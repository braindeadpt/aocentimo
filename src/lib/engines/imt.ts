import imt2026 from "@data/fiscal/imt-2026.json";
import {
  custoCompraPuro,
  imtJovemPuro,
  imtPuro,
  isAquisicaoGeralPuro,
  isAquisicaoJovemPuro,
  type CompradoresJovens,
  type EscalaoImt,
  type RegrasImt,
  type ResultadoCompra,
  type TipoCompra,
} from "./imt-puro";

export type {
  CompradoresJovens,
  EscalaoImt,
  RegrasImt,
  ResultadoCompra,
  TipoCompra,
};

export {
  custoCompraPuro,
  imtJovemPuro,
  imtPuro,
  isAquisicaoGeralPuro,
  isAquisicaoJovemPuro,
};

/**
 * IMT + Imposto de Selo + registos — o custo de comprar casa.
 * Regras versionadas em data/fiscal/imt-AAAA.json (Ofício Circulado AT).
 * IMT incide sobre o maior valor entre preço de escritura e VPT.
 */

export const REGRAS_IMT: Record<number, RegrasImt> = {
  2026: imt2026 as RegrasImt,
};

/** IMT por escalões (ou taxa única nos dois últimos). */
export function imt(valor: number, tipo: TipoCompra, ano = 2026): number {
  return imtPuro(valor, tipo, REGRAS_IMT[ano]);
}

/**
 * IMT Jovem (≤35 anos, 1.ª HPP): isento até ao limiar; na banda seguinte
 * paga-se a taxa marginal só sobre o excedente; acima do limite do
 * benefício aplica-se a tabela geral.
 */
export function imtJovem(valor: number, ano = 2026): number {
  return imtJovemPuro(valor, REGRAS_IMT[ano]);
}

/**
 * Custo total de comprar casa: IMT (geral, Jovem ou compra a dois 50 %/50 %),
 * IS de aquisição (0,8 %), IS sobre o crédito (0,6 %) e registos. No IMT
 * Jovem o IS de aquisição segue a mesma isenção proporcional até ao limite
 * do benefício (DL 48-A/2024, art. 9.º n.º 2 CIMT e art. 31.º-A CIS); acima
 * desse limite perde-se totalmente a isenção.
 */
export function custoCompra(
  preco: number,
  opts: {
    tipo?: TipoCompra;
    jovem?: boolean;
    compradoresJovens?: CompradoresJovens;
    montanteCredito?: number;
    ano?: number;
  } = {}
): ResultadoCompra {
  const { ano = 2026, ...resto } = opts;
  return custoCompraPuro(preco, REGRAS_IMT[ano], resto);
}
