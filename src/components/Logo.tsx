const U_PATH = "M0 0h18v50q0 16 18 16t18-16V0h18v52q0 32-36 32T0 52Z";

interface LogoProps {
  variant?: "ink" | "paper";
  className?: string;
}

/**
 * Wordmark BRUTO — conceito C1 «O Nível».
 * O U é um recipiente cheio a ~62%: o que fica do custo total do
 * trabalho (bruto + TSU da empresa) num salário médio. Fonte: motor
 * próprio, regras 2026 — ver docs/PLANO-REDESIGN-BRUTO.md §3.
 */
export function Logo({ variant = "ink", className }: LogoProps) {
  const ink = variant === "ink" ? "#221F19" : "#F0E9DA";
  const keep = variant === "ink" ? "#2F5D46" : "#8FBCA0";
  return (
    <svg viewBox="0 0 480 132" role="img" aria-label="BRUTO" className={className}>
      <defs>
        <clipPath id={`logoU-${variant}`}>
          <path d={U_PATH} />
        </clipPath>
      </defs>
      <g
        fill={ink}
        fontFamily="var(--font-archivo), 'Arial Black', sans-serif"
        fontWeight={800}
        fontSize={100}
        style={{ fontVariationSettings: "'wdth' 125" }}
      >
        <text x="54" y="100" textAnchor="middle" textLength="70" lengthAdjust="spacingAndGlyphs">B</text>
        <text x="142" y="100" textAnchor="middle" textLength="70" lengthAdjust="spacingAndGlyphs">R</text>
        <text x="318" y="100" textAnchor="middle" textLength="70" lengthAdjust="spacingAndGlyphs">T</text>
        <text x="406" y="100" textAnchor="middle" textLength="70" lengthAdjust="spacingAndGlyphs">O</text>
      </g>
      <g transform="translate(199.14 28) scale(0.857143)">
        <path d={U_PATH} fill={ink} />
        <g clipPath={`url(#logoU-${variant})`}>
          <rect x="0" y="31.9" width="72" height="52.1" fill={keep} />
        </g>
      </g>
    </svg>
  );
}

/** Marca reduzida — o U recipiente sozinho, para favicon/app icon. */
export function LogoMark({ variant = "ink", className }: LogoProps) {
  const bg = variant === "ink" ? "#221F19" : "#F0E9DA";
  const fg = variant === "ink" ? "#F0E9DA" : "#221F19";
  const keep = variant === "ink" ? "#8FBCA0" : "#2F5D46";
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="BRUTO" className={className}>
      <defs>
        <clipPath id={`markU-${variant}`}>
          <path d={U_PATH} />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="14" fill={bg} />
      <g transform="translate(14 10) scale(0.5238)">
        <path d={U_PATH} fill={fg} />
        <g clipPath={`url(#markU-${variant})`}>
          <rect x="0" y="31.9" width="72" height="52.1" fill={keep} />
        </g>
      </g>
    </svg>
  );
}
