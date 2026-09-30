/**
 * A planta do bairro — o Porto em dois níveis. Porta de
 * design/prototipos/mapa/mapa.js (P0-2 do PACK V5 PRODUÇÃO).
 *
 *   Lá em cima (cota 110): a Avenida com o elétrico, a fila de edifícios
 *   públicos, o largo dos Clérigos e o miradouro. Um muro de granito desce
 *   ao Cais da Ribeira; as escadinhas ligam os dois níveis.
 *   Cá em baixo (cota 0): as casas estreitas da Ribeira, a praça, o cais, o
 *   Douro e Gaia.
 *
 * Os edifícios ficam do lado de cima de cada rua, com a fachada virada
 * para quem olha.
 *
 * DUAS MUDANÇAS DELIBERADAS EM RELAÇÃO AO PROTÓTIPO:
 *
 * 1. O terreno não é mais um global. No protótipo, `definirTerreno()` era
 *    chamado no topo do ficheiro e TODAS as peças de `iso.js` o liam de lá.
 *    Aqui `TERRENO` é uma função exportada e passada a cada peça — o mapa
 *    não pode depender de uma importação com efeito de lado.
 *
 * 2. Os valores dos marcadores chegam JÁ FORMATADOS, em `MarcadoresBairro`.
 *    No protótipo vinham de uma função `eur()`/`EURO()` escrita à mão dentro
 *    da página. A casa proíbe isso (ver PACK V5 PRODUÇÃO §1): os números
 *    saem sempre pelos formatadores de src/lib/format.ts, e quem os formata
 *    é `dadosBairro()` (P0-3), no servidor. Aqui não se formata nada — só
 *    se escreve o que veio.
 */
import {
  LAD,
  P,
  Pcom,
  CORES as C,
  arcada,
  arvoreVerde,
  baloesSaoJoao,
  bandeiraFCP,
  bandeiraPT,
  cabeco,
  caixa,
  cameleira,
  candeeiro,
  carro,
  casaRibeira,
  chao,
  clerigos,
  cupula,
  esplanada,
  f1,
  grelhaJanelas,
  muroI,
  placa2,
  ponteLuisI,
  pombo,
  porta2,
  pts,
  rabelo,
  toldo2,
  type OpcoesCaixa,
  type Ponto,
  type Terreno,
} from "./iso";
import { PASSANTES, pessoa } from "./personagens";

const K = "#16130f";

/** Cota da Avenida, a 110. */
export const HP = 110;
/** A junta onde o muro de granito começa a descer. */
export const JM = 6.6;
/** As escadinhas que ligam os dois níveis. */
export const ESCD = { i0: 7, i1: 8, j0: 5.4, j1: 8.4 } as const;

/** Os limites do mapa. */
export const MAPA = { i0: -1, i1: 15.6, j0: -0.4, j1: 10.8 } as const;

const altEscada = (j: number): number => (HP * (ESCD.j1 - j)) / (ESCD.j1 - ESCD.j0);

/**
 * A cota de cada ponto do bairro: a Avenida a 110, a Ribeira a 0, o rio a
 * −22, e as escadinhas a descer de uma para a outra.
 */
export const TERRENO: Terreno = (i, j) => {
  if (i >= ESCD.i0 && i <= ESCD.i1 && j >= ESCD.j0 && j <= ESCD.j1) return altEscada(j);
  if (j < JM) return HP;
  if (j > 10.8 && j < 15.2) return -22;
  return 0;
};

/** `P()` já com o terreno do bairro — o `P()` do protótipo. */
const Pt = Pcom(TERRENO);

/**
 * Os dois pontos onde a câmara pode enquadrar, apurados no protótipo:
 *
 * · `perto` — a Avenida, em `P(3.6, 5.6)`, para ecrãs estreitos;
 * · `longe` — o `(760, 470)` escrito à mão no `enquadrar()` do protótipo.
 *   NÃO é um ponto da planta: é o enquadramento que o autor escolheu, e
 *   o `transform` por omissão do CSS está apurado para ele.
 *
 * Vive aqui, e não no componente nem no CSS, porque é o mesmo número em
 * três sítios — e quando o CSS foi fitted contra um par diferente do que
 * o componente passava, a câmara saltava no primeiro quadro. Um só
 * sítio, um só número.
 */
export const ENQUADRAMENTOS = {
  perto: Pt(3.6, 5.6),
  longe: { x: 760, y: 470 },
} as const;

/* Atalhos locais: o protótipo escrevia `caixa(...)` e o terreno vinha do
   global. Aqui cada atalho passa TERRENO, e a forma das chamadas no corpo
   da planta fica igual à do protótipo. */
const cx = (i: number, j: number, wi: number, dj: number, h: number, o?: OpcoesCaixa): string =>
  caixa(i, j, wi, dj, h, o, TERRENO);
const ch = (i: number, j: number, wi: number, dj: number, fill: string, extra = "", z?: number): string =>
  chao(i, j, wi, dj, fill, extra, z, TERRENO);
const cas = (i: number, j: number, wi: number, dj: number, h: number, o?: Parameters<typeof casaRibeira>[5]): string =>
  casaRibeira(i, j, wi, dj, h, o, TERRENO);
const carr = (i: number, j: number, cor: string): string => carro(i, j, cor, TERRENO);

/**
 * Os valores dos marcadores, JÁ FORMATADOS como texto.
 *
 * Vêm de `dadosBairro()` (P0-3), que os lê em `data/` no servidor e os
 * passa pelos formatadores de `src/lib/format.ts`. Se uma série faltar, o
 * valor é a falha declarada (`EstadoVazio`), nunca um número inventado —
 * Regra nº1.
 */
export interface MarcadoresBairro {
  salario: string;
  tsu: string;
  irs: string;
  liquido: string;
  cabaz: string;
  cafes: string;
  euribor: string;
  ca: string;
  /** O preço por litro, só o número — é o que o totem escreve. */
  gasoleo: string;
  gasolina: string;
  /** O mesmo preço já com a unidade, feita pelo formatador do servidor. */
  gasoleoUn: string;
  gasolinaUn: string;
  inflacao: string;
  desemprego: string;
}

/** Um marcador: a que edifício pertence, onde, a que altura e que diz. */
export type Pino = readonly [id: string, ponto: Ponto, altura: number, rotulo: string, valor: string];

/** Onde é a porta de cada edifício — a câmara foca-a ao abrir a cena. */
export type Portas = Record<string, Ponto>;

export interface MapaBairro {
  chao: string;
  tras: string;
  frente: string;
  vida: string;
  agua: string;
  ponte: { tras: string; frente: string };
  gaia: string;
  /**
   * A fila da Ribeira, SEM o embrulho `<g id="gRibeira">`. O reflexo no
   * Douro é esta mesma fila espelhada — no protótipo, o `cloneNode` do DOM
   * tirava-lhe os `id` e as classes. No servidor não há DOM para clonar,
   * por isso a fila vem aqui nua e `mundo.ts` espelha-a (P1-1).
   */
  ribeira: string;
  portas: Portas;
  pinos: Pino[];
}

/** Um edifício focável: o `data-id` é o que liga o mapa à cena e ao e2e. */
export function edificioIso(id: string, rotulo: string, svg: string): string {
  return `<g class="ed" data-id="${id}" tabindex="0" role="button" aria-label="${rotulo}">${svg}</g>`;
}

/** Um ponto no chão, na fachada (parede esquerda) de uma caixa, a `u` px do canto. */
const naFachada = (i: number, j: number, dj: number, u: number): Ponto => Pt(i + u / LAD, j + dj);

