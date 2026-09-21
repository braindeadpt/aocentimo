"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, ViewTransition } from "react";
import { m } from "@/lib/messages";

/* três grupos temáticos (D-04): Dinheiro = o teu bolso, Preços = o
   que pagas, País = o observatório; Aprender fica fora, à direita.
   Em desktop cada rótulo de grupo é um <details> — 14 ligações não
   cabem numa linha de 1152 px sem transbordar. */
const GRUPOS = [
  {
    kicker: "grupoDinheiro",
    links: [
      ["salario", "/salario"],
      ["irs", "/irs"],
      ["impostos", "/impostos"],
      ["poupanca", "/poupanca"],
      ["credito", "/credito"],
      ["casa", "/casa"],
    ],
  },
  {
    kicker: "grupoPrecos",
    links: [
      ["inflacao", "/inflacao"],
      ["precos", "/precos"],
      ["habitacao", "/habitacao"],
    ],
  },
  {
    kicker: "grupoPais",
    links: [
      ["trabalho", "/trabalho"],
      ["emprego", "/emprego"],
      ["economia", "/economia"],
      ["dados", "/dados"],
    ],
  },
] as const;

const APRENDER = ["aprender", "/aprender"] as const;

/**
 * Navegação principal — cliente porque precisa de usePathname para o
 * estado ativo (aria-current) e para gerir os menus <details>: fecham
 * ao navegar, com Escape e com clique fora (desktop e mobile).
 */
export function SiteNav() {
  const pathname = usePathname();
  const raiz = useRef<HTMLDivElement>(null);

  // fecha os menus ao mudar de rota
  useEffect(() => {
    raiz.current
      ?.querySelectorAll("details[open]")
      .forEach((d) => d.removeAttribute("open"));
  }, [pathname]);

  // Escape e clique fora fecham os menus abertos
  useEffect(() => {
    const fecharTodos = () =>
      raiz.current
        ?.querySelectorAll("details[open]")
        .forEach((d) => d.removeAttribute("open"));
    const aoFechar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharTodos();
    };
    const foraDoClique = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) fecharTodos();
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

  const linkCls = (href: string) =>
    `kicker relative whitespace-nowrap transition-colors ${
      ativo(href) ? "text-accent" : "text-ink2 hover:text-accent"
    }`;

  return (
    <div ref={raiz} className="contents">
      {/* desktop ≥ xl — cada grupo é um <details> com o rótulo kicker */}
      <nav aria-label="Principal" className="hidden items-center gap-6 xl:flex">
        {GRUPOS.map((g) => {
          const temAtivo = g.links.some(([, href]) => ativo(href));
          return (
            <details
              key={g.kicker}
              className="group relative"
              onToggle={(e) => {
                // um menu aberto de cada vez
                if ((e.target as HTMLDetailsElement).open) {
                  raiz.current
                    ?.querySelectorAll("nav[aria-label='Principal'] details[open]")
                    .forEach((d) => {
                      if (d !== e.target) d.removeAttribute("open");
                    });
                }
              }}
            >
              <summary
                className={`kicker cursor-pointer list-none whitespace-nowrap transition-colors [&::-webkit-details-marker]:hidden ${
                  temAtivo ? "text-accent" : "text-ink2 hover:text-accent"
                }`}
              >
                {m.nav[g.kicker]}
                <span
                  aria-hidden
                  className="ml-1 inline-block transition-transform duration-150 group-open:rotate-180"
                >
                  ⌄
                </span>
              </summary>
              <div className="absolute right-0 top-7 z-50 flex w-44 flex-col border border-ink bg-overlay shadow-overlay">
                {g.links.map(([key, href]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={ativo(href) ? "page" : undefined}
                    className={`border-b border-line px-4 py-2.5 text-sm last:border-0 hover:bg-floor ${
                      ativo(href) ? "text-accent" : "text-ink2"
                    }`}
                  >
                    {m.nav[key]}
                  </Link>
                ))}
              </div>
            </details>
          );
        })}
        <Link
          href={APRENDER[1]}
          aria-current={ativo(APRENDER[1]) ? "page" : undefined}
          className={linkCls(APRENDER[1])}
        >
          {m.nav[APRENDER[0]]}
          {ativo(APRENDER[1]) && (
            <ViewTransition name="nav-ind" share="auto" default="none">
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-[2px] bg-accent"
              />
            </ViewTransition>
          )}
        </Link>
      </nav>

      {/* mobile — um <details> que lista os grupos */}
      <div className="flex items-center gap-3 xl:hidden">
        <details className="relative">
          <summary className="kicker cursor-pointer list-none text-ink2 [&::-webkit-details-marker]:hidden">
            {m.nav.index}
          </summary>
          <nav
            aria-label="Principal"
            className="absolute right-0 top-7 z-50 flex w-48 flex-col border border-ink bg-overlay shadow-overlay"
          >
            {GRUPOS.map((g) => (
              <div
                key={g.kicker}
                className="border-b border-line last:border-0"
              >
                <p className="kicker-xs px-4 pt-3 pb-1 text-ink2">
                  {m.nav[g.kicker]}
                </p>
                {g.links.map(([key, href]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={ativo(href) ? "page" : undefined}
                    className={`block px-4 py-2 text-sm hover:bg-floor ${
                      ativo(href) ? "text-accent" : "text-ink2"
                    }`}
                  >
                    {m.nav[key]}
                  </Link>
                ))}
              </div>
            ))}
            <Link
              href={APRENDER[1]}
              aria-current={ativo(APRENDER[1]) ? "page" : undefined}
              className={`border-t border-line px-4 py-2.5 text-sm hover:bg-floor ${
                ativo(APRENDER[1]) ? "text-accent" : "text-ink2"
              }`}
            >
              {m.nav[APRENDER[0]]}
            </Link>
          </nav>
        </details>
      </div>
    </div>
  );
}
