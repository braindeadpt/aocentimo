/**
 * layouts — a geometria pura do campo de cêntimos (V4, S1-04).
 *
 * Três layouts sobre os mesmos pontos: "moeda" (a face de 1 €,
 * desenhada a partir da moeda real — coroa de latão-níquel dourada,
 * disco de cuproníquel prateado com raio ≈ 0,74), "grelha" (10×10) e
 * "montes" (um aglomerado rotulado por parte).
 *
 * Tudo determinista — o desenho do servidor (svg) e o do canvas são o
 * mesmo número de pontos nos mesmos sítios. Os centros dos montes são
 * fracções da largura (`fx`) para os rótulos HTML, posicionados em %,
 * ficarem exactamente sobre o seu monte em qualquer largura — e para
 * o svg de SSR (cx em %) coincidir com eles.
 */
import type { ParteEntrada } from "./repartir";

export type NomeLayout = "moeda" | "grelha" | "montes";
export type TomParte = "sai" | "fica" | "neutro";

/** Parte como o motor a vê: valor real + cor semântica. */
export interface PartePontos extends ParteEntrada {
  tom: TomParte;
}

/* ————— a moeda de 1 € (face comum, Luc Luycx — medidas da moeda real) ————— */

/** raio do disco de cuproníquel / raio total — 0,74 na moeda real */
export const ANEL_DISCO = 0.74;
/** espessura da moeda em fracção do raio — 2,33 mm num raio de 11,6 mm */
export const ESPESSURA = 0.2;
/** amplitude da oscilação em repouso — ±0,95 rad ≈ ±55°, nunca de perfil */
export const OSCILACAO = 0.95;
/** theta fixo em reduced-motion / SSR — inclinada o suficiente para se
 *  ler como moeda 3D (aresta visível), sem nunca virar de perfil */
export const THETA_PARADA = 0.32;

/** os metais são o objecto real — têm as SUAS cores, não a cor ocre */
export const METAL = {
  ouro: [216, 184, 98] as const, // coroa de latão-níquel
  prata: [214, 217, 222] as const, // disco de cuproníquel
  arestaEscura: [111, 86, 32] as const,
  arestaClara: [134, 105, 43] as const,
};

export interface PontoMoeda {
  /** posição na face, em unidades do raio (0..~0,93) */
  ux: number;
  uy: number;
  /** o metal que tem por baixo — herdado ao desfazer-se */
  metal: "ouro" | "prata";
}

const ANGULO_AUREO = 2.399963229728653; // phyllotaxis

/**
 * Os `total` pontos distribuídos pela face em phyllotaxis — densidade
 * uniforme, sem linhas visíveis. Cada ponto herda o metal que tem por
 * baixo: fora do anel → ouro; dentro do disco → prata.
 */
export function faceMoeda(total: number): PontoMoeda[] {
  const pontos: PontoMoeda[] = [];
  for (let i = 0; i < total; i++) {
    const r = Math.sqrt((i + 0.5) / total) * 0.93;
    const a = i * ANGULO_AUREO;
    pontos.push({
      ux: r * Math.cos(a),
      uy: r * Math.sin(a),
      metal: r > ANEL_DISCO + 0.02 ? "ouro" : "prata",
    });
  }
  return pontos;
}

export interface GeoMoeda {
  cx: number;
  cy: number;
  R: number;
}

export function geoMoeda(W: number, H: number): GeoMoeda {
  return { cx: W / 2, cy: H * 0.46, R: Math.min(W * 0.25, H * 0.36) };
}

/** posição do ponto da face com a moeda rodada de `theta` */
export function posNaFace(
  p: PontoMoeda,
  g: GeoMoeda,
  theta: number
): { x: number; y: number } {
  return {
    x: g.cx + p.ux * g.R * Math.cos(theta),
    y: g.cy + p.uy * g.R,
  };
}

/* ————— grelha — 10×10 para um euro; outros totais → quase-quadrada ————— */

export interface GeoGrelha {
  cols: number;
  linhas: number;
  /** distância entre centros, px */
  passo: number;
  /** centro da primeira célula */
  x0: number;
  y0: number;
  /** raio de desenho de cada ponto */
  r: number;
}

export function geoGrelha(W: number, H: number, total: number): GeoGrelha {
  const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, total))));
  const linhas = Math.max(1, Math.ceil(Math.max(1, total) / cols));
  const passo = Math.max(
    8,
    Math.min((W * 0.82) / cols, (H * 0.56) / linhas, 30)
  );
  return {
    cols,
    linhas,
    passo,
    x0: W / 2 - ((cols - 1) / 2) * passo,
    y0: H * 0.44 - ((linhas - 1) / 2) * passo,
    r: Math.max(2.2, passo * 0.34),
  };
}

