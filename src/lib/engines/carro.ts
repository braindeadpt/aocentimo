import isv2026 from "@data/fiscal/isv-2026.json";
import iuc2026 from "@data/fiscal/iuc-2026.json";

/**
 * ISV e IUC — os dois impostos do automóvel ligeiro.
 *
 * São coisas diferentes e confundi-las é o erro mais comum:
 *
 * - **ISV** (Código do Imposto sobre Veículos, Lei 22-A/2007) paga-se **uma
 *   vez**, na matrícula. É imposto de taxa específica: a base tributável é a
 *   cilindrada e o CO2 do certificado de conformidade — **não** o preço.
 * - **IUC** (Código do Imposto Único de Circulação, mesmo diploma, Anexo II)
 *   paga-se **todos os anos**. Incide sobre a idade, a cilindrada e as
 *   emissões, também sem qualquer relação com o preço pago pelo carro.
 *
 * Regras versionadas em data/fiscal/isv-AAAA.json e iuc-AAAA.json.
 */

interface EscalaoValor {
  de: number | null;
  ate: number | null;
  valorFixo?: number;
  taxa: number;
  parcelaAbater: number;
}

interface EscalaoTaxa {
  de: number | null;
  ate: number | null;
  taxa: number;
}

interface RegrasIsv {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  tabelaA: {
    cilindrada: EscalaoValor[];
    ambiental: {
      gasolina: Record<NormaTeste, EscalaoValor[]>;
      gasoleo: Record<NormaTeste, EscalaoValor[]>;
    };
  };
  tabelaB: { cilindrada: EscalaoValor[] };
  agravamentoGasoleo: {
    valor: number;
    limiteParticulas: number;
    nota: string;
  };
  minimo: number;
  taxasIntermedias: { regra: { percentagem: number; designacao: string }[] };
  veiculosUsadosImportadosUE: { tabelaD: { de: number; ate: number | null; reducao: number }[] };
}

interface RegrasIuc {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  categoriaA: {
    gasolina: {
      de: number | null;
      ate: number | null;
      posteriorA1995: number;
      de1990a1995: number;
      de1981a1989: number;
    }[];
    outrosProdutos: {
      de: number | null;
      ate: number | null;
      posteriorA1995: number;
      de1990a1995: number;
      de1981a1989: number;
    }[];
  };
  categoriaB: {
    cilindrada: EscalaoTaxa[];
    co2: {
      deNedc: number | null;
      ateNedc: number | null;
      deWltp: number | null;
      ateWltp: number | null;
      taxa: number;
    }[];
    adicionalCo2: {
      condicao: string;
      escaloes: {
        deNedc: number;
        ateNedc: number | null;
        deWltp: number;
        ateWltp: number | null;
        taxa: number;
      }[];
    };
    coeficientes: { tabela: { de: number; ate: number | null; coeficiente: number }[] };
  };
}

export const REGRAS_ISV: Record<number, RegrasIsv> = {
  2026: isv2026 as unknown as RegrasIsv,
};

export const REGRAS_IUC: Record<number, RegrasIuc> = {
  2026: iuc2026 as unknown as RegrasIuc,
};

/** Norma de medição das emissões, tal como vem no certificado de conformidade. */
export type NormaTeste = "NEDC" | "WLTP";
export type Combustivel = "gasolina" | "gasoleo";

/** Ano da matrícula, para escolher a coluna da tabela do IUC. */
export type FaixaMatricula = "posteriorA1995" | "de1990a1995" | "de1981a1989";

/** Arredonda a cêntimos, evitando o `-0` que às vezes aparece em subtrações. */
function arred(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100 + 0;
}

function escalaoValor(
  tabela: EscalaoValor[],
  v: number
): EscalaoValor | undefined {
  return tabela.find((e) => (e.de === null || v >= e.de) && (e.ate === null || v <= e.ate));
}

function escalaoCo2(
  tabela: RegrasIuc["categoriaB"]["co2"],
  co2: number,
  norma: NormaTeste
) {
  // Os limites da tabela de CO2 da categoria B diferem entre NEDC e WLTP
  // (NEDC 120/180/250 g/km, WLTP 140/205/260 g/km): a lei escreve as duas
  // colunas lado a lado, por isso o escalão tem de ser escolhido pela norma.
  return tabela.find((e) => {
    const de = norma === "NEDC" ? e.deNedc : e.deWltp;
    const ate = norma === "NEDC" ? e.ateNedc : e.ateWltp;
    return (de === null || co2 >= de) && (ate === null || co2 <= ate);
  });
}

// ────────────────────────────── ISV ──────────────────────────────

