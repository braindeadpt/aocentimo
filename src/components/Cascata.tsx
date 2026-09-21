"use client";

import { useState } from "react";
import { fmtEUR, fmtPct } from "@/lib/format";
import type { Messages } from "@/lib/messages";

export interface Passo {
  label: string;
  /** positivo = entra; negativo = corte */
  valor: number;
  tipo: "base" | "corte" | "total";
  nota?: string;
}

/**
 * A cascata — anatomia de um montante que vai sendo cortado.
 * Cada linha mostra a fatia que sai (acento) e o que continua (tinta),
 * proporcionais ao total inicial. A entrada é escalonada: os degraus
 * acumulam na ordem em que o dinheiro cai — a montagem explica a soma.
 * Padrão canónico de gráficos: o bloco visual é aria-hidden e o
 * equivalente textual é a tabela sr-only irmã — nunca os dois
 * (role="img" + tabela anunciava a informação duas vezes).
 * Interrogação: readout fixo em cima; ponteiro nas linhas, régua com
 * setas para teclado.
 */
export function Cascata({
  passos,
  chart,
}: {
  passos: Passo[];
  /** strings messages.chart — prop para o JSON não entrar no cliente */
  chart: Messages["chart"];
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const total = passos.find((p) => p.tipo === "base")?.valor ?? 0;

  // valor corrente após cada passo — cálculo puro, sem estado
  const linhas = passos.map((p, i) => {
    const depois =
      p.tipo === "base"
        ? p.valor
        : total +
          passos
            .slice(0, i + 1)
            .filter((q) => q.tipo === "corte")
            .reduce((a, q) => a + q.valor, 0);
    return { ...p, depois };
  });

  const lida = ativo !== null ? linhas[ativo] : null;

  return (
    <div>
      {/* readout fixo — a linha em leitura; régua percorre por teclado */}
      <div className="chart-readout" aria-live="polite">
        {lida ? (
          <>
            <span className="chart-readout-t">{lida.label}</span>
            <span className="chart-readout-v">
              {lida.tipo === "corte" ? "−" : ""}
              {fmtEUR(Math.abs(lida.valor))}
            </span>
            <span className="chart-readout-t">
              → {fmtEUR(lida.depois)} · {fmtPct(total > 0 ? lida.depois / total : 0)}
            </span>
          </>
        ) : (
          <span className="chart-readout-t">
            {fmtEUR(total)} → {fmtEUR(linhas[linhas.length - 1]?.depois ?? 0)}
          </span>
        )}
        <input
          type="range"
          className="chart-scrub"
          min={0}
          max={Math.max(0, linhas.length - 1)}
          value={ativo ?? linhas.length - 1}
          aria-label={chart.scrubAria}
          aria-valuetext={lida ? `${lida.label}: ${fmtEUR(lida.valor)}` : undefined}
          onChange={(e) => setAtivo(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAtivo(null);
          }}
          onBlur={() => setAtivo(null)}
        />
      </div>

      <div className="space-y-1.5 mt-2" aria-hidden="true">
        {linhas.map((l, i) => {
          const fica = total > 0 ? (l.depois / total) * 100 : 0;
          const sai = total > 0 ? (Math.abs(l.tipo === "corte" ? l.valor : 0) / total) * 100 : 0;
          return (
            <div
              key={l.label}
              className={`chart-hit grid grid-cols-[7.5rem_1fr_5.5rem] md:grid-cols-[10rem_1fr_7rem] items-center gap-3 ${
                ativo !== null && ativo !== i ? "chart-hit-off" : ""
              }`}
              onPointerEnter={() => setAtivo(i)}
              onPointerLeave={() => setAtivo(null)}
            >
              <span className={`text-xs md:text-sm ${l.tipo === "total" ? "font-medium" : "text-ink2"}`}>
                {l.label}
              </span>
              <div className="flex h-6 md:h-7">
                {l.tipo === "corte" ? (
                  <>
                    <div
                      className="eurobar-seg h-full"
                      style={{
                        width: `${fica}%`,
                        backgroundColor: "var(--color-keep)",
                        animationDelay: `calc(${i} * var(--stagger))`,
                      }}
                    />
                    {/* o corte CAI — é dinheiro que sai, não barra que cresce */}
                    <div
                      className="eurobar-cai h-full"
                      style={{
                        width: `${sai}%`,
                        backgroundColor: "var(--color-accent)",
                        animationDelay: `calc(${i} * var(--stagger))`,
                      }}
                    />
                  </>
                ) : (
                  <div
                    className="eurobar-seg h-full"
                    style={{
                      width: `${fica}%`,
                      backgroundColor: l.tipo === "total" ? "var(--color-keep)" : "var(--color-ink2)",
                      animationDelay: `calc(${i} * var(--stagger))`,
                    }}
                  />
                )}
              </div>
              <span className={`num text-right text-xs md:text-sm ${l.tipo === "corte" ? "text-up" : l.tipo === "total" ? "font-medium" : "text-ink2"}`}>
                {l.tipo === "corte" ? "−" : ""}
                {fmtEUR(Math.abs(l.valor))}
              </span>
            </div>
          );
        })}
      </div>

      {/* sr-only no wrapper: uma <table> ignora width:1px */}
      <div className="sr-only">
        <table>
          <caption>Decomposição em cascata</caption>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.label}>
                <td>{l.label}</td>
                <td>{fmtEUR(l.valor)}</td>
                <td>{fmtPct(total > 0 ? l.depois / total : 0)} do total</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
