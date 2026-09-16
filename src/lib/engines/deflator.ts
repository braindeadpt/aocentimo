/**
 * Deflator IHPC: corrige valores nominais para poder de compra.
 * A série é o índice mensal (CP00) — meses no formato "YYYY-MM".
 */

export interface PontoSerie {
  t: string;
  v: number;
}

/** Quanto valem hoje `valor` euros de `mesInicio` (índice mais recente). */
export function inflacionar(
  valor: number,
  mesInicio: string,
  serie: PontoSerie[]
): number | null {
  const ponto = serie.find((p) => p.t.startsWith(mesInicio));
  const ultimo = serie.at(-1);
  if (!ponto || !ultimo) return null;
  return valor * (ultimo.v / ponto.v);
}

/**
 * Salário em termos reais: compara o salário de hoje com o que o salário
 * antigo valeria se tivesse acompanhado a inflação.
 */
export function salarioReal(
  salarioInicio: number,
  salarioHoje: number,
  mesInicio: string,
  serie: PontoSerie[]
): { equivalenteHoje: number; variacaoReal: number } | null {
  const eq = inflacionar(salarioInicio, mesInicio, serie);
  if (eq === null) return null;
  return { equivalenteHoje: eq, variacaoReal: salarioHoje / eq - 1 };
}
