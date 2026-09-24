"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { m } from "@/lib/messages";

/**
 * Navegação principal — as quatro perguntas da V4 (S1-07), + Aprender:
 *
 *   O que ganhas (Salário · IRS · Trabalho)
 *   O que pagas (Impostos · Preços · Inflação)
 *   O banco     (Crédito · Casa · Poupança)
 *   O país      (Dados)
 *
 * Desktop — cada grupo é um menu que abre ao passar o rato ou focar
 * (:hover / :focus-within em CSS — navega sem JS); o JS só sincroniza
 * aria-expanded e o Escape (tira o foco → o focus-within cai).
 * aria-current fica na página activa; o indicador partilhado
 * (view-transition nav-ind) sobe para o botão do grupo.
 *
 * Mobile — o «Índice» abre uma folha inferior (bottom sheet) em
 * <details>: sem JS abre e navega na mesma; com JS ganha foco preso,
 * Escape, clique fora e fecho à mudança de rota.
 */

type Item = readonly [keyof typeof m.nav, string];

const GRUPOS: { id: string; rotulo: string; itens: readonly Item[] }[] = [
  {
    id: "ganhas",
    rotulo: m.nav.grupoGanhas,
    itens: [
      ["salario", "/salario"],
      ["irs", "/irs"],
      ["trabalho", "/trabalho"],
    ],
  },
  {
    id: "pagas",
    rotulo: m.nav.grupoPagas,
    itens: [
      ["impostos", "/impostos"],
      ["precos", "/precos"],
      ["inflacao", "/inflacao"],
    ],
  },
  {
    id: "banco",
    rotulo: m.nav.grupoBanco,
    itens: [
      ["credito", "/credito"],
      ["casa", "/casa"],
      ["poupanca", "/poupanca"],
    ],
  },
  {
    id: "pais",
    rotulo: m.nav.grupoPais,
    itens: [["dados", "/dados"]],
  },
];

const FOCAVEIS = "a[href], button:not([disabled])";

