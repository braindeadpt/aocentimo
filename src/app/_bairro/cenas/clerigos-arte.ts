/**
 * O interior da Torre dos Clérigos — o miradouro lá em cima. Pela arcada
 * de granito vê-se o Porto: os telhados cá à frente, o Douro com a Ponte
 * D. Luís I e os rabelos, Gaia e a Serra do Pilar do outro lado. Sobre o
 * rio, as colunas com o peso do Norte no país (PIB, exportações, emprego
 * na indústria) ou, no passo 2, duas (PIB por habitante: Norte e país).
 *
 * REFEITO a 2026-10-13 (dono: «a animação dentro dos Clérigos é fraca»):
 *   · a CHEGADA ao alto: a vista sobe para o lugar e a arcada abre, como
 *     quem acaba de subir os 240 degraus (`nte-vista`, `nte-arco`);
 *   · cada coluna tem por trás o contorno tracejado do PAÍS INTEIRO (100 %
 *     no passo 1; o PIB por habitante de Portugal no passo 2), para se ver
 *     de relance quanto do todo é o Norte (`nte-todo`);
 *   · a coluna sobe com ressalto, um brilho passa por ela no fim e o
 *     número salta (`nte-col`, `nte-brilho`, `nte-val`);
 *   · o céu vive: nuvens a andar, gaivotas a bater as asas, o rio a
 *     cintilar, dois rabelos a atravessar, a Inês ao parapeito a apontar.
 * Nada disto corre em reduced-motion: o desenho parado é o estado final.
 *
 * As alturas são proporcionais (100 % = 220 px); um valor em falta não
 * desenha coluna e escreve «—». Os ids `nteV{k}` são o gancho da contagem.
 */
import { ELENCO, pessoa } from "@/lib/bairro/personagens";
import { K } from "./p2c-arte-base";

export interface ColunaNorte {
  rotulo: string;
  valor: string;
  pct: number | null;
  cor: string;
}

const TELHADOS = ["#c4623f", "#d9774f", "#b5532f", "#e08a5d", "#c4623f", "#a94a2a", "#d9774f", "#c4623f"];
const FACHADAS = ["#f6f1e6", "#ffd9a8", "#cfe3f2", "#f6f1e6", "#ffe9b0", "#e8d5f0", "#f6f1e6", "#d8efe0"];

/** O atraso da 1.ª coluna: depois de a vista chegar ao alto. */
const ATRASO0 = 0.9;
const ATRASO_PASSO = 0.35;

const nuvem = (x: number, y: number, e: number, atraso: number): string =>
  `<g class="nte-nuvem" style="animation-delay:${atraso}s"><g transform="translate(${x} ${y}) scale(${e})"><path d="M0 0 h86 a14 14 0 0 0 -7 -27 a22 22 0 0 0 -38 -10 a16 16 0 0 0 -29 9 a13 13 0 0 0 -12 28 z" fill="#fff" stroke="${K}" stroke-width="2.2"/></g></g>`;

