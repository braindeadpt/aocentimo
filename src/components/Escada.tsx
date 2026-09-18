"use client";

import { useEffect, useRef, useState } from "react";
import { FitaTalao, type MedidasEuro } from "@/components/FitaTalao";
import { fmtEUR0, fmtPct } from "@/lib/format";
import { m, t } from "@/lib/messages";

/**
 * Scrollytelling da fita do salário: a fita fica sticky enquanto cada
 * corte é narrado. O passo activo (IntersectionObserver, centro do ecrã)
 * passa a `destaque` da FitaTalao e recua os outros. Sem JS tudo se lê
 * na mesma — a fita fica no lugar e os passos em lista. Com
 * prefers-reduced-motion o observer nem liga: recuar troços ao rolar é
 * uma mudança de estado desencadeada por scroll — o estado final é a
 * fita inteira a opacidade plena e todos os passos legíveis.
 */
export function Escada({ medidas }: { medidas: MedidasEuro }) {
  const { custo, tsu, irs, ss, liquido, estado, taxaTsu, taxaSs } = medidas;

  const passos = [
    t(m.escada.p0, { valor: fmtEUR0(custo) }),
    t(m.escada.p1, { valor: fmtEUR0(tsu), taxa: fmtPct(taxaTsu, 2) }),
    t(m.escada.p2, { valor: fmtEUR0(custo - tsu) }),
    t(m.escada.p3, { valor: `−${fmtEUR0(irs)}` }),
    t(m.escada.p4, { valor: `−${fmtEUR0(ss)}`, taxa: fmtPct(taxaSs, 0) }),
    t(m.escada.p5, {
      valor: fmtEUR0(liquido),
      custo: fmtEUR0(custo),
      estado: fmtEUR0(estado),
    }),
  ];

  const [ativo, setAtivo] = useState<number | null>(null);
  const [reduz, setReduz] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const atual = () => setReduz(mq.matches);
    atual();
    mq.addEventListener("change", atual);
    return () => mq.removeEventListener("change", atual);
  }, []);

  useEffect(() => {
    if (reduz) return; // estado final — sem mudanças de estado ao rolar
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
  }, [reduz]);

  return (
    <div className="mt-8 border-t border-dashed border-line2 pt-6 lg:grid lg:grid-cols-12 lg:gap-8">
      {/* blueprint = a textura da zona de medição — só atrás do diagrama,
          nunca atrás do texto da aposta (a malha estragava o mono de 12px) */}
      <div className="blueprint self-start px-3 py-6 lg:sticky lg:top-24 lg:col-span-8">
        <FitaTalao destaque={ativo} medidas={medidas} />
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
            className="flex items-center py-10 lg:min-h-[34vh] lg:py-0"
          >
            <p
              className={`border-l-2 pl-5 font-display text-xl leading-snug tracking-wide transition-colors duration-[var(--dur-curta)] md:text-2xl ${
                reduz
                  ? "border-line text-ink"
                  : ativo === i
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
