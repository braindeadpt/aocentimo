"use client";

/**
 * Manchete — lettering de instrumento (B-03): ao armar (useArmado —
 * só abaixo da dobra ou com runKey nova), cada carácter abre de
 * font-stretch 62 % → 100 %, escalonado por --stagger, opacidade nunca
 * abaixo de 0.6. Archivo tem o eixo wdth carregado — a compressão é real.
 * SSR/sem-JS/reduced-motion: o texto inteiro, no peso final, sempre.
 */
import { useRef } from "react";
import { useArmado } from "@/lib/useArmado";
import {
  dur,
  ease,
  gsap,
  reduzido,
  SplitText,
  stagger,
  useGSAP,
} from "@/lib/motion/gsap";

interface Props {
  children: string;
  as?: "h1" | "h2" | "p";
  className?: string;
}

export function Manchete({ children, as: Tag = "h1", className }: Props) {
  const scope = useRef<HTMLHeadingElement | HTMLParagraphElement>(null);
  const { ref: refArmado, armado } = useArmado<HTMLElement>(children);

  useGSAP(
    () => {
      const el = scope.current;
      if (!el || !armado || reduzido()) return;
      const st = new SplitText(el, { type: "chars" });
      gsap.fromTo(
        st.chars,
        { fontStretch: "62%", opacity: 0.6 },
        {
          fontStretch: "100%",
          opacity: 1,
          duration: dur("curta"),
          ease: ease("entra"),
          stagger: stagger(),
          // repõe o texto original — DOM limpo depois da revelação
          onComplete: () => st.revert(),
        }
      );
      return () => st.revert();
    },
    { scope, dependencies: [armado, children] }
  );

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        scope.current = el as HTMLHeadingElement;
        refArmado(el);
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
