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

function yearTicks(t0: number, t1: number): number[] {
  const y0 = new Date(t0).getUTCFullYear();
  const y1 = new Date(t1).getUTCFullYear();
  const n = y1 - y0 + 1;
  const step = Math.ceil(n / 8);
  const ticks: number[] = [];
  for (let y = y0; y <= y1; y += step) ticks.push(Date.UTC(y, 0, 1));
  return ticks;
}

/**
 * Gráfico de linhas editorial — SVG próprio, sem biblioteca.
 * Rótulos no fim da linha (à maneira do FT), tooltip ao hover/focus,
 * números mono tabulares. `prefers-reduced-motion`: estado final já.
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

  const dados = useMemo(
    () =>
      series
        .map((s, i) => ({
          name: s.name,
          cor: s.cor ?? CORES[i % CORES.length],
          pts: s.data
            .map(([t, v]) => ({ t: toMs(t), v }))
            .sort((a, b) => a.t - b.t),
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
    const x = (t: number) =>
      PAD.left + ((t - t0) / (t1 - t0 || 1)) * (w - PAD.left - PAD.right);
    const y = (v: number) =>
      PAD.top + (1 - (v - lo) / (hi - lo || 1)) * (height - PAD.top - PAD.bottom);
    // posição dos rótulos de fim de linha — relaxação em duas passagens:
    // empurra para baixo, e se a fila transbordar o fim do gráfico,
    // sobe o bloco inteiro para dentro da área útil
    const fim = dados
      .map((d) => ({ name: d.name, cor: d.cor, y: y(d.pts[d.pts.length - 1]?.v ?? lo), v: d.pts[d.pts.length - 1]?.v }))
      .sort((a, b) => a.y - b.y);
    let prev = -Infinity;
    for (const f of fim) {
      f.y = Math.max(f.y, prev + 15, PAD.top + 6);
      prev = f.y;
    }
    const limite = PAD.top + (height - PAD.top - PAD.bottom) - 6;
    const excesso = fim.length ? fim[fim.length - 1].y - limite : 0;
    if (excesso > 0) {
      for (let i = fim.length - 1; i >= 0; i--) {
        const teto = i === fim.length - 1 ? limite : fim[i + 1].y - 15;
        fim[i].y = Math.min(fim[i].y, teto);
      }
    }
    return {
      escala: { x, y },
      xticks: yearTicks(t0, t1),
      yticks: ticks,
      fim,
    };
  }, [dados, w, height]);

  const { x, y } = escala;
  const plotW = w - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left - PAD.left) / plotW;
    setHover(Math.max(0, Math.min(1, frac)));
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

  const descricao = dados
    .map((d) => `${d.name}: ${yFormat(d.pts[d.pts.length - 1]?.v ?? 0)}`)
    .join("; ");

  // regra nº1 a nível de componente: sem dados → estado explícito, nunca NaN
  if (dados.length === 0) {
    return <EmptyState titulo="Série indisponível" />;
  }

  return (
    <div ref={wrap} className="relative w-full" role="img" aria-label={`Gráfico de linhas — ${descricao}`}>
      {/* equivalente tabular para leitores de ecrã — últimos 24 pontos;
          sr-only no wrapper porque uma <table> ignora width:1px */}
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
      <svg width={w} height={height} className="block" aria-hidden>
        {/* grelha horizontal + eixo y */}
        {yticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={w - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
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
            points={d.pts.map((p) => `${x(p.t)},${y(p.v)}`).join(" ")}
          />
        ))}
        {/* rótulos de fim de linha */}
        {fim.map((f) => (
          <text
            key={f.name}
            x={w - PAD.right + 8}
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
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--color-line2)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {proximos.map((p, i) => (
              <circle key={i} cx={x(p.t)} cy={y(p.v)} r={3.5} fill={dados[i].cor} />
            ))}
          </g>
        )}
        {/* zona de hover */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={Math.max(0, plotW)}
          height={Math.max(0, plotH)}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
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
