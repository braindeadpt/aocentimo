"use client";

import type { MouseEventHandler, ReactNode } from "react";

/**
 * Interruptor — o toggle da casa (1B-03). A pílula da referência:
 * trilho com nó que desliza; o estado lê-se na posição do nó e no
 * trilho preenchido — nunca só na cor. É um <button role="switch">:
 * Enter/Espaço comutam nativamente, o nome acessível é o rótulo
 * visível, `aria-checked` diz o estado.
 *
 *   desligado → nó à esquerda, trilho oco
 *   ligado    → nó à direita, trilho de tinta
 *   desativado→ aria-disabled (fica focável) + `razao` em title e
 *               na nota visível — entra no nome acessível; o
 *               «porquê» nunca se perde
 *
 * Sem hooks: vive dentro de client components (`onChange` não
 * serializa). O clique no texto também comuta — o rótulo está
 * dentro do botão, à maneira de interruptor de instrumento.
 */
export interface InterruptorProps {
  /** estado corrente */
  ligado: boolean;
  onChange: (ligado: boolean) => void;
  /** o rótulo visível — é também o nome acessível */
  rotulo: ReactNode;
  /** nota discreta junto ao rótulo (contexto, unidade) */
  nota?: ReactNode;
  desativado?: boolean;
  /** porquê desativado — title + nota visível (nome acessível) */
  razao?: string;
  className?: string;
  id?: string;
}

export function Interruptor({
  ligado,
  onChange,
  rotulo,
  nota,
  desativado,
  razao,
  className,
  id,
}: InterruptorProps) {
  if (process.env.NODE_ENV !== "production" && desativado && !razao) {
    console.warn(
      "[Interruptor] desativado sem `razao` — um controlo morto sem explicação não é honesto."
    );
  }

  const comuta: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (desativado) {
      e.preventDefault();
      return;
    }
    onChange(!ligado);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-disabled={desativado || undefined}
      title={desativado ? razao : undefined}
      className={`interruptor${className ? ` ${className}` : ""}`}
      onClick={comuta}
    >
      <span className="interruptor-trilho" aria-hidden="true">
        <span className="interruptor-no" />
      </span>
      <span className="interruptor-rotulo">
        {rotulo}
        {/* desactivado: a razão aparece em texto visível (a nota) —
            honesta ao olho e anunciada no nome; em uso é a nota do
            autor */}
        {desativado && razao ? (
          <span className="interruptor-nota">{razao}</span>
        ) : (
          nota && <span className="interruptor-nota">{nota}</span>
        )}
      </span>
    </button>
  );
}
