/**
 * Kinetic — divide texto em palavras que sobem de trás de uma máscara.
 * CSS puro: a animação vai de translateY(110%) para o estado normal;
 * com reduced-motion a animação não corre e o texto fica visível.
 */
export function Kinetic({
  texto,
  desde = 0,
  className,
}: {
  texto: string;
  desde?: number;
  className?: string;
}) {
  const palavras = texto.split(" ");
  return (
    <span className={className}>
      {palavras.map((palavra, i) => (
        <span key={i}>
          <span className="kin-line">
            <span
              className="kin-word"
              style={{ "--i": desde + i } as React.CSSProperties}
            >
              {palavra}
            </span>
          </span>
          {i < palavras.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
