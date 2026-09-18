// Wordmark e marca do AO CÊNTIMO.
// Conceito «o cêntimo»: o sinal ¢ é o C cortado por uma haste — a unidade
// em que contamos cada euro que te chega. Verde = o que é teu.

interface LogoProps {
  className?: string;
}

/**
 * Wordmark AO CÊNTIMO — texto real (Archivo expandido). O C é o sinal
 * de cêntimo desenhado à mão: arco à altura de cap em tinta (igual às
 * letras — o glifo ¢ da fonte é minúsculo e desafinava) atravessado
 * pela haste verde, «o que é teu». Escala com a fonte via em.
 */
export function Logo({ className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="AO CÊNTIMO"
      className={`logo-word ${className ?? ""}`}
    >
      AO&nbsp;
      <svg viewBox="0 -6 30 34" aria-hidden className="logo-cent">
        <path
          d="M23.4 3.9 A11 11 0 1 0 23.4 18.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.8"
        />
        <rect x="12.9" y="-6" width="4.2" height="34" className="logo-cent-bar" />
      </svg>
      ÊNTIMO
    </span>
  );
}

/** Marca reduzida — o ¢ desenhado (arco de C + haste verde), para favicon/app icon. */
export function LogoMark({ className }: LogoProps) {
  const bg = "var(--ink)";
  const fg = "var(--floor)";
  const keep = "#63D6A4";
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
