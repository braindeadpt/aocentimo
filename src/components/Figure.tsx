import type { ReactNode } from "react";
import { m } from "@/lib/messages";

/** Figura com título e fonte — a legenda identifica a peça; nada no
    texto remete para "Fig. N", logo a numeração saiu (M-20). */
export function Figure({
  title,
  source,
  children,
}: {
  title: string;
  /** Texto livre ou um <Source/> estruturado. */
  source?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="stack-fig">
      <figcaption className="flex items-baseline gap-3 border-t-2 border-ink pt-2 mb-4">
        <span className="font-display text-grande text-ink">{title}</span>
      </figcaption>
      {children}
      {source &&
        (typeof source === "string" ? (
          <p className="footnote mt-3 wrap-break-word">
            <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
            {m.common.fonte}: {source}
          </p>
        ) : (
          <div className="mt-3">{source}</div>
        ))}
    </figure>
  );
}
