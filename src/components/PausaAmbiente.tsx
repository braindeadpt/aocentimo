"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * PausaAmbiente — a guarda das animações ambiente (hoje: o marquee do
 * Ticker). Põe `.amb-off` no embrulho quando a faixa sai do ecrã
 * (IntersectionObserver) ou o separador fica escondido
 * (`visibilitychange`); o CSS pausa aí o `animation-play-state` de
 * qualquer animação que viva dentro. Ao voltar a ver-se, retoma.
 *
 * É o contrato M-ambiente do AGENTS/PRODUTO: animação ambiente só
 * corre onde se vê e com o separador activo — fora disso não gasta
 * um fotograma. Em prefers-reduced-motion nem chega a correr: o bloco
 * global já cortou a animação.
 *
 * Embrulho neutro (div block sem estilo) — não muda layout nem a11y.
 */
export function PausaAmbiente({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let foraDoEcra = false;
    const sync = () =>
      el.classList.toggle("amb-off", foraDoEcra || document.hidden);
    const io = new IntersectionObserver(([e]) => {
      foraDoEcra = !e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={ref} className="amb">
      {children}
    </div>
  );
}
