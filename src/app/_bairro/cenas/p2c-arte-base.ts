/**
 * Base comum da arte das cenas P2c — a `paredeChao` do protótipo
 * (`cena-base.js`): parede, chão e a placa com o nome do sítio.
 * Funções puras, sem DOM.
 */

import { FINO, fmtNum } from "@/lib/format";

export const K = "#16130f";

/** Parede + chão + placa com o nome do sítio (a `paredeChao` do protótipo). */
export function paredeChao(
  corParede: string,
  corChao: string,
  placa: string,
  corPlaca = "#16130f",
  corTexto = "#fff"
): string {
  return `<rect x="0" y="0" width="640" height="410" fill="${corParede}"/><rect x="0" y="410" width="640" height="60" fill="${corChao}" stroke="${K}" stroke-width="2.6"/>
    <rect x="${320 - placa.length * 7 - 24}" y="16" width="${placa.length * 14 + 48}" height="34" rx="6" fill="${corPlaca}" stroke="${K}" stroke-width="2.6"/><text x="320" y="40" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="${corTexto}">${placa}</text>`;
}

/** «2026-Q1» → «1.º trimestre de 2026» (o `trimestre()` do protótipo). */
export const trimestre = (t: string): string => `${t.slice(-1)}.º trimestre de ${t.slice(0, 4)}`;

/** «▲ +191 %» — o `setaVar()` do protótipo (seta, sinal, espaço fino). */
export const setaVar = (v: number, casas = 0, un = "%"): string =>
  `${v > 0 ? "▲ +" : v < 0 ? "▼ −" : ""}${fmtNum(Math.abs(v), casas)}${FINO}${un}`;
