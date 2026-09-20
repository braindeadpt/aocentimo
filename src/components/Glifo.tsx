"use client";

/**
 * Glifo — os sinais do observatório desenhados à mão (B-03): paths 12×12,
 * traço 1.5 em currentColor. Decorativos (aria-hidden) — o significado
 * mora sempre no texto ao lado.
 * Mudança de `tipo`: o traço redesenha-se em CSS (stroke-dashoffset sobre
 * pathLength=1, --dur-curta) — sem GSAP, o glifo aparece em todo o lado
 * e não pode arrastar o motor para o bundle inicial.
 * prefers-reduced-motion: o glifo novo aparece já desenhado.
 */
import { useLayoutEffect, useRef } from "react";
import { motionActiva } from "@/lib/motion/gsap";

export type TipoGlifo = "sobe" | "desce" | "euro" | "pct" | "fluxo";

/** cada tipo = lista de traços (d de path — os círculos do % são arcos
 *  para o pathLength=1 funcionar em todo o lado) */
const TRACOS: Record<TipoGlifo, string[]> = {
  sobe: ["M6 10.2V2.6", "M3.2 5.2L6 2.4L8.8 5.2"],
  desce: ["M6 1.8V9.4", "M3.2 6.8L6 9.6L8.8 6.8"],
  euro: ["M8.8 3.6A4.6 4.6 0 1 0 8.8 8.4", "M2.4 5.4H7.2", "M2.4 7H7.2"],
  pct: [
    "M3 9L9 3",
    "M4.5 3.4a1.1 1.1 0 1 1-2.2 0a1.1 1.1 0 1 1 2.2 0",
    "M9.7 8.6a1.1 1.1 0 1 1-2.2 0a1.1 1.1 0 1 1 2.2 0",
  ],
  fluxo: ["M2.2 4.4h6.4M6.9 2.6l2.3 1.8-2.3 1.8", "M9.8 7.6H3.4M5.1 5.8L2.8 7.6l2.3 1.8"],
};

export function Glifo({
  tipo,
  className = "",
}: {
  tipo: TipoGlifo;
  className?: string;
}) {
  /* o <g> remonta a cada tipo novo (key); a classe de redesenho entra
     em useLayoutEffect — antes do paint, sem flash — e nunca na
     montagem inicial nem com reduced-motion */
  const gRef = useRef<SVGGElement>(null);
  const primeira = useRef(true);
  useLayoutEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const g = gRef.current;
    if (!g || !motionActiva()) return;
    g.classList.add("glifo-desenha");
  }, [tipo]);

  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`glifo ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g key={tipo} ref={gRef}>
        {TRACOS[tipo].map((d, i) => (
          <path key={i} d={d} pathLength={1} />
        ))}
      </g>
    </svg>
  );
}
