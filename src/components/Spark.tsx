"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Spark — a micro-série dentro de uma célula de instrumento.
 * Linha fina, sem eixos; o último ponto é um quadrado torrado — o
 * marcador de evidência do sistema (a fonte/data vive na célula ao lado).
 * Desenha-se UMA vez, à entrada no viewport (stroke-dashoffset via
 * IntersectionObserver). Sem JS ou com reduced-motion: já vem desenhada —
 * o estado final é o defeito, a animação é um extra que o JS arma.
 */
export function Spark({
  pts,
  className = "",
  atraso = 0,
}: {
  /** pontos {t, v} — usa-se a cauda (últimos 24) */
  pts: { t: string; v: number }[];
  className?: string;
  /** índice de escalonamento entre células — multiplica --stagger */
  atraso?: number;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const arm = () => {
      const line = el.querySelector(".spark-line") as SVGPolylineElement | null;
      if (!line) return;
      const len = line.getTotalLength();
      el.style.setProperty("--spark-len", `${len}`);
      el.classList.add("spark-armed");
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    arm();
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cauda = pts.slice(-24);
  if (cauda.length < 2) return null;
  const vs = cauda.map((p) => p.v);
  const mn = Math.min(...vs);
  const mx = Math.max(...vs);
  const span = mx - mn || 1;
  const W = 100;
  const H = 30;
  const P = 3;
  const x = (i: number) => P + (i / (cauda.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - mn) / span) * (H - 2 * P);
  const ultimo = cauda[cauda.length - 1];

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`spark block h-9 w-full ${on ? "spark-on" : ""} ${className}`}
      style={{ "--spark-delay": `${atraso}` } as React.CSSProperties}
    >
      {/* área sob a linha — massa que torna a forma legível a esta escala */}
      <polygon
        className="spark-area"
        fill="var(--ink2)"
        points={`${x(0).toFixed(1)},${(H - P).toFixed(1)} ${cauda
          .map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`)
          .join(" ")} ${x(cauda.length - 1).toFixed(1)},${(H - P).toFixed(1)}`}
      />
      <polyline
        className="spark-line"
        fill="none"
        stroke="var(--ink2)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        points={cauda.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")}
      />
      {/* último ponto — marcador de evidência em torrado */}
      <rect
        x={x(cauda.length - 1) - 2}
        y={y(ultimo.v) - 2}
        width={4}
        height={4}
        fill="var(--color-mark)"
      />
    </svg>
  );
}
