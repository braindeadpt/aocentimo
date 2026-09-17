"use client";

import { useEffect, useRef } from "react";

/**
 * Contador animado — conta de 0 até `valor` uma vez, ao montar.
 * Escreve directamente no DOM via rAF (sem re-renders); o SSR e no-JS
 * mostram sempre o valor final, por isso o HTML nunca contém um número
 * errado. Com prefers-reduced-motion o valor final fica como está.
 * Formatação pt-PT: vírgula decimal.
 */
export function CountUp({
  valor,
  casas = 0,
  sufixo = "",
  prefixo = "",
  dur = 1400,
  className,
}: {
  valor: number;
  casas?: number;
  sufixo?: string;
  prefixo?: string;
  dur?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const fmt = (v: number) =>
    `${prefixo}${new Intl.NumberFormat("pt-PT", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(v)}${sufixo}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const inicio = performance.now();
    const tick = (agora: number) => {
      const p = Math.min((agora - inicio) / dur, 1);
      // ease-out quártico — arranca rápido e pousa
      el.textContent = fmt(valor * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, dur, casas, sufixo, prefixo]);

  return (
    <span ref={ref} className={className}>
      {fmt(valor)}
    </span>
  );
}