export function montarMapa(D: MarcadoresBairro): MapaBairro {
  const ed: Record<string, string> = {};
  const portas: Portas = {};
  const pinos: Pino[] = [];
  const { i0: I0, i1: I1, j0: J0 } = MAPA;

  /* ——— a maqueta: faces de fora, rio, cais ——— */
  const FUNDO = -70;
  let s = "";
  const perfil: readonly (readonly [number, number])[] = [[J0, HP], [JM, HP], [JM, 0], [10.8, 0], [10.8, -22], [15.2, -22], [15.2, 0], [19, 0]];
  s += `<polygon points="${pts(...perfil.map(([j, z]) => P(I1, j, z)), P(I1, 19, FUNDO), P(I1, J0, FUNDO))}" fill="#a48f72" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
  for (const z of [70, 30]) s += `<path d="M${pts(P(I1, J0, z), P(I1, JM, z)).replace(" ", " L")}" stroke="#7d6a52" stroke-width="2" stroke-dasharray="14 8"/>`;
  for (const z of [-40, -58]) s += `<path d="M${pts(P(I1, J0, z), P(I1, 19, z)).replace(" ", " L")}" stroke="#7d6a52" stroke-width="2" stroke-dasharray="18 10"/>`;
  s += `<polygon points="${pts(P(I1, 10.8, -22), P(I1, 15.2, -22), P(I1, 15.2, -52), P(I1, 10.8, -52))}" fill="url(#b-aguaCorte)" stroke="${K}" stroke-width="2"/>`;
  s += `<polygon points="${pts(P(I0, 19, 0), P(I1, 19, 0), P(I1, 19, FUNDO), P(I0, 19, FUNDO))}" fill="#b39e80" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
  for (const z of [-24, -48]) s += `<path d="M${pts(P(I0, 19, z), P(I1, 19, z)).replace(" ", " L")}" stroke="#8a7658" stroke-width="2" stroke-dasharray="18 10"/>`;
  const rio = pts(P(I0, 10.8, -22), P(I1, 10.8, -22), P(I1, 15.2, -22), P(I0, 15.2, -22));
  s += `<clipPath id="b-clipAgua"><polygon points="${rio}"/></clipPath><polygon points="${rio}" fill="url(#b-aguaIso)" stroke="${K}" stroke-width="3"/><g id="reflexos"></g>`;
  s += muroI(I0, I1, 10.8, -22, 0, "url(#b-granito)", Array.from({ length: 9 }, (_, k) => `<rect x="${f1(60 + k * 132)}" y="-22" width="16" height="22" fill="#2e6d8f" opacity=".25"/>`).join(""));

  /* ——— cá em baixo: Ribeira ——— */
  s += ch(I0, JM, I1 - I0, 10.8 - JM, "#e3dac8", "", 0);
  s += ch(I0, 8.6, I1 - I0, 0.4, "url(#b-calcadaIso)", "", 0) + ch(I0, 9, I1 - I0, 1.8, "url(#b-lajesIso)", "", 0);
  s += ch(5.2, JM, 1.8, 8.6 - JM, "url(#b-calcadaIso)", "", 0) + ch(8, JM, 0.45, 8.6 - JM, "url(#b-calcadaIso)", "", 0);
  s += ch(13.9, 6.8, I1 - 13.9, 1.8, C.relva, "", 0);
  const hera = (x: number, w: number): string => `<path d="M${x} -110 q${w * 0.2} 40 ${w * 0.1} 70 q${w * 0.3} -30 ${w * 0.5} -10 q${w * 0.2} -40 ${w * 0.4} -60 z" fill="#4f8f4a" stroke="${K}" stroke-width="1.6" opacity=".95"/>`;
  const fonte = (x: number): string => `<rect x="${x}" y="-92" width="64" height="52" fill="url(#b-azAzul)" stroke="${K}" stroke-width="2.2"/><rect x="${x - 4}" y="-96" width="72" height="6" fill="${C.granito}" stroke="${K}" stroke-width="1.6"/><path d="M${x + 32} -60 v6" stroke="${K}" stroke-width="3"/><path class="jorro" d="M${x + 32} -54 q2 12 0 24" stroke="#9fd0ff" stroke-width="3" fill="none"/><rect x="${x + 12}" y="-30" width="40" height="30" fill="${C.granito}" stroke="${K}" stroke-width="2"/><rect x="${x + 14}" y="-30" width="36" height="5" fill="#6fb3dc"/>`;
  s += muroI(I0, 7, JM, 0, HP, "url(#b-granito)", hera(40, 90) + hera(250, 70) + fonte(6.3 * LAD) + `<path d="M${f1(1.2 * LAD)} 0 V-40 a16 16 0 0 1 32 0 V0 Z" fill="#3b2f26" stroke="${K}" stroke-width="2"/>`);
  s += muroI(8, I1, JM, 0, HP, "url(#b-granito)", hera(160, 110) + hera(380, 80) + `<path d="M${f1(6.2 * LAD)} 0 V-40 a16 16 0 0 1 32 0 V0 Z" fill="#3b2f26" stroke="${K}" stroke-width="2"/>`);

  /* ——— as escadinhas ——— */
  s += `<polygon points="${pts(P(7, ESCD.j0, HP), P(7, JM, HP), P(7, JM, altEscada(JM)))}" fill="${C.granitoEsc}" stroke="${K}" stroke-width="2.4"/>`;
  const nD = 22;
  const dj = (ESCD.j1 - ESCD.j0) / nD;
  const dz = HP / nD;
  const lado: [number, number][] = [[JM, 0]];
  for (let k = 0; k < nD; k++) {
    const ja = ESCD.j0 + k * dj;
    const za = HP - k * dz;
    s += `<polygon points="${pts(P(7, ja, za), P(8, ja, za), P(8, ja + dj, za), P(7, ja + dj, za))}" fill="#e2dacb" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/>`;
    s += `<polygon points="${pts(P(7, ja + dj, za), P(8, ja + dj, za), P(8, ja + dj, za - dz), P(7, ja + dj, za - dz))}" fill="#b3a893" stroke="${K}" stroke-width="1.2" stroke-linejoin="round"/>`;
    if (ja + dj > JM) lado.push([Math.max(ja, JM), za], [ja + dj, za], [ja + dj, za - dz]);
  }
  lado.push([ESCD.j1, 0]);
  s += `<polygon points="${pts(...lado.map(([j, z]) => P(8, j, z)))}" fill="${C.granito}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>`;
  for (const ii of [7.08, 7.92]) s += `<path d="M${pts(P(ii, ESCD.j0, HP + 16), P(ii, ESCD.j1, 16)).replace(" ", " L")}" stroke="${C.ferro}" stroke-width="2.4"/>${[0, 0.25, 0.5, 0.75, 1].map((t) => { const j = ESCD.j0 + t * (ESCD.j1 - ESCD.j0); const z = altEscada(j); return `<path d="M${pts(P(ii, j, z), P(ii, j, z + 16)).replace(" ", " L")}" stroke="${C.ferro}" stroke-width="1.6"/>`; }).join("")}`;

  /* ——— lá em cima: a Avenida ——— */
  const Z = HP;
  s += ch(I0, J0, 7 - I0, JM - J0, "#ece4d3", "", Z) + ch(8, J0, I1 - 8, JM - J0, "#ece4d3", "", Z) + ch(7, J0, 1, ESCD.j0 - J0, "#ece4d3", "", Z);
  s += ch(I0, J0, 1.1, 3.8, C.relva, "", Z);
  s += ch(6.55, J0, 2.1, 1.3, "url(#b-calcadaIso)", "", Z);
  s += ch(6.6, 0.9, 0.4, 2.7, "url(#b-calcadaIso)", "", Z) + ch(8, 0.9, 0.4, 2.7, "url(#b-calcadaIso)", "", Z) + ch(7, 0.9, 1, 2.7, "url(#b-pedrasIso)", "", Z);
  s += ch(I0, 3.6, I1 - I0, 0.4, "url(#b-calcadaIso)", "", Z) + ch(I0, 4, I1 - I0, 1, "url(#b-pedrasIso)", "", Z) + ch(I0, 5, I1 - I0, 0.4, "url(#b-calcadaIso)", "", Z);
  s += ch(I0, 5.4, 7 - I0, JM - 5.4, "url(#b-calcadaIso)", "", Z) + ch(8, 5.4, I1 - 8, JM - 5.4, "url(#b-calcadaIso)", "", Z);
  for (const jj of [4.38, 4.62]) s += `<path d="M${pts(P(I0, jj, Z), P(I1, jj, Z)).replace(" ", " L")}" stroke="#6f6a61" stroke-width="3"/>`;
  for (const [pi, pj, wi, djj, dir] of [[7, 3.62, 1, 0.36, "i"], [7, 5.02, 1, 0.36, "i"], [6.62, 4, 0.36, 1, "j"], [8.02, 4, 0.36, 1, "j"]] as const) {
    for (let k = 0; k < 5; k++) s += dir === "i" ? ch(pi + k * 0.2 + 0.03, pj, 0.12, djj, "#fff", 'stroke-width="1.2"', Z) : ch(pi, pj + k * 0.2 + 0.03, wi, 0.12, "#fff", 'stroke-width="1.2"', Z);
  }
  for (const [a, b] of [[I0, 7], [8, I1]] as const) s += muroI(a, b, JM - 0.05, Z, Z + 9, C.granito);
  const chaoSvg = s;

  /* ——— fila de cima (Avenida) ——— */

  // Fábrica de fiação: tijolo, janelas industriais, portão de enrolar, relógio
  {
    const i = 0.1, j = 0.8, wi = 2.8, dj = 2.8, h = 128;
    const janelaFerro = (x: number, y: number, w: number, hh: number, cols = 3, lins = 4): string => {
      let s2 = `<rect x="${f1(x - 3)}" y="${f1(y - 3)}" width="${f1(w + 6)}" height="${f1(hh + 6)}" fill="${C.pedra}" stroke="${K}" stroke-width="2"/><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(hh)}" class="vidro" stroke="${K}" stroke-width="2"/>`;
      for (let c = 1; c < cols; c++) s2 += `<path d="M${f1(x + (w * c) / cols)} ${f1(y)} v${f1(hh)}" stroke="#3a4450" stroke-width="1.8"/>`;
      for (let l = 1; l < lins; l++) s2 += `<path d="M${f1(x)} ${f1(y + (hh * l) / lins)} h${f1(w)}" stroke="#3a4450" stroke-width="1.8"/>`;
      s2 += `<path d="M${f1(x + 3)} ${f1(y + hh * 0.6)} l${f1(w * 0.3)} ${f1(-hh * 0.3)}" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/><path d="M${f1(x - 3)} ${f1(y - 7)} q${f1((w + 6) / 2)} -8 ${f1(w + 6)} 0" fill="none" stroke="${K}" stroke-width="2"/>`;
      return s2;
    };
    const portao = (x: number, w: number, hh: number): string => `<rect x="${x - 4}" y="${-hh - 6}" width="${w + 8}" height="8" fill="#5b6773" stroke="${K}" stroke-width="2"/><rect x="${x}" y="${-hh}" width="${w}" height="${hh}" fill="#8e99a5" stroke="${K}" stroke-width="2.2"/>${Array.from({ length: Math.floor(hh / 5) }, (_, k) => `<path d="M${x} ${-hh + 5 + k * 5} h${w}" stroke="${K}" stroke-width=".9" opacity=".45"/>`).join("")}${Array.from({ length: Math.ceil(w / 8) }, (_, k) => `<path d="M${x + k * 8} 0 l6 -7 h4 l-6 7z" fill="${C.amarelo}"/>`).join("")}<path d="M${x} -7 h${w}" stroke="${K}" stroke-width="1.2"/>`;
    const relogio = (x: number, y: number): string => `<circle cx="${x}" cy="${y}" r="13" fill="#fbfaf6" stroke="${K}" stroke-width="2.4"/>${Array.from({ length: 12 }, (_, k) => { const a = (k * Math.PI) / 6; return `<path d="M${f1(x + Math.sin(a) * 10)} ${f1(y - Math.cos(a) * 10)} L${f1(x + Math.sin(a) * 11.5)} ${f1(y - Math.cos(a) * 11.5)}" stroke="${K}" stroke-width="1.1"/>`; }).join("")}<path class="ponteiro" d="M${x} ${y} v-8" stroke="${K}" stroke-width="2" stroke-linecap="round"/><path class="ponteiro2" d="M${x} ${y} h6" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;
    const svg = cx(i, j, wi, dj, h, {
      fundo: "url(#b-tijolo)",
      topo: "#8a96a8",
      esq: (w, hh) => `<rect x="0" y="${-hh + 6}" width="${f1(w)}" height="7" fill="#9c3e28" opacity=".6"/>${[14, 62, 110].map((x) => janelaFerro(x, -hh + 26, 34, 44)).join("")}${janelaFerro(158, -hh + 26, 34, 44)}
        ${placa2(18, -64, 104, "FÁBRICA", C.amarelo, K)}<rect x="26" y="-34" width="88" height="13" rx="2" fill="#26282b" stroke="${K}" stroke-width="1.6"/><text x="70" y="-24.5" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="7.6" letter-spacing=".1em" fill="#f4efe4">FIAÇÃO DO DOURO</text>
        ${portao(132, 46, 50)}${relogio(f1(w / 2), -hh - 6)}`,
      dir: (w, hh) => `${[12, 70, 128].map((x) => janelaFerro(x, -hh + 26, 34, 44)).join("")}${[12, 70, 128].map((x) => janelaFerro(x, -hh + 84, 34, 30, 3, 2)).join("")}`,
      extraTopo: ({ A, B, C: Cc, D: Dd }) => {
        let s2 = "";
        for (let k = 0; k < 3; k++) {
          const t0 = k / 3, t1 = (k + 1) / 3;
          const a: Ponto = [A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0];
          const b: Ponto = [A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1];
          const d: Ponto = [Dd[0] + (Cc[0] - Dd[0]) * t0, Dd[1] + (Cc[1] - Dd[1]) * t0];
          const c: Ponto = [Dd[0] + (Cc[0] - Dd[0]) * t1, Dd[1] + (Cc[1] - Dd[1]) * t1];
          s2 += `<polygon points="${pts(a, [b[0], b[1] - 30], [c[0], c[1] - 30], d)}" fill="#6b7a8f" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${pts(b, [b[0], b[1] - 30], [c[0], c[1] - 30], c)}" class="vidro" stroke="${K}" stroke-width="2.4"/>`;
          for (let f = 1; f < 4; f++) {
            const p: Ponto = [b[0] + ((c[0] - b[0]) * f) / 4, b[1] + ((c[1] - b[1]) * f) / 4];
            s2 += `<path d="M${f1(p[0])} ${f1(p[1])} v-30" stroke="#3a4450" stroke-width="1.4"/>`;
          }
        }
        for (const t of [0.2, 0.55]) {
          const p: Ponto = [Dd[0] + (Cc[0] - Dd[0]) * 0.82 + (A[0] - Dd[0]) * t, Dd[1] + (Cc[1] - Dd[1]) * 0.82 + (A[1] - Dd[1]) * t - 30];
          s2 += `<g class="ventilador"><rect x="${f1(p[0] - 7)}" y="${f1(p[1] - 12)}" width="14" height="12" fill="#b9c1c9" stroke="${K}" stroke-width="1.8"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1] - 12)}" rx="9" ry="4" fill="#dfe4e8" stroke="${K}" stroke-width="1.8"/><path d="M${f1(p[0] - 5)} ${f1(p[1] - 6)} h10 M${f1(p[0] - 5)} ${f1(p[1] - 3)} h10" stroke="${K}" stroke-width="1" opacity=".5"/></g>`;
        }
        const ch2: Ponto = [Dd[0] + 40, Dd[1] + 26];
        s2 += `<rect x="${f1(ch2[0] - 11)}" y="${f1(ch2[1] - 110)}" width="22" height="110" fill="url(#b-tijolo)" stroke="${K}" stroke-width="2.6"/><rect x="${f1(ch2[0] - 13)}" y="${f1(ch2[1] - 80)}" width="26" height="6" fill="#9c3e28" stroke="${K}" stroke-width="1.6"/><path d="M${f1(ch2[0] - 11)} ${f1(ch2[1] - 95)} h22" stroke="#fff" stroke-width="3" opacity=".8"/><ellipse cx="${f1(ch2[0])}" cy="${f1(ch2[1] - 110)}" rx="13" ry="5" fill="${C.pedraEsc}" stroke="${K}" stroke-width="2.4"/>
          <g class="fumo">${[0, 1, 2, 3].map(() => `<circle class="baforada" cx="${f1(ch2[0])}" cy="${f1(ch2[1] - 120)}" r="12" fill="#ece8df" opacity="0"/>`).join("")}</g>`;
        return s2;
      },
    });
    let carga = "";
    for (const [pi, pj] of [[0.35, 3.66], [0.72, 3.66]] as const) {
      carga += cx(i + pi, pj, 0.3, 0.22, 5, { fundo: "#b8844d", topo: "#c99a5b", semRodape: true, semCornija: true, semSombra: true });
      carga += cx(i + pi + 0.02, pj + 0.02, 0.26, 0.18, 13, { z0: HP + 5, fundo: "#d9b27c", topo: "#e6c793", semRodape: true, semCornija: true, semSombra: true, esq: (w) => `<path d="M${f1(w / 2)} -13 v13" stroke="#8a5a2b" stroke-width="2"/>` });
    }
    ed.fabrica = edificioIso("fabrica", "Fábrica — para onde vai o teu salário?", svg + carga);
    portas.fabrica = naFachada(i, j, dj, 155);
    pinos.push(["fabrica", Pt(i + wi / 2, j + dj / 2), 128 + 48, "Salário bruto", D.salario]);
  }

  // Segurança Social
  {
    const i = 3.2, j = 1.6, wi = 1.7, dj = 2, h = 142;
    const frontao = ({ A }: { A: Ponto }): string => {
      const w = wi * LAD;
      return `<g transform="matrix(.8944 .4472 0 1 ${f1(A[0])} ${f1(A[1])})"><path d="M-6 0 L${f1(w / 2)} -36 L${f1(w + 6)} 0 Z" fill="${C.pedra}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><path d="M8 -4 L${f1(w / 2)} -28 L${f1(w - 8)} -4 Z" fill="none" stroke="${K}" stroke-width="1.2" opacity=".5"/><circle cx="${f1(w / 2)}" cy="-14" r="8.5" fill="#fbfaf6" stroke="${K}" stroke-width="2"/><path class="ponteiro" d="M${f1(w / 2)} -14 v-6" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/><path class="ponteiro2" d="M${f1(w / 2)} -14 h4" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/></g>`;
    };
    const svg = cx(i, j, wi, dj, h, {
      fundo: "#eef1f6",
      topo: C.pedraEsc,
      esq: (w, hh) => `<rect x="0" y="-60" width="${f1(w)}" height="60" fill="url(#b-granito)" stroke="${K}" stroke-width="1.6"/><rect x="0" y="${-hh + 6}" width="${f1(w)}" height="12" fill="url(#b-azAzul)" stroke="${K}" stroke-width="1.6"/>
        ${grelhaJanelas(w, hh, 1, 3, { jw: 18, jh: 34, top: 22, base: 84, arco: true })}${placa2(10, -82, f1(w - 20), "SEGURANÇA SOCIAL", C.azul, "#fff")}
        ${[0, 1, 2].map((k) => `<rect x="${12 + k * 30}" y="-58" width="9" height="50" fill="${C.pedra}" stroke="${K}" stroke-width="1.8"/><rect x="${10 + k * 30}" y="-60" width="13" height="4" fill="${C.pedraEsc}" stroke="${K}" stroke-width="1.4"/>`).join("")}
        ${porta2(f1(w - 38), 28, 48, C.azul, true)}<rect x="${f1(w - 44)}" y="-8" width="40" height="4" fill="${C.pedraEsc}" stroke="${K}" stroke-width="1.4"/><rect x="${f1(w - 48)}" y="-4" width="48" height="4" fill="${C.pedraEsc}" stroke="${K}" stroke-width="1.4"/>`,
      dir: (w, hh) => `<rect x="0" y="-60" width="${f1(w)}" height="60" fill="url(#b-granito)" stroke="${K}" stroke-width="1.6"/><rect x="0" y="${-hh + 6}" width="${f1(w)}" height="12" fill="url(#b-azAzul)" stroke="${K}" stroke-width="1.6"/>${grelhaJanelas(w, hh, 1, 3, { jw: 16, jh: 32, top: 24, base: 84, arco: true })}${grelhaJanelas(w, 60, 1, 3, { jw: 14, jh: 22, top: 14, base: 14 })}`,
      extraTopo: frontao,
    });
    const fila = ([[4.55, 3.74, 0], [4.28, 3.76, 1], [4.0, 3.75, 2]] as const)
      .map(([fi, fj, k]) => { const [x, y] = Pt(fi, fj); return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k === 1 ? -0.33 : 0.33} 0.33)">${pessoa(PASSANTES[k])}</g>`; })
      .join("");
    const t = Pt(i + wi * 0.5, j + dj * 0.5);
    ed.segsocial = edificioIso("segsocial", "Segurança Social — os descontos", svg + bandeiraPT(t[0], t[1] - h, 0.9) + fila);
    portas.segsocial = naFachada(i, j, dj, wi * LAD - 24);
    pinos.push(["segsocial", Pt(i + wi / 2, j + dj / 2), h + 70, "TSU da empresa", D.tsu]);
  }

  // Finanças
  {
    const i = 5.05, j = 1.6, wi = 1.45, dj = 2, h = 150;
    const svg = cx(i, j, wi, dj, h, {
      fundo: "url(#b-granito)",
      topo: C.pedraEsc,
      esq: (w, hh) => `<rect x="${f1(w / 2 - 20)}" y="${-hh - 36}" width="40" height="36" fill="${C.pedra}" stroke="${K}" stroke-width="2.4"/><circle cx="${f1(w / 2)}" cy="${-hh - 18}" r="11" fill="#fff" stroke="${K}" stroke-width="2.2"/><path class="ponteiro" d="M${f1(w / 2)} ${-hh - 18} v-8" stroke="${K}" stroke-width="2"/><path class="ponteiro2" d="M${f1(w / 2)} ${-hh - 18} h6" stroke="${K}" stroke-width="2"/>
        ${grelhaJanelas(w, hh, 2, 3, { jw: 16, jh: 24, top: 12, base: 70, portadas: "#7c8a6a" })}${placa2(10, -66, f1(w - 20), "FINANÇAS", K, "#fff")}${porta2(f1(w / 2 - 15), 30, 42, "#5a3d27")}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 3, 2, { jw: 16, jh: 22 }),
    });
    const t = Pt(i + wi * 0.7, j + dj * 0.4);
    ed.financas = edificioIso("financas", "Finanças — os escalões do IRS", svg + bandeiraPT(t[0], t[1] - h, 0.9));
    portas.financas = naFachada(i, j, dj, (wi * LAD) / 2);
    pinos.push(["financas", Pt(i + wi / 2, j + dj / 2), h + 56, "IRS retido / mês", D.irs]);
  }

  const torre = clerigos(7.55, 0.28, 1.22, TERRENO);

  // Banco
  {
    const i = 8.5, j = 1.6, wi = 1.8, dj = 2, h = 146;
    const svg = cx(i, j, wi, dj, h, {
      fundo: C.pedra,
      topo: C.pedraEsc,
      esq: (w, hh) => `<path d="M-8 ${-hh} L${f1(w / 2)} ${-hh - 36} L${f1(w + 8)} ${-hh} Z" fill="${C.pedraEsc}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><text x="${f1(w / 2)}" y="${-hh - 9}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="16" fill="${K}">€</text>
        ${placa2(22, -hh + 12, f1(w - 44), "BANCO", "#fff", K)}${[0, 1, 2, 3, 4].map((k) => `<rect x="${10 + k * 26}" y="${-hh + 44}" width="12" height="${hh - 44}" fill="#fff" stroke="${K}" stroke-width="2"/>`).join("")}${porta2(f1(w / 2 - 17), 34, 52, "#2b3a66")}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 2, { jw: 18, jh: 28 }),
      extraTopo: ({ A, C: Cc }) => {
        const c: Ponto = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2 + 6];
        return cupula(c[0], c[1], 36, "#4d5864");
      },
    });
    ed.banco = edificioIso("banco", "Banco — crédito, juros e a Euribor", svg);
    portas.banco = naFachada(i, j, dj, (wi * LAD) / 2);
    pinos.push(["banco", Pt(i + wi / 2, j + dj / 2), h + 128, "Euribor 12 meses", D.euribor]);
  }

  // Correios
  {
    const i = 10.6, j = 2, wi = 1.45, dj = 1.6, h = 104;
    const svg = cx(i, j, wi, dj, h, {
      fundo: C.creme,
      telhado: "duas",
      rh: 30,
      esq: (w, hh) => `${grelhaJanelas(w, hh, 1, 2, { jw: 18, jh: 24, top: 10, base: 60, portadas: C.vermelho })}${placa2(12, -58, f1(w - 24), "CORREIOS", C.vermelho, "#fff")}${porta2(f1(w - 38), 28, 40, C.vermelho)}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 1, 2, { jw: 18, jh: 24 }),
    });
    const mc = Pt(i + 0.45, j + dj + 0.22);
    ed.correios = edificioIso("correios", "Correios — os certificados de aforro", svg + `<g class="marco"><rect x="${f1(mc[0] - 7)}" y="${f1(mc[1] - 30)}" width="14" height="30" rx="3" fill="${C.vermelho}" stroke="${K}" stroke-width="2.2"/><ellipse cx="${f1(mc[0])}" cy="${f1(mc[1] - 30)}" rx="7" ry="3.5" fill="${C.vermelho}" stroke="${K}" stroke-width="2"/></g>`);
    portas.correios = naFachada(i, j, dj, wi * LAD - 24);
    pinos.push(["correios", Pt(i + wi / 2, j + dj / 2), h + 50, "Cert. de Aforro", D.ca]);
  }

  // Posto de combustível
  {
    const i = 12.4, j = 1.4, wi = 2.4, dj = 2.1, Z = HP, alt = 64;
    let t = ch(i, j, wi, dj, "#d6d2ca");
    for (const jj of [2.2, 2.85]) t += ch(i + 1.1, jj, 1.2, 0.04, "#fff", 'stroke-width="0"');
    t += cx(i + 0.1, j + 0.08, 1.05, 0.72, 46, {
      fundo: "#f4f1ea",
      topo: "#c9c4b8",
      semCornija: true,
      esq: (w, hh) => `<rect x="0" y="${-hh}" width="${f1(w)}" height="10" fill="${C.vermelho}" stroke="${K}" stroke-width="1.8"/><text x="${f1(w / 2)}" y="${-hh + 8}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="7.5" fill="#fff">LOJA · CAFÉ</text><rect x="6" y="-30" width="${f1(w - 34)}" height="22" class="vidro" stroke="${K}" stroke-width="1.8"/><path d="M${f1((w - 28) / 2 + 3)} -30 v22" stroke="${K}" stroke-width="1.4"/><rect x="${f1(w - 22)}" y="-32" width="16" height="32" class="vidro" stroke="${K}" stroke-width="1.8"/><path d="M${f1(w - 14)} -32 v32" stroke="${K}" stroke-width="1.2"/>`,
      dir: (w, hh) => `<rect x="0" y="${-hh}" width="${f1(w)}" height="10" fill="${C.vermelho}" stroke="${K}" stroke-width="1.8"/><rect x="6" y="-28" width="${f1(w - 12)}" height="16" class="vidro" stroke="${K}" stroke-width="1.6"/>`,
    });
    t += `<polygon points="${pts(Pt(i + 0.95, j + 0.7), Pt(i + 2.35, j + 0.7), Pt(i + 2.35, j + 1.95), Pt(i + 0.95, j + 1.95))}" fill="${C.sombra}"/>`;
    const pilar = (pi: number, pj: number): string => cx(pi - 0.06, pj - 0.06, 0.12, 0.12, alt, { fundo: "#e9e6df", topo: "#ccc", semRodape: true, semCornija: true, semSombra: true, esq: (w) => `<rect x="0" y="-16" width="${f1(w)}" height="16" fill="${C.vermelho}"/>`, dir: (w) => `<rect x="0" y="-16" width="${f1(w)}" height="16" fill="${C.vermelho}"/>` });
    const ilha = (jj: number): string => {
      let s2 = cx(i + 1.3, jj, 0.8, 0.22, 5, { fundo: "#e4e0d8", topo: "#f5f2ec", semRodape: true, semCornija: true, semSombra: true, esq: (w) => `${Array.from({ length: 6 }, (_, k) => `<rect x="${f1((k * w) / 6)}" y="-5" width="${f1(w / 12)}" height="5" fill="${C.amarelo}"/>`).join("")}` });
      s2 += cx(i + 1.58, jj + 0.03, 0.24, 0.16, 36, {
        z0: Z + 5,
        fundo: "#f7f5f0",
        topo: "#e2412a",
        semRodape: true,
        semCornija: true,
        semSombra: true,
        esq: (w, hh) => `<rect x="0" y="${-hh}" width="${f1(w)}" height="7" fill="${C.vermelho}"/><rect x="3" y="${-hh + 10}" width="${f1(w - 6)}" height="9" rx="1.5" class="vidro" stroke="${K}" stroke-width="1.2"/><path d="M5 ${-hh + 13} h${f1(w - 10)} M5 ${-hh + 16} h${f1(w * 0.4)}" stroke="${K}" stroke-width=".9" opacity=".6"/>${[0, 1, 2].map((k) => `<rect x="${f1(3 + (k * (w - 6)) / 3)}" y="${-hh + 23}" width="${f1((w - 6) / 3 - 1.5)}" height="6" fill="${["#0c8f5c", C.amarelo, K][k]}" stroke="${K}" stroke-width=".8"/>`).join("")}`,
        dir: (w, hh) => `<path d="M${f1(w * 0.5)} ${-hh + 12} q10 8 3 26" fill="none" stroke="${K}" stroke-width="1.8"/><rect x="${f1(w * 0.5 - 2)}" y="${-hh + 8}" width="5" height="8" rx="1" fill="${K}"/>`,
      });
      return s2;
    };
    t += pilar(i + 1.05, j + 0.8) + pilar(i + 2.25, j + 0.8) + ilha(j + 0.95);
    t += carr(i + 1.15, j + 1.3, "#2445d6") + ilha(j + 1.62);
    t += pilar(i + 1.05, j + 1.85) + pilar(i + 2.25, j + 1.85);
    t += cx(i + 0.95, j + 0.7, 1.4, 1.25, 14, {
      z0: Z + alt,
      fundo: "#ffffff",
      topo: "#e9e6df",
      semRodape: true,
      semCornija: true,
      semSombra: true,
      esq: (w, hh) => `<rect x="0" y="${-hh}" width="${f1(w)}" height="5" fill="${C.amarelo}"/><rect x="0" y="-5" width="${f1(w)}" height="5" fill="${C.vermelho}"/><text x="${f1(w / 2)}" y="-4.8" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="4.6" fill="${K}">COMBUSTÍVEIS</text>`,
      dir: (w, hh) => `<rect x="0" y="${-hh}" width="${f1(w)}" height="5" fill="${C.amarelo}"/><rect x="0" y="-5" width="${f1(w)}" height="5" fill="${C.vermelho}"/>`,
      extraTopo: ({ A, C: Cc, D: Dd }) => ([[0.25, 0.3], [0.75, 0.3], [0.25, 0.75], [0.75, 0.75]] as const).map(([u, v]) => { const x = Dd[0] + (Cc[0] - Dd[0]) * u + (A[0] - Dd[0]) * v; const y = Dd[1] + (Cc[1] - Dd[1]) * u + (A[1] - Dd[1]) * v; return `<ellipse cx="${f1(x)}" cy="${f1(y + 14)}" rx="6" ry="3" class="vidro" opacity=".0"/>`; }).join(""),
    });
    // o totem dos preços — os VALORES são os de D, já formatados pelo servidor
    t += cx(i + 0.25, j + 1.85, 0.6, 0.12, 96, {
      fundo: "#26282b",
      topo: "#16130f",
      semCornija: true,
      esq: (w, hh) => `<rect x="3" y="${-hh + 4}" width="${f1(w - 6)}" height="16" rx="2" fill="${C.amarelo}" stroke="${K}" stroke-width="1.2"/><path d="M${f1(w / 2)} ${-hh + 7} q-5 6 -4 8 a4 4 0 0 0 8 0 q1 -2 -4 -8z" fill="${C.vermelho}" stroke="${K}" stroke-width="1"/>
        <text x="${f1(w / 2)}" y="${-hh + 29}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="5.6" fill="#fff">GASÓLEO</text><rect x="3" y="${-hh + 31}" width="${f1(w - 6)}" height="13" rx="1.5" fill="#0d0f10"/><text x="${f1(w / 2)}" y="${-hh + 41}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9.5" fill="#ffcf4a" font-variant-numeric="tabular-nums">${D.gasoleo}</text>
        <text x="${f1(w / 2)}" y="${-hh + 53}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="5.6" fill="#fff">GASOLINA 95</text><rect x="3" y="${-hh + 55}" width="${f1(w - 6)}" height="13" rx="1.5" fill="#0d0f10"/><text x="${f1(w / 2)}" y="${-hh + 65}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9.5" fill="#ffcf4a" font-variant-numeric="tabular-nums">${D.gasolina}</text>
        <text x="${f1(w / 2)}" y="${-hh + 76}" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="5" fill="#bbb">€ por litro</text>`,
    });
    ed.bomba = edificioIso("bomba", "Bomba de gasolina — quanto do litro é imposto?", t);
    portas.bomba = Pt(i + 1.2, j + dj);
    // a unidade vem feita do servidor (fmtLitro): a planta nunca escreve «€/L»
    pinos.push(["bomba", Pt(i + 1.3, j + 1.2), alt + 70, "Gasóleo · hoje", D.gasoleoUn]);
    pinos.push(["bomba2", Pt(i + 2.2, j + 1.1), alt + 70, "Gasolina 95", D.gasolinaUn]);
  }

  /* ——— a Ribeira: casas estreitas, coladas, de cores diferentes ——— */
  const J = 6.8, DJ = 1.8;
  const rib: string[] = [];
  const casa = (i: number, wi: number, h: number, o?: Parameters<typeof casaRibeira>[5]): string => cas(i, J, wi, DJ, h, o);
  rib.push(casa(-1, 0.72, 128, { cor: "#e2a73f", pisos: 3, varandas: "baixo", semente: 1 }));

  // Mercearia
  {
    const i = -0.28, wi = 1.2, h = 124;
    const svg = casa(i, wi, h, {
      cor: "url(#b-azVerde)", pisos: 2, rc: 48, varandas: "todas", semente: 2, telha: "#c9573a",
      rdc: (w, rc) => `<rect x="4" y="${-rc + 2}" width="${f1(w - 8)}" height="${rc - 2}" fill="#7a4a2a" stroke="${K}" stroke-width="2"/>${placa2(8, -rc + 4, f1(w - 16), "MERCEARIA", C.creme, K)}${toldo2(6, -rc + 20, w - 12, C.verde)}<rect x="9" y="-14" width="34" height="12" class="vidro" stroke="${K}" stroke-width="1.8"/>${porta2(f1(w - 28), 18, 22, "#5a3d27")}`,
    });
    const cx2 = Pt(i + 0.45, J + DJ + 0.2);
    ed.mercearia = edificioIso("mercearia", "Mercearia — porque está tudo mais caro?", svg + `<g class="fruta">${cx(i + 0.2, J + DJ + 0.06, 0.34, 0.22, 10, { fundo: "#c99a5b", topo: "#c99a5b", semSombra: true })}${[0, 1, 2, 3].map((k) => `<circle cx="${f1(cx2[0] - 14 + k * 8)}" cy="${f1(cx2[1] - 16 + k * 3)}" r="4.5" fill="${k % 2 ? C.amarelo : C.vermelho}" stroke="${K}" stroke-width="1.5"/>`).join("")}</g>`);
    rib.push(ed.mercearia);
    portas.mercearia = naFachada(i, J, DJ, wi * LAD - 18);
    pinos.push(["mercearia", Pt(i + wi / 2, J + DJ / 2), h + 52, "Cabaz desde 2020", D.cabaz]);
  }

  rib.push(casa(0.92, 0.56, 150, { cor: "#b9463a", pisos: 3, varandas: "todas", semente: 3, telha: "#c96a45" }));

  // Pastelaria
  {
    const i = 1.48, wi = 0.98, h = 120;
    const svg = casa(i, wi, h, {
      cor: "url(#b-azRosa)", pisos: 2, rc: 48, varandas: "cima", semente: 4, portadas: C.vermelho,
      rdc: (w, rc) => `<rect x="4" y="${-rc + 2}" width="${f1(w - 8)}" height="${rc - 2}" fill="#fff" stroke="${K}" stroke-width="2"/>${placa2(7, -rc + 4, f1(w - 14), "PASTELARIA", "#fff", C.vermelho)}${toldo2(6, -rc + 20, w - 12, C.vermelho)}<rect x="8" y="-14" width="28" height="12" class="vidro" stroke="${K}" stroke-width="1.8"/><circle cx="16" cy="-6" r="3" fill="#e6a93a"/><circle cx="26" cy="-6" r="3" fill="#e6a93a"/>${porta2(f1(w - 24), 16, 22, C.vermelho)}`,
    });
    const cv = Pt(i + 0.5, J + DJ + 0.22);
    ed.pastelaria = edificioIso("pastelaria", "Pastelaria — o café e o pastel", svg + `<g class="cavalete"><path d="M${f1(cv[0] - 9)} ${f1(cv[1])} l3 -26 M${f1(cv[0] + 9)} ${f1(cv[1])} l-3 -26" stroke="#7a4a2a" stroke-width="3"/><rect x="${f1(cv[0] - 12)}" y="${f1(cv[1] - 30)}" width="24" height="20" rx="2" fill="#26332c" stroke="${K}" stroke-width="2"/><text x="${f1(cv[0])}" y="${f1(cv[1] - 17)}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="9" fill="#fff">café</text></g>`);
    rib.push(ed.pastelaria);
    portas.pastelaria = naFachada(i, J, DJ, wi * LAD - 16);
    pinos.push(["pastelaria", Pt(i + wi / 2, J + DJ / 2), h + 50, "Cafés desde 2020", D.cafes]);
  }

  rib.push(casa(2.46, 0.52, 152, { cor: "#f2d27a", pisos: 3, varandas: "alternadas", semente: 5, rdc: arcada }));
  rib.push(casa(2.98, 0.72, 136, { cor: "#7f95a6", chapa: true, pisos: 3, varandas: "todas", semente: 6, telha: "#b8543a", extraEsq: (w, hh) => bandeiraFCP(f1(w / 2 - 15), -hh + 52, 30, 46) }));

  // Casa da Inês
  {
    const i = 3.7, wi = 0.86, h = 160;
    const svg = casa(i, wi, h, {
      cor: "url(#b-azAzul)", pisos: 3, varandas: "todas", semente: 7, roupa: true, corPorta: C.verde,
      extraEsq: (w) => `<text x="${f1(w / 2)}" y="-36" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="8" fill="${K}">24</text>`,
      extraTopo: ({ A, B }) => {
        const g: Ponto = [A[0] + (B[0] - A[0]) * 0.35, A[1] + (B[1] - A[1]) * 0.35 - 13];
        return `<g class="gato" transform="translate(${f1(g[0])} ${f1(g[1])})"><path d="M0 0 q-1 -13 7 -14 q8 1 7 14 z" fill="${K}"/><path d="M1.5 -12 l1.5 -5 l3 4 M12.5 -12 l-1.5 -5 l-3 4" fill="${K}"/><path class="cauda" d="M13 -1 q9 -2 8 -12" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/></g>`;
      },
    });
    ed.casa = edificioIso("casa", "Casa da Inês — o que chega ao fim do mês", svg);
    rib.push(ed.casa);
    portas.casa = naFachada(i, J, DJ, (wi * LAD) / 2);
    pinos.push(["casa", Pt(i + wi / 2, J + DJ / 2), h + 50, "Chega à conta", D.liquido]);
  }

  rib.push(casa(4.56, 0.6, 132, { cor: "#6f9d6a", pisos: 3, varandas: "cima", semente: 8, portadas: "#2f5d34" }));

  // A praça: quiosque, cameleira, banco, balões
  {
    const q = Pt(6.02, 7.9);
    let t = `<g class="quiosque-g">${cx(5.75, 7.6, 0.55, 0.55, 44, { fundo: C.verdeEsc, topo: C.verde, esq: (w) => `<rect x="4" y="-36" width="${f1(w - 8)}" height="16" fill="#fff" stroke="${K}" stroke-width="1.6"/><text x="${f1(w / 2)}" y="-24.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="8" fill="${K}">JORNAIS</text>` })}
      <path d="M${f1(q[0] - 30)} ${f1(q[1] - 50)} Q${f1(q[0])} ${f1(q[1] - 84)} ${f1(q[0] + 30)} ${f1(q[1] - 50)} Z" fill="${C.verde}" stroke="${K}" stroke-width="2.4"/><circle cx="${f1(q[0])}" cy="${f1(q[1] - 70)}" r="4" fill="${C.amarelo}" stroke="${K}" stroke-width="1.6"/></g>`;
    const bj = Pt(5.45, 8.25);
    t += `<g><path d="M${f1(bj[0] - 16)} ${f1(bj[1] - 8)} l32 16 M${f1(bj[0] - 16)} ${f1(bj[1] - 14)} l32 16" stroke="${C.verde}" stroke-width="5"/><path d="M${f1(bj[0] - 12)} ${f1(bj[1] - 6)} v8 M${f1(bj[0] + 12)} ${f1(bj[1] + 6)} v8" stroke="${K}" stroke-width="2.4"/></g>`;
    const cm = Pt(6.35, 7.05);
    t = cameleira(cm[0], cm[1], 1.15) + t;
    const b1 = Pt(5.25, 8.52);
    const b2 = Pt(6.95, 8.52);
    t += `<path d="M${f1(b1[0])} ${f1(b1[1])} v-74 M${f1(b2[0])} ${f1(b2[1])} v-74" stroke="${K}" stroke-width="2.4"/>` + baloesSaoJoao([b1[0], b1[1] - 72], [b2[0], b2[1] - 72], 8);
    ed.quiosque = edificioIso("quiosque", "Quiosque — os números do país hoje", t);
    rib.push(ed.quiosque);
    portas.quiosque = Pt(6.02, 8.2);
    pinos.push(["quiosque", Pt(6.02, 7.9), 104, "Inflação · 12 meses", D.inflacao]);
    pinos.push(["quiosque2", Pt(6.3, 8.3), 44, "Desemprego", D.desemprego]);
  }

  // Escola
  {
    const i = 8.5, wi = 1.9, h = 124;
    const svg = cx(i, J, wi, DJ, h, {
      fundo: C.ocre,
      telhado: "duas",
      rh: 30,
      corTelhado: "#b8543a",
      esq: (w, hh) => `${grelhaJanelas(w, hh, 1, 3, { jw: 20, jh: 30, top: 12, base: 64 })}${placa2(f1(w / 2 - 40), -62, 80, "ESCOLA", "#fff", K)}<rect x="10" y="-44" width="50" height="30" fill="#264a3a" stroke="${K}" stroke-width="2.4"/><text x="35" y="-30" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="10" fill="#fff">o que é a</text><text x="35" y="-19" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="10" fill="${C.amarelo}">inflação?</text>${porta2(f1(w - 44), 30, 46, C.azul)}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 2, { jw: 16, jh: 22 }),
      extraTopo: ({ A, B }) => {
        const m: Ponto = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 34];
        return `<rect x="${f1(m[0] - 10)}" y="${f1(m[1] - 18)}" width="20" height="20" fill="${C.ocre}" stroke="${K}" stroke-width="2.2"/><path d="M${f1(m[0] - 12)} ${f1(m[1] - 18)} l12 -12 l12 12 z" fill="#b8543a" stroke="${K}" stroke-width="2"/><path d="M${f1(m[0] - 5)} ${f1(m[1] - 2)} q0 -10 5 -11 q5 1 5 11 z" fill="${C.amarelo}" stroke="${K}" stroke-width="1.5"/>`;
      },
    });
    ed.escola = edificioIso("escola", "Escola — as palavras do dinheiro", svg);
    rib.push(ed.escola);
    portas.escola = naFachada(i, J, DJ, wi * LAD - 29);
    pinos.push(["escola", Pt(i + wi / 2, J + DJ / 2), h + 48, "Pergunta do dia", "inflação?"]);
  }

  rib.push(casa(10.4, 0.7, 140, { cor: "#c9573a", pisos: 3, varandas: "todas", semente: 9, rdc: arcada, telha: "#e07a4f" }));
  rib.push(casa(11.1, 0.62, 128, { cor: "#ecd9b0", pisos: 3, varandas: "alternadas", semente: 10, portadas: C.verde }));
  rib.push(casa(11.72, 0.78, 152, { cor: "url(#b-azAmarelo)", pisos: 3, varandas: "todas", semente: 11, rdc: arcada, extraEsq: (w, hh) => bandeiraFCP(f1(w / 2 - 14), -hh + 90, 28, 40) }));
  rib.push(casa(12.5, 0.58, 134, { cor: "#e98f8f", pisos: 3, varandas: "baixo", semente: 12, roupa: true }));
  rib.push(casa(13.08, 0.74, 144, { cor: "#9aa7ae", chapa: true, pisos: 3, varandas: "todas", semente: 13 }));

  /* ——— árvores, candeeiros, o cais ——— */
  const arvoresTras = ([[-0.4, 2.2, 0.9], [-0.5, 3.1, 0.8], [2.9, 3.35, 0.7]] as const)
  .map(([i, j, e]) => { const [x, y] = Pt(i, j); return arvoreVerde(x, y, e); })
  .join("");
  const miradouro = [0.4, 2.2, 3.9, 9.6, 11.6, 13.4].map((ii) => { const [x, y] = Pt(ii, 6.05); return arvoreVerde(x, y, 0.74); }).join("") + [1.3, 5.2, 10.6, 14.4].map((ii) => { const [x, y] = Pt(ii, 6.3); return candeeiro(x, y); }).join("");
  const candTras = [1.2, 4.6, 9.6, 12].map((ii) => { const [x, y] = Pt(ii, 3.8); return candeeiro(x, y); }).join("");
  const jardim = [arvoreVerde(14.5, 7.2, 1), arvoreVerde(15.1, 8.1, 0.85), arvoreVerde(14.2, 8.3, 0.75)].join("");
  const cais = ([[0.5, 9.3], [2.1, 9.35], [10.8, 9.3], [12.1, 9.35], [13.4, 9.3]] as const)
    .map(([ii, jj], k) => { const [x, y] = Pt(ii, jj); return esplanada(x, y, k % 2 ? "#fff" : "#fff6e3"); })
    .join("")
    + [-0.4, 1.4, 3.2, 5, 6.8, 9, 10.8, 12.6].map((ii) => { const [x, y] = Pt(ii, 10.62); return cabeco(x, y); }).join("")
    + [0.9, 3.8, 6.1, 9.8, 12.8].map((ii) => { const [x, y] = Pt(ii, 9.05); return candeeiro(x, y); }).join("");
  const vida = ([[5.55, 8.55, 1], [5.85, 8.7, -1], [6.5, 8.62, 1], [4.9, 10.1, -1], [8.8, 9.9, 1]] as const)
    .map(([ii, jj, d]) => { const [x, y] = Pt(ii, jj); return pombo(x, y, d); })
    .join("");
  const atracados = ([[8.6, 10.95]] as const).map(([ii, jj]) => { const a = Pt(ii + 1, 10.62); return `<g transform="translate(${f1((ii - jj) * 64)} ${f1((ii + jj) * 32 + 22)})">${rabelo(false)}</g><path d="M${f1(a[0])} ${f1(a[1] - 8)} q20 20 34 26" fill="none" stroke="#7a5a3a" stroke-width="1.6"/>`; }).join("");

  const ribeira = rib.join("");
  return {
    chao: chaoSvg,
    tras: arvoresTras + candTras + ed.fabrica + ed.segsocial + ed.financas + torre + ed.banco + ed.correios + ed.bomba + miradouro,
    frente: `<g id="gRibeira">${ribeira}</g>` + jardim + cais,
    ribeira,
    vida,
    agua: atracados,
    ponte: ponteLuisI({ iA: 14.3, iB: 14.78, jPorto: JM - 0.15, jGaia: 19, jA1: 10.8, jA2: 15.2, zCima: HP, pilares: [[8.75, 0], [10.55, 16], [15.45, 16], [17.3, 0]] }),
    gaia: margemGaia(),
    portas,
    pinos,
  };
}

