"use client";

import { useRef, useSyncExternalStore } from "react";

/**
 * Alternador claro/escuro. O tema vive em <html data-theme> e em
 * localStorage("bruto-theme"); a preferência inicial é resolvida por um
 * script inline no layout, antes da primeira pintura. O rótulo lê o DOM
 * via useSyncExternalStore — sem efeitos, sem estado duplicado.
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

  const animTimer = useRef(0);

  function alternar() {
    const proximo = tema === "dark" ? "light" : "dark";
    const root = document.documentElement;
    // transição suave só se o utilizador não pediu movimento reduzido;
    // o atributo sai ao fim da transição para não prender transições
    // globais !important para sempre
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.setAttribute("data-theme-anim", "");
      clearTimeout(animTimer.current);
      animTimer.current = window.setTimeout(
        () => root.removeAttribute("data-theme-anim"),
        400
      );
    }
    root.dataset.theme = proximo;
    try {
      localStorage.setItem("bruto-theme", proximo);
    } catch {
      /* modo privado — a preferência não persiste, aceitável */
    }
  }

  const escuro = tema === "dark";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={escuro}
      className="num inline-flex items-center gap-1.5 border border-line2 px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-ink2 transition-colors hover:border-ink hover:text-ink"
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