export function slotGrelha(g: GeoGrelha, i: number): { x: number; y: number } {
  return { x: g.x0 + (i % g.cols) * g.passo, y: g.y0 + Math.floor(i / g.cols) * g.passo };
}

/* ————— montes — um aglomerado rotulado por parte ————— */

/**
 * Colunas de um monte: ⌊√pontos⌋ — a forma compacta que a referência
 * aprovada usa (63→7, 19→4, 9→3). 0 pontos → 0 colunas (o rótulo fica).
 */
export function colsMonte(pontos: number): number {
  return pontos > 0 ? Math.max(1, Math.floor(Math.sqrt(pontos))) : 0;
}

export interface MonteGeo {
  /** fracção da largura onde o monte está centrado — o rótulo vai a fx·100% */
  fx: number;
  cols: number;
  gap: number;
  /** centro x e linha de base y, em px */
  cx: number;
  base: number;
}

export interface GeoMontes {
  montes: MonteGeo[];
  /** fracção da altura da linha de base dos montes */
  baseFrac: number;
  /** fracção da altura da linha dos rótulos */
  rotuloFrac: number;
}

/** unidades de «folga» entre montes, em larguras de coluna */
const FOLGA_MONTES = 2.4;
const BASE_FRAC = 0.62;
const ROTULO_FRAC = 0.68;

export function geoMontes(
  W: number,
  H: number,
  pontos: readonly number[]
): GeoMontes {
  const n = pontos.length;
  const cols = pontos.map(colsMonte);
  const unidades = cols.reduce((a, c) => a + c, 0) + FOLGA_MONTES * Math.max(0, n - 1);
  // os centros são fracções puras da largura — válidas a qualquer W;
  // a banda [0,08 … 0,92] deixa margem para o rótulo mais largo
  const lo = 0.09;
  const hi = 0.91;
  const gap = Math.max(9, Math.min(18, W / 52));
  const base = H * BASE_FRAC;
  const montes: MonteGeo[] = [];
  let corrido = 0;
  for (let i = 0; i < n; i++) {
    const meioU = unidades > 0 ? (corrido + cols[i] / 2) / unidades : 0.5;
    const fx = n === 1 ? 0.5 : lo + (hi - lo) * meioU;
    montes.push({ fx, cols: cols[i], gap, cx: fx * W, base });
    corrido += cols[i] + FOLGA_MONTES;
  }
  return { montes, baseFrac: BASE_FRAC, rotuloFrac: ROTULO_FRAC };
}

/** o k-ésimo ponto do monte — enche por linhas a partir da base */
export function slotMonte(
  m: MonteGeo,
  k: number
): { x: number; y: number } {
  return {
    x: m.cx - ((m.cols - 1) / 2) * m.gap + (k % m.cols) * m.gap,
    y: m.base - Math.floor(k / m.cols) * m.gap,
  };
}

/* ————— atribuição — que ponto pertence a que parte ————— */

export interface Dono {
  /** índice da parte a que o ponto pertence */
  part: number;
  /** ordem do ponto dentro da sua parte (posição no monte/grelha) */
  rank: number;
}

/**
 * Sectores da moeda: cada parte recebe uma fatia contígua da face,
 * medida pelo ângulo do ponto. A ÚLTIMA parte fica centrada a nascente
 * (ângulo 0 — é a que «fica contigo», a primeira a ler-se) e as que
 * saem ocupam o arco poente, de cima para baixo — o destacado da
 * coreografia é um único bloco.
 */
export function atribuirSectores(
  face: readonly PontoMoeda[],
  pontos: readonly number[]
): Dono[] {
  const total = face.length;
  const ultima = pontos[pontos.length - 1] ?? 0;
  const inicio = (ultima / Math.max(1, total)) * Math.PI;
  const porAngulo = face
    .map((p, i) => ({
      ang:
        ((Math.atan2(p.uy, p.ux) - inicio) % (Math.PI * 2) + Math.PI * 2) %
        (Math.PI * 2),
      i,
    }))
    .sort((a, b) => a.ang - b.ang);
  const seq: number[] = [];
  pontos.forEach((c, p) => {
    for (let j = 0; j < c; j++) seq.push(p);
  });
  const donos: Dono[] = face.map(() => ({ part: -1, rank: 0 }));
  const conta = pontos.map(() => 0);
  porAngulo.forEach((o, k) => {
    const part = seq[k] ?? -1;
    donos[o.i] = { part, rank: part >= 0 ? conta[part]++ : 0 };
  });
  return donos;
}

/**
 * Atribuição directa por ordem — sem moeda à vista (o campo nasce em
 * grelha/montes): os primeiros pontos são da primeira parte, e por
 * diante. O rank é a posição dentro da parte.
 */
