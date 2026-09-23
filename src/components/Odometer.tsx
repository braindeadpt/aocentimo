"use client";

import { useEffect, useRef } from "react";
import { FINO, fmtNum } from "@/lib/format";

/**
 * Odometer — cada dígito é uma roda de 0–9 que roda até ao valor.
 * A posição final vive em --d (transform base); a transição CSS anima
 * qualquer mudança — montagem incluída: com JS, a classe .od-zero põe as
 * rodas a 0, sai, e a transição desce-as até ao dígito. Sem JS e com
 * reduced-motion o valor final está sempre correcto no DOM — nunca zeros.
 * Quando `valor` muda, as rodas rodam do dígito anterior para o novo.
 * Separadores (espaços, vírgula) são estáticos; só dígitos rodam.
 * O `sufixo` é a unidade SEM espaço («€», «c») — a ponte é o fino
 * inseparável (FINO, U+202F), posto por aqui, nunca um espaço normal.
 */
export function Odometer({
  valor,
  casas = 0,
  prefixo = "",
  sufixo = "",
  dur = 1200,
  className,
}: {
  valor: number;
  casas?: number;
  prefixo?: string;
  /** a unidade sem espaço — «€», «c»; a ponte é o FINO (U+202F) */
  sufixo?: string;
  dur?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const corpo = `${prefixo}${fmtNum(valor, casas)}`;
  const texto = sufixo ? `${corpo}${FINO}${sufixo}` : corpo;

  // roll de entrada — só uma vez, só com motion, e só quando nasce
  // abaixo da primeira dobra (M-09: acima da dobra nada entra a animar
  // ao carregar); o .od-zero sai depois de o browser pintar o 0, e a
  // transição faz o resto
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        el.classList.add("od-zero");
        // força a composição do estado zero antes de soltar as rodas
        void el.offsetWidth;
        el.classList.remove("od-zero");
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  let rodas = 0;
  return (
    <>
      {/* texto real em sr-only com aria-live — anuncia o valor FINAL uma
          vez, nunca as rodas a meio; o visual é aria-hidden */}
      <span className="sr-only" aria-live="polite">
        {texto}
      </span>
      <span ref={ref} className={`odometer ${className ?? ""}`} aria-hidden="true">
      {corpo.split("").map((ch, i) => {
        if (/\d/.test(ch)) {
          const d = Number(ch);
          const atraso = `calc(${rodas++} * var(--stagger))`; // as rodas da direita chegam por último
          return (
            <span key={i} aria-hidden className="od-wheel">
              <span
                className="od-strip"
                style={
                  {
                    "--d": d,
                    "--delay": atraso,
                    "--dur": `${dur}ms`,
                  } as React.CSSProperties
                }
              >
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n} className="od-digit">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        }
        return (
          <span key={i} aria-hidden>
            {ch}
          </span>
        );
      })}
      {/* a unidade não roda — segue as rodas no fino inseparável */}
      {sufixo && (
        <span aria-hidden>
          {FINO}
          {sufixo}
        </span>
      )}
      </span>
    </>
  );
}
