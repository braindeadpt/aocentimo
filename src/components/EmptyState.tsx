import { EstadoVazio } from "@/components/EstadoVazio";

/**
 * EmptyState — a falha onde um gráfico devia estar. Delega no
 * EstadoVazio partilhado (1B-05): a falha tem desenho, orbe e
 * frase honesta — nunca um número inventado. API mínima para os
 * pontos internos (LineChart) que só sabem o nome da série.
 */
export function EmptyState({
  titulo = "Dados indisponíveis",
  detalhe,
}: {
  titulo?: string;
  detalhe?: string;
}) {
  return (
    <EstadoVazio
      titulo={titulo}
      falha={
        detalhe ?? "a fonte ainda não foi recolhida ou falhou a atualização"
      }
      compacto
    />
  );
}
