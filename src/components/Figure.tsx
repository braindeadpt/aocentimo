import type { ReactNode } from "react";

/** Figura numerada, à maneira de publicação de referência. */
export function Figure({
  n,
  title,
  source,
  children,
}: {
  n: number;
  title: string;
  source?: string;
  children: ReactNode;
}) {
  return (
    <figure className="my-8">
      <figcaption className="flex items-baseline gap-3 border-t-2 border-ink pt-2 mb-4">
        <span className="num text-xs text-muted">Fig. {n}</span>
        <span className="font-display text-lg text-ink">{title}</span>
      </figcaption>
      {children}
      {source && <p className="footnote mt-3">Fonte: {source}</p>}
    </figure>
  );
}
