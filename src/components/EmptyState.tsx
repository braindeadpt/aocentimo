/**
 * Estado de falha de dados — a regra nº1 feita componente.
 * Quando uma fonte falha ou ainda não foi recolhida, mostramos a falha
 * com contexto — nunca um número inventado, nunca um espaço em branco.
 */
export function EmptyState({
  titulo = "Dados indisponíveis",
  detalhe = "A fonte ainda não foi recolhida ou falhou a atualização. Não mostramos valores inventados.",
  className = "",
}: {
  titulo?: string;
  detalhe?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex min-h-24 flex-col items-center justify-center gap-1 border border-dashed border-line2 px-4 py-6 text-center ${className}`}
    >
      <p className="kicker text-warn">
        {titulo}
      </p>
      <p className="footnote max-w-sm">{detalhe}</p>
    </div>
  );
}
