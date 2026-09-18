"use client";

import { useState } from "react";
import { fmtEUR, fmtPct } from "@/lib/format";
import { m } from "@/lib/messages";

export interface Segmento {
  label: string;
  valor: number;
  cor: string;
}

/**
 * A barra do euro — a assinatura do site. Desmonta um total em fatias
 * proporcionais: quem fica com o quê. Anima uma vez, à entrada; quando
 * os dados mudam, as fatias repartem-se por transição — vês a barra a
 * dividir-se, não a saltar.
 * Interrogação: readout fixo em cima; ponteiro sobre as fatias (ou sobre
 * as linhas da tabela — acendem-se uma à outra); régua com setas para
 * teclado. A barra visual é aria-hidden — a tabela visível já é o
 * equivalente textual.
 */
export function EuroBar({
  segmentos,
  total,
  unidade = "€",
}: {
  segmentos: Segmento[];
  total: number;
  unidade?: string;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const lida = ativo !== null ? segmentos[ativo] : null;

  return (
    <div>
      {/* readout fixo — a fatia em leitura; a régua percorre por teclado */}
      <div className="chart-readout" aria-live="polite">
        {lida ? (
          <>
            <span
              aria-hidden
              className="inline-block h-2 w-2 self-center"
              style={{ background: lida.cor }}
            />
            <span className="chart-readout-t">{lida.label}</span>
            <span className="chart-readout-v">
              {fmtEUR(lida.valor)}
              {unidade === "€" ? "" : ` ${unidade}`}
            </span>
            <span className="chart-readout-t">
              {fmtPct(total > 0 ? lida.valor / total : 0)}
            </span>
          </>
        ) : (
          <span className="chart-readout-t">
            {fmtEUR(total)}
            {unidade === "€" ? "" : ` ${unidade}`} · {segmentos.length} fatias
          </span>
        )}
        <input
          type="range"
          className="chart-scrub"
          min={0}
          max={Math.max(0, segmentos.length - 1)}
          value={ativo ?? segmentos.length - 1}
          aria-label={m.chart.scrubAria}
          aria-valuetext={lida ? `${lida.label}: ${fmtEUR(lida.valor)}` : undefined}
          onChange={(e) => setAtivo(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAtivo(null);
          }}
          onBlur={() => setAtivo(null)}
        />
      </div>

      {/* a barra é decorativa — a tabela visível por baixo já é o
          equivalente textual; role="img" + label aqui anunciava tudo 2× */}
      <div
        className="mt-2 flex h-16 md:h-20 w-full overflow-hidden border border-ink"
        aria-hidden="true"
      >
        {segmentos.map((s, i) => {
          const w = total > 0 ? (s.valor / total) * 100 : 0;
          return (
            <div
              key={s.label}
              className={`eurobar-seg chart-hit relative h-full border-r border-floor last:border-0 ${
                ativo !== null && ativo !== i ? "chart-hit-off" : ""
              }`}
              style={{
                width: `${w}%`,
                backgroundColor: s.cor,
                animationDelay: `${i * 140}ms`,
              }}
              onPointerEnter={() => setAtivo(i)}
              onPointerLeave={() => setAtivo(null)}
            >
              {w >= 12 && (
                <span
                  className="num absolute inset-0 flex items-center justify-center text-xs md:text-sm"
                  style={{ color: "var(--color-floor)" }}
                >
                  {fmtPct(s.valor / total, 0)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <table className="mt-3 w-full text-sm">
        <tbody>
          {segmentos.map((s, i) => (
            <tr
              key={s.label}
              className={`chart-hit border-b border-line last:border-0 ${
                ativo !== null && ativo !== i ? "chart-hit-off" : ""
              }`}
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
            >
              <td className="py-1.5 text-ink2">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 align-middle"
                  style={{ backgroundColor: s.cor }}
                />
                {s.label}
              </td>
              <td className="num py-1.5 text-right">
                {fmtEUR(s.valor)} {unidade === "€" ? "" : unidade}
              </td>
              <td className="num w-16 py-1.5 text-right text-muted">
                {fmtPct(total > 0 ? s.valor / total : 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
