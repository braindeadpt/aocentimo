"use client";

/**
 * Contador — o motor único de números: interpolação pura em rAF
 * (`useValorAnimado`), sem GSAP — estes números estão acima da dobra
 * em quase todas as rotas e não podem arrastar o motor de movimento
 * para o bundle inicial.
 * Odometer e TweenNum são apresentadores deste motor — as duas APIs
 * continuam exportadas nos seus ficheiros.
 *
 * Contrato (inalterado):
 *  - o valor final está no DOM desde o primeiro paint — nunca zero;
 *  - a animação parte do valor actual (retarget a meio não salta);
 *  - prefers-reduced-motion: salta para o final, sem interpolação.
 */
import { useValorAnimado } from "@/lib/useValorAnimado";

export interface OpcoesContador {
  /** ms — os apresentadores passam o seu `dur` actual */
  durMs?: number;
  /** casas decimais mostradas — a quantização é do formatador de cada
      apresentador; mantido para compatibilidade da API */
  casas?: number;
}

export function useContador(
  valor: number,
  { durMs = 600 }: OpcoesContador = {}
): number {
  return useValorAnimado(valor, { dur: durMs });
}
