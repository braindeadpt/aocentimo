"use client";

/**
 * Calendario — heatmap semanal (B-02): 53 semanas × 7 dias por ano,
 * cor por quantis na rampa --seq-1..4. Dia sem dado = célula oca
 * (nunca interpolado). A semana começa a segunda-feira.
 *
 * Interrogação: hover/foco mostra o dia no readout fixo; as setas
 * movem a célula focada (←→ ±1 dia, ↑↓ ±1 semana), cada célula tem
 * aria-valuetext com data e valor. Equivalente único: tabela sr-only
 * de médias mensais — explicitamente marcadas como médias.
 * prefers-reduced-motion: estado final já, sem tween.
 */
import { useMemo, useRef, useState } from "react";
import { quantile } from "d3-array";
import { fmtData, fmtNum } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import { dur, ease, gsap, reduzido, stagger, useGSAP } from "@/lib/motion/gsap";
import { corQuantil } from "@/lib/viz/cores";
import { EmptyState } from "@/components/EmptyState";
import { m } from "@/lib/messages";

interface Props {
  /** pontos diários — t em "YYYY-MM-DD" */
  pontos: { t: string; v: number }[];
  anos: number[];
  unidade: string;
  titulo: string;
}

const CELL = 10;
const GAP = 2;
const PASSO = CELL + GAP;
const DIAS_SEM = ["2ª", "3ª", "4ª", "5ª", "6ª", "sáb", "dom"];

interface Celula {
  iso: string;
  col: number;
  linha: number;
  v: number | null;
}

/** semana ISO simplificada: coluna = (offset do 1.º jan + dia do ano) / 7 */
function celulasDoAno(ano: number, dados: Map<string, number>): Celula[] {
  const jan1 = new Date(Date.UTC(ano, 0, 1));
  const offset = (jan1.getUTCDay() + 6) % 7; // seg=0
  const nDias =
    Math.round(
      (Date.UTC(ano + 1, 0, 1) - Date.UTC(ano, 0, 1)) / 86_400_000
    );
  const celulas: Celula[] = [];
  for (let i = 0; i < nDias; i++) {
    const d = new Date(Date.UTC(ano, 0, 1 + i));
    const iso = d.toISOString().slice(0, 10);
    celulas.push({
      iso,
      col: Math.floor((offset + i) / 7),
      linha: (d.getUTCDay() + 6) % 7,
      v: dados.get(iso) ?? null,
    });
  }
  return celulas;
}