const gaivota = (x: number, y: number, e: number, atraso: number): string =>
  `<g class="nte-gaivota" style="animation-delay:${atraso}s"><g transform="translate(${x} ${y}) scale(${e})"><path class="nte-asas" style="animation-delay:${atraso}s" d="M-14 0 Q-7 -8 0 0 Q7 -8 14 0" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;

const barco = (cls: string, x: number, y: number, e: number, vela: string): string =>
  `<g class="${cls}" transform="translate(${x} 0)"><g transform="translate(0 ${y}) scale(${e})"><path d="M-70 0 Q-35 16 0 0 L-8 -6 H-62 Z" fill="#7a4a26" stroke="${K}" stroke-width="2"/><path d="M-36 -6 V-44" stroke="${K}" stroke-width="2.2"/><path d="M-36 -42 H-14 V-12 H-58 V-42 Z" fill="${vela}" stroke="${K}" stroke-width="1.8"/><path d="M-62 -6 L-76 2" stroke="${K}" stroke-width="2.4"/><rect x="-54" y="-14" width="10" height="7" fill="#b5773f" stroke="${K}" stroke-width="1.2"/><rect x="-30" y="-14" width="10" height="7" fill="#b5773f" stroke="${K}" stroke-width="1.2"/></g></g>`;

export function interiorClerigos(placa: string, colunas: readonly ColunaNorte[]): string {
  let s = `<defs><linearGradient id="nteCeu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f0"/><stop offset="1" stop-color="#e3f4fb"/></linearGradient><linearGradient id="nteRio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c9fd1"/><stop offset="1" stop-color="#2f78ad"/></linearGradient></defs>`;

  // ——— a VISTA: tudo o que está lá fora sobe para o lugar ao chegar ———
  s += `<g class="nte-vista">`;
  s += `<rect x="-20" y="-20" width="680" height="510" fill="url(#nteCeu)"/>`;
  s += `<circle cx="520" cy="86" r="26" fill="#ffd34d" stroke="${K}" stroke-width="2.4"/>`;
  s += nuvem(70, 92, 0.9, 0) + nuvem(330, 70, 0.7, -9) + nuvem(470, 128, 0.55, -17);

  // Gaia e a Serra do Pilar, do outro lado do rio
  s += `<path d="M-10 300 L60 282 L150 276 L240 262 L330 270 L400 250 L470 226 L540 214 L610 222 L650 232 V312 H-10 Z" fill="#c9d9a8" stroke="${K}" stroke-width="2"/>`;
  // o mosteiro da Serra do Pilar: o claustro redondo e a cúpula
  s += `<ellipse cx="540" cy="222" rx="44" ry="13" fill="#efe7d6" stroke="${K}" stroke-width="2"/><rect x="496" y="206" width="88" height="16" fill="#efe7d6" stroke="${K}" stroke-width="2"/><ellipse cx="540" cy="206" rx="44" ry="11" fill="#e3d8c2" stroke="${K}" stroke-width="2"/><path d="M522 206 V188 a18 18 0 0 1 36 0 V206" fill="#efe7d6" stroke="${K}" stroke-width="2"/><path d="M540 170 V160" stroke="${K}" stroke-width="2"/>`;
  // as caves, os telhados compridos à beira-rio de Gaia
  for (let k = 0; k < 6; k++) {
    const x = 10 + k * 76;
    const y = 288 - (k % 2) * 6;
    s += `<rect x="${x}" y="${y}" width="66" height="22" fill="#f6efe1" stroke="${K}" stroke-width="1.8"/><path d="M${x - 3} ${y} L${x + 8} ${y - 9} H${x + 58} L${x + 69} ${y} Z" fill="#b5532f" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/><rect x="${x + 14}" y="${y + 6}" width="38" height="8" fill="#16130f" opacity=".75"/>`;
  }

  // o Douro e o cintilar
  s += `<path d="M-10 310 Q160 300 320 312 T650 306 V392 H-10 Z" fill="url(#nteRio)" stroke="${K}" stroke-width="2.4"/>`;
  const brilhos: readonly (readonly [number, number, number])[] = [
    [24, 336, 38], [126, 350, 50], [262, 330, 36], [362, 352, 44], [470, 334, 54], [570, 356, 34], [196, 372, 30], [420, 378, 40],
  ];
  brilhos.forEach(([x, y, w], k) => {
    s += `<path class="nte-cintila" style="animation-delay:${(k * 0.37) % 2.2}s" d="M${x} ${y} h${w}" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`;
  });

  // a Ponte D. Luís I, ao longe à esquerda: o arco de ferro entre os
  // pilares, o tabuleiro de cima apoiado nele e o de baixo à cota do rio
  s += `<g class="nte-ponte" opacity=".95">`;
  s += `<path d="M14 312 Q118 176 222 312" fill="none" stroke="#5a4636" stroke-width="7"/><path d="M14 312 Q118 176 222 312" fill="none" stroke="${K}" stroke-width="1.6" stroke-dasharray="2 5"/>`;
  s += `<path d="M2 236 H236" stroke="#5a4636" stroke-width="6"/><path d="M2 233 H236" stroke="${K}" stroke-width="1.4"/>`;
  for (const x of [52, 84, 118, 152, 184]) {
    const yArco = 312 - (1 - Math.pow((x - 118) / 104, 2)) * 68 - 1;
    s += `<path d="M${x} 236 V${yArco.toFixed(1)}" stroke="#5a4636" stroke-width="2.6"/>`;
  }
  s += `<rect x="-2" y="232" width="16" height="80" fill="#cfc4b0" stroke="${K}" stroke-width="2"/><rect x="222" y="232" width="16" height="80" fill="#cfc4b0" stroke="${K}" stroke-width="2"/><path d="M14 296 H222" stroke="#5a4636" stroke-width="4"/>`;
  s += `</g>`;

  // os rabelos que atravessam o Douro. Parados (reduced-motion) ficam pelo
  // atributo transform; com movimento, a animação CSS leva-os de fora à
  // esquerda até fora à direita (o segundo mais longe e mais devagar)
  s += barco("nte-rabelo nte-rabelo2", 520, 330, 0.62, "#f7f1e3");
  s += barco("nte-rabelo", 380, 352, 1, "#f7f1e3");

  // as gaivotas
  s += gaivota(150, 150, 1, 0) + gaivota(190, 170, 0.8, -1.3) + gaivota(430, 190, 0.9, -3.1);

  // as colunas, sobre o rio: crescem do chão (CSS) e o número conta (JS).
  // Por trás de cada uma, tracejado, o PAÍS INTEIRO (100 %).
  const base = 300;
  const passoX = colunas.length === 2 ? 190 : 150;
  const x0 = 320 - ((colunas.length - 1) * passoX) / 2 - 42;
  colunas.forEach((c, k) => {
    const x = x0 + k * passoX;
    const atraso = ATRASO0 + k * ATRASO_PASSO;
    s += `<g class="nte-todo" style="animation-delay:${atraso - 0.2}s"><rect x="${x}" y="${base - 220}" width="84" height="220" fill="#fff" fill-opacity=".35" stroke="${K}" stroke-width="2" stroke-dasharray="6 5"/></g>`;
    if (c.pct !== null) {
      const h = Math.max(6, Math.min(100, c.pct) * 2.2);
      s += `<g class="nte-col" style="animation-delay:${atraso}s"><rect x="${x + 5}" y="${base - h + 5}" width="84" height="${h}" fill="${K}"/><rect x="${x}" y="${base - h}" width="84" height="${h}" fill="${c.cor}" stroke="${K}" stroke-width="2.6"/><rect x="${x + 8}" y="${base - h + 6}" width="10" height="${Math.max(0, h - 12)}" rx="4" fill="#fff" opacity=".35"/></g>`;
      // o brilho que passa pela coluna quando ela acaba de subir
      s += `<clipPath id="nteCorte${k}"><rect x="${x}" y="${base - h}" width="84" height="${h}"/></clipPath><g clip-path="url(#nteCorte${k})"><path class="nte-brilho" style="animation-delay:${atraso + 0.7}s" d="M${x - 30} ${base} L${x - 6} ${base - h} H${x + 14} L${x - 10} ${base} Z" fill="#fff" opacity="0"/></g>`;
      s += `<g class="nte-val-g" style="animation-delay:${atraso}s"><text id="nteV${k}" class="nte-val" style="animation-delay:${atraso}s" x="${x + 42}" y="${base - h - 12}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="${K}" stroke="#fff" stroke-width="5" paint-order="stroke">${c.valor}</text></g>`;
    } else {
      s += `<text x="${x + 42}" y="${base - 12}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="21" fill="${K}">—</text>`;
    }
    s += `<rect x="${x - 36}" y="${base + 6}" width="156" height="22" rx="4" fill="#fff" stroke="${K}" stroke-width="2"/><text x="${x + 42}" y="${base + 21.5}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="10.5" fill="${K}">${c.rotulo}</text>`;
  });

  // os telhados do Porto cá à frente, com chaminés e varandas
  for (let k = 0; k < 8; k++) {
    const x = k * 82 - 6;
    const h = 46 + ((k * 37) % 30);
    const topo = 470 - h - 40;
    s += `<rect x="${x}" y="${topo}" width="80" height="${h + 40}" fill="${FACHADAS[k]}" stroke="${K}" stroke-width="2"/>`;
    if (k % 3 !== 1) s += `<rect x="${x + 54}" y="${topo - 44}" width="10" height="22" fill="#d9774f" stroke="${K}" stroke-width="1.8"/>`;
    s += `<path d="M${x - 4} ${topo} L${x + 40} ${topo - 30} L${x + 84} ${topo} Z" fill="${TELHADOS[k]}" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<rect x="${x + 16}" y="${topo + 16}" width="14" height="20" fill="#3d5f7a" stroke="${K}" stroke-width="1.6"/><rect x="${x + 48}" y="${topo + 16}" width="14" height="20" fill="#3d5f7a" stroke="${K}" stroke-width="1.6"/><path d="M${x + 12} ${topo + 38} h56" stroke="${K}" stroke-width="2"/>`;
  }
  s += `</g>`;

  // ——— a ARCADA de granito do miradouro e o parapeito, à volta de tudo ———
  s += `<g class="nte-arco">`;
  s += `<path d="M-60 -60 H700 V530 H600 V150 A280 130 0 0 0 40 150 V530 H-60 Z" fill="#cfc6b6" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M40 150 A280 130 0 0 1 600 150" fill="none" stroke="#a89d8a" stroke-width="8"/>`;
  // as aduelas da arcada e a pedra das ombreiras
  for (let k = 1; k < 10; k++) {
    const a = Math.PI * (k / 10);
    const xi = 320 - 280 * Math.cos(a);
    const yi = 150 - 130 * Math.sin(a);
    const xo = 320 - 312 * Math.cos(a);
    const yo = 150 - 158 * Math.sin(a);
    s += `<path d="M${xi.toFixed(1)} ${yi.toFixed(1)} L${xo.toFixed(1)} ${yo.toFixed(1)}" stroke="#a89d8a" stroke-width="2.2"/>`;
  }
  for (const y of [200, 260, 320, 380]) s += `<path d="M0 ${y} H40 M600 ${y} H640" stroke="#a89d8a" stroke-width="2.2"/>`;
  // o parapeito com balaústres, onde a Inês se debruça
  s += `<rect x="36" y="418" width="568" height="14" fill="#d8cfbf" stroke="${K}" stroke-width="2.4"/>`;
  for (let x = 52; x < 600; x += 26) s += `<path d="M${x} 432 q-6 9 0 18 q6 9 0 18 h10 q-6 -9 0 -18 q6 -9 0 -18 Z" fill="#d8cfbf" stroke="${K}" stroke-width="1.6"/>`;
  s += `<rect x="36" y="466" width="568" height="10" fill="#cfc6b6" stroke="${K}" stroke-width="2.2"/>`;
  s += `<g class="nte-ines" transform="translate(96 470) scale(.82)"><g class="nte-aponta">${pessoa(ELENCO.ines, "ines")}</g></g>`;
  s += `</g>`;

  // a placa com o nome
  s += `<g class="nte-placa"><rect x="${320 - placa.length * 7 - 24}" y="16" width="${placa.length * 14 + 48}" height="34" rx="6" fill="${K}" stroke="${K}" stroke-width="2.6"/><text x="320" y="40" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="#fff">${placa}</text></g>`;
  return s;
}

/** Quando a última coluna acaba de subir (s) — a contagem dos números usa-o. */
export const atrasoColuna = (k: number): number => ATRASO0 + k * ATRASO_PASSO;
