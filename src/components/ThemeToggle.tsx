"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { m } from "@/lib/messages";

/**
 * Alternador claro/escuro — apenas apresentação.
 * O clique é tratado por um listener delegado no script inline do layout
 * (vanilla JS, antes de qualquer hidratação): funciona mesmo numa página
 * com React morto. Aqui só lemos data-theme via useSyncExternalStore para
 * manter o rótulo e o aria-pressed sincronizados.
 *
 * M-16: a reconciliação do <html> pode repor o data-theme do SSR ("light")
 * sobre a escolha clara que o script inline já tinha posto. O layout
 * effect corre antes do paint pós-hidratação e repõe a escolha guardada —
 * sem frame errado, sem transição (os dois writes caem na mesma frame).
 */
export function ThemeToggle() {
  useLayoutEffect(() => {
    try {
      // o default é CLARO desde o veredicto do design sobre a P1 — o
      // mesmo valor do script inline do layout e do data-theme do JSX;
      // três sítios a dizer o mesmo, senão este effect reescreve o
      // atributo no load e as transições Tailwind do header disparam
      // (foi assim que o e2e «nada anima ao carregar» se pôs a falhar)
      const t = localStorage.getItem("aocentimo-theme") ?? "light";
      if (document.documentElement.dataset.theme !== t) {
        document.documentElement.dataset.theme = t;
      }
    } catch {
      /* localStorage indisponível — fica o tema do documento */
    }
  }, []);

  const tema = useSyncExternalStore(
    (onChange) => {
      const obs = new MutationObserver(onChange);
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      return () => obs.disconnect();
    },
    () =>
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    () => "light"
  );

  const escuro = tema === "dark";
  return (
    <button
      type="button"
      data-theme-toggle
      aria-label={escuro ? m.tema.mudarParaClaro : m.tema.mudarParaEscuro}
      title={escuro ? m.tema.mudarParaClaro : m.tema.mudarParaEscuro}
      aria-pressed={escuro}
      className="pil-tema"
    >
      {/* círculo: cheio no escuro, vazado no claro — o aspecto vem do
          data-theme em CSS (posto pelo script inline ANTES do primeiro
          paint): não há flip pós-hidratação nem transição ao carregar */}
      <span aria-hidden className="tema-ponto" />
      {escuro ? m.tema.claro : m.tema.escuro}
    </button>
  );
}
