"use client";

import type { KeyboardEvent, ReactNode } from "react";

/**
 * Segmentado — o controlo segmentado da casa (1B-03): uma pílula
 * dividida em segmentos, um seleccionado de cada vez. Pensado para
 * janelas temporais dos gráficos («1A · 5A · Máx») e para escolhas
 * de modo mutuamente exclusivas.
 *
 * Semântica: `role="radiogroup"` + segmentos `role="radio"` com
 * `aria-checked`. Um só ponto de tabulação — a selecção (roving
 * tabindex); as setas (e Home/End) movem foco e selecção juntos,
 * como num grupo de rádio nativo, saltando os segmentos
 * desativados. Enter/Espaço seleccionam o focado.
 *
 * A selecção nunca é só cor: o segmento activo é a pílula cheia de
 * tinta com texto invertido — forma contra contorno. Desactivado →
 * aria-disabled + `razao` em title e dentro do nome acessível,
 * fora da rotação de teclado.
 *
 * Sem hooks: as setas resolvem o alvo no DOM e chamam `onChange` —
 * quem renderiza decide o que a opção significa (ex.: fatiar a
 * série pelos últimos N meses; uma janela sem dados entra
 * desactivada com a razão honesta).
 */
export interface OpcaoSegmento {
  /** identificador estável — o `valor` do controlo aponta a um id */
  id: string;
  /** o texto do segmento — curto («1A», «5A», «Máx») */
  rotulo: ReactNode;
  desativado?: boolean;
  /** porquê desativado — title + nome acessível */
  razao?: string;
}

export interface SegmentadoProps {
  /** nome acessível do grupo (aria-label) — ex.: «Janela temporal» */
  rotulo: string;
  /** id da opção seleccionada */
  valor: string;
  onChange: (id: string) => void;
  opcoes: readonly OpcaoSegmento[];
  className?: string;
  id?: string;
}

export function Segmentado({
  rotulo,
  valor,
  onChange,
  opcoes,
  className,
  id,
}: SegmentadoProps) {
  if (process.env.NODE_ENV !== "production") {
    for (const o of opcoes) {
      if (o.desativado && !o.razao) {
        console.warn(
          `[Segmentado] opção «${o.id}» desativada sem \`razao\` — uma janela morta sem explicação não é honesta.`
        );
      }
    }
    if (!opcoes.some((o) => o.id === valor)) {
      console.warn(
        `[Segmentado] valor «${valor}» não existe nas opções — o controlo nasce sem selecção.`
      );
    }
  }

  const activas = opcoes.map((o, i) => ({ o, i })).filter(({ o }) => !o.desativado);

  const navega = (e: KeyboardEvent<HTMLDivElement>) => {
    const grupo = e.currentTarget;
    const radios = Array.from(
      grupo.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    );
    const foco = radios.indexOf(document.activeElement as HTMLButtonElement);
    const cur = opcoes.findIndex((o) => o.id === valor);
    let alvo = -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      const de = foco >= 0 ? foco : cur;
      for (let k = 1; k <= opcoes.length; k++) {
        const j = (de + k) % opcoes.length;
        if (!opcoes[j].desativado) {
          alvo = j;
          break;
        }
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      const de = foco >= 0 ? foco : cur;
      for (let k = 1; k <= opcoes.length; k++) {
        const j = (de - k + opcoes.length) % opcoes.length;
        if (!opcoes[j].desativado) {
          alvo = j;
          break;
        }
      }
    } else if (e.key === "Home") {
      alvo = activas[0]?.i ?? -1;
    } else if (e.key === "End") {
      alvo = activas[activas.length - 1]?.i ?? -1;
    } else {
      return;
    }

    if (alvo < 0 || alvo === cur) {
      e.preventDefault();
      if (alvo >= 0) radios[alvo]?.focus();
      return;
    }
    e.preventDefault();
    const o = opcoes[alvo];
    onChange(o.id);
    radios[alvo]?.focus();
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={rotulo}
      className={`segmentado${className ? ` ${className}` : ""}`}
      onKeyDown={navega}
    >
      {opcoes.map((o) => {
        const sel = o.id === valor;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={sel}
            aria-disabled={o.desativado || undefined}
            title={o.desativado ? o.razao : undefined}
            tabIndex={o.desativado ? -1 : sel ? 0 : -1}
            className="segmentado-op"
            onClick={(e) => {
              if (o.desativado) {
                e.preventDefault();
                return;
              }
              if (!sel) onChange(o.id);
            }}
          >
            {o.rotulo}
            {/* a razão entra no nome acessível — «5A — a série tem só
                24 meses» */}
            {o.desativado && o.razao && (
              <span className="sr-only"> — {o.razao}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
