import type { ReactNode } from "react";
import { FINO } from "@/lib/format";

/**
 * Valor — a composição única número + unidade (+ sinal) da casa (1B-02).
 *
 * UMA peça compõe os três membros da linha: o sinal («+»/«−» em
 * .num-sign, membro semântico — herda a cor, nunca decoração), o número
 * (string já formatada ou apresentador animado — <TweenNum>,
 * <Odometer>) e a unidade em .num-unit: elemento próprio a ~45 % do
 * tamanho do herói, na mesma linha de base, em tinta atenuada — nunca
 * nota de rodapé nem span flutuante.
 *
 * A ponte número→unidade é o espaço fino inseparável (FINO, U+202F) —
 * nunca espaço normal: «1 856 €», «63,2 c», «3,6 %». O menos é o
 * verdadeiro (U+2212), vem dos formatadores ou do `sinal`.
 *
 * O tamanho vem do contexto — envolve-se no registo tipográfico da
 * peça (.num-hero, .leitura-valor, .ap-num, ou uma classe display):
 *
 *   <p className="num-hero"><Valor numero="1 234,56" unidade="€" /></p>
 *   <Valor numero={<TweenNum …/>} unidade="€" />
 *
 * Acessibilidade: quando `numero` é um apresentador com nó sr-only
 * (TweenNum/Odometer), o texto acessível é o do apresentador seguido da
 * unidade visível — passa-se ao `texto` só o número para não anunciar
 * a unidade em duplicado.
 */
export function Valor({
  numero,
  unidade,
  sinal,
  className = "",
}: {
  /** o número — string formatada («1 234,56», «−5,2») ou apresentador
      animado (<TweenNum>, <Odometer>) */
  numero: ReactNode;
  /** o símbolo da unidade, SEM espaço — «€», «€/mês», «%», «c» */
  unidade?: string;
  /** sinal de membro — «+»/«−» antes do número (deltas, cortes) */
  sinal?: "+" | "−";
  className?: string;
}) {
  return (
    <span className={className || undefined}>
      {sinal && <span className="num-sign">{sinal}</span>}
      {numero}
      {unidade && (
        <>
          {FINO}
          <span className="num-unit">{unidade}</span>
        </>
      )}
    </span>
  );
}
