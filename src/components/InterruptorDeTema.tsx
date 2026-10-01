"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * O interruptor de tema com uma excepção de rota.
 *
 * Esconde-se na home (veredicto do design sobre a P1): a home do bairro é
 * uma página de papel e não tem tema — um botão que não muda nada à vista
 * é uma promessa falsa. Volta em P3, quando a pele V5 chegar às outras
 * rotas e a preferência voltar a ter efeito em toda a página.
 *
 * Existe porque o `SiteHeader` é de servidor (lê `data/` para a data de
 * edição) e não pode chamar `usePathname()`; o `ThemeToggle` original
 * fica como estava, para as outras rotas.
 */
export function InterruptorDeTema() {
  const naHome = usePathname() === "/";
  if (naHome) return null;
  return <ThemeToggle />;
}
