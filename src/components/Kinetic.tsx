"use client";

import { useEffect, useRef } from "react";

/**
 * Kinetic — divide texto em palavras que sobem de trás de uma máscara.
 * REGRA M-09: nada acima da dobra entra com fade ao carregar. A animação
 * é armada por JS apenas quando o elemento COMEÇA abaixo da primeira
 * dobra — então sobe ao entrar no viewport. Se já está visível ao
 * carregar, nasce no estado final e nunca anima. Sem JS ou com
 * reduced-motion: texto sempre visível.
 */
export function Kinetic({
  texto,
  desde = 0,
  className,
}: {
  texto: string;
  desde?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    // a regra: só anima o que nasce fora da primeira dobra
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("kin-on");
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const palavras = texto.split(" ");
  return (
    <span ref={ref} className={className}>
      {palavras.map((palavra, i) => (
        <span key={i}>
          <span className="kin-line">
            <span
              className="kin-word"
              style={{ "--i": desde + i } as React.CSSProperties}
            >
              {palavra}
            </span>
          </span>
          {i < palavras.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
