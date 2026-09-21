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
import { m, t } from "@/lib/messages";

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
  /** janela em anos — activa os botões «{n} a · máx» por cima da
      grelha; por omissão mostra a janela */
  janela?: number;
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
  janela,
}: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const [janelaOn, setJanelaOn] = useState(janela !== undefined);

  const dados = useMemo(() => {
    const todas = series
      .map((s) => ({
        ...s,
        pts: s.pontos
          .map((p) => ({ t: dataDePeriodo(p.t).getTime(), v: p.v }))
          .filter((p) => !Number.isNaN(p.t))
          .sort((a, b) => a.t - b.t),
      }))
      .filter((s) => s.pts.length > 0);
    if (!janela || !janelaOn) return todas;
    /* janela global — o mesmo intervalo temporal em todos os painéis,
       medido a partir do ponto mais recente do conjunto */
    const maxT = Math.max(...todas.map((d) => d.pts[d.pts.length - 1].t));
    const corte = maxT - janela * 365.25 * 86_400_000;
    return todas.map((d) => {
      const pts = d.pts.filter((p) => p.t >= corte);
      return { ...d, pts: pts.length >= 2 ? pts : d.pts.slice(-2) };
    });
  }, [series, janela, janelaOn]);

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

      {/* barra de contexto — âmbito do eixo comum no canto superior
          esquerdo (uma só vez, não em cada múltiplo), selector de
          janela à direita */}
      {(janela !== undefined || domComum) && (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          {domComum ? (
            <p className="footnote">
              {t(m.chart.eixoComum, {
                min: fmtV(domComum[0], unidade),
                max: fmtV(domComum[1], unidade),
              })}
            </p>
          ) : (
            <span />
          )}
          {janela !== undefined && (
            <div className="flex gap-1" role="group">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={janelaOn === v}
                  onClick={() => setJanelaOn(v)}
                  className={`border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    janelaOn === v
                      ? "border-ink bg-ink text-panel"
                      : "border-line bg-transparent text-ink2 hover:border-ink2"
                  }`}
                >
                  {v ? t(m.chart.janelaAnos, { n: janela }) : m.chart.janelaMax}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
                <p
                  className="kicker-xs min-w-0 flex-1 truncate"
                  title={d.rotulo}
                >
                  {d.rotulo}
                </p>
                <p className="num shrink-0 text-xs text-ink tabular-nums whitespace-nowrap">
                  {fmtV(ult.v, unidade)}
                </p>
              </div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mt-1 block w-full"
                aria-hidden
                data-viz
              >
                {/* linha do zero a tracejado — só quando o domínio a
                    cruza (comum ou próprio) */}
                {dom[0] < 0 && dom[1] > 0 && (
                  <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={y(0)}
                    y2={y(0)}
                    stroke="var(--line)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
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
