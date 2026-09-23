import imt2026 from "@data/fiscal/imt-2026.json";

/**
 * IMT + Imposto de Selo + registos — o custo de comprar casa.
 * Regras versionadas em data/fiscal/imt-AAAA.json (Ofício Circulado AT).
 * IMT incide sobre o maior valor entre preço de escritura e VPT.
 */

interface EscalaoImt {
  ate: number | null;
  taxa: number;
  taxaUnica?: boolean;
  parcelaAbater: number;
}

interface RegrasImt {
  ano: number;
  fonte: string;
  fonteUrl: string;
  hpp: EscalaoImt[];
  jovem: {
    idadeMax: number;
    isentoAte: number;
    taxaExcedente: number;
    parcelaAbater: number;
    limiteBeneficio: number;
  };
  secundaria: EscalaoImt[];
  impostoSelo: {
    aquisicao: { taxa: number };
    credito: { taxa: number };
  };
  registos: { semCredito: number; comCredito: number; nota: string };
}

export const REGRAS_IMT: Record<number, RegrasImt> = {
  2026: imt2026 as RegrasImt,
};

export type TipoCompra = "hpp" | "secundaria";

/** IMT por escalões (ou taxa única nos dois últimos). */
export function imt(valor: number, tipo: TipoCompra, ano = 2026): number {
  const tabela = REGRAS_IMT[ano][tipo];
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
export function imtJovem(valor: number, ano = 2026): number {
  const j = REGRAS_IMT[ano].jovem;
  if (valor <= j.isentoAte) return 0;
  if (valor <= j.limiteBeneficio)
    return valor * j.taxaExcedente - j.parcelaAbater;
  return imt(valor, "hpp", ano);
}

export interface ResultadoCompra {
  valorTributavel: number;
  imt: number;
  isAquisicao: number;
  isCredito: number;
  registos: number;
  totalCustos: number;
  precoFinal: number; // preço + todos os custos
}

/**
 * Custo total de comprar casa: IMT (geral ou Jovem), IS de aquisição
 * (0,8 %), IS sobre o crédito (0,6 %) e registos. No IMT Jovem o IS de
 * aquisição segue a mesma isenção proporcional.
 */
export function custoCompra(
  preco: number,
  opts: {
    tipo?: TipoCompra;
    jovem?: boolean;
    montanteCredito?: number;
    ano?: number;
  } = {}
): ResultadoCompra {
  const { tipo = "hpp", jovem = false, montanteCredito = 0, ano = 2026 } = opts;
  const r = REGRAS_IMT[ano];

  const imtDevido =
    tipo === "hpp" && jovem ? imtJovem(preco, ano) : imt(preco, tipo, ano);

  // IS de aquisição: no IMT Jovem é isento na mesma proporção do IMT
  const isBase = preco * r.impostoSelo.aquisicao.taxa;
  const isAquisicao =
    tipo === "hpp" && jovem
      ? preco <= r.jovem.isentoAte
        ? 0
        : isBase * (1 - r.jovem.isentoAte / preco)
      : isBase;

  const isCredito = montanteCredito * r.impostoSelo.credito.taxa;
  const registos =
    montanteCredito > 0 ? r.registos.comCredito : r.registos.semCredito;

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
