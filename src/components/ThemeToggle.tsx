"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

/**
 * Alternador claro/escuro — apenas apresentação.
 * O clique é tratado por um listener delegado no script inline do layout
 * (vanilla JS, antes de qualquer hidratação): funciona mesmo numa página
 * com React morto. Aqui só lemos data-theme via useSyncExternalStore para
 * manter o rótulo e o aria-pressed sincronizados.
 *
 * M-16: a reconciliação do <html> pode repor o data-theme do SSR ("dark")
 * sobre a escolha clara que o script inline já tinha posto. O layout
 * effect corre antes do paint pós-hidratação e repõe a escolha guardada —
 * sem frame errado, sem transição (os dois writes caem na mesma frame).
 */
export function ThemeToggle() {
  useLayoutEffect(() => {
    try {
      const t = localStorage.getItem("aocentimo-theme") ?? "dark";
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
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={escuro}
      className="kicker-sm inline-flex items-center gap-1.5 border border-line2 px-2 py-1 text-ink2 transition-colors hover:border-ink hover:text-ink"
    >
      {/* círculo: cheio no escuro, vazado no claro — o aspecto vem do
          data-theme em CSS (posto pelo script inline ANTES do primeiro
          paint): não há flip pós-hidratação nem transição ao carregar */}
      <span aria-hidden className="tema-ponto" />
      {escuro ? "claro" : "escuro"}
    </button>
  );
}
