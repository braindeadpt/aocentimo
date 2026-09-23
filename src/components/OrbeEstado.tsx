"use client";

import { useEffect, useRef } from "react";

/**
 * OrbeEstado — o selo de frescura da V4 (S1-08). Um objecto pequeno
 * (16–20 px por omissão) feito de pontos cuja FORMA diz o estado — a
 * lição do ThinkingOrbs: não é um quadrado colorido, é um desenho
 * próprio para o tamanho pequeno:
 *
 *   em-dia      → cheio e calmo — um disco completo de pontos
 *   no-limite   → cheio por dentro, anel oco na borda — em dia, mas a
 *                 próxima publicação decide
 *   a-recolher  → um anel de pontos em rotação (reservado: a ingestão
 *                 ainda não expõe este estado)
 *   atrasada    → esburacado — o disco a que falta o centro
 *   sem-sla     → só o anel oco — não há como dizer
 *
 * SVG + CSS (sem canvas a este tamanho). A rotação pára fora do ecrã
 * (IntersectionObserver) e o bloco global de reduced-motion corta-a —
 * o anel fica parado, que é leitura suficiente. O svg é aria-hidden:
 * o estado existe sempre também em texto ao lado (estadoRotulo no
 * Cartao, o rótulo nas células) — a forma nunca é o único canal.
 */

export type EstadoOrbe =
  | "em-dia"
  | "a-recolher"
  | "no-limite"
  | "atrasada"
  | "sem-sla";

const TAU = Math.PI * 2;

/** anel de n pontos à distância r do centro (viewBox 24×24, centro 12) */
function anel(n: number, r: number, offset = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * TAU;
    return {
      x: +(12 + r * Math.cos(a)).toFixed(2),
      y: +(12 + r * Math.sin(a)).toFixed(2),
    };
  });
}

const DISCO = [
  { x: 12, y: 12, r: 2.2 },
  ...anel(6, 5.4).map((p) => ({ ...p, r: 1.9 })),
  ...anel(12, 9.6, -Math.PI / 2 + Math.PI / 12).map((p) => ({
    ...p,
    r: 1.5,
  })),
];

function Pontos({ estado }: { estado: EstadoOrbe }) {
  switch (estado) {
    case "em-dia":
      return (
        <>
          {DISCO.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} />
          ))}
        </>
      );
    case "no-limite":
      return (
        <>
          {DISCO.slice(0, 7).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} />
          ))}
          {DISCO.slice(7).map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </>
      );
    case "atrasada":
      return (
        <>
          {DISCO.slice(1).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} />
          ))}
        </>
      );
    case "sem-sla":
      return (
        <>
          {DISCO.slice(7).map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </>
      );
    case "a-recolher":
      return (
        <g className="orbe-roda" style={{ transformOrigin: "12px 12px" }}>
          {anel(8, 7.8).map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              // um ponto-líder maior: a rotação lê-se, não se adivinha
              r={i === 0 ? 2.7 : 2.1}
            />
          ))}
        </g>
      );
  }
}

export function OrbeEstado({
  estado,
  tamanho = 18,
  className,
}: {
  estado: EstadoOrbe;
  /** px — o desenho é feito para 16–20; abaixo de 14 usa-se só em
      contextos densos (ticker, células) */
  tamanho?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  // a rotação de «a-recolher» pára fora do ecrã
  useEffect(() => {
    const el = ref.current;
    if (!el || estado !== "a-recolher") return;
    const io = new IntersectionObserver(([e]) => {
      el.classList.toggle("orbe-pausado", !e.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [estado]);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="currentColor"
      className={`orbe-estado orbe-${estado} ${className ?? ""}`}
    >
      <Pontos estado={estado} />
    </svg>
  );
}