export function SiteNav() {
  const pathname = usePathname();
  const detalhes = useRef<HTMLDetailsElement>(null);
  const folha = useRef<HTMLElement>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  const ativo = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const grupoAtivo = (itens: readonly Item[]) =>
    itens.some(([, href]) => ativo(href));

  // fecha a folha ao mudar de rota
  useEffect(() => {
    detalhes.current?.removeAttribute("open");
  }, [pathname]);

  // folha inferior: Escape, clique fora, foco preso e tranca de scroll
  useEffect(() => {
    const el = detalhes.current;
    const nav = folha.current;
    if (!el || !nav) return;
    const sumario = el.querySelector("summary") as HTMLElement | null;

    const aoAlternar = () => {
      const aberta = el.hasAttribute("open");
      document.body.style.overflow = aberta ? "hidden" : "";
      if (aberta) nav.querySelector<HTMLElement>(FOCAVEIS)?.focus();
    };

    const aoTeclar = (e: KeyboardEvent) => {
      if (!el.hasAttribute("open")) return;
      if (e.key === "Escape") {
        el.removeAttribute("open");
        sumario?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const foc = [...nav.querySelectorAll<HTMLElement>(FOCAVEIS)];
      if (!foc.length) return;
      const primeiro = foc[0];
      const ultimo = foc[foc.length - 1];
      const activo = document.activeElement;
      if (!e.shiftKey && (activo === sumario || !nav.contains(activo))) {
        // foco no sumário ou perdido fora da folha → volta ao primeiro
        primeiro.focus();
        e.preventDefault();
      } else if (e.shiftKey && (activo === primeiro || !nav.contains(activo))) {
        ultimo.focus();
        e.preventDefault();
      } else if (!e.shiftKey && activo === ultimo) {
        primeiro.focus();
        e.preventDefault();
      }
    };

    const foraDoClique = (e: MouseEvent) => {
      if (!el.hasAttribute("open")) return;
      const alvo = e.target as Node;
      // dentro da folha ou no próprio sumário (o toggle nativo trata)
      if (nav.contains(alvo) || sumario?.contains(alvo)) return;
      el.removeAttribute("open");
    };

    el.addEventListener("toggle", aoAlternar);
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("click", foraDoClique);
    return () => {
      el.removeEventListener("toggle", aoAlternar);
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("click", foraDoClique);
      document.body.style.overflow = "";
    };
  }, []);

  const indicador = (
    <ViewTransition name="nav-ind" share="auto" default="none">
      <span
        aria-hidden
        className="absolute inset-x-0 -bottom-1 h-[2px] bg-mark"
      />
    </ViewTransition>
  );

  return (
    <>
      {/* desktop — grupos com menu ao passar/focar (CSS), JS só p/ aria-expanded */}
      <nav aria-label="Principal" className="hidden items-center gap-5 lg:flex">
        {GRUPOS.map((g) => (
          <div
            key={g.id}
            className="group relative"
            onPointerEnter={() => setAberto(g.id)}
            onPointerLeave={(e) => {
              if (!e.currentTarget.contains(document.activeElement))
                setAberto(null);
            }}
            onFocus={() => setAberto(g.id)}
            onBlur={(e) => {
              const el = e.currentTarget;
              if (
                !el.contains(e.relatedTarget as Node) &&
                !el.matches(":hover")
              )
                setAberto(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape")
                (document.activeElement as HTMLElement | null)?.blur();
            }}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={aberto === g.id}
              className={`kicker relative cursor-pointer whitespace-nowrap transition-colors ${
                grupoAtivo(g.itens)
                  ? "text-ink"
                  : "text-ink2 hover:text-ink"
              }`}
            >
              {g.rotulo}
              {grupoAtivo(g.itens) && indicador}
            </button>
            <div className="absolute left-0 top-full z-50 hidden pt-1.5 group-focus-within:block group-hover:block">
              <div className="flex min-w-44 flex-col border border-ink bg-overlay shadow-overlay">
                {g.itens.map(([key, href]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={ativo(href) ? "page" : undefined}
                    className={`border-b border-line px-4 py-2.5 text-corpo-sm last:border-0 hover:bg-floor ${
                      ativo(href)
                        ? "text-ink underline decoration-mark underline-offset-4"
                        : "text-ink2"
                    }`}
                  >
                    {m.nav[key]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
        <Link
          href="/aprender"
          aria-current={ativo("/aprender") ? "page" : undefined}
          className={`kicker relative whitespace-nowrap transition-colors ${
            ativo("/aprender") ? "text-ink" : "text-ink2 hover:text-ink"
          }`}
        >
          {m.nav.aprender}
          {ativo("/aprender") && indicador}
        </Link>
      </nav>

      {/* mobile — «Índice» abre a folha inferior */}
      <div className="flex items-center gap-3 lg:hidden">
        <details ref={detalhes}>
          <summary className="kicker cursor-pointer list-none text-ink2">
            {m.nav.index}
          </summary>
          <div aria-hidden className="fixed inset-0 z-40 bg-ink/25" />
          <nav
            ref={folha}
            aria-label="Principal"
            role="dialog"
            aria-modal="true"
            className="nav-sheet fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto border-t-2 border-ink bg-overlay shadow-overlay"
          >
            <div className="flex items-baseline justify-between px-5 pb-1 pt-4">
              <p className="kicker">{m.nav.index}</p>
              <button
                type="button"
                className="kicker-xs cursor-pointer text-ink2 underline decoration-line2 underline-offset-4 hover:text-ink hover:decoration-mark"
                onClick={() => detalhes.current?.removeAttribute("open")}
              >
                {m.nav.fechar}
              </button>
            </div>
            {GRUPOS.map((g) => (
              <div key={g.id} className="border-t border-line px-5 py-3">
                <p className="kicker-xs mb-1 text-muted">{g.rotulo}</p>
                <div className="flex flex-col">
                  {g.itens.map(([key, href]) => (
                    <Link
                      key={href}
                      href={href}
                      aria-current={ativo(href) ? "page" : undefined}
                      className={`py-2 text-corpo-sm ${
                        ativo(href)
                          ? "text-ink underline decoration-mark underline-offset-4"
                          : "text-ink2"
                      }`}
                    >
                      {m.nav[key]}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t-2 border-ink px-5 py-3">
              <Link
                href="/aprender"
                aria-current={ativo("/aprender") ? "page" : undefined}
                className={`block py-2 text-corpo ${
                  ativo("/aprender")
                    ? "text-ink underline decoration-mark underline-offset-4"
                    : "text-ink"
                }`}
              >
                {m.nav.aprender}
              </Link>
            </div>
          </nav>
        </details>
      </div>
    </>
  );
}
