import type { ReactNode } from "react";
import { fmtData } from "@/lib/format";
import { m } from "@/lib/messages";

interface SourceProps {
  /** Nome da fonte: "Eurostat", "IGCP", "Lei n.º 73-A/2025". */
  nome: string;
  /** Link para a fonte (API, DR, ficha técnica). */
  url?: string;
  /** Vigência declarada — regras fiscais: "2026". */
  vigencia?: string;
  /** Fim da série — dados: "2025-12" → "série até dez 2025". */
  serieAte?: string;
  /** Data de recolha ISO — "recolhido 16 set 2026". */
  recolhidoEm?: string;
  /** Nota livre adicional ("divergência entre fontes", …). */
  nota?: string;
}

/**
 * Selo de evidência — aparece sob cada número do site.
 * O quadrado torrado é o único uso decorativo permitido ao amarelo:
 * marca sempre «isto tem fonte» (regra §3 do plano).
 */
export function Source({ nome, url, vigencia, serieAte, recolhidoEm, nota }: SourceProps) {
  const partes: ReactNode[] = [];
  if (vigencia) partes.push(`vigente ${vigencia}`);
  if (serieAte) partes.push(`série até ${fmtData(serieAte)}`);
  if (recolhidoEm) partes.push(`recolhido ${fmtData(recolhidoEm.slice(0, 10))}`);
  if (nota) partes.push(nota);

  return (
    <p className="footnote">
      <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
      {m.common.fonte}:{" "}
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