export interface EntradaIsv {
  /** Cilindrada em cm³, tal como consta da homologação. */
  cilindrada: number;
  /** Emissões de CO2 em g/km. Não se converte entre normas. */
  co2?: number;
  norma?: NormaTeste;
  combustivel?: Combustivel;
  /** Partículas em g/km. Sem este valor, o agravamento do gasóleo aplica-se. */
  particulas?: number;
  /**
   * Anos de uso desde a primeira matrícula. Só tem efeito em veículos
   * importados de outro Estado-Membro da UE (tabela D do art. 11.º).
   */
  anosDeUso?: number;
  /** Veículo com matrícula definitiva atribuída por outro Estado-Membro da UE. */
  matriculaUE?: boolean;
  /**
   * Percentagem de taxa intermédia a aplicar à totalidade (art. 8.º):
   * 60 para híbrido não plug-in elegível (autonomia elétrica >50 km e
   * emissões <50 gCO2/km), 25 para plug-in, 40 para gás natural exclusivo
   * ou utilização mista de 7 lugares sem tracção às quatro rodas.
   */
  taxaIntermedia?: number;
  ano?: number;
}

export interface ResultadoIsv {
  componenteCilindrada: number;
  componenteAmbiental: number;
  agravamentoGasoleo: number;
  reducaoUsadoUE: number;
  total: number;
}

/**
 * ISV de um ligeiro de passageiros pela tabela A.
 *
 * Cada componente é «valor do escalão × taxa − parcela a abater». Se a
 * componente ambiental for negativa, é deduzida à cilindrada (art. 7.º n.º 4),
 * e o total nunca desce abaixo de 100 €. O agravamento do gasóleo entra
 * depois de tudo, sobre o total.
 */
export function isv(e: EntradaIsv): ResultadoIsv {
  const ano = e.ano ?? 2026;
  const r = REGRAS_ISV[ano];
  if (!r) throw new Error(`isv: não há regras para ${ano}`);

  const linha = escalaoValor(r.tabelaA.cilindrada, e.cilindrada);
  if (!linha)
    throw new Error(`isv: cilindrada ${e.cilindrada} cm³ fora de tabela`);
  const componenteCilindrada = arred(
    e.cilindrada * linha.taxa - linha.parcelaAbater
  );

  // Componente ambiental: só existe se houver CO2 e norma declarados.
  let componenteAmbiental = 0;
  if (e.co2 !== undefined && e.norma !== undefined) {
    const combustivel = e.combustivel ?? "gasolina";
    const tabela = r.tabelaA.ambiental[combustivel][e.norma];
    const linhaAmb = escalaoValor(tabela, e.co2);
    if (!linhaAmb)
      throw new Error(
        `isv: CO2 ${e.co2} g/km fora de tabela (${combustivel} ${e.norma})`
      );
    componenteAmbiental = arred(e.co2 * linhaAmb.taxa - linhaAmb.parcelaAbater);
  }

  const base = componenteCilindrada + componenteAmbiental;

  // Agravamento do gasóleo: 500 €, salvo partículas declaradas abaixo do limite.
  let agravamentoGasoleo = 0;
  if (e.combustivel === "gasoleo") {
    const isencao = e.particulas !== undefined && e.particulas < r.agravamentoGasoleo.limiteParticulas;
    if (!isencao) agravamentoGasoleo = r.agravamentoGasoleo.valor;
  }

  let total = Math.max(r.minimo, base) + agravamentoGasoleo;

  // Redução por tempo de uso — só veículos importados de outro Estado-Membro.
  let reducaoUsadoUE = 0;
  if (e.matriculaUE && e.anosDeUso !== undefined) {
    const linhaD = r.veiculosUsadosImportadosUE.tabelaD.find(
      (d) => e.anosDeUso! >= d.de && (d.ate === null || e.anosDeUso! < d.ate)
    );
    if (linhaD) {
      reducaoUsadoUE = arred(total * (linhaD.reducao / 100));
      total = arred(total - reducaoUsadoUE);
    }
  }

  // Taxa intermédia do art. 8.º — sobre a totalidade.
  if (e.taxaIntermedia) total = arred(total * (e.taxaIntermedia / 100));

  return {
    componenteCilindrada,
    componenteAmbiental,
    agravamentoGasoleo,
    reducaoUsadoUE,
    total: arred(total),
  };
}

// ────────────────────────────── IUC ──────────────────────────────

export interface EntradaIuc {
  cilindrada: number;
  /** Ano da primeira matrícula — escolhe o escalão e o coeficiente. */
  anoMatricula: number;
  combustivel?: Combustivel;
  /** CO2 em g/km, só para a categoria B. */
  co2?: number;
  norma?: NormaTeste;
  ano?: number;
}

