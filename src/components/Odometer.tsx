"use client";

import { useEffect, useRef } from "react";

/**
 * Odometer — cada dígito é uma roda de 0–9 que roda até ao valor.
 * A posição final vive em --d (transform base); a transição CSS anima
 * qualquer mudança — montagem incluída: com JS, a classe .od-zero põe as
 * rodas a 0, sai, e a transição desce-as até ao dígito. Sem JS e com
 * reduced-motion o valor final está sempre correcto no DOM — nunca zeros.
 * Quando `valor` muda, as rodas rodam do dígito anterior para o novo.
 * Separadores (espaços, vírgula, €) são estáticos; só dígitos rodam.
 */
export function Odometer({
  valor,
  casas = 0,
  prefixo = "",
  sufixo = "",
  dur = 1400,
  className,
}: {
  valor: number;
  casas?: number;
  prefixo?: string;
  sufixo?: string;
  dur?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const texto = `${prefixo}${new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor)}${sufixo}`;

  // roll de entrada — só uma vez, só com motion; o .od-zero sai depois
  // de o browser pintar o 0, e a transição faz o resto
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("od-zero");
    // força a composição do estado zero antes de soltar as rodas
    void el.offsetWidth;
    el.classList.remove("od-zero");
  }, []);

  let rodas = 0;
  return (
    <>
      {/* (b) texto real em sr-only — dentro de aria-live um nome acessível
          via aria-label num <span> genérico não é exposto; o texto é */}
      <span className="sr-only">{texto}</span>
      <span ref={ref} className={`odometer ${className ?? ""}`} aria-hidden="true">
      {texto.split("").map((ch, i) => {
        if (/\d/.test(ch)) {
          const d = Number(ch);
          const atraso = rodas++ * 90; // as rodas da direita chegam por último
          return (
            <span key={i} aria-hidden className="od-wheel">
              <span
                className="od-strip"
                style={
                  {
                    "--d": d,
                    "--delay": `${atraso}ms`,
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
      </span>
    </>
  );
}
