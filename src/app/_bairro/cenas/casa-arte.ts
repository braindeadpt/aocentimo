/**
 * O interior da Casa da Inês — porta de `cenaCasa()` do protótipo
 * (`cenas-bairro.js`). A sala com a janela para a Ribeira, a casa em
 * miniatura e a pilha de recibos que cresce com os meses de trabalho.
 * `pessoa()`/`ELENCO` são os mesmos do mapa — a cena usa a personagem
 * oficial, não um desenho paralelo.
 */
import { pessoa, ELENCO } from "@/lib/bairro/personagens";
import { K, paredeChao } from "./p2c-arte-base";

/** A altura da pilha por mês de trabalho (0,9 px/mês, como no protótipo). */
export const PX_POR_MES = 0.9;

/** O interior: janela para a Ribeira, mesa, casa miniatura, pilha, a Inês. */
export function interiorCasa(placa: string, legPilha: string): string {
  let s = paredeChao("#fdf1dc", "#b98552", placa, "#0c8f5c");
  // a janela com a Ribeira lá fora (casas ao longe e o rio)
  s += `<g><rect x="360" y="70" width="240" height="170" fill="#9fd6f3" stroke="${K}" stroke-width="4"/><path d="M360 200 q60 -30 120 -10 t120 -12 V240 H360z" fill="#4f9bc4"/><path d="M372 190 l18 -24 h30 l14 24 M470 180 l22 -30 h40 l18 30" fill="#e2412a" stroke="${K}" stroke-width="2"/><rect x="376" y="150" width="30" height="40" fill="#e9a13b" stroke="${K}" stroke-width="1.6"/><rect x="480" y="146" width="44" height="40" fill="#7fb3d9" stroke="${K}" stroke-width="1.6"/><path d="M480 70 V240 M360 155 H600" stroke="#fff" stroke-width="6"/><path d="M480 70 V240 M360 155 H600" stroke="${K}" stroke-width="1.6"/></g>`;
  // a mesa
  s += `<rect x="40" y="300" width="560" height="16" rx="4" fill="#8a5a2b" stroke="${K}" stroke-width="2.6"/><path d="M70 316 v94 M570 316 v94" stroke="${K}" stroke-width="8"/>`;
  // a casa em miniatura
  s += `<g id="casaMini" transform="translate(180 300)"><path d="M-60 0 V-60 L0 -100 L60 -60 V0z" fill="#fff6e3" stroke="${K}" stroke-width="3"/><path d="M-68 -56 L0 -106 L68 -56" fill="none" stroke="#c9573a" stroke-width="8" stroke-linecap="round"/><rect x="-14" y="-36" width="28" height="36" fill="#2445d6" stroke="${K}" stroke-width="2.2"/><rect x="-46" y="-50" width="20" height="18" fill="var(--vidro)" stroke="${K}" stroke-width="2"/><rect x="26" y="-50" width="20" height="18" fill="var(--vidro)" stroke="${K}" stroke-width="2"/></g>`;
  // a pilha de recibos — cresce para os meses de trabalho
  s += `<g id="casaPilha" transform="translate(330 300)"><rect class="pilha" x="-36" y="0" width="72" height="0" fill="#fff" stroke="${K}" stroke-width="2.4"/><g class="riscas"></g><text class="pilha-txt" x="0" y="-8" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="16" fill="${K}"></text><text x="0" y="36" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="12" fill="${K}">${legPilha}</text></g>`;
  // a Inês, de costas para a janela
  s += `<g id="casaInes" transform="translate(520 440) scale(-.95 .95)">${pessoa(ELENCO.ines)}</g>`;
  return s;
}
