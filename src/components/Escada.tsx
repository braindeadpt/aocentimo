"use client";

import { useEffect, useRef, useState } from "react";
import { Fluxo } from "@/components/Fluxo";
import { simularSalario } from "@/lib/engines/irs";
import { TSU_ENTIDADE, TSU_TRABALHADOR } from "@/lib/engines/seg-social";
import { fmtEUR0, fmtPct } from "@/lib/format";
import { m, t } from "@/lib/messages";

/**
 * Scrollytelling da escada do euro: o diagrama fica sticky enquanto cada
 * degrau é narrado. O passo activo (IntersectionObserver, centro do ecrã)
 * passa a `destaque` do Fluxo e esbate os outros. Sem JS tudo se lê na
 * mesma — o diagrama fica no lugar e os passos em lista.
 */
export function Escada() {
  const med = simularSalario([1500], 0, 2026);
  const mensal = (v: number) => v / 14;
  const custo = mensal(med.custoEmpresaAnual);
  const tsu = mensal(med.brutoAnualTotal * TSU_ENTIDADE);
  const irs = mensal(med.irsAnual);
  const ss = mensal(med.ssAnual);
  const liquido = mensal(med.liquidoAnual);
  const estado = tsu + irs + ss;

  const passos = [
    t(m.escada.p0, { valor: fmtEUR0(custo) }),
    t(m.escada.p1, { valor: fmtEUR0(tsu), taxa: fmtPct(TSU_ENTIDADE, 2) }),
    t(m.escada.p2, { valor: fmtEUR0(custo - tsu) }),
    t(m.escada.p3, { valor: `−${fmtEUR0(irs)}` }),
    t(m.escada.p4, { valor: `−${fmtEUR0(ss)}`, taxa: fmtPct(TSU_TRABALHADOR, 0) }),
    t(m.escada.p5, {
      valor: fmtEUR0(liquido),
      custo: fmtEUR0(custo),
      estado: fmtEUR0(estado),
    }),
  ];

  const [ativo, setAtivo] = useState<number | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            setAtivo(Number((e.target as HTMLElement).dataset.step));
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px" }
    );
    for (const el of refs.current) if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="mt-8 border-t border-dashed border-line2 pt-6 lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="self-start lg:sticky lg:top-28 lg:col-span-8">
        <Fluxo destaque={ativo} />
      </div>
      <div className="lg:col-span-4">
        <p className="kicker-xs">
          {m.escada.titulo}
        </p>
        {passos.map((p, i) => (
          <div
            key={i}
            data-step={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="flex items-center py-10 lg:min-h-[52vh] lg:py-0"
          >
            <p
              className={`border-l-2 pl-5 font-display text-xl leading-snug tracking-wide transition-colors duration-300 md:text-2xl ${
                ativo === i
                  ? "border-accent text-ink"
                  : "border-line text-muted"
              }`}
            >
              {p}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
