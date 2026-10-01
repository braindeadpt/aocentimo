"use client";

/**
 * `<CenaDePerto>` — a moldura comum das cenas (o `cenaBase` do
 * protótipo, P1-3 do PACK V5 PRODUÇÃO): desenho à esquerda, conversa à
 * direita, o botão de fechar, a fonte no fundo. No telemóvel, o desenho
 * fica em cima e o texto em baixo (o `bairro.css` decide isso — o
 * componente só usa as classes).
 *
 * O que a casa obriga e a moldura garante:
 *
 *   - ao abrir, o FOCO vai para o título da cena; fechar devolve-o a
 *     quem o tinha (o edifício do mapa) — PACK §2.3;
 *   - fechar é Escape ou o botão; a cena avisa o pai com `aoFechar`;
 *   - `aria-labelledby` para o título, a fala em `aria-live="polite"`.
 *
 * O desenho do interior chega por `arteHtml` (string SVG, injetada como
 * o mapa) e o `refArte` dá a cena o sítio onde manipular os seus ids —
 * a árvore React nunca vê o interior.
 *
 * Não há GSAP aqui: a entrada é CSS e `prefers-reduced-motion` corta-a
 * no stylesheet — estado final sem animação, como manda a casa.
 */
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { fechar as fecharTxt } from "./textos";

interface PropsCenaDePerto {
  /** Quem fala: «Finanças · balcão A · o IRS em gavetas». */
  quem: string;
  /** A fonte dos números, no fundo do texto. */
  fonte: string;
  /** Chamado ao fechar (Escape, botão ×) — o pai devolve o foco ao edifício. */
  aoFechar: () => void;
  /** O desenho do interior, como HTML/SVG pronto (injetado, não hidratado). */
  arteHtml?: string;
  /** Onde a cena vai manipular os ids do `arteHtml`. */
  refArte?: RefObject<HTMLDivElement | null>;
  /** O rótulo do desenho, quando não há `arteHtml`. */
  rotuloArte?: string;
  /** A conversa e o corpo dos passos. */
  children: ReactNode;
}

export default function CenaDePerto({ quem, rotuloArte, fonte, aoFechar, arteHtml, refArte, children }: PropsCenaDePerto) {
  const tituloRef = useRef<HTMLSpanElement>(null);
  const id = "cena-quem";

  // o foco entra no título: quem navega por teclado sabe onde está
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div className="b-cena" role="dialog" aria-modal="false" aria-labelledby={id}>
      {arteHtml ? (
        <div className="b-cena-arte" ref={refArte} dangerouslySetInnerHTML={{ __html: arteHtml }} />
      ) : (
        <div className="b-cena-arte">
          <svg viewBox="0 0 640 470" role="img" aria-label={rotuloArte ?? quem} />
        </div>
      )}
      <div className="b-cena-texto">
        <button className="b-fechar" type="button" aria-label={fecharTxt} onClick={aoFechar}>
          ×
        </button>
        <span className="b-quem" id={id} tabIndex={-1} ref={tituloRef}>
          {quem}
        </span>
        {children}
        <span className="b-fonte">{fonte}</span>
      </div>
    </div>
  );
}
