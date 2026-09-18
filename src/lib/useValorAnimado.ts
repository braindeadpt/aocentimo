import { useEffect, useRef, useState } from "react";

/**
 * Motor de valores animados — UM hook, a única interpolação do site
 * (M-03). Os apresentadores (TweenNum, Odometer) consomem-no; nenhum
 * outro componente interpola números.
 *
 * Contrato inviolável:
 *  - o valor final está no DOM desde o primeiro paint (o estado inicial
 *    é sempre o alvo, nunca um zero ou um intermédio)
 *  - a animação vai do valor ANTERIOR para o novo — de onde quer que a
 *    leitura esteja, mesmo a meio de outra animação (retarget)
 *  - com prefers-reduced-motion não há interpolação nenhuma
 *  - a curva é a da gramática: easeEntra ≈ --ease-entra
 *
 * A máquina é pura e testável em node: `valorEm` lê a posição num
 * instante, `retarget` re-aponta sem saltos (o `de` passa a ser a
 * posição actual — mudar de valor a meio nunca deixa o número errado).
 */

/** ease-entra da gramática (aproximação cúbica de cubic-bezier(.22,1,.36,1)) */
export const easeEntra = (p: number): number => 1 - Math.pow(1 - p, 3);

export interface Animado {
  /** posição de partida */
  de: number;
  /** alvo */
  para: number;
  /** instante de partida (ms, performance.now) */
  t0: number;
  /** duração (ms) — vem sempre da gramática nos apresentadores */
  dur: number;
}

/** Posição da máquina no instante t — easeEntra entre de e para. */
export function valorEm(a: Animado, t: number): number {
  const p = a.dur <= 0 ? 1 : Math.min(Math.max((t - a.t0) / a.dur, 0), 1);
  return a.de + (a.para - a.de) * easeEntra(p);
}

export const terminado = (a: Animado, t: number): boolean =>
  a.dur <= 0 || t - a.t0 >= a.dur;

/** Re-aponta a meio: o novo `de` é a posição actual — nunca salta. */
export function retarget(a: Animado, para: number, t: number): Animado {
  return { de: valorEm(a, t), para, t0: t, dur: a.dur };
}

/**
 * O hook. Devolve o valor a mostrar AGORA; o primeiro render (SSR e
 * cliente) devolve `valor` — o número certo está sempre no HTML.
 */
export function useValorAnimado(
  valor: number,
  { dur = 600 }: { dur?: number } = {}
): number {
  const [atual, setAtual] = useState(valor);
  const maq = useRef<Animado | null>(null);
  const alvo = useRef(valor);

  useEffect(() => {
    const reduzir = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const t = performance.now();
    // a partida é a posição visível agora: a meio duma animação é
    // valorEm(maquina); parada, é o último alvo — nunca zero
    const de = maq.current ? valorEm(maq.current, t) : alvo.current;
    alvo.current = valor;
    if (reduzir || de === valor) {
      maq.current = null;
      setAtual(valor);
      return;
    }
    maq.current = { de, para: valor, t0: t, dur };
    let raf = 0;
    const tick = (agora: number) => {
      const m = maq.current;
      if (!m) return;
      setAtual(valorEm(m, agora));
      if (terminado(m, agora)) {
        maq.current = null;
        setAtual(valor);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // dur é estável por convenção dos apresentadores
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return atual;
}
