import imi2026 from "@data/fiscal/imi-2026.json";

/**
 * IMI — Imposto Municipal sobre Imóveis.
 *
 * Regras versionadas em data/fiscal/imi-AAAA.json (CIMI, Decreto-Lei
 * n.º 287/2003, de 12 de novembro, na redacção da AT).
 *
 * O cálculo é trivial — `IMI = VPT × taxa` — e é essa trivialidade que
 * esconde duas coisas que o motor tem de preservar:
 *
 * 1. **O VPT não é o preço.** É o valor fiscal do imóvel, determinado pela
 *    AT a partir de área, localização, idade e custo de construção. Se a app
 *    mostrar «gastaste X € a comprar casa», o IMI não é X × taxa. O VPT vem
 *    da nota de liquidação.
 * 2. **A taxa é municipal, não nacional.** Cada assembleia municipal fixa a
 *    sua, dentro de 0,3 % a 0,45 %, e pode criar áreas com taxas diferentes
 *    na mesma freguesia. Por isso a taxa entra como argumento e não há valor
 *    por omissão: se o município não estiver nas regras, o motor falha em vez
 *    de chutar a mínima.
 */

interface RegrasImi {
  ano: number;
  anoImposto: number;
  vigencia: string;
  taxasLegais: {
    rusticos: number;
    urbanos: { min: number; max: number };
  };
  municipios: { nota: string };
  porto: {
    taxa: number;
    anoImposto: number;
    reducaoHabitacaoPropriaPermanente: number;
    taxaEfetivaHabitacaoPropriaPermanente: number;
    majoracaoPrediosDegradados: number;
  };
  imiFamiliar: {
    deducoes: { dependentes: number; valor: number }[];
  };
  prestacoes: {
    regras: {
      de?: number;
      ate: number | null;
      prestacoes: number;
      meses: number[];
    }[];
  };
}

export const REGRAS_IMI: Record<number, RegrasImi> = {
  2026: imi2026 as RegrasImi,
};

/** Os municípios cujas taxas foram lidas na fonte. */
export type MunicipioConhecido = "porto";

export interface EntradaImi {
  /** Valor patrimonial tributário, em euros, tal como consta da nota de liquidação. */
  vpt: number;
  /**
   * Taxa municipal, em fracção (0,00324 = 0,324 %). Se `municipio` for
   * dado, a taxa é lida das regras e este campo é ignorado.
   */
  taxa?: number;
  municipio?: MunicipioConhecido;
  /** Número de dependentes a cargo, para a dedução do IMI familiar. */
  dependentes?: number;
  /** O município deliberou a redução por dependentes? A lei obriga-o a deliberar. */
  imiFamiliar?: boolean;
  /** O prédio é a habitação própria e permanente do sujeito passivo? */
  habitacaoPropriaPermanente?: boolean;
  /** Aplicar a redução municipal para prédios degradados (só no Porto: 30 %). */
  predioDegradado?: boolean;
  ano?: number;
}

export interface Prestacao {
  mes: number;
  valor: number;
}

export interface ResultadoImi {
  coleta: number;
  reducaoFamiliar: number;
  majoracaoDegradado: number;
  /** O que se paga depois de tudo. Nunca negativo. */
  aPagar: number;
  taxaEfetiva: number;
  prestacoes: Prestacao[];
}

/** Arredonda a cêntimos, sem deixar passar o `-0`. */
function arred(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100 + 0;
}

/** A taxa do município, se estiver nas regras; se não estiver, falha. */
export function taxaDoMunicipio(
  municipio: MunicipioConhecido,
  ano = 2026
): number {
  const r = REGRAS_IMI[ano];
  if (!r) throw new Error(`imi: não há regras para ${ano}`);
  const taxa = r[municipio]?.taxa;
  if (taxa === undefined)
    throw new Error(
      `imi: a taxa de "${municipio}" não foi curada nesta sessão — não se assume a mínima legal, que seria falso`
    );
  return taxa;
}

/**
 * IMI de um prédio urbano: VPT × taxa, menos a dedução familiar, mais a
 * majoração por degradação.
 *
 * A dedução por dependentes é o que o chamamos IMI familiar, e é uma redução
 * **em euros** (30/70/140), não uma percentagem. Depende de o município ter
 * deliberado: sem deliberação não há dedução, mesmo que a casa tenha três
 * dependentes. E só se aplica a habitação própria e permanente.
 */
