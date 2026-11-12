import isv2026 from "@data/fiscal/isv-2026.json";
import iuc2026 from "@data/fiscal/iuc-2026.json";
import {
  custoAnualCarro as custoAnualCarroPuro,
  custoFiscalAnualCarro as custoFiscalAnualCarroPuro,
  isv as isvPuro,
  iuc as iucPuro,
  type Combustivel,
  type EntradaCustoFiscalCarro,
  type EntradaIsv,
  type EntradaIuc,
  type EscalaoTaxa,
  type EscalaoValor,
  type FaixaMatricula,
  type LitroDecomposto,
  type NormaTeste,
  type PropulsaoCarro,
  type RegrasIsv,
  type RegrasIuc,
  type ResultadoCustoFiscalCarro,
  type ResultadoIsv,
  type ResultadoIuc,
} from "./carro-puro";

export type {
  Combustivel,
  EntradaCustoFiscalCarro,
  EntradaIsv,
  EntradaIuc,
  EscalaoTaxa,
  EscalaoValor,
  FaixaMatricula,
  LitroDecomposto,
  NormaTeste,
  PropulsaoCarro,
  RegrasIsv,
  RegrasIuc,
  ResultadoCustoFiscalCarro,
  ResultadoIsv,
  ResultadoIuc,
};

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

export const REGRAS_ISV: Record<number, RegrasIsv> = {
  2026: isv2026 as unknown as RegrasIsv,
};

export const REGRAS_IUC: Record<number, RegrasIuc> = {
  2026: iuc2026 as unknown as RegrasIuc,
};

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
  return isvPuro(e, r);
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
  return iucPuro(e, r);
}

/**
 * Custo anual de manter um ligeiro na estrada, a partir do valor de compra.
 * O IUC não depende do preço pago, mas serve de comparação entre veículos.
 */
export function custoAnualCarro(
  entrada: EntradaIuc,
  precoCompra: number
): { iuc: number; iucSobrePreco: number } {
  const ano = entrada.ano ?? 2026;
  const r = REGRAS_IUC[ano];
  if (!r) throw new Error(`iuc: não há regras para ${ano}`);
  return custoAnualCarroPuro(entrada, precoCompra, r);
}

/**
 * Decompõe o ISV (na matrícula) e o custo fiscal anual de circular
 * (IUC + ISP + taxa de carbono + IVA sobre combustível).
 */
export function custoFiscalAnualCarro(
  e: EntradaCustoFiscalCarro,
  ano = 2026
): ResultadoCustoFiscalCarro {
  const rIsv = REGRAS_ISV[ano];
  const rIuc = REGRAS_IUC[ano];
  if (!rIsv || !rIuc)
    throw new Error(`carro: não há regras para ${ano}`);
  return custoFiscalAnualCarroPuro(e, rIsv, rIuc);
}
