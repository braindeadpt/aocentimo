/**
 * Núcleo puro de IMI — sem imports de @data/fiscal/*.json para poder ser
 * importado em componentes "use client" sem arrastar JSONs fiscais para o
 * bundle do cliente (regra AGENTS.md).
 */

export interface RegrasImi {
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

export interface ComparacaoMunicipio {
  municipio: MunicipioConhecido;
  nome: string;
  taxa: number;
  imiEm: number;
}

/** Arredonda a cêntimos, sem deixar passar o `-0`. */
function arred(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100 + 0;
}

/** A taxa do município a partir das regras fornecidas; se não estiver, falha. */
export function taxaDoMunicipio(
  municipio: MunicipioConhecido,
  regras: RegrasImi
): number {
  const taxa = regras[municipio]?.taxa;
  if (taxa === undefined)
    throw new Error(
      `imi: a taxa de "${municipio}" não foi curada nesta sessão — não se assume a mínima legal, que seria falso`
    );
  return taxa;
}

/**
 * Desdobra o imposto em prestações, pelo art. 120.º n.º 1: uma até 100 €,
 * duas acima disso e até 500 €, três acima de 500 €. Meses de maio, novembro
 * e agosto.
 */
export function desdobraPrestacoes(
  montante: number,
  regras: RegrasImi
): Prestacao[] {
  const regra = regras.prestacoes.regras.find(
    (g) =>
      (g.de === undefined || montante >= g.de) &&
      (g.ate === null || montante <= g.ate)
  );
  if (!regra) return [];

  // A última prestação absorve o resto da divisão: sem isso, um total
  // como 100,01 € em duas prestações arredondava cada uma para 50,01 € e
  // a soma dava 100,02 €.
  const parcelas = regra.meses.map(() => arred(montante / regra.prestacoes));
  const ultima = parcelas.length - 1;
  parcelas[ultima] = arred(
    parcelas[ultima] + (montante - arred(parcelas[ultima] * parcelas.length))
  );
  return regra.meses.map((mes, i) => ({ mes, valor: parcelas[i] }));
}

/**
 * IMI de um prédio urbano: VPT × taxa, menos a dedução familiar, mais a
 * majoração por degradação.
 */
export function imi(e: EntradaImi, regras: RegrasImi): ResultadoImi {
  if (e.vpt <= 0)
    throw new Error(`imi: VPT tem de ser positivo, recebido ${e.vpt}`);

  const taxa = e.municipio ? taxaDoMunicipio(e.municipio, regras) : e.taxa;
  if (taxa === undefined)
    throw new Error(
      "imi: falta a taxa do município. Não há taxa por omissão — o IMI é municipal."
    );

  // A taxa tem de estar dentro do intervalo legal (art. 112.º n.º 1).
  const { min, max } = regras.taxasLegais.urbanos;
  const pct = (v: number) => (v * 100).toFixed(2).replace(".", ",");
  if (taxa < min || taxa > max)
    throw new Error(
      `imi: taxa ${pct(taxa)} % fora do intervalo legal ${pct(min)} % – ${pct(max)} %`
    );

  const coletaBruta = arred(e.vpt * taxa);

  // IMI familiar: redução em euros, e só se o município tiver deliberado.
  let reducaoFamiliar = 0;
  if (e.imiFamiliar && e.habitacaoPropriaPermanente && (e.dependentes ?? 0) > 0) {
    const ded = regras.imiFamiliar.deducoes
      .filter((d) => e.dependentes! >= d.dependentes)
      .pop();
    if (ded) reducaoFamiliar = ded.valor;
  }

  // Majoração por prédio degradado, nos limites que a lei permite.
  let majoracaoDegradado = 0;
  if (e.predioDegradado) {
    const maxDeg = regras.porto.majoracaoPrediosDegradados;
    if (e.municipio === "porto")
      majoracaoDegradado = arred(coletaBruta * maxDeg);
  }

  const aPagar = Math.max(
    0,
    arred(coletaBruta - reducaoFamiliar + majoracaoDegradado)
  );

  return {
    coleta: coletaBruta,
    reducaoFamiliar,
    majoracaoDegradado,
    aPagar,
    taxaEfetiva: arred((aPagar / e.vpt) * 10000) / 10000,
    prestacoes: desdobraPrestacoes(aPagar, regras),
  };
}

/**
 * Compara o mesmo imóvel em todos os municípios com taxa curada nas regras.
 */
export function compararMunicipios(
  vpt: number,
  regras: RegrasImi,
  opcoes: {
    imiFamiliar?: boolean;
    habitacaoPropriaPermanente?: boolean;
    dependentes?: number;
  } = {}
): ComparacaoMunicipio[] {
  const nomes: Record<MunicipioConhecido, string> = { porto: "Porto" };

  return (Object.keys(regras) as MunicipioConhecido[])
    .filter((m) => typeof regras[m]?.taxa === "number")
    .map((m) => ({
      municipio: m,
      nome: nomes[m] ?? m,
      taxa: regras[m].taxa,
      imiEm: imi({ vpt, municipio: m, ...opcoes }, regras).aPagar,
    }));
}
