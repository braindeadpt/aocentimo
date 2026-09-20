"use client";

import { useContador } from "@/components/Contador";
import { fmtNum } from "@/lib/format";

/**
 * Contagem simples — o apresentador dos números que mudam (M-03).
 * Consome o motor único `Contador` (tween GSAP): desliza do valor
 * anterior para o novo, nunca de zero.
 *
 * Contrato:
 *  - o SSR e o primeiro paint mostram o valor FINAL
 *  - o visual é `aria-hidden`; um nó sr-only com `aria-live="polite"`
 *    traz `texto` — anuncia o valor final UMA vez, nunca os intermédios
 *  - `tabular-nums` no visual: a largura não muda ao animar
 *  - com prefers-reduced-motion não há interpolação nenhuma
 */
export function TweenNum({
  valor,
  casas = 2,
  texto,
  sufixo = "",
  dur = 320,
}: {
  /** valor actual — o alvo da interpolação */
  valor: number;
  /** casas decimais — tem de bater com a formatação de `texto` */
  casas?: number;
  /** o dígito já formatado no SSR — é o que o sr-only lê e anuncia
      (inclui a unidade, ex.: "1 234,56 €") */
  texto: string;
  /** unidade estática dentro do span visual — nunca interpola */
  sufixo?: string;
  /** ms — da gramática (--dur-curta 320 por defeito: a resposta a um
      input é "muda de estado" — M-09) */
  dur?: number;
}) {
  const animado = useContador(valor, { durMs: dur, casas });
  return (
    <>
      <span className="sr-only" aria-live="polite">
        {texto}
      </span>
      <span className="tabular-nums" aria-hidden="true">
        {fmtNum(animado, casas)}
        {sufixo}
      </span>
    </>
  );
}
