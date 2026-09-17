"use client";

import { useSyncExternalStore } from "react";

/**
 * Alternador claro/escuro — apenas apresentação.
 * O clique é tratado por um listener delegado no script inline do layout
 * (vanilla JS, antes de qualquer hidratação): funciona mesmo numa página
 * com React morto. Aqui só lemos data-theme via useSyncExternalStore para
 * manter o rótulo e o aria-pressed sincronizados.
 */
export function ThemeToggle() {
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
      {/* círculo: cheio no escuro, vazado no claro — mostra o estado */}
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full transition-colors ${
          escuro ? "bg-mark" : "border border-ink2 bg-transparent"
        }`}
      />
      {escuro ? "claro" : "escuro"}
    </button>
  );
}