export function imi(e: EntradaImi): ResultadoImi {
  const ano = e.ano ?? 2026;
  const r = REGRAS_IMI[ano];
  if (!r) throw new Error(`imi: não há regras para ${ano}`);

  if (e.vpt <= 0) throw new Error(`imi: VPT tem de ser positivo, recebido ${e.vpt}`);

  const taxa = e.municipio ? taxaDoMunicipio(e.municipio, ano) : e.taxa;
  if (taxa === undefined)
    throw new Error(
      "imi: falta a taxa do município. Não há taxa por omissão — o IMI é municipal."
    );

  // A taxa tem de estar dentro do intervalo legal (art. 112.º n.º 1).
  const { min, max } = r.taxasLegais.urbanos;
  // toFixed(1) sobre 0,0045 escreve "0.0" em some runtimes (float); o fix(2)
  // garante «0,45 %» — e a vírgula é porque o resto do repo fala PT-PT.
  const pct = (v: number) => (v * 100).toFixed(2).replace(".", ",");
  if (taxa < min || taxa > max)
    throw new Error(
      `imi: taxa ${pct(taxa)} % fora do intervalo legal ${pct(min)} % – ${pct(max)} %`
    );

  const coletaBruta = arred(e.vpt * taxa);

  // IMI familiar: redução em euros, e só se o município tiver deliberado.
  let reducaoFamiliar = 0;
  if (e.imiFamiliar && e.habitacaoPropriaPermanente) {
    // A tabela é crescente (1 → 30 €, 2 → 70 €, 3 ou mais → 140 €), por
    // isso vale a ÚLTIMA linha que ainda abrange o número de dependentes.
    // Com `find` era devolvida sempre a de 1 dependente.
    const ded = r.imiFamiliar.deducoes
      .filter((d) => e.dependentes! >= d.dependentes)
      .pop();
    if (ded) reducaoFamiliar = ded.valor;
  }

  // Majoração por prédio degradado, nos limites que a lei permite.
  let majoracaoDegradado = 0;
  if (e.predioDegradado) {
    const max = r.porto.majoracaoPrediosDegradados;
    if (e.municipio === "porto")
      majoracaoDegradado = arred(coletaBruta * max);
  }

  const aPagar = Math.max(0, arred(coletaBruta - reducaoFamiliar + majoracaoDegradado));

  return {
    coleta: coletaBruta,
    reducaoFamiliar,
    majoracaoDegradado,
    aPagar,
    taxaEfetiva: arred((aPagar / e.vpt) * 10000) / 10000,
    prestacoes: desdobraPrestacoes(aPagar, ano),
  };
}

/**
 * Desdobra o imposto em prestações, pelo art. 120.º n.º 1: uma até 100 €,
 * duas acima disso e até 500 €, três acima de 500 €. Meses de maio, novembro
 * e agosto.
 */
export function desdobraPrestacoes(
  montante: number,
  ano = 2026
): Prestacao[] {
  const r = REGRAS_IMI[ano];
  if (!r) throw new Error(`imi: não há regras para ${ano}`);

  const regra = r.prestacoes.regras.find(
    (g) =>
      (g.de === undefined || montante >= g.de) &&
      (g.ate === null || montante <= g.ate)
  );
  if (!regra) return [];

  // A última prestação absorve o resto da divisão: sem isso, um total
  // como 100,01 € em duas prestações arredondava cada uma para 50,01 € e
  // o soma dava 100,02 €.
  const parcelas = regra.meses.map(() => arred(montante / regra.prestacoes));
  const ultima = parcelas.length - 1;
  parcelas[ultima] = arred(
    parcelas[ultima] + (montante - arred(parcelas[ultima] * parcelas.length))
  );
  return regra.meses.map((mes, i) => ({ mes, valor: parcelas[i] }));
}

export interface ComparacaoMunicipio {
  municipio: MunicipioConhecido;
  nome: string;
  taxa: number;
  imiEm: number;
}

/**
 * Compara o mesmo imóvel em todos os municípios com taxa curada. Mostra
 * que a diferença entre dois counties da mesma lei pode ser de 50 % do
 * imposto — o que o intervalo «0,3 % a 0,45 %» não deixa logo à vista.
 */
export function compararMunicipios(
  vpt: number,
  opcoes: {
    imiFamiliar?: boolean;
    habitacaoPropriaPermanente?: boolean;
    dependentes?: number;
    ano?: number;
  } = {}
): ComparacaoMunicipio[] {
  const ano = opcoes.ano ?? 2026;
  const nomes: Record<MunicipioConhecido, string> = { porto: "Porto" };

  return (Object.keys(REGRAS_IMI[ano]) as MunicipioConhecido[])
    .filter((m) => typeof REGRAS_IMI[ano][m]?.taxa === "number")
    .map((m) => ({
      municipio: m,
      nome: nomes[m] ?? m,
      taxa: REGRAS_IMI[ano][m].taxa,
      imiEm: imi({ vpt, municipio: m, ano, ...opcoes }).aPagar,
    }));
}
