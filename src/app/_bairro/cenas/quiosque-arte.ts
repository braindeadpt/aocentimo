/**
 * O interior do Quiosque da praça — porta do desenho de
 * `cenaQuiosque()` do protótipo. O quiosque verde com os jornais
 * pendurados, o vendedor, a primeira página do Jornal do Bairro e o
 * Gonçalo a passar.
 */
import { pessoa, ELENCO } from "@/lib/bairro/personagens";
import { K, paredeChao } from "./p2c-arte-base";

/** As faixas de cor dos jornais pendurados (a fila do protótipo). */
const CAPAS = ["#e2412a", "#2445d6", "#16130f", "#ffc62b", "#0c8f5c"];

/** O interior; `#quiManchete` fica vazio até ao passo 2 escrevê-la. */
export function interiorQuiosque(placa: string, cabecalho: string, rodape: string): string {
  let s = paredeChao("#dff2e6", "#e4dccb", placa, "#07613d");
  // o quiosque: telhado, corpo e a montra com os jornais
  s += `<g><path d="M120 110 L320 70 L520 110 z" fill="#0c8f5c" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><rect x="140" y="110" width="360" height="300" fill="#07613d" stroke="${K}" stroke-width="3"/><rect x="170" y="140" width="300" height="160" fill="#f7f5f0" stroke="${K}" stroke-width="2.4"/>`;
  for (let k = 0; k < 5; k++)
    s += `<g transform="translate(${186 + k * 58} 152)"><rect width="46" height="60" fill="#fff" stroke="${K}" stroke-width="1.6"/><rect x="4" y="4" width="38" height="8" fill="${CAPAS[k]}"/><path d="M5 18 h36 M5 24 h36 M5 30 h24" stroke="${K}" stroke-width="1" opacity=".4"/></g>`;
  // o vendedor
  s += `<g id="quiVend" transform="translate(320 400) scale(1)">${pessoa({ pele: "c", cabelo: "curto", corCabelo: "#cfc9c1", roupa: "#ffc62b", calcas: "#2b3a55", bigode: true, oculos: true })}</g>`;
  // o Jornal do Bairro pendurado — a manchete escreve-se no passo 2
  s += `<rect x="150" y="320" width="340" height="90" fill="#0c8f5c" stroke="${K}" stroke-width="3"/><rect x="170" y="330" width="120" height="70" fill="#fff" stroke="${K}" stroke-width="2"/><text x="230" y="350" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9.5" fill="${K}">${cabecalho}</text><text id="quiManchete" x="230" y="376" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="15" fill="#e2412a"></text><text x="230" y="392" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="8.5" fill="${K}">${rodape}</text></g>`;
  // o Gonçalo a passar
  s += `<g transform="translate(560 440) scale(-.9 .9)">${pessoa(ELENCO.goncalo)}</g>`;
  return s;
}
