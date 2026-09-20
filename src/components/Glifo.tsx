"use client";

/**
 * Glifo — os sinais do observatório desenhados à mão (B-03): paths 12×12,
 * traço 1.5 em currentColor. Decorativos (aria-hidden) — o significado
 * mora sempre no texto ao lado.
 * Mudança de `tipo`: o traço redesenha-se via DrawSVG em --dur-curta.
 * prefers-reduced-motion: o glifo novo aparece já desenhado.
 */
import { useEffect, useRef } from "react";
import { dur, ease, gsap, reduzido } from "@/lib/motion/gsap";

export type TipoGlifo = "sobe" | "desce" | "euro" | "pct" | "fluxo";

/** cada tipo = lista de traços (d de path, ou círculo para o %) */
const TRACOS: Record<TipoGlifo, { d?: string; c?: [number, number, number] }[]> = {
  sobe: [
    { d: "M6 10.2V2.6" },
    { d: "M3.2 5.2L6 2.4L8.8 5.2" },
  ],
  desce: [
    { d: "M6 1.8V9.4" },
    { d: "M3.2 6.8L6 9.6L8.8 6.8" },
  ],
  euro: [
    { d: "M8.8 3.6A4.6 4.6 0 1 0 8.8 8.4" },
    { d: "M2.4 5.4H7.2" },
    { d: "M2.4 7H7.2" },
  ],
  pct: [
    { d: "M3 9L9 3" },
    { c: [3.4, 3.4, 1.1] },
    { c: [8.6, 8.6, 1.1] },
  ],
  fluxo: [
    { d: "M2.2 4.4h6.4M6.9 2.6l2.3 1.8-2.3 1.8" },
    { d: "M9.8 7.6H3.4M5.1 5.8L2.8 7.6l2.3 1.8" },
  ],
};

export function Glifo({
  tipo,
  className = "",
}: {
  tipo: TipoGlifo;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tipoAnt = useRef(tipo);

  /* redesenho na mudança de tipo — o traço desenha-se outra vez */
  useEffect(() => {
    if (tipoAnt.current === tipo) return;
    tipoAnt.current = tipo;
    const el = svgRef.current;
    if (!el || reduzido()) return;
    const tracos = el.querySelectorAll("path, circle");
    gsap.fromTo(
      tracos,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: dur("curta"), ease: ease("entra") }
    );
  }, [tipo]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRACOS[tipo].map((t, i) =>
        t.c ? (
          <circle key={i} cx={t.c[0]} cy={t.c[1]} r={t.c[2]} />
        ) : (
          <path key={i} d={t.d} />
        )
      )}
    </svg>
  );
}
