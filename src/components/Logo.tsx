"use client";

import { useId } from "react";

// O U desenhado: recipiente de 68×76 — hastes de 18, fundo redondo.
const U_PATH = "M0 0h18v42a16 16 0 0 0 32 0V0h18v42a34 34 0 0 1-68 0Z";
// nível ~62%: o que fica do custo do trabalho num salário mediano
const U_NIVEL_Y = 29;

interface LogoProps {
  variant?: "ink" | "paper";
  className?: string;
}

/**
 * Wordmark BRUTO — conceito C1 «O Nível».
 * O U é um recipiente cheio a ~62%: o que fica do custo total do
 * trabalho (bruto + TSU da empresa) num salário médio. Fonte: motor
 * próprio, regras 2026 — ver docs/PLANO-REDESIGN-BRUTO.md §3.
 * As cores vêm dos tokens do tema — o logo adapta-se a claro/escuro.
 * Cliente só por causa do useId: o clipPath precisa de um id único por
 * instância (o logo aparece no header, no footer e em /estilo).
 */
export function Logo({ variant = "ink", className }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const ink = variant === "ink" ? "var(--ink)" : "#F0E9DA";
  const keep = variant === "ink" ? "var(--keep)" : "#8FBCA0";
  return (
    <svg viewBox="0 0 436 110" role="img" aria-label="BRUTO" className={className}>
      <defs>
        <clipPath id={`logoU-${uid}`}>
          <path d={U_PATH} />
        </clipPath>
      </defs>
      <g
        fill={ink}
        fontFamily="var(--font-archivo), 'Arial Black', sans-serif"
        fontWeight={800}
        fontSize={96}
        style={{ fontVariationSettings: "'wdth' 125" }}
      >
        <text x="4" y="102">B</text>
        <text x="100" y="102">R</text>
        <text x="272" y="102">T</text>
        <text x="350" y="102">O</text>
      </g>
      {/* U recipiente — cap-height 70, alinhado à baseline das letras */}
      <g transform="translate(190 32) scale(0.9211)">
        <path d={U_PATH} fill={ink} />
        <g clipPath={`url(#logoU-${uid})`}>
          <rect x="0" y={U_NIVEL_Y} width="68" height="47" fill={keep} />
        </g>
      </g>
    </svg>
  );
}

/** Marca reduzida — o U recipiente sozinho, para favicon/app icon. */
export function LogoMark({ variant = "ink", className }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const bg = variant === "ink" ? "var(--ink)" : "#F0E9DA";
  const fg = variant === "ink" ? "var(--paper)" : "#221F19";
  const keep = variant === "ink" ? "#8FBCA0" : "#2F5D46";
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="BRUTO" className={className}>
      <defs>
        <clipPath id={`markU-${uid}`}>
          <path d={U_PATH} />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="14" fill={bg} />
      <g transform="translate(15.5 9.5) scale(0.592)">
        <path d={U_PATH} fill={fg} />
        <g clipPath={`url(#markU-${uid})`}>
          <rect x="0" y={U_NIVEL_Y} width="68" height="47" fill={keep} />
        </g>
      </g>
    </svg>
  );
}
