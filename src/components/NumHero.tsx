"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { TweenNum } from "@/components/TweenNum";
import { Valor } from "@/components/Valor";

// useLayoutEffect no cliente, useEffect no SSR — evita o aviso de hidratação
const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** O número-resposta — registo herói da escala de números.
 *  Recebe a string já formatada: fmtEUR/fmtPct trazem « €»/« %» no
 *  fino inseparável (U+202F); a unidade é separada e composta pelo
 *  <Valor> (.num-unit a ~45 %, mesma linha de base), com `sufixo`
 *  colado («€/mês»). O `sinal` («+»/«−») é membro da linha e herda a
 *  cor — nunca decoração. Falha de dados («—») renderiza-se tal qual.
 *  `animar`: o mesmo valor em número — quando muda, os dígitos deslizam
 *  (TweenNum) em vez de saltar; o SSR continua a trazer o valor certo.
 *  O clamp do .num-hero mede-se pela viewport, mas quem manda é o painel:
 *  se a linha passar a largura disponível, reduz até caber — nunca
 *  cresce para lá do registo, nunca transborda. */
export function NumHero({
  valor,
  sufixo,
  sinal,
  compacto = false,
  animar,
  casas = 2,
  className = "",
}: {
  valor: string;
  sufixo?: string;
  sinal?: "+" | "−";
  /** cabeça mais baixa para valores sem teto conhecido */
  compacto?: boolean;
  /** valor numérico para interpolação — o texto continua a vir de `valor` */
  animar?: number;
  /** casas decimais do valor animado — tem de bater com `valor` */
  casas?: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useIso(() => {
    const el = ref.current;
    if (!el) return;
    const ajusta = () => {
      el.style.fontSize = "";
      const { clientWidth, scrollWidth } = el;
      if (scrollWidth > clientWidth) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        // a largura do texto escala linearmente com a fonte — uma passa chega
        el.style.fontSize = `${Math.max((fs * clientWidth * 0.99) / scrollWidth, 20)}px`;
      }
    };
    ajusta();
    const ro = new ResizeObserver(ajusta);
    ro.observe(el);
    // o texto pode mudar depois do mount (tween de `animar`): re-mede por
    // mutação — ajusta só toca em style, não há ciclo
    const mo = new MutationObserver(ajusta);
    mo.observe(el, { childList: true, characterData: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [valor, sufixo, sinal, compacto, animar, casas]);

  // dígitos + separadores + sinais (+, − U+2212, - de valores antigos)
  // à esquerda; a unidade solta-se à direita — «€», «%», «c»
  const m = /^([\s\d.,+−-]+?)\s*(€|%|c)?$/.exec(valor.trim());
  const digitos = m ? m[1].trim() : valor;
  const unidade = m ? (m[2] ?? "") + (sufixo ?? "") : "";
  return (
    <p ref={ref} className={`num-hero${compacto ? " num-hero-compact" : ""}${className ? ` ${className}` : ""}`}>
      <Valor
        sinal={sinal}
        numero={
          animar === undefined ? (
            digitos
          ) : (
            <TweenNum valor={animar} casas={casas} texto={digitos} />
          )
        }
        unidade={unidade || undefined}
      />
    </p>
  );
}
