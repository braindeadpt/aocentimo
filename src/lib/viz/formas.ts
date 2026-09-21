/**
 * Formas — B-01. Paths SVG calculados com d3-shape; o desenho é manual.
 * Convenção de ângulos: 0° = 12h, positivo no sentido dos ponteiros.
 */
import { area, curveMonotoneX, curveStepAfter, line } from "d3-shape";

export type Ponto = [number, number];

const f = (n: number) => Math.round(n * 100) / 100;

/** Traço de série — monotone em x (nunca ultrapassa os dados). */
export function pathLinha(pontos: Ponto[]): string {
  return (
    line<Ponto>()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveMonotoneX)(pontos) ?? ""
  );
}

/** Área de série até à linha de base y0 — mesmo monotone. */
export function pathArea(pontos: Ponto[], y0: number): string {
  return (
    area<Ponto>()
      .x((d) => d[0])
      .y0(y0)
      .y1((d) => d[1])
      .curve(curveMonotoneX)(pontos) ?? ""
  );
}

/** Degrau — o valor mantém-se até ao ponto seguinte (step-after). */
export function pathStep(pontos: Ponto[]): string {
  return (
    line<Ponto>()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveStepAfter)(pontos) ?? ""
  );
}

/**
 * Arco circular para o Mostrador: de a0 a a1 em graus, 0° = 12h,
 * positivo no sentido dos ponteiros do relógio (sweep=1 quando a1>a0).
 */
export function pathArco(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number
): string {
  const p = (a: number): Ponto => {
    const rad = (a * Math.PI) / 180;
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
  };
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const amplitude = Math.abs(a1 - a0) % 360;
  const grande = amplitude > 180 ? 1 : 0;
  const sweep = a1 >= a0 ? 1 : 0;
  return `M ${f(x0)} ${f(y0)} A ${f(r)} ${f(r)} 0 ${grande} ${sweep} ${f(x1)} ${f(y1)}`;
}
