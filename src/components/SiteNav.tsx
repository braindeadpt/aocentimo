"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, ViewTransition } from "react";
import { m } from "@/lib/messages";

const NAV = [
  ["salario", "/salario"],
  ["impostos", "/impostos"],
  ["inflacao", "/inflacao"],
  ["credito", "/credito"],
  ["casa", "/casa"],
  ["irs", "/irs"],
  ["trabalho", "/trabalho"],
  ["poupanca", "/poupanca"],
  ["precos", "/precos"],
  ["dados", "/dados"],
  ["aprender", "/aprender"],
] as const;

/**
 * Navegação principal — cliente porque precisa de usePathname para o
 * estado ativo (aria-current) e para gerir o menu mobile: fecha ao
 * navegar, com Escape e com clique fora.
 */
export function SiteNav() {
  const pathname = usePathname();
  const detalhes = useRef<HTMLDetailsElement>(null);

  // fecha o menu mobile ao mudar de rota
  useEffect(() => {
    detalhes.current?.removeAttribute("open");
  }, [pathname]);

  // Escape e clique fora fecham o menu mobile
  useEffect(() => {
    const el = detalhes.current;
    if (!el) return;
    const aoFechar = (e: KeyboardEvent) => {
      if (e.key === "Escape") el.removeAttribute("open");
    };
    const foraDoClique = (e: MouseEvent) => {
      if (el.hasAttribute("open") && !el.contains(e.target as Node)) {
        el.removeAttribute("open");
      }
    };
    document.addEventListener("keydown", aoFechar);
    document.addEventListener("click", foraDoClique);
    return () => {
      document.removeEventListener("keydown", aoFechar);
      document.removeEventListener("click", foraDoClique);
    };
  }, []);

  const ativo = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="Principal" className="hidden items-center gap-5 xl:flex">
        {NAV.map(([key, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={ativo(href) ? "page" : undefined}
            className={`num relative whitespace-nowrap text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
              ativo(href)
                ? "text-accent"
                : "text-ink2 hover:text-accent"
            }`}
          >
            {m.nav[key]}
            {ativo(href) && (
              <ViewTransition name="nav-ind" share="auto" default="none">
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-[2px] bg-accent"
                />
              </ViewTransition>
            )}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 xl:hidden">
        <details ref={detalhes} className="relative">
          <summary className="num cursor-pointer list-none text-[0.72rem] uppercase tracking-[0.12em] text-ink2">
            {m.nav.index}
          </summary>
          <nav aria-label="Principal" className="absolute right-0 top-7 z-50 flex w-44 flex-col border border-ink bg-surface">
            {NAV.map(([key, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={ativo(href) ? "page" : undefined}
                className={`border-b border-line px-4 py-2.5 text-sm last:border-0 hover:bg-paper ${
                  ativo(href) ? "text-accent" : "text-ink2"
                }`}
              >
                {m.nav[key]}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </>
  );
}
