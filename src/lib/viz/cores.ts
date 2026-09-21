/**
 * Cores de dados — B-01. Devolvem nomes de variável CSS, nunca hex:
 * o tema (claro/escuro) resolve os valores em globals.css.
 *
 *  --seq-1..4   rampa sequencial (magnitude, quantis de calendário)
 *  --dink-1..4  família de tinta por ordem decrescente (séries irmãs)
 */

const grampo4 = (i: number) => Math.min(4, Math.max(1, Math.round(i)));

/** --seq-N directo (1–4). */
export const corSeq = (n: number) => `var(--seq-${grampo4(n)})`;

/** --dink-N directo (1–4). */
export const corDink = (n: number) => `var(--dink-${grampo4(n)})`;

/** Cor da i-ésima série (0-based) — percorre a família de tinta. */
export const corSerie = (i: number) => `var(--dink-${(Math.abs(i) % 4) + 1})`;

/** Quantil 0–3 → rampa sequencial (célula de calendário). */
export const corQuantil = (q: number) => `var(--seq-${grampo4(q + 1)})`;
