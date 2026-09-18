"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que desliza — interpola do valor anterior para o novo via rAF,
 * escrevendo directamente no DOM (sem re-renders por frame). O SSR e o
 * primeiro paint mostram sempre o valor correcto: `texto` vem já
 * formatado do servidor e nunca volta a ser escrito pelo React — depois
 * da montagem, só este efeito escreve. Com prefers-reduced-motion o
 * valor final aparece de imediato, sem interpolação.
 */
export function TweenNum({
  valor,
  casas = 2,
  texto,
  dur = 550,
}: {
  /** valor actual — o alvo da interpolação */
  valor: number;
  /** casas decimais — tem de bater com a formatação de `texto` */
  casas?: number;
  /** o dígito já formatado no SSR — fica congelado como valor inicial */
  texto: string;
  dur?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef<number | null>(null);
  // congelado: o React não volta a escrever este nó — as actualizações
  // são todas da responsabilidade do efeito (tween ou escrita directa)
  const [inicial] = useState(texto);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-PT", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(v);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmt(valor);
      prev.current = valor;
      return;
    }
    if (prev.current === null) {
      prev.current = valor; // montagem: o DOM já tem o valor certo
      return;
    }
    const de = prev.current;
    prev.current = valor;
    if (de === valor) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(de + (valor - de) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return <span ref={ref}>{inicial}</span>;
}
