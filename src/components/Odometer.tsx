"use client";

/**
 * Odometer — cada dígito é uma roda de 0–9 que roda até ao valor.
 * CSS puro: a posição final vive em --d (transform base), a animação
 * parte de 0 até essa posição; com reduced-motion a animação não corre
 * e o transform base deixa o valor final já correto — nunca zeros.
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
  const texto = `${prefixo}${new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor)}${sufixo}`;

  let rodas = 0;
  return (
    <span className={`odometer ${className ?? ""}`} aria-label={texto}>
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
  );
}
