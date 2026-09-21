import type { ReactNode } from "react";
import { fmtData } from "@/lib/format";

export interface SourceBaseProps {
  /** Nome da fonte: "Eurostat", "IGCP", "Lei n.º 73-A/2025". */
  nome: string;
  /** Link para a fonte (API, DR, ficha técnica). */
  url?: string;
  /** Vigência declarada — regras fiscais: "2026" ou ISO "2026-01-01". */
  vigencia?: string;
  /** Fim da série — dados: "2025-12" → "série até dez 2025". */
  serieAte?: string;
  /** Data de recolha ISO — "recolhido 16 set 2026". */
  recolhidoEm?: string;
  /** Nota livre adicional ("divergência entre fontes", …). */
  nota?: string;
  /** Rótulo localizado («Fonte») — prop porque este componente é
   *  usado dentro de client components e não pode importar messages. */
  rotuloFonte: string;
}

/**
 * Selo de evidência — variante sem dependência de messages,
 * para usar dentro de client components (o rótulo vem por prop).
 * Em server components usa-se `<Source>`, que resolve o rótulo.
 */
export function SourceBase({
  nome,
  url,
  vigencia,
  serieAte,
  recolhidoEm,
  nota,
  rotuloFonte,
}: SourceBaseProps) {
  const partes: ReactNode[] = [];
  if (vigencia) partes.push(`vigente ${fmtData(vigencia)}`);
  if (serieAte) partes.push(`série até ${fmtData(serieAte)}`);
  if (recolhidoEm) partes.push(`recolhido ${fmtData(recolhidoEm.slice(0, 10))}`);
  if (nota) partes.push(nota);

  return (
    <p className="footnote wrap-break-word">
      <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
      {rotuloFonte}:{" "}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line2 underline-offset-2 hover:text-accent"
        >
          {nome}
        </a>
      ) : (
        nome
      )}
      {partes.length > 0 && ` · ${partes.join(" · ")}`}
    </p>
  );
}
