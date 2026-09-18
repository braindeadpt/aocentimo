"use client";

import type { ReactNode } from "react";

/** Glossário inline — o termo fica com sublinhado tracejado; ao passar ou
 *  focar mostra a definição, e o clique abre a página do termo.
 *  Sem JavaScript degrada para ligação simples (o cartão é CSS puro);
 *  Esc fecha-o sem mover o foco. Sem transições — reduced-motion fica
 *  garantido por omissão.
 *  Vive em /aprender enquanto o padrão aguarda aprovação do dono; quando
 *  se espalhar pelos módulos deve ir para src/components/. */
export function TermoRef({
  slug,
  termo,
  definicao,
  children,
}: {
  slug: string;
  termo: string;
  definicao: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`/aprender/${slug}`}
      className="group/termo relative underline decoration-dashed decoration-line2 underline-offset-4 hover:decoration-mark focus-visible:decoration-mark"
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.blur();
      }}
    >
      {children}
      <span
        aria-hidden="true"
        className="invisible absolute left-0 top-full z-40 mt-2 block w-72 max-w-[80vw] border border-line bg-overlay px-4 py-3 text-left font-sans text-sm font-normal normal-case not-italic tracking-normal text-ink2 shadow-overlay group-hover/termo:visible group-focus-visible/termo:visible"
      >
        <span className="kicker-xs block">{termo}</span>
        <span className="mt-1 block leading-relaxed">{definicao}</span>
      </span>
    </a>
  );
}
