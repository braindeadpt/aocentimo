/**
 * O GSAP das cenas P2a (Finanças, Banco, Mercearia) — as animações do
 * protótipo que a primeira porta tinha deixado de fora.
 *
 * O motor carrega-se UMA vez ao abrir a cena e só quando há movimento
 * (`motionActiva()`); com `prefers-reduced-motion` o ref fica `null` e
 * cada cena escreve logo o estado final, como sempre fez. O estado final
 * é o mesmo com e sem animação: a animação só decide o caminho.
 */
import { useEffect, useRef, type RefObject } from "react";
import { carregarGsap, motionActiva, type MotorGsap } from "@/lib/motion/gsap";

export type Gsap = MotorGsap["gsap"];

export function useGsap(): RefObject<Gsap | null> {
  const ref = useRef<Gsap | null>(null);
  useEffect(() => {
    let vivo = true;
    if (motionActiva())
      carregarGsap().then((m) => {
        if (vivo) ref.current = m.gsap;
      });
    return () => {
      vivo = false;
    };
  }, []);
  return ref;
}

/** O braço que acena (o `acena()` da Mercearia: sobe, abana três vezes, desce). */
export function acenar(gsap: Gsap, braco: NodeListOf<Element> | Element[]): void {
  if (!braco.length) return;
  gsap
    .timeline()
    .to(braco, { rotation: -150, transformOrigin: "50% 0%", duration: 0.25 })
    .to(braco, { rotation: -120, duration: 0.15, yoyo: true, repeat: 3 })
    .to(braco, { rotation: 0, duration: 0.3 });
}

/** Uma palheta do quadro vira e mostra a letra nova (o `quadro()` do Banco). */
export function virarPalheta(gsap: Gsap, palheta: Element, texto: Element, novo: string): void {
  gsap
    .timeline()
    .to(palheta, {
      scaleY: 0,
      transformOrigin: "50% 50%",
      duration: 0.09,
      ease: "power1.in",
      onComplete: () => {
        texto.textContent = novo;
      },
    })
    .to(palheta, { scaleY: 1, duration: 0.12, ease: "power1.out" });
}
