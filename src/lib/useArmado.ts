"use client";

import { useCallback, useRef, useState } from "react";

/**
 * useArmado — o gate de dobra dos artefactos animados (regra M-09).
 *
 * A classe animada só se aplica quando a animação é legítima:
 *  - nasceu visível (acima da dobra) → o run inicial NUNCA anima: o
 *    elemento nasce "impresso", no estado final. Mudanças de valor
 *    (a runKey muda e os nós remontam) animam a partir daí;
 *  - nasceu abaixo da dobra → ao entrar no viewport `revelou` arma e
 *    faz re-render: a primeira "impressão" acontece como revelação.
 *
 * Uso: `const { ref, arm } = useArmado<HTMLDivElement>(runKey)` onde
 * `runKey` é a mesma string usada como `key` do grupo que remonta nas
 * mudanças. `arm("talao-linha")` devolve a classe só quando a animação
 * é legítima — sem ela o elemento fica no estado final (que é também o
 * estado SSR e o reduced-motion).
 *
 * Implementação sem refs no render: `ref` é callback-ref (decide no
 * attach, antes do paint) e `arm` lê apenas state — `mountRun` captura
 * a runKey do primeiro render via inicialização lazy.
 */
export function useArmado<T extends Element>(run: string) {
  const [mountRun] = useState(run);
  const [revelou, setRevelou] = useState(false);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((el: T | null) => {
    ioRef.current?.disconnect();
    ioRef.current = null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRevelou(true);
          io.disconnect();
          ioRef.current = null;
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    ioRef.current = io;
  }, []);

  const arm = (cls: string) => (revelou || run !== mountRun ? cls : "");
  // armado: a mesma decisão em booleano — os motores GSAP (B-01) precisam
  // do predicado, não da classe
  return { ref, arm, armado: revelou || run !== mountRun };
}