/* ——— o elétrico 22 (anda ao longo de i, na Avenida) ——— */
export function eletricoIso(): string {
  const wi = 2.4, dj = 0.5, h = 40, i = 0, j = 4.25;
  return cx(i, j, wi, dj, h, {
    fundo: "#c98f3a",
    topo: "#4b3222",
    semRodape: true,
    semCornija: true,
    esq: (w, hh) => `${Array.from({ length: 8 }, (_, k) => `<rect x="${14 + k * 18.5}" y="${-hh + 5}" width="13" height="19" rx="4" fill="#f1e2b6" stroke="${K}" stroke-width="1.6"/><rect x="${16 + k * 18.5}" y="${-hh + 7}" width="9" height="14" rx="3" class="vidro" stroke="${K}" stroke-width="1.2"/>`).join("")}<path d="M4 ${-hh + 30} H${f1(w - 4)}" stroke="#f1e2b6" stroke-width="2.4"/><path d="M0 -3 H${f1(w)}" stroke="#4b3222" stroke-width="3"/>`,
    dir: (w, hh) => `<rect x="0" y="${-hh}" width="${f1(w)}" height="${hh * 0.58}" fill="${C.creme}" stroke="${K}" stroke-width="2.2"/><rect x="4" y="${-hh + 4}" width="${f1(w - 8)}" height="14" rx="2" class="vidro" stroke="${K}" stroke-width="1.8"/><circle cx="${f1(w / 2)}" cy="-10" r="3" fill="#fff6c9" stroke="${K}" stroke-width="1.4"/>`,
    extraTopo: ({ A, C: Cc }) => {
      const m: Ponto = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2];
      return `<path d="M${f1(m[0])} ${f1(m[1])} l-26 -64" stroke="${K}" stroke-width="2.4"/><rect x="${f1(m[0] + 6)}" y="${f1(m[1] - 14)}" width="30" height="12" rx="2" fill="${K}"/><text x="${f1(m[0] + 21)}" y="${f1(m[1] - 5)}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9" fill="#f1e2b6">22</text>`;
    },
  });
}

