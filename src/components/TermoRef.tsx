"use client";

import { useRef } from "react";
import type { ReactNode } from "react";

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
  const ancora = useRef<HTMLAnchorElement>(null);
  const cartao = useRef<HTMLSpanElement>(null);
  const ajusta = () => {
    const a = ancora.current;
    const el = cartao.current;
    if (!a || !el) return;
    el.style.left = "";
    el.style.right = "";
    // o cartão é display:none em repouso — getBoundingClientRect() dele
    // devolveria zeros; a posição calcula-se do rect da âncora com a
    // largura conhecida do cartão (w-72 = 18rem, teto max-w-[80vw])
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const largura = Math.min(18 * rem, document.documentElement.clientWidth * 0.8);
    if (a.getBoundingClientRect().left + largura > document.documentElement.clientWidth - 8) {
      el.style.left = "auto";
      el.style.right = "0";
    }
  };
  return (
    <a
      ref={ancora}
      href={`/aprender/${slug}`}
      className="group/termo relative underline decoration-dashed decoration-line2 underline-offset-4 hover:decoration-mark focus-visible:decoration-mark"
      onMouseEnter={ajusta}
      onFocus={ajusta}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.blur();
      }}
    >
      {children}
      <span
        ref={cartao}
        aria-hidden="true"
        className="absolute left-0 top-full z-40 mt-2 hidden w-72 max-w-[80vw] border border-line bg-overlay px-4 py-3 text-left font-sans text-corpo-sm font-normal normal-case not-italic tracking-normal text-ink2 shadow-overlay group-hover/termo:block group-focus-visible/termo:block"
      >
        <span className="kicker-xs block">{termo}</span>
        <span className="mt-1 block leading-relaxed">{definicao}</span>
      </span>
    </a>
  );
}
