/**
 * Núcleo puro de IMT + Imposto de Selo + registos — sem imports de
 * @data/fiscal/*.json para poder ser importado em componentes "use client"
 * sem arrastar JSONs fiscais para o bundle do cliente (regra AGENTS.md).
 */

export interface EscalaoImt {
  ate: number | null;
  taxa: number;
  taxaUnica?: boolean;
  parcelaAbater: number;
}

export interface RegrasImt {
  ano: number;
  vigencia?: string;
  fonte: string;
  fonteUrl: string;
  hpp: EscalaoImt[];
  jovem: {
    idadeMax: number;
    isentoAte: number;
    taxaExcedente: number;
    parcelaAbater: number;
    limiteBeneficio: number;
    nota?: string;
  };
  secundaria: EscalaoImt[];
  impostoSelo: {
    aquisicao: { taxa: number; nota?: string };
    credito: { taxa: number; nota?: string };
  };
  registos: { semCredito: number; comCredito: number; nota: string; fonteUrl?: string };
}

export type TipoCompra = "hpp" | "secundaria";

/**
 * Regime de elegibilidade para IMT Jovem (≤35 anos, 1.ª HPP):
 * - "nenhum": tabela geral HPP
 * - "todos": comprador único elegível ou casal em que ambos cumprem os requisitos (100 % IMT Jovem)
 * - "umDeDois": compra a dois (50 %/50 %) onde apenas 1 cumpre os requisitos (art. 9.º CIMT / Ofício Circulado AT)
 */
export type CompradoresJovens = "nenhum" | "todos" | "umDeDois";

export interface ResultadoCompra {
  valorTributavel: number;
  imt: number;
  isAquisicao: number;
  isCredito: number;
  registos: number;
  totalCustos: number;
  precoFinal: number; // preço + todos os custos
}

/** IMT por escalões (ou taxa única nos dois últimos). */
export function imtPuro(
  valor: number,
  tipo: TipoCompra,
  regras: RegrasImt
): number {
  const tabela = regras[tipo];
  const linha = tabela.find((e) => e.ate === null || valor <= e.ate);
  if (!linha) return 0;
  if (linha.taxaUnica) return valor * linha.taxa;
  return Math.max(0, valor * linha.taxa - linha.parcelaAbater);
}

/**
 * IMT Jovem (≤35 anos, 1.ª HPP): isento até ao limiar; na banda seguinte
 * paga-se a taxa marginal só sobre o excedente; acima do limite do
 * benefício aplica-se a tabela geral.
 */
export function imtJovemPuro(valor: number, regras: RegrasImt): number {
  const j = regras.jovem;
  if (valor <= j.isentoAte) return 0;
  if (valor <= j.limiteBeneficio)
    return valor * j.taxaExcedente - j.parcelaAbater;
  return imtPuro(valor, "hpp", regras);
}

/** IS de aquisição no regime geral (0,8 %). */
export function isAquisicaoGeralPuro(valor: number, regras: RegrasImt): number {
  return valor * regras.impostoSelo.aquisicao.taxa;
}

/**
 * IS de aquisição no IMT Jovem: isento até isentoAte, paga só sobre o
 * excedente até limiteBeneficio e perde a isenção acima desse tecto.
 */
export function isAquisicaoJovemPuro(valor: number, regras: RegrasImt): number {
  const j = regras.jovem;
  const taxa = regras.impostoSelo.aquisicao.taxa;
  if (valor <= j.isentoAte) return 0;
  if (valor <= j.limiteBeneficio) return (valor - j.isentoAte) * taxa;
  return valor * taxa;
}

/**
 * Custo total de comprar casa: IMT (geral, Jovem a 100 % ou compra a dois 50 %/50 %),
 * IS de aquisição (0,8 %), IS sobre o crédito (0,6 %) e registos.
 */
export function custoCompraPuro(
  preco: number,
  regras: RegrasImt,
  opts: {
    tipo?: TipoCompra;
    jovem?: boolean;
    compradoresJovens?: CompradoresJovens;
    montanteCredito?: number;
  } = {}
): ResultadoCompra {
  const {
    tipo = "hpp",
    jovem = false,
    compradoresJovens,
    montanteCredito = 0,
  } = opts;

  const regimeJovem: CompradoresJovens =
    tipo !== "hpp"
      ? "nenhum"
      : compradoresJovens ?? (jovem ? "todos" : "nenhum");

  let imtDevido: number;
  let isAquisicao: number;

  if (regimeJovem === "todos") {
    imtDevido = imtJovemPuro(preco, regras);
    isAquisicao = isAquisicaoJovemPuro(preco, regras);
  } else if (regimeJovem === "umDeDois") {
    imtDevido =
      0.5 * imtJovemPuro(preco, regras) + 0.5 * imtPuro(preco, "hpp", regras);
    isAquisicao =
      0.5 * isAquisicaoJovemPuro(preco, regras) +
      0.5 * isAquisicaoGeralPuro(preco, regras);
  } else {
    imtDevido = imtPuro(preco, tipo, regras);
    isAquisicao = isAquisicaoGeralPuro(preco, regras);
  }

  const isCredito = montanteCredito * regras.impostoSelo.credito.taxa;
  const registos =
    montanteCredito > 0
      ? regras.registos.comCredito
      : regras.registos.semCredito;

  const totalCustos = imtDevido + isAquisicao + isCredito + registos;
  return {
    valorTributavel: preco,
    imt: imtDevido,
    isAquisicao,
    isCredito,
    registos,
    totalCustos,
    precoFinal: preco + totalCustos,
  };
}
