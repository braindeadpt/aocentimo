"use client";

import { useState } from "react";
import { Chip } from "@/components/Chip";
import { NumHero } from "@/components/NumHero";
import { fmtEUR, fmtEUR0 } from "@/lib/format";

/** Demonstração ao vivo da gramática de motion: o número é a resposta
 *  do instrumento — quando o input muda, desliza do valor anterior para
 *  o novo (TweenNum), nunca salta nem reparte de zero. Com
 *  prefers-reduced-motion o valor final aparece de imediato. Os
 *  presets são os chips do sistema de controlos (1B-03). */
export function MotionDemo() {
  const [v, setV] = useState(920);
  return (
    <div className="border border-line bg-raised px-5 py-4 shadow-raised">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <NumHero valor={fmtEUR(v)} sufixo="/mês" animar={v} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="mudar o valor">
          {[920, 1500, 2600].map((n) => (
            <Chip key={n} ativo={v === n} onClick={() => setV(n)}>
              {fmtEUR0(n)}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