/* ——— a outra margem: Vila Nova de Gaia, com as caves do vinho do Porto ——— */
export function margemGaia(): string {
  const j0 = 15.2;
  let s = `<polygon points="${pts(P(-1, j0, 0), P(15.6, j0, 0), P(15.6, 19, 0), P(-1, 19, 0))}" fill="#e7dfcf" stroke="${K}" stroke-width="3"/>`;
  s += `<polygon points="${pts(P(-1, j0, 0), P(15.6, j0, 0), P(15.6, j0 + 0.9, 0), P(-1, j0 + 0.9, 0))}" fill="url(#b-calcadaIso)" opacity=".8"/>`;
  s += [2.4, 6.8, 10.1, 13.2].map((i) => { const [x, y] = Pt(i, 16.1); return arvoreVerde(x, y, 0.7); }).join("");
  for (const i of [1.2, 4.1]) s += `<g transform="translate(${f1((i - (j0 - 0.7)) * 64)} ${f1((i + j0 - 0.7) * 32 + 22)})">${rabelo(false)}</g>`;
  const armazem = (i: number, j: number, wi: number, h: number, letreiro: string): string => {
    const dj = 1.5;
    const svg = cx(i, j, wi, dj, h, {
      fundo: "#f6f1e6",
      telhado: "duas",
      rh: 24,
      corTelhado: "#c4623f",
      semCornija: true,
      esq: (w, hh) => `${Array.from({ length: Math.floor(w / 34) }, (_, k) => `<rect x="${14 + k * 34}" y="${-hh + 14}" width="12" height="16" rx="6" class="vidro" stroke="${K}" stroke-width="1.6"/>`).join("")}<rect x="0" y="${-hh}" width="${f1(w)}" height="6" fill="#c4623f" opacity=".5"/>`,
      dir: (w, hh) => `<rect x="${f1(w / 2 - 10)}" y="${-hh + 12}" width="20" height="18" rx="9" class="vidro" stroke="${K}" stroke-width="1.6"/>`,
    });
    if (!letreiro) return svg;
    const m = Pt(i + wi * 0.15, j + dj / 2);
    const lw = wi * LAD * 0.7;
    return `${svg}<g transform="matrix(.8944 .4472 0 1 ${f1(m[0])} ${f1(m[1] - h - 24)})"><path d="M${f1(lw * 0.2)} 0 v-10 M${f1(lw * 0.8)} 0 v-10" stroke="${K}" stroke-width="2"/><rect x="0" y="-30" width="${f1(lw)}" height="20" fill="${K}"/><text x="${f1(lw / 2)}" y="-15.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="12" letter-spacing=".08em" fill="#f6f1e6">${letreiro}</text></g>`;
  };
  s += armazem(3.2, 16.6, 3.4, 58, "VINHO DO PORTO") + armazem(7.3, 16.4, 2.6, 50, "CAVES") + armazem(10.6, 16.3, 2.2, 54, "");
  return `<g class="gaia">${s}</g>`;
}