export function Calendario({ pontos, anos, unidade, titulo }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const { ref: refArmado, armado } = useArmado<HTMLDivElement>(titulo);
  const [foco, setFoco] = useState<string | null>(null);

  const dados = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pontos) m.set(p.t, p.v);
    return m;
  }, [pontos]);

  // quantis reais — as 4 caixas da rampa
  const quantis = useMemo(() => {
    const vs = pontos.map((p) => p.v).filter(Number.isFinite).sort((a, b) => a - b);
    if (vs.length === 0) return null;
    return [0.25, 0.5, 0.75, 1].map((q) => quantile(vs, q) ?? vs[vs.length - 1]);
  }, [pontos]);

  const quantilDe = (v: number): number => {
    if (!quantis) return 0;
    if (v <= quantis[0]) return 0;
    if (v <= quantis[1]) return 1;
    if (v <= quantis[2]) return 2;
    return 3;
  };

  const anosBlocos = useMemo(
    () => anos.map((ano) => ({ ano, celulas: celulasDoAno(ano, dados) })),
    [anos, dados]
  );

  /* revelação — os anos esbatem-se escalonados ao entrar na dobra */
  useGSAP(
    () => {
      if (!armado || reduzido()) return;
      const blocos = scope.current?.querySelectorAll(".cal-ano");
      if (!blocos?.length) return;
      gsap.fromTo(
        blocos,
        { opacity: 0 },
        {
          opacity: 1,
          duration: dur("media"),
          ease: ease("entra"),
          stagger: stagger(),
          onComplete: () => gsap.set(blocos, { clearProps: "opacity" }),
        }
      );
    },
    { scope, dependencies: [armado] }
  );

  const fmtV = (v: number) =>
    unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v);

  const celulasPlano = anosBlocos.flatMap((b) =>
    b.celulas.map((c) => ({ ...c, ano: b.ano }))
  );
  const focada = celulasPlano.find((c) => c.iso === foco) ?? null;

  const moveFoco = (iso: string, deltaDias: number) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + deltaDias);
    const nova = d.toISOString().slice(0, 10);
    if (celulasPlano.some((c) => c.iso === nova)) {
      setFoco(nova);
      scope.current
        ?.querySelector<HTMLElement>(`[data-dia="${nova}"]`)
        ?.focus();
    }
  };

  if (pontos.length === 0) {
    return <EmptyState titulo="Série indisponível" />;
  }

  return (
    <div
      ref={(el) => {
        scope.current = el;
        refArmado(el);
      }}
      className="relative w-full"
    >
      {/* equivalente único — médias mensais, ditas como médias */}
      <div className="sr-only">
        <table>
          <caption>{titulo} — médias mensais</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">Média mensal</th>
            </tr>
          </thead>
          <tbody>
            {anos.flatMap((ano) =>
              Array.from({ length: 12 }, (_, mes) => {
                const vals = pontos
                  .filter((p) => p.t.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`))
                  .map((p) => p.v);
                if (vals.length === 0) return null;
                const media = vals.reduce((a, b) => a + b, 0) / vals.length;
                return (
                  <tr key={`${ano}-${mes}`}>
                    <td>{`${ano}-${String(mes + 1).padStart(2, "0")}`}</td>
                    <td>
                      média de {vals.length} dia(s): {fmtV(media)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* readout fixo — o dia interrogado */}
      <div className="chart-readout" aria-live="polite">
        <span className="chart-readout-t">
          {focada ? fmtData(focada.iso) : `${m.chart.ultimo} · ${fmtData(pontos[pontos.length - 1].t)}`}
        </span>
        <span className="chart-readout-v">
          {focada ? (focada.v !== null ? fmtV(focada.v) : "sem dados") : fmtV(pontos[pontos.length - 1].v)}
        </span>
      </div>

      <div className="overflow-x-auto">
        {anosBlocos.map(({ ano, celulas }) => {
          const W = 53 * PASSO + 30;
          const H = 7 * PASSO + 6;
          return (
            <div key={ano} className="cal-ano mt-3">
              <p aria-hidden className="kicker-xs mb-1">{ano}</p>
              <div className="relative w-full min-w-[540px]" style={{ maxWidth: 700 }}>
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="block h-auto w-full"
                  aria-hidden="true"
                  data-viz
                >
                  {DIAS_SEM.map((d, i) =>
                    i % 2 === 0 ? (
                      <text
                        key={d}
                        x={0}
                        y={i * PASSO + CELL - 1}
                        fontSize={8}
                        fill="var(--muted)"
                        fontFamily="var(--font-mono)"
                      >
                        {d}
                      </text>
                    ) : null
                  )}
                  {celulas.map((c) => (
                    <rect
                      key={c.iso}
                      x={26 + c.col * PASSO}
                      y={c.linha * PASSO}
                      width={CELL}
                      height={CELL}
                      fill={c.v !== null ? corQuantil(quantilDe(c.v)) : "none"}
                      stroke={c.v !== null ? "none" : "var(--line)"}
                      strokeWidth={c.v !== null ? 0 : 1}
                    />
                  ))}
                </svg>
                {/* grelha interactiva — o svg fica mudo, as células são divs sobre ele */}
                <div role="grid" aria-label={`${titulo} — ${ano}`} className="absolute inset-0">
                  {celulas.map((c) => (
                    // eslint-disable-next-line jsx-a11y/role-supports-aria-props -- o brief exige aria-valuetext na célula; o aria-label é o anúncio
                    <div
                      key={c.iso}
                      data-dia={c.iso}
                      role="gridcell"
                      tabIndex={foco === c.iso || (foco === null && c === celulas[celulas.length - 1]) ? 0 : -1}
                      aria-label={`${c.iso}: ${c.v !== null ? fmtV(c.v) : "sem dados"}`}
                      aria-valuetext={c.v !== null ? fmtV(c.v) : "sem dados"}
                      className="absolute"
                      style={{
                        left: `${((26 + c.col * PASSO) / W) * 100}%`,
                        top: `${((c.linha * PASSO) / H) * 100}%`,
                        width: `${(CELL / W) * 100}%`,
                        height: `${(CELL / H) * 100}%`,
                        outline: foco === c.iso ? "1.5px solid var(--mark)" : undefined,
                        outlineOffset: 1,
                      }}
                      onPointerEnter={() => setFoco(c.iso)}
                      onFocus={() => setFoco(c.iso)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight") { e.preventDefault(); moveFoco(c.iso, 1); }
                        else if (e.key === "ArrowLeft") { e.preventDefault(); moveFoco(c.iso, -1); }
                        else if (e.key === "ArrowDown") { e.preventDefault(); moveFoco(c.iso, 7); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); moveFoco(c.iso, -7); }
                        else if (e.key === "Escape") setFoco(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* legenda de quantis — valores reais */}
      {quantis && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="footnote">menos → mais</span>
          {quantis.map((q, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11px] text-ink2" style={{ fontFamily: "var(--font-mono)" }}>
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5"
                style={{ background: corQuantil(i) }}
              />
              ≤ {fmtNum(q)}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11px] text-ink2" style={{ fontFamily: "var(--font-mono)" }}>
            <span aria-hidden className="inline-block h-2.5 w-2.5 border border-line" />
            sem dados
          </span>
        </div>
      )}
    </div>
  );
}
