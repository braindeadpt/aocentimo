"use client";

import { useMemo, useState } from "react";
import { fmtEUR0 } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import type { LinhaAmortizacao } from "@/lib/engines/prestacao";

/**
 * Mapa de amortização — a divisória que troca de peso.
 *
 * Cada ano do crédito agrega as prestações do plano: capital em
 * verde-keep ("fica teu", é património) e juro em up ("vai para o
 * banco"). No início quase tudo é juro; no fim quase tudo é capital —
 * a linha divisória desce e o verde engorda. A revelação esq→dir
 * (clip-path, --dur-longa) é a passagem do tempo.
 *
 * Interrogável por ano: régua + readout (chart-readout), Escape
 * limpa. Gate de dobra (M-09): nascer à vista = nascer no estado
 * final; a primeira revelação só anima se entrar no viewport.
 * `runKey` re-desenha a revelação quando os dados mudam.
 */

const W = 300;
const H = 96;

export function JuroCapital({
  linhas,
  runKey,
  titulo = "O que cada ano paga — capital a ganhar peso ao juro",
  ariaLabel = "Divisão entre capital e juro em cada ano do crédito",
}: {
  /** plano mensal do motor simularPrestacao */
  linhas: LinhaAmortizacao[];
  /** muda para re-animar a revelação ao mudar os inputs */
  runKey: string;
  titulo?: string;
  ariaLabel?: string;
}) {
  const [anoLido, setAnoLido] = useState<number | null>(null);
  const { ref: tempoRef, arm: tempoArm } = useArmado<SVGSVGElement>(runKey);

  // juro vs capital por ano
  const planoAnual = useMemo(() => {
    const anosArr: { juro: number; capital: number }[] = [];
    for (const l of linhas) {
      const a = Math.floor((l.mes - 1) / 12);
      if (!anosArr[a]) anosArr[a] = { juro: 0, capital: 0 };
      anosArr[a].juro += l.juro;
      anosArr[a].capital += l.capital;
    }
    return anosArr;
  }, [linhas]);

  // geometria da faixa anual — a soma juro+capital é ~constante,
  // a divisória desce: no início é quase tudo juro
  const pts = planoAnual.map((a, i) => {
    const tot = a.juro + a.capital;
    const x = planoAnual.length > 1 ? (i / (planoAnual.length - 1)) * W : W;
    const yCap = tot > 0 ? H - (a.capital / tot) * H : H;
    return { x: Math.round(x * 10) / 10, yCap: Math.round(yCap * 10) / 10, ano: i + 1, ...a };
  });
  const divPts = pts.map((p) => `${p.x},${p.yCap}`).join(" ");
  const capArea = pts.length ? `M0,${H} L${divPts.replaceAll(" ", " L")} L${W},${H} Z` : "";
  const lido = anoLido !== null ? pts[Math.min(anoLido, pts.length - 1)] : null;

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="chart-readout" aria-live="polite">
        {lido ? (
          <>
            <span className="chart-readout-t">Ano {lido.ano}</span>
            <span className="chart-readout-v">
              {fmtEUR0(lido.capital)} capital · {fmtEUR0(lido.juro)} juro
            </span>
          </>
        ) : (
          <span className="chart-readout-t">{titulo}</span>
        )}
        <input
          type="range"
          className="chart-scrub"
          min={0}
          max={Math.max(0, pts.length - 1)}
          value={anoLido ?? pts.length - 1}
          aria-label="Percorrer os anos do crédito"
          aria-valuetext={
            lido
              ? `Ano ${lido.ano}: ${fmtEUR0(lido.capital)} capital, ${fmtEUR0(lido.juro)} juro`
              : undefined
          }
          onChange={(e) => setAnoLido(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAnoLido(null);
          }}
          onBlur={() => setAnoLido(null)}
        />
      </div>
      <svg
        ref={tempoRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-24 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
      >
        <g className={tempoArm("tempo-revela")} key={runKey}>
          {/* juro — a faixa inteira; a área keep tapa a parte
              que é capital */}
          <rect x={0} y={0} width={W} height={H} fill="var(--color-up)" opacity={0.16} />
          <path d={capArea} fill="var(--color-keep)" opacity={0.7} />
          <polyline
            points={divPts}
            fill="none"
            stroke="var(--color-ink2)"
            strokeWidth={1.5}
          />
        </g>
        {lido && (
          <line
            x1={lido.x}
            x2={lido.x}
            y1={0}
            y2={H}
            stroke="var(--color-ink)"
            strokeWidth={1}
          />
        )}
      </svg>
      <div className="mt-1 flex items-center gap-4 text-rotulo text-muted">
        <span className="flex items-center gap-1.5">
          <span className="sw" style={{ background: "var(--color-keep)", opacity: 0.7 }} aria-hidden />
          capital — fica teu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="sw" style={{ background: "var(--color-up)", opacity: 0.5 }} aria-hidden />
          juro — vai para o banco
        </span>
      </div>
    </div>
  );
}
