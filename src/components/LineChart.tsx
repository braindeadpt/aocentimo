"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fmtData, fmtNum } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

interface SerieIn {
  name: string;
  /** [data ISO "YYYY-MM-DD" ou "YYYY-MM", valor] */
  data: [string, number][];
  cor?: string;
}

interface Props {
  series: SerieIn[];
  height?: number;
  /** Sufixo dos valores do eixo e do tooltip ("%", "€", …). */
  unidade?: string;
}

const CORES = [
  "var(--color-ink)",
  "var(--color-accent)",
  "var(--color-warn)",
  "var(--color-keep)",
];

const PAD = { top: 16, right: 132, bottom: 30, left: 46 };
/** ecrã estreito: sem rótulos de fim — o espaço é todo para a curva */
const PAD_SM = { top: 16, right: 8, bottom: 30, left: 46 };
/** abaixo desta largura: legenda em linha por baixo em vez de rótulos de fim */
const COMPACTO = 560;

/** 1 casa decimal chega — o SVG está em unidades de pixel. */
const r1 = (n: number) => Math.round(n * 10) / 10;

function toMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

/** Ticks "redondos" — 1/2/5×10ⁿ, à maneira de gráfico editorial. */
function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step * 1e-9; v += step) ticks.push(v);
  return { ticks, lo, hi };
}

function yearTicks(t0: number, t1: number, maxTicks: number): number[] {
  const y0 = new Date(t0).getUTCFullYear();
  const y1 = new Date(t1).getUTCFullYear();
  const n = y1 - y0 + 1;
  const step = Math.ceil(n / maxTicks);
  const ticks: number[] = [];
  for (let y = y0; y <= y1; y += step) ticks.push(Date.UTC(y, 0, 1));
  return ticks;
}

/**
 * Gráfico de linhas editorial — SVG próprio, sem biblioteca.
 * Rótulos no fim da linha (à maneira do FT); em ecrã estreito, legenda em
 * linha por baixo. Tooltip ao hover/focus, números mono tabulares.
 * `prefers-reduced-motion`: estado final já.
 *
 * Responsivo sem salto: o <svg> tem caixa CSS final (w-full × height) e
 * viewBox com preserveAspectRatio="none" — o primeiro paint preenche já o
 * contentor; o ResizeObserver recalcula a geometria em px antes do paint,
 * corrigindo qualquer deformação transitória. A alternativa (viewBox com
 * aspecto fixo) mudava a altura renderizada consoante a largura — CLS.
 */
