// Wordmark e marca do AO CÊNTIMO.
// Conceito «o cêntimo»: o sinal ¢ é o C cortado por uma haste — a unidade
// em que contamos cada euro que te chega. Verde = o que é teu.

interface LogoProps {
  variant?: "ink" | "paper";
  className?: string;
}

/**
 * Wordmark AO CÊNTIMO — texto real (Archivo expandido), o C é o sinal
 * de cêntimo em verde-keep. Nada de letras posicionadas à mão em SVG:
 * escala com a fonte e adapta-se ao tema pelos tokens.
 * O tamanho controla-se com classes de font-size no call site
 * (ex.: text-3xl), não com alturas fixas.
 */
export function Logo({ variant = "ink", className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="AO CÊNTIMO"
      className={`logo-word ${variant === "paper" ? "logo-word--paper" : ""} ${className ?? ""}`}
    >
      AO&nbsp;<span className="logo-cent">¢</span>ÊNTIMO
    </span>
  );
}

/** Marca reduzida — o ¢ desenhado (arco de C + haste verde), para favicon/app icon. */
export function LogoMark({ variant = "ink", className }: LogoProps) {
  const bg = variant === "ink" ? "var(--ink)" : "#F0E9DA";
  const fg = variant === "ink" ? "var(--paper)" : "#221F19";
  const keep = variant === "ink" ? "#63D6A4" : "#1F6B4D";
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="AO CÊNTIMO" className={className}>
      <rect width="64" height="64" rx="14" fill={bg} />
      {/* o C: arco aberto à direita */}
      <path
        d="M44.2 20.6 A16 16 0 1 0 44.2 43.4"
        fill="none"
        stroke={fg}
        strokeWidth="9"
      />
      {/* a haste do cêntimo — verde, o que é teu */}
      <rect x="29" y="10" width="6" height="44" fill={keep} />
    </svg>
  );
}
