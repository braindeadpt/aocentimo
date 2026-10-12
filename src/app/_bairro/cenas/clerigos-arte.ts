/**
 * O interior da Torre dos Clérigos — o miradouro lá em cima. Pela arcada
 * de granito vê-se o Porto: os telhados, o Douro e, sobre eles, três
 * colunas com o peso do Norte no país (PIB, exportações, emprego na
 * indústria). As alturas são proporcionais ao valor (100 % = 220 px);
 * um valor em falta não desenha coluna e escreve «—».
 */
import { K } from "./p2c-arte-base";

export interface ColunaNorte {
  rotulo: string;
  valor: string;
  pct: number | null;
  cor: string;
}

const TELHADOS = ["#c4623f", "#d9774f", "#b5532f", "#e08a5d", "#c4623f", "#a94a2a", "#d9774f", "#c4623f"];

export function interiorClerigos(placa: string, colunas: readonly ColunaNorte[]): string {
  // o céu e o Douro ao fundo
  let s = `<rect x="0" y="0" width="640" height="470" fill="#bfe3f5"/>`;
  s += `<path d="M0 330 Q160 310 320 326 T640 318 V380 H0 Z" fill="#3d8fc4" stroke="${K}" stroke-width="2.4"/>`;
  s += `<path d="M30 352 h40 M140 344 h56 M300 350 h44 M450 340 h60 M560 354 h36" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`;
  // a outra margem (Gaia) e os telhados do Porto cá à frente
  s += `<path d="M0 318 L80 300 L160 306 L260 296 L360 304 L460 294 L560 302 L640 296 V330 H0 Z" fill="#e7dfcf" stroke="${K}" stroke-width="2"/>`;
  for (let k = 0; k < 8; k++) {
    const x = k * 82 - 6;
    const h = 46 + ((k * 37) % 30);
    s += `<rect x="${x}" y="${470 - h - 40}" width="80" height="${h + 40}" fill="#f6f1e6" stroke="${K}" stroke-width="2"/>`;
    s += `<path d="M${x - 4} ${470 - h - 40} L${x + 40} ${470 - h - 70} L${x + 84} ${470 - h - 40} Z" fill="${TELHADOS[k]}" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<rect x="${x + 16}" y="${470 - h - 24}" width="14" height="20" fill="#3d5f7a" stroke="${K}" stroke-width="1.6"/><rect x="${x + 48}" y="${470 - h - 24}" width="14" height="20" fill="#3d5f7a" stroke="${K}" stroke-width="1.6"/>`;
  }
  // as três colunas, sobre o rio
  const base = 300;
  colunas.forEach((c, k) => {
    const x = 128 + k * 150;
    if (c.pct !== null) {
      const h = Math.max(6, Math.min(100, c.pct) * 2.2);
      s += `<rect x="${x + 5}" y="${base - h + 5}" width="84" height="${h}" fill="${K}"/>`;
      s += `<rect x="${x}" y="${base - h}" width="84" height="${h}" fill="${c.cor}" stroke="${K}" stroke-width="2.6"/>`;
      s += `<text x="${x + 42}" y="${base - h - 12}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="${K}">${c.valor}</text>`;
    } else {
      s += `<text x="${x + 42}" y="${base - 12}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="${K}">—</text>`;
    }
    s += `<rect x="${x - 36}" y="${base + 6}" width="156" height="22" rx="4" fill="#fff" stroke="${K}" stroke-width="2"/><text x="${x + 42}" y="${base + 21.5}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="10.5" fill="${K}">${c.rotulo}</text>`;
  });
  // a arcada de granito do miradouro, à volta de tudo
  s += `<path d="M0 0 H640 V470 H600 V150 A280 130 0 0 0 40 150 V470 H0 Z" fill="#cfc6b6" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M40 150 A280 130 0 0 1 600 150" fill="none" stroke="#a89d8a" stroke-width="8"/>`;
  // a placa com o nome
  s += `<rect x="${320 - placa.length * 7 - 24}" y="16" width="${placa.length * 14 + 48}" height="34" rx="6" fill="${K}" stroke="${K}" stroke-width="2.6"/><text x="320" y="40" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="#fff">${placa}</text>`;
  return s;
}
