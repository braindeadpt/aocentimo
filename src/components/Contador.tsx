"use client";

/**
 * Contador — o motor único de números (B-03): uma tween GSAP sobre um
 * objecto ({v}), snap na precisão mostrada, duração dos tokens.
 * Odometer e TweenNum são apresentadores deste motor — as duas APIs
 * continuam exportadas nos seus ficheiros.
 *
 * Contrato (inalterado do motor rAF que substitui):
 *  - o valor final está no DOM desde o primeiro paint — nunca zero;
 *  - a animação parte do valor actual (retarget a meio não salta);
 *  - prefers-reduced-motion: salta para o final, sem interpolação.
 */
import { useEffect, useRef, useState } from "react";
import { dur, ease, gsap, reduzido } from "@/lib/motion/gsap";

export interface OpcoesContador {
  /** ms — os apresentadores passam o seu `dur` actual */
  durMs?: number;
  /** casas decimais mostradas — o snap da tween */
  casas?: number;
}

export function useContador(
  valor: number,
  { durMs = 600, casas = 0 }: OpcoesContador = {}
): number {
  const [atual, setAtual] = useState(valor);
  const obj = useRef({ v: valor });

  useEffect(() => {
    const de = obj.current.v;
    if (reduzido() || de === valor || !Number.isFinite(valor)) {
      obj.current.v = valor;
      setAtual(valor);
      return;
    }
    const tw = gsap.to(obj.current, {
      v: valor,
      snap: { v: Math.pow(10, -Math.max(0, casas)) },
      duration: durMs / 1000 || dur("media"),
      ease: ease("entra"),
      onUpdate: () => setAtual(obj.current.v),
      // o snap quantiza até ao fim — o estado final é o valor exacto
      onComplete: () => {
        obj.current.v = valor;
        setAtual(valor);
      },
    });
    return () => {
      tw.kill();
    };
    // durMs/casas são estáveis por convenção dos apresentadores
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return atual;
}