export function atribuirSequencia(
  total: number,
  pontos: readonly number[]
): Dono[] {
  const donos: Dono[] = [];
  const conta = pontos.map(() => 0);
  let i = 0;
  pontos.forEach((c, p) => {
    for (let j = 0; j < c; j++) donos[i++] = { part: p, rank: conta[p]++ };
  });
  // pontos livres (sem dono — soma de valores 0): part −1
  while (i < total) donos[i++] = { part: -1, rank: 0 };
  return donos;
}

/**
 * Re-atribuição mínima quando os valores mudam com os pontos já nos
 * montes/grelha: tira-se aos que têm a mais (do topo do monte para
 * baixo — os de maior rank) e dá-se aos que têm a menos.
 */
export function reatribuir(
  donos: readonly Dono[],
  novosPontos: readonly number[]
): Dono[] {
  const n = novosPontos.length;
  const atuais = new Array<number>(n).fill(0);
  donos.forEach((d) => {
    if (d.part >= 0 && d.part < n) atuais[d.part]++;
  });
  const livres: number[] = [];
  const out: Dono[] = donos.map((d) => ({ ...d }));
  // pontos de partes que deixaram de existir ficam livres
  out.forEach((d, i) => {
    if (d.part >= n) livres.push(i);
  });
  for (let p = 0; p < n; p++) {
    if (atuais[p] > novosPontos[p]) {
      const excesso = atuais[p] - novosPontos[p];
      // libertam-se os de maior rank primeiro (o topo do monte)
      const idx = out
        .map((d, i) => ({ d, i }))
        .filter((o) => o.d.part === p)
        .sort((a, b) => b.d.rank - a.d.rank)
        .slice(0, excesso)
        .map((o) => o.i);
      livres.push(...idx);
    }
  }
  const conta = new Array<number>(n).fill(0);
  for (let q = 0; q < n; q++) {
    let falta = novosPontos[q] - atuais[q];
    while (falta-- > 0) {
      const i = livres.shift();
      if (i === undefined) break;
      out[i] = { part: q, rank: 900 + conta[q]++ };
    }
  }
  // pontos sem dono ficam livres
  for (const i of livres) out[i] = { part: -1, rank: 0 };
  // ranks definitivos: ordem estável por (part, rank antigo)
  const porParte = new Array<number>(n).fill(0);
  out
    .map((d, i) => ({ d, i }))
    .sort((a, b) => a.d.part - b.d.part || a.d.rank - b.d.rank)
    .forEach((o) => {
      if (o.d.part >= 0) out[o.i].rank = porParte[o.d.part]++;
    });
  return out;
}

/* ————— a coreografia aprovada (referencias/V4/prototipo-moeda.html) —————
 * Tempos em ms desde o início da revelação. É uma sequência orquestrada
 * (gramática: --dur-longa), não uma transição de estado. */
export const COREO = {
  /** 0–450: a moeda pára de frente */
  frente: 450,
  /** 450–800: desfaz-se nos seus 100 cêntimos — cada ponto herda o metal */
  desfazIni: 450,
  desfazFim: 800,
  /** 800–1200: a pausa — «um euro são 100 cêntimos» */
  pausaIni: 800,
  coresIni: 1200,
  /** 1200–1550: as fatias ganham a cor semântica */
  coresFim: 1550,
  /** 1550–2050: a fatia do que sai destaca-se */
  puxaIni: 1550,
  puxaFim: 2050,
  /** 2050+: cada ponto voa para o seu monte — escalonado por parte+rank */
  vooIni: 2050,
  vooPorParte: 190,
  vooPorPonto: 5,
  /** a partir daqui tudo assentou — estado «montes» */
  assenta: 3100,
} as const;

/* ————— física — mola amortecida, sem biblioteca ————— */

export interface CorpoMola {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
}

/**
 * Um passo de mola amortecida. `fdt` é o tempo do frame em unidades de
 * 16,7 ms — a rigidez escala linear e o amortecimento exponencialmente,
 * para a mola ter o mesmo comportamento a 60 Hz e a 120 Hz.
 */
export function molaPasso(
  c: CorpoMola,
  k: number,
  amortecimento: number,
  fdt = 1
): void {
  const am = Math.pow(amortecimento, fdt);
  c.vx = (c.vx + (c.tx - c.x) * k * fdt) * am;
  c.vy = (c.vy + (c.ty - c.y) * k * fdt) * am;
  c.x += c.vx * fdt;
  c.y += c.vy * fdt;
}

/** true quando o corpo já pousou no alvo (dentro das tolerâncias) */
export function molaAssentou(c: CorpoMola): boolean {
  return (
    Math.abs(c.tx - c.x) < 0.4 &&
    Math.abs(c.ty - c.y) < 0.4 &&
    Math.abs(c.vx) + Math.abs(c.vy) < 0.06
  );
}
