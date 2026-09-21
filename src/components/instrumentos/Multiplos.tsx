"use client";

/**
 * Multiplos — pequenos múltiplos (B-02): uma mini-Linha por série,
 * eixo Y comum quando `eixoComum` (senão cada painel escala a si).
 * Hover/foco num painel destaca-o e esbate os outros em --dur-micro.
 * Equivalente único: <dl> sr-only com último valor e variação.
 */
import { useMemo, useState } from "react";
import { fmtData, fmtNum, fmtPct } from "@/lib/format";
import { dataDePeriodo, escalaTempo, escalaValor } from "@/lib/viz/escalas";
import { pathLinha } from "@/lib/viz/formas";
import { EmptyState } from "@/components/EmptyState";

interface Serie {
  id: string;
  rotulo: string;
  pontos: { t: string; v: number }[];
}

interface Props {
  series: Serie[];
  colunas: 3 | 4;
  unidade: string;
  eixoComum: boolean;
  titulo: string;
}

const W = 200;
const H = 90;
const PAD = { top: 8, right: 6, bottom: 6, left: 6 };

const fmtV = (v: number, unidade: string) =>
  unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v);

export function Multiplos({
  series,
  colunas,
  unidade,
  eixoComum,
  titulo,
}: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);

  const dados = useMemo(
    () =>
      series
        .map((s) => ({
          ...s,
          pts: s.pontos
            .map((p) => ({ t: dataDePeriodo(p.t).getTime(), v: p.v }))
            .filter((p) => !Number.isNaN(p.t))
            .sort((a, b) => a.t - b.t),
        }))
        .filter((s) => s.pts.length > 0),
    [series]
  );

  const domComum = useMemo(() => {
    if (!eixoComum) return null;
    const vs = dados.flatMap((d) => d.pts.map((p) => p.v));
    const mn = Math.min(...vs);
    const mx = Math.max(...vs);
    const folga = (mx - mn || 1) * 0.08;
    return [mn - folga, mx + folga] as [number, number];
  }, [dados, eixoComum]);

  if (dados.length === 0) return <EmptyState titulo="Série indisponível" />;

  const variacao = (pts: { v: number }[]) => {
    const a = pts[0]?.v;
    const b = pts[pts.length - 1]?.v;
    return a && b ? b / a - 1 : null;
  };

  return (
    <div className="relative w-full">
      <dl className="sr-only">
        <dt>{titulo}</dt>
        {dados.map((d) => {
          const ult = d.pts[d.pts.length - 1];
          const v = variacao(d.pts);
          return (
            <dd key={d.id}>
              {d.rotulo}: {fmtV(ult.v, unidade)} em{" "}
              {fmtData(new Date(ult.t).toISOString().slice(0, 10))}
              {v !== null ? ` (${v >= 0 ? "+" : ""}${fmtPct(v)} desde o início)` : ""}
            </dd>
          );
        })}
      </dl>

      <div
        className={`grid gap-px border border-line bg-line grid-cols-2 ${
          colunas === 4 ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3"
        }`}
      >
        {dados.map((d) => {
          const ys = d.pts.map((p) => p.v);
          const dom =
            domComum ??
            (() => {
              const mn = Math.min(...ys);
              const mx = Math.max(...ys);
              const folga = (mx - mn || 1) * 0.08;
              return [mn - folga, mx + folga] as [number, number];
            })();
          const x = escalaTempo(
            d.pontos,
            [PAD.left, W - PAD.right]
          );
          const y = escalaValor([], [H - PAD.bottom, PAD.top], {
            dominio: dom,
          });
          const ult = d.pts[d.pts.length - 1];
          const esbatido = ativo !== null && ativo !== d.id;
          return (
            <div
              key={d.id}
              tabIndex={0}
              role="group"
              aria-label={`${d.rotulo}: ${fmtV(ult.v, unidade)}`}
              className="bg-panel px-3 py-2 outline-none transition-opacity focus-visible:ring-1 focus-visible:ring-mark"
              style={{
                opacity: esbatido ? 0.35 : 1,
                transitionDuration: "var(--dur-micro)",
                transitionTimingFunction: "var(--ease-entra)",
              }}
              onPointerEnter={() => setAtivo(d.id)}
              onPointerLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(d.id)}
              onBlur={() => setAtivo(null)}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="kicker-xs">{d.rotulo}</p>
                <p className="num text-xs text-ink tabular-nums">
                  {fmtV(ult.v, unidade)}
                </p>
              </div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mt-1 block w-full"
                aria-hidden
                data-viz
              >
                {eixoComum && (
                  <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={y(0)}
                    y2={y(0)}
                    stroke="var(--line)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    display={dom[0] < 0 && dom[1] > 0 ? undefined : "none"}
                  />
                )}
                <path
                  d={pathLinha(
                    d.pts.map(
                      (p) => [x(new Date(p.t)), y(p.v)] as [number, number]
                    )
                  )}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={x(new Date(ult.t))}
                  cy={y(ult.v)}
                  r={2}
                  fill="var(--ink)"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