export function LineChart({ series, height = 360, unidade = "" }: Props) {
  const yFormat = (v: number) => (unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v));
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compacto = w < COMPACTO;
  const pad = compacto ? PAD_SM : PAD;

  const dados = useMemo(
    () =>
      series
        .map((s, i) => ({
          name: s.name,
          cor: s.cor ?? CORES[i % CORES.length],
          pts: s.data
            .map(([t, v]) => ({ t: toMs(t), v }))
            .sort((a, b) => a.t - b.t)
            // datas repetidas (revisões na fonte): fica a última
            .filter((p, i, arr) => i === arr.length - 1 || arr[i + 1].t !== p.t),
        }))
        .filter((d) => d.pts.length > 0),
    [series]
  );

  const { escala, xticks, yticks, fim } = useMemo(() => {
    const ts = dados.flatMap((d) => d.pts.map((p) => p.t));
    const vs = dados.flatMap((d) => d.pts.map((p) => p.v));
    const t0 = Math.min(...ts);
    const t1 = Math.max(...ts);
    const { ticks, lo, hi } = niceTicks(Math.min(...vs), Math.max(...vs));
    const plotW = w - pad.left - pad.right;
    const x = (t: number) =>
      r1(pad.left + ((t - t0) / (t1 - t0 || 1)) * plotW);
    const y = (v: number) =>
      r1(pad.top + (1 - (v - lo) / (hi - lo || 1)) * (height - pad.top - pad.bottom));
    // posição dos rótulos de fim de linha — relaxação em duas passagens:
    // empurra para baixo, e se a fila transbordar o fim do gráfico,
    // sobe o bloco inteiro para dentro da área útil
    const fim = dados
      .map((d) => ({ name: d.name, cor: d.cor, y: y(d.pts[d.pts.length - 1]?.v ?? lo), v: d.pts[d.pts.length - 1]?.v }))
      .sort((a, b) => a.y - b.y);
    let prev = -Infinity;
    for (const f of fim) {
      f.y = Math.max(f.y, prev + 15, pad.top + 6);
      prev = f.y;
    }
    const limite = pad.top + (height - pad.top - pad.bottom) - 6;
    const excesso = fim.length ? fim[fim.length - 1].y - limite : 0;
    if (excesso > 0) {
      for (let i = fim.length - 1; i >= 0; i--) {
        const teto = i === fim.length - 1 ? limite : fim[i + 1].y - 15;
        fim[i].y = Math.min(fim[i].y, teto);
      }
    }
    return {
      escala: { x, y },
      xticks: yearTicks(t0, t1, Math.max(2, Math.floor(plotW / 56))),
      yticks: ticks,
      fim,
    };
  }, [dados, w, height, pad]);

  const { x, y } = escala;
  const plotW = w - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // fração dentro da zona de hover — imune à escala transitória do viewBox
    setHover(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  // ponto mais próximo do cursor em cada série
  const proximos = hover === null
    ? null
    : dados.map((d) => {
        const t0 = d.pts[0].t;
        const t1 = d.pts[d.pts.length - 1].t;
        const alvo = t0 + hover * (t1 - t0);
        let best = d.pts[0];
        for (const p of d.pts) if (Math.abs(p.t - alvo) < Math.abs(best.t - alvo)) best = p;
        return best;
      });
  const hoverX = proximos ? x(proximos[0].t) : null;

  // regra nº1 a nível de componente: sem dados → estado explícito, nunca NaN
  if (dados.length === 0) {
    return <EmptyState titulo="Série indisponível" />;
  }

  return (
    <div ref={wrap} className="relative w-full">
      {/* equivalente tabular para leitores de ecrã — últimos 24 pontos;
          irmão do <svg> (aria-hidden): role="img" no wrapper escondia a
          tabela — descendentes de role="img" não são expostos */}
      <div className="sr-only">
        <table>
        <caption>Valores recentes do gráfico</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            {dados.map((d) => (
              <th key={d.name} scope="col">{d.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 24 }, (_, i) => {
            const idx = dados[0].pts.length - 24 + i;
            const p0 = dados[0].pts[idx];
            if (!p0) return null;
            return (
              <tr key={p0.t}>
                <td>{new Date(p0.t).toISOString().slice(0, 10)}</td>
                {dados.map((d) => (
                  <td key={d.name}>
                    {d.pts[idx] ? yFormat(d.pts[idx].v) : "—"}
                  </td>
                ))}
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        height={height}
        className="block w-full"
        aria-hidden
      >
        {/* grelha horizontal + eixo y */}
        {yticks.map((v) => (
          <g key={v}>
            <line
              x1={pad.left}
              x2={w - pad.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={pad.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--color-muted)"
              fontFamily="var(--font-mono)"
            >
              {yFormat(v)}
            </text>
          </g>
        ))}
        {/* eixo x — anos */}
        {xticks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={height - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-muted)"
            fontFamily="var(--font-mono)"
          >
            {new Date(t).getUTCFullYear()}
          </text>
        ))}
        {/* linhas */}
        {dados.map((d) => (
          <polyline
            key={d.name}
            fill="none"
            stroke={d.cor}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            points={d.pts.map((p) => `${x(p.t)},${y(p.v)}`).join(" ")}
          />
        ))}
        {/* rótulos de fim de linha — só com espaço; em compacto há legenda */}
        {!compacto &&
          fim.map((f) => (
            <text
              key={f.name}
              x={w - pad.right + 8}
              y={f.y + 4}
              fontSize={11}
              fill={f.cor}
              fontFamily="var(--font-mono)"
            >
              {f.name}
            </text>
          ))}
        {/* cursor */}
        {hoverX !== null && proximos && (
          <g>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={pad.top}
              y2={pad.top + plotH}
              stroke="var(--color-line2)"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {proximos.map((p, i) => (
              <circle key={i} cx={x(p.t)} cy={y(p.v)} r={3.5} fill={dados[i].cor} />
            ))}
          </g>
        )}
        {/* zona de hover */}
        <rect
          x={pad.left}
          y={pad.top}
          width={Math.max(0, plotW)}
          height={Math.max(0, plotH)}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {/* legenda em linha por baixo — regime compacto (nomes já na tabela) */}
      {compacto && (
        <div aria-hidden className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {dados.map((d) => (
            <span
              key={d.name}
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: d.cor, fontFamily: "var(--font-mono)" }}
            >
              <span className="inline-block h-2 w-2" style={{ background: d.cor }} />
              {d.name}
            </span>
          ))}
        </div>
      )}
      {/* tooltip */}
      {proximos && hoverX !== null && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-2 z-10 border border-line bg-surface px-3 py-2 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(hoverX - 70, 0), w - 170),
            fontFamily: "var(--font-mono)",
          }}
        >
          <p className="text-muted">{fmtData(new Date(proximos[0].t).toISOString().slice(0, 10))}</p>
          {proximos.map((p, i) => (
            <p key={i} className="mt-0.5 flex items-center gap-2">
              <span className="inline-block h-2 w-2" style={{ background: dados[i].cor }} />
              <span className="text-ink2">{dados[i].name}</span>
              <span className="ml-auto pl-3 font-medium">{yFormat(p.v)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
