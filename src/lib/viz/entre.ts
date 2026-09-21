/**
 * Entre — a região ENTRE duas séries, partida nos cruzamentos.
 * Cada troço devolve um path fechado e diz se a principal está por
 * cima — é o substrato da área hachurada do cartão «Leitura»
 * (acento quando acima, keep quando abaixo; DIRECAO-V3 §3).
 *
 * Trabalha em coordenadas já escaladas (px do viewBox): o componente
 * resolve as escalas, este módulo só faz geometria — puro e testável.
 * Interpolação linear entre pontos para localizar os cruzamentos;
 * os troços fecham com o mesmo monotone das linhas (d3-shape area),
 * para a hachura colar exactamente aos traços.
 */
import { area, curveMonotoneX } from "d3-shape";
import type { Ponto } from "./formas";

export interface RegiaoEntre {
  /** true = série A por cima (em px: y menor — o eixo cresce para baixo) */
  acima: boolean;
  /** path fechado da região */
  d: string;
}

interface No {
  x: number;
  a: number;
  b: number;
}

/** interpolação linear em x, com clamp nos extremos */
function interpola(pts: Ponto[]): (x: number) => number {
  return (x: number) => {
    if (x <= pts[0][0]) return pts[0][1];
    const ult = pts[pts.length - 1];
    if (x >= ult[0]) return ult[1];
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid][0] <= x) lo = mid;
      else hi = mid;
    }
    const [x0, y0] = pts[lo];
    const [x1, y1] = pts[hi];
    const k = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
    return y0 + (y1 - y0) * k;
  };
}

/**
 * Regiões entre A (principal) e B (referência) no intervalo comum.
 * "acima" = valor de A maior que B — em coordenadas de ecrã, a.y < b.y.
 * Série B pode ser uma recta de dois pontos (referência constante).
 */
export function regioesEntre(a: Ponto[], b: Ponto[]): RegiaoEntre[] {
  if (a.length < 2 || b.length < 2) return [];
  const xs = [...new Set([...a, ...b].map((p) => p[0]))].sort((m, n) => m - n);
  const x0 = Math.max(a[0][0], b[0][0]);
  const x1 = Math.min(a[a.length - 1][0], b[b.length - 1][0]);
  const dom = xs.filter((x) => x >= x0 && x <= x1);
  if (dom.length < 2) return [];
  const ya = interpola(a);
  const yb = interpola(b);

  // primeiro sinal real — se as séries nascerem coladas, a região
  // inicial decide-se pela primeira diferença não nula
  const d0 = dom.map((x) => yb(x) - ya(x)).find((d) => d !== 0);
  if (d0 === undefined) return [];
  let acima = d0 > 0;

  const gerador = area<No>()
    .x((n) => n.x)
    .y0((n) => n.b)
    .y1((n) => n.a)
    .curve(curveMonotoneX);

  const regioes: RegiaoEntre[] = [];
  let nos: No[] = [];
  const fecha = () => {
    if (nos.length >= 2) {
      const d = gerador(nos);
      if (d) regioes.push({ acima, d });
    }
    nos = [];
  };

  let prev: No = { x: dom[0], a: ya(dom[0]), b: yb(dom[0]) };
  nos.push(prev);
  for (let i = 1; i < dom.length; i++) {
    const x = dom[i];
    const q: No = { x, a: ya(x), b: yb(x) };
    const dPrev = prev.b - prev.a;
    const dQ = q.b - q.a;
    const cruza = (dPrev > 0 && dQ < 0) || (dPrev < 0 && dQ > 0);
    // sai de um patamar colado (dPrev 0) para o lado contrário — fecha
    // a região corrente sem ponto de cruzamento extra
    const saiColado =
      !cruza && dPrev === 0 && dQ !== 0 && acima !== dQ > 0;
    if (cruza || saiColado) {
      if (cruza) {
        const k = dPrev / (dPrev - dQ);
        const cx: No = {
          x: prev.x + (q.x - prev.x) * k,
          a: prev.a + (q.a - prev.a) * k,
          b: prev.b + (q.b - prev.b) * k,
        };
        nos.push(cx);
        fecha();
        nos = [cx];
      } else {
        fecha();
        nos = [prev];
      }
      acima = !acima;
    }
    nos.push(q);
    prev = q;
  }
  fecha();
  return regioes;
}
