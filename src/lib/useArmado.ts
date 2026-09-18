"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useArmado — o gate de dobra dos artefactos animados (regra M-09).
 *
 * A classe animada só se aplica quando o elemento JÁ entrou no viewport
 * pela primeira vez:
 *  - nasceu visível (acima da dobra) → nasce "impresso": a flag fica
 *    armada em silêncio (sem re-render), e as MUDANÇAS de valor é que
 *    passam a animar — nada entra com animação ao carregar a página;
 *  - nasceu abaixo da dobra → ao entrar no viewport a flag arma e faz
 *    re-render: a primeira "impressão" acontece como revelação.
 *
 * Uso: `const { ref, arm } = useArmado<HTMLDivElement>();`
 * `arm("talao-linha")` devolve a classe só depois de armado — sem ela o
 * elemento fica no estado final (que é também o estado SSR e o
 * reduced-motion).
 */
export function useArmado<T extends Element>() {
  const ref = useRef<T>(null);
  const impresso = useRef(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      impresso.current = true;
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          impresso.current = true;
          io.disconnect();
          setTick((t) => t + 1);
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const arm = (cls: string) => (impresso.current ? cls : "");
  return { ref, arm };
}
