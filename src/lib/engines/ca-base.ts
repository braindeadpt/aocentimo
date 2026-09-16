/**
 * Taxa base dos Certificados de Aforro Série F — fórmula oficial:
 * média da Euribor 3M nos 10 dias úteis anteriores, arredondada ao
 * milésimo, limitada a [0 %, 2,50 %]. Com a média mensal BPstat a
 * taxa indicativa é min(média mensal, 2,5 %) — o valor oficial é o
 * publicado mensalmente pelo IGCP em data/fiscal/ca.json.
 */
export function taxaBaseCA(euribor3mPct: number): number {
  const v = Math.min(Math.max(euribor3mPct, 0), 2.5);
  return Math.round(v * 1000) / 1000;
}
