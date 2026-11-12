import type { ReactNode } from "react";
import { fmtData } from "@/lib/format";

export interface SourceBaseProps {
  /** Rótulo da fonte — por omissão "Fonte" (passado por prop para não importar messages no cliente). */
  rotuloFonte?: string;
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
}

/**
 * Selo de evidência para client components — sem importação de messages/pt.json.
 */
export function SourceBase({
  rotuloFonte = "Fonte",
  nome,
  url,
  vigencia,
  serieAte,
  recolhidoEm,
  nota,
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
          className="underline decoration-line2 underline-offset-2 hover:text-ink hover:decoration-mark"
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
