/**
 * Escalas — B-01. d3 só calcula; o SVG é desenhado pelos componentes.
 *
 * Convenção de datas: os rótulos de período resolvem no FIM do período —
 * a mesma regra do watchdog de frescura (scripts/derive/freshness.ts),
 * em UTC para não depender do fuso da máquina.
 */
import { extent } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import type { ScaleLinear, ScaleTime } from "d3-scale";

export type EscalaTempo = ScaleTime<number, number>;
export type EscalaValor = ScaleLinear<number, number>;

/**
 * "2026" | "2026-08" | "2026-08-15" | "2026-Q2" | "2025-S2" → Date (UTC).
 * Períodos resolvem no último dia: ano→31/dez, mês→último dia do mês,
 * trimestre/semestre→fim do período. Malformado → Date inválida (NaN).
 */
export function dataDePeriodo(t: string): Date {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?|-Q([1-4])|-S([1-2]))?$/.exec(
    t.trim()
  );
  if (!m) return new Date(NaN);
  const ano = Number(m[1]);
  if (m[4] !== undefined) return new Date(Date.UTC(ano, Number(m[4]) * 3, 0));
  if (m[5] !== undefined) return new Date(Date.UTC(ano, Number(m[5]) * 6, 0));
  if (m[2] === undefined) return new Date(Date.UTC(ano, 11, 31));
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return new Date(NaN);
  if (m[3] === undefined) return new Date(Date.UTC(ano, mes, 0));
  return new Date(Date.UTC(ano, mes - 1, Number(m[3])));
}

/** Escala temporal para um conjunto de pontos — domínio fim-a-fim. */
export function escalaTempo(
  pontos: { t: string }[],
  range: [number, number]
): EscalaTempo {
  const datas = pontos
    .map((p) => dataDePeriodo(p.t))
    .filter((d) => !Number.isNaN(d.getTime()));
  let [d0, d1] = extent(datas);
  if (!d0 || !d1) {
    d0 = new Date(Date.UTC(2000, 0, 1));
    d1 = new Date(Date.UTC(2000, 11, 31));
  }
  if (d0.getTime() === d1.getTime()) {
    d0 = new Date(d0.getTime() - 43200_000);
    d1 = new Date(d1.getTime() + 43200_000);
  }
  return scaleTime().domain([d0, d1]).range(range);
}

export interface OpcoesValor {
  /** incluir o zero no domínio */
  zero?: boolean;
  /** arredondar o domínio para marcas limpas */
  nice?: boolean;
  /** domínio explícito — nunca auto-escalado (ex.: Mostrador) */
  dominio?: [number, number];
}

/** Escala linear vertical — range invertido (y0 em baixo, y1 em cima). */
export function escalaValor(
  valores: number[],
  range: [number, number],
  opcoes: OpcoesValor = {}
): EscalaValor {
  const s = scaleLinear().range(range);
  if (opcoes.dominio) {
    s.domain(opcoes.dominio);
  } else {
    const finitos = valores.filter(Number.isFinite);
    let [a, b] = extent(finitos);
    a = a ?? 0;
    b = b ?? 1;
    if (a === b) {
      a -= 0.5;
      b += 0.5;
    }
    if (opcoes.zero) {
      a = Math.min(0, a);
      b = Math.max(0, b);
    }
    s.domain([a, b]);
  }
  if (opcoes.nice) s.nice();
  return s;
}