export interface ResultadoIuc {
  categoria: "A" | "B";
  componenteCilindrada: number;
  componenteCo2: number;
  adicionalCo2: number;
  coeficiente: number;
  total: number;
}

function faixaMatricula(ano: number): FaixaMatricula {
  if (ano > 1995) return "posteriorA1995";
  if (ano >= 1990) return "de1990a1995";
  if (ano >= 1981) return "de1981a1989";
  throw new Error(`iuc: ano de matrícula ${ano} anterior a 1981 não tem tabela`);
}

/**
 * IUC anual de um ligeiro. A categoria segue o combustível: a gasolina (e os
 * demais produtos da coluna «outros produtos») cai na categoria A, o gasóleo na
 * categoria B.
 * A categoria A tem três colunas consoante a antiguidade; a B aplica
 * adicional de CO2 acima de 2017 e um coeficiente sobre a coleta.
 */
export function iuc(e: EntradaIuc): ResultadoIuc {
  const ano = e.ano ?? 2026;
  const r = REGRAS_IUC[ano];
  if (!r) throw new Error(`iuc: não há regras para ${ano}`);

  const faixa = faixaMatricula(e.anoMatricula);
  const combustivel = e.combustivel ?? "gasolina";

  if (combustivel === "gasolina") {
    const linha = r.categoriaA.gasolina.find(
      (s) => (s.de === null || e.cilindrada >= s.de) && (s.ate === null || e.cilindrada <= s.ate)
    );
    if (!linha) throw new Error(`iuc: cilindrada ${e.cilindrada} cm³ fora de tabela`);
    const total = arred(linha[faixa]);
    return {
      categoria: "A",
      componenteCilindrada: total,
      componenteCo2: 0,
      adicionalCo2: 0,
      coeficiente: 1,
      total,
    };
  }

  // Categoria B: cilindrada + CO2 (+ adicional se matriculado depois de 2017).
  const linhaCil = r.categoriaB.cilindrada.find(
    (s) => (s.de === null || e.cilindrada >= s.de) && (s.ate === null || e.cilindrada <= s.ate)
  );
  if (!linhaCil) throw new Error(`iuc: cilindrada ${e.cilindrada} cm³ fora de tabela`);

  const norma = e.norma ?? "WLTP";
  const linhaCo2 = escalaoCo2(r.categoriaB.co2, e.co2 ?? 0, norma);
  if (!linhaCo2) throw new Error(`iuc: CO2 ${e.co2} g/km fora de tabela (${norma})`);

  let adicionalCo2 = 0;
  // Art. 10.º n.º 2 do CIUC: a taxa adicional é devida quando a primeira
  // matrícula é «posterior a 1 de janeiro de 2017» — ou seja, desde 2017.
  // Com `> 2017`, um carro matriculado em junho de 2017 perdia a taxa que a
  // lei lhe dá; a fronteira certa com o ano como único dado é `>= 2017`.
  if (e.anoMatricula >= 2017) {
    const linhaAd = r.categoriaB.adicionalCo2.escaloes.find((a) => {
      if (norma === "NEDC") return e.co2! > a.deNedc && (a.ateNedc === null || e.co2! <= a.ateNedc);
      return e.co2! > a.deWltp && (a.ateWltp === null || e.co2! <= a.ateWltp);
    });
    if (linhaAd) adicionalCo2 = linhaAd.taxa;
  }

  const linhaCoef = r.categoriaB.coeficientes.tabela.find(
    (c) => e.anoMatricula >= c.de && (c.ate === null || e.anoMatricula <= c.ate)
  );
  if (!linhaCoef)
    throw new Error(`iuc: ano de matrícula ${e.anoMatricula} sem coeficiente`);

  const coleta = linhaCil.taxa + linhaCo2.taxa + adicionalCo2;
  return {
    categoria: "B",
    componenteCilindrada: linhaCil.taxa,
    componenteCo2: linhaCo2.taxa,
    adicionalCo2,
    coeficiente: linhaCoef.coeficiente,
    total: arred(coleta * linhaCoef.coeficiente),
  };
}

/**
 * Custo anual de manter um ligeiro na estrada, a partir do valor de compra.
 * O IUC não depende do preço pago, mas serve de comparação entre veículos.
 */
export function custoAnualCarro(
  entrada: EntradaIuc,
  precoCompra: number
): { iuc: number; iucSobrePreco: number } {
  const r = iuc(entrada);
  return {
    iuc: r.total,
    iucSobrePreco: arred((r.total / precoCompra) * 100),
  };
}
