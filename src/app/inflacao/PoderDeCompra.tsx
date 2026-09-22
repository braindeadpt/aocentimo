"use client";

import { useMemo, useState } from "react";
import { NumHero } from "@/components/NumHero";
import { fmtEUR, fmtPct } from "@/lib/format";

interface Props {
  /** pontos [{t, v}] do índice geral (CP00) */
  serie: { t: string; v: number }[];
}

/** "1000 € em 2015 valem quanto hoje?" — deflaciona pelo IHPC total. */
export function PoderDeCompra({ serie }: Props) {
  const anos = useMemo(
    () => [...new Set(serie.map((p) => p.t.slice(0, 4)))],
    [serie]
  );
  const [ano, setAno] = useState(anos[Math.min(5, anos.length - 1)] ?? "2020");
  const [valor, setValor] = useState(1000);

  const ponto = serie.find((p) => p.t.startsWith(ano));
  const ultimo = serie[serie.length - 1];
  const resultado =
    ponto && ultimo ? valor * (ultimo.v / ponto.v) : null;
  // a fração do euro que sobrou: poder = índice(ano)/índice(hoje) ≤ 1
  const poder = ponto && ultimo ? Math.min(1, ponto.v / ultimo.v) : 1;

  return (
    <div className="bg-raised border border-line shadow-raised px-5 py-5" aria-live="polite">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kicker block mb-1.5" htmlFor="pd-valor">Valor</label>
          <input
            id="pd-valor"
            type="number"
            min={0}
            step={50}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value) || 0)}
            className="field"
          />
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="pd-ano">Em janeiro de</label>
          <select
            id="pd-ano"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="field"
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
      {resultado !== null ? (
        <div className="mt-5 flex items-center gap-6">
          {/* o euro a encolher — a moeda cheia era o poder de compra de
              janeiro do ano escolhido; o disco encolhe para a fração que
              resta hoje. O contorno tracejado fica: é o que foi comido.
              Vê-se, não se lê. */}
          <div className="euro-wrap" aria-hidden="true">
            <div className="euro-ghost" />
            <div
              className="euro-disc"
              style={{ transform: `scale(${poder})` }}
            >
              <span>€</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-ink2 text-corpo-sm">
              {fmtEUR(valor)} em janeiro de {ano} compram hoje o equivalente a
            </p>
            <NumHero compacto valor={fmtEUR(resultado)} animar={resultado} className="mt-1" />
            <p className="footnote mt-2">
              O euro de {ano} encolheu para {fmtPct(poder, 0)} do que valia —
              a inflação comeu o resto ({fmtEUR(resultado - valor)} de
              diferença).
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-ink2 text-corpo-sm">Sem dados suficientes.</p>
      )}
    </div>
  );
}
