"use client";

import { useState } from "react";
import { Odometer } from "@/components/Odometer";
import { m, t } from "@/lib/messages";

/**
 * Guess-first — antes da explosão do euro, o visitante aposta quantos
 * cêntimos de cada euro de custo da empresa lhe chegam. Ao revelar, o
 * odometer mostra a realidade; a decomposição completa é a secção
 * seguinte («O TEU EURO»). Números do motor fiscal, calculados no
 * servidor (page.tsx) — aqui só se compara com a aposta.
 */
export function Adivinha({ real }: { real: number }) {
  const estado = 100 - real;

  const [aposta, setAposta] = useState<number | null>(null);

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
          }
        }}
      >
        <div className="min-w-0 flex-1 basis-64">
          <p className="kicker-xs text-accent">
            {m.guess.kicker}
          </p>
          <p className="mt-1 font-display text-display-xs leading-snug tracking-wide text-ink md:text-display-sm">
            {m.guess.pergunta}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <label className="block w-24">
            <span className="kicker-xs">
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
              className="field num mt-1 text-grande"
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
            <span className="num text-corpo-sm text-muted">
              {t(m.guess.disseste, { aposta: String(Math.round(aposta)) })} · {veredicto}
            </span>
            <span className="kicker">
              {m.guess.realidade}
            </span>
            <Odometer
              valor={real}
              casas={1}
              sufixo=" c"
              className="num text-display-xl text-keep md:text-display-2xl"
            />
            <span className="text-corpo-sm leading-relaxed text-ink2">
              {t(m.guess.estadoFica, { valor: `${Math.round(estado)} ${m.guess.centimos}` })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
