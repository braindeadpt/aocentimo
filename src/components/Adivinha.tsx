"use client";

import { useState } from "react";
import { Odometer } from "@/components/Odometer";
import { simularSalario } from "@/lib/engines/irs";
import { m, t } from "@/lib/messages";

/**
 * Guess-first — antes de mostrar a escada, o visitante aposta quantos
 * cêntimos de cada euro de custo da empresa lhe chegam. Ao revelar, o
 * odometer mostra a realidade e a escada volta a desenhar-se (remount
 * por key = replay da animação). Números do motor fiscal, não literais.
 */
export function Adivinha({ children }: { children: React.ReactNode }) {
  const med = simularSalario([1500], 0, 2026);
  const real = (med.liquidoAnual / med.custoEmpresaAnual) * 100;
  const estado = 100 - real;

  const [aposta, setAposta] = useState<number | null>(null);
  const [ronda, setRonda] = useState(0);

  const diff = aposta === null ? null : Math.abs(aposta - real);
  const veredicto =
    diff === null ? null : diff <= 2 ? m.guess.certeiro : diff <= 10 ? m.guess.perto : m.guess.longe;

  return (
    <div>
      <form
        className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const v = new FormData(e.currentTarget).get("aposta");
          const n = Number(v);
          if (v !== null && v !== "" && Number.isFinite(n)) {
            setAposta(Math.max(0, Math.min(100, n)));
            setRonda((r) => r + 1);
          }
        }}
      >
        <div className="min-w-0 flex-1 basis-64">
          <p className="num text-[0.62rem] uppercase tracking-[0.16em] text-accent">
            {m.guess.kicker}
          </p>
          <p className="mt-1 font-display text-xl leading-snug tracking-wide text-ink md:text-2xl">
            {m.guess.pergunta}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <label className="block w-24">
            <span className="num text-[0.6rem] uppercase tracking-[0.14em] text-muted">
              {m.guess.inputLabel}
            </span>
            <input
              name="aposta"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step="any"
              required
              className="field num mt-1 text-lg"
              placeholder="—"
            />
          </label>
          <button type="submit" className="btn btn-primary">
            {m.guess.botao}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {aposta !== null && (
          <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-dashed border-line2 pt-4">
            <span className="num text-sm text-muted">
              {t(m.guess.disseste, { aposta: String(Math.round(aposta)) })} · {veredicto}
            </span>
            <span className="num text-sm uppercase tracking-[0.14em] text-muted">
              {m.guess.realidade}
            </span>
            <Odometer
              valor={real}
              casas={1}
              sufixo=" c"
              className="num text-5xl text-keep md:text-6xl"
            />
            <span className="text-sm leading-relaxed text-ink2">
              {t(m.guess.estadoFica, { valor: `${Math.round(estado)} ${m.guess.centimos}` })}
            </span>
          </div>
        )}
      </div>

      {/* a escada — remount rejoga a animação das barras a cada aposta */}
      <div key={ronda}>{children}</div>
    </div>
  );
}
