"use client";

import type { MouseEventHandler, ReactNode } from "react";

/**
 * Chip — a pill de preset/escolha rápida da casa (1B-03). Usado nos
 * presets da Regua e onde quer que um conjunto curto de escolhas
 * salte para um valor. O estado seleccionado é inequívoco — três
 * canais: `aria-pressed` (AT), a pílula cheia de tinta e o quadrado-
 * marca antes do rótulo (forma, não só cor).
 *
 * Desativado → aria-disabled (fica focável) + `razao` em title e
 * dentro do nome acessível (texto escondido — aria-description não é
 * suportado no role button).
 */
export interface ChipProps {
  /** seleccionado — reflecte-se em aria-pressed e na pílula cheia */
  ativo?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  desativado?: boolean;
  /** porquê desativado — title + nome acessível */
  razao?: string;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Chip({
  ativo,
  onClick,
  desativado,
  razao,
  ariaLabel,
  children,
  className,
  id,
}: ChipProps) {
  if (process.env.NODE_ENV !== "production" && desativado && !razao) {
    console.warn(
      "[Chip] desativado sem `razao` — um controlo morto sem explicação não é honesto."
    );
  }
  return (
    <button
      id={id}
      type="button"
      className={`chip${className ? ` ${className}` : ""}`}
      aria-pressed={ativo}
      aria-disabled={desativado || undefined}
      title={desativado ? razao : undefined}
      aria-label={
        ariaLabel && desativado && razao ? `${ariaLabel} — ${razao}` : ariaLabel
      }
      onClick={(e) => {
        if (desativado) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {children}
      {/* a razão entra no nome acessível quando não há aria-label */}
      {!ariaLabel && desativado && razao && (
        <span className="sr-only"> — {razao}</span>
      )}
    </button>
  );
}
