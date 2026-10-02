/**
 * O interior da Escola — porta do desenho e dos minis de
 * `cenaEscola()` do protótipo. A sala de aula com o quadro verde, a
 * professora Diana e o Gonçalo na carteira.
 *
 * Os `mini()` são os pequenos gráficos do primeiro passo: a mesma
 * série desenhada com o eixo desde zero e com o eixo cortado. São
 * desenhos próprios (não usam `grafico-linhas` — o propósito deles é
 * mostrar um eixo «batoteiro», coisa que o gráfico reutilizável não
 * deixa fazer por princípio).
 */
import { pessoa, ELENCO } from "@/lib/bairro/personagens";
import { fmtNum } from "@/lib/format";
import type { Ponto } from "./dados";
import { K, paredeChao } from "./p2c-arte-base";

/** O interior: quadro verde com giz, professora e carteira. */
export function interiorEscola(placa: string, perguntaQuadro: string): string {
  let s = paredeChao("#fff6d6", "#c9a36b", placa, "#e6a93a", "#16130f");
  // o quadro: eixos a giz e a linha amarela
  s += `<g><rect x="90" y="70" width="360" height="200" rx="6" fill="#264a3a" stroke="#8a5a2b" stroke-width="10"/><path d="M120 240 H420 M120 240 V100" stroke="#fff" stroke-width="2.4" opacity=".85"/><path id="escGiz" d="M130 220 L170 210 L210 214 L250 190 L290 180 L330 150 L370 140 L410 110" fill="none" stroke="#ffd34d" stroke-width="3.4" stroke-linecap="round"/><text x="420" y="98" text-anchor="end" font-family="Caveat" font-weight="700" font-size="20" fill="#fff">${perguntaQuadro}</text><rect x="100" y="270" width="340" height="8" fill="#8a5a2b"/></g>`;
  // a professora Diana
  s += `<g id="escDiana" transform="translate(500 380) scale(1.05)">${pessoa(ELENCO.diana)}</g>`;
  // a carteira e o Gonçalo
  s += `<g><rect x="150" y="360" width="140" height="10" fill="#b98552" stroke="${K}" stroke-width="2.4"/><path d="M160 370 v40 M280 370 v40" stroke="${K}" stroke-width="4"/></g><g transform="translate(220 400) scale(.9)">${pessoa(ELENCO.goncalo)}</g>`;
  return s;
}

/**
 * Um mini-gráfico (o `mini` do protótipo): o eixo desde zero ou cortado
 * no mínimo da série — o truque que a lição desfaz.
 */
export function mini(pts: Ponto[], desdeZero: boolean, mesCurto: (t: string) => string): { svg: string; lo: number; hi: number } {
  const vs = pts.map((p) => p.v);
  const lo = desdeZero ? 0 : Math.floor(Math.min(...vs));
  const hi = desdeZero ? Math.ceil(Math.max(...vs) / 20) * 20 : Math.ceil(Math.max(...vs));
  if (!pts.length || hi === lo) return { svg: "", lo: 0, hi: 0 };
  const x = (k: number) => 30 + (170 * k) / (pts.length - 1);
  const y = (v: number) => 110 - (95 * (v - lo)) / (hi - lo);
  const svg = `<svg viewBox="0 0 210 130" role="img" aria-label="Eixo de ${fmtNum(lo, 0)} a ${fmtNum(hi, 0)}" font-family="Archivo"><path d="M30 15 V110 H200" fill="none" stroke="#16130f" stroke-width="1.6"/><text x="26" y="${y(hi) + 4}" text-anchor="end" font-size="10" fill="#6e675e">${fmtNum(hi, 0)}</text><text x="26" y="${y(lo) + 4}" text-anchor="end" font-size="10" fill="#6e675e" font-weight="800">${fmtNum(lo, 0)}</text>
    <path d="${pts.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")}" fill="none" stroke="#e2412a" stroke-width="3"/><text x="115" y="126" text-anchor="middle" font-size="10" fill="#6e675e">${mesCurto(pts[0].t)} → ${mesCurto(pts[pts.length - 1].t)}</text></svg>`;
  return { svg, lo, hi };
}
