import type { ReactNode } from "react";
import { m } from "@/lib/messages";

/** Figura numerada, à maneira de publicação de referência. */
export function Figure({
  n,
  title,
  source,
  children,
}: {
  n: number;
  title: string;
  /** Texto livre ou um <Source/> estruturado. */
  source?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="my-8">
      <figcaption className="flex items-baseline gap-3 border-t-2 border-ink pt-2 mb-4">
        <span className="num text-xs text-muted">Fig. {n}</span>
        <span className="font-display text-lg text-ink">{title}</span>
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
