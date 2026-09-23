"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/Icone";
import { ACarregar } from "@/components/ACarregar";

/**
 * Botao — o controlo de acção da casa (1B-03). Um sistema, não um
 * estilo: quatro variantes com a mesma geometria física (pílula de
 * raio-controlo, ≥44 px de alvo, pressão scale(.97) em --dur-micro,
 * foco = anel torrado global 3 px + offset 2):
 *
 *   primario   → pílula de tinta cheia — a acção principal da vista
 *   secundario → pílula com contorno — a alternativa ao lado
 *   terciario  → texto — o passo discreto («ver», «repor»)
 *   icone      → quadrado ≥44×44 com um Icone do conjunto fechado —
 *                `ariaLabel` é obrigatório (o nome mora no controlo)
 *
 * Estados — todos na mesma peça:
 *   desativado → `aria-disabled` (continua focável para a razão se
 *                ler) + `razao` em title e dentro do nome acessível —
 *                nunca um botão morto sem explicação
 *   aCarregar  → o mini-orbe de pontos no lugar do ícone e o rótulo
 *                a dizer o que se passa («A calcular…»); aria-busy +
 *                aria-disabled cortam a repetição do gesto
 *
 * Cliente porque é um controlo (onClick, guarda de inércia), mas sem
 * estado interno nem hooks: server components podem renderizá-lo com
 * props serializáveis (CTA com `href`); `onClick` só de pais client.
 * Quando `href` existe desenha-se uma ligação com a cara do sistema —
 * a semântica fica certa.
 */
export type VarianteBotao = "primario" | "secundario" | "terciario" | "icone";

export interface BotaoProps {
  variante?: VarianteBotao;
  /** com href é uma ligação; sem href é um <button> */
  href?: string;
  /** ligação externa — target _blank + rel */
  externo?: boolean;
  type?: "button" | "submit" | "reset";
  /** ícone do conjunto fechado — na variante «icone» é o conteúdo;
      nas outras precede o rótulo */
  icone?: NomeIcone;
  /** estado a-carregar: substitui o ícone pelo mini-orbe e o rótulo
      por este texto («A calcular…»); bloqueia a activação */
  aCarregar?: string;
  desativado?: boolean;
  /** porquê desativado — vai para title + nome acessível;
      desativado sem razão é aviso em dev */
  razao?: string;
  /** nome acessível — obrigatório na variante «icone» (aviso em dev) */
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
  className?: string;
  id?: string;
}

export function Botao({
  variante = "secundario",
  href,
  externo,
  type = "button",
  icone,
  aCarregar,
  desativado,
  razao,
  ariaLabel,
  onClick,
  children,
  className,
  id,
}: BotaoProps) {
  if (process.env.NODE_ENV !== "production") {
    if (variante === "icone" && !ariaLabel) {
      console.warn(
        "[Botao] variante «icone» sem ariaLabel — o controlo fica sem nome acessível."
      );
    }
    if (desativado && !razao) {
      console.warn(
        "[Botao] desativado sem `razao` — um controlo morto sem explicação não é honesto."
      );
    }
  }

  const inerte = Boolean(desativado || aCarregar);
  const cls = `botao botao-${variante}${aCarregar ? " botao-carga" : ""}${
    className ? ` ${className}` : ""
  }`;

  // a razão entra no NOME acessível — com aria-label vai dentro dele,
  // sem vai como texto escondido no conteúdo (o title cobre o rato)
  const nomeAcessivel =
    ariaLabel && desativado && razao ? `${ariaLabel} — ${razao}` : ariaLabel;
  // aCarregar: o role=status do ACarregar não entra no nome do
  // controlo (a região viva é nó próprio na árvore) — o rótulo vai
  // explícito, 1:1 com o que se lê («A calcular…»)
  const nome = aCarregar ?? nomeAcessivel;

  const conteudo = (
    <>
      {aCarregar ? (
        // o estado a-carregar partilhado (1B-05): mini-orbe + rótulo
        // do que se passa — o Botao é onde a espera real acontece
        <ACarregar rotulo={aCarregar} className="botao-orbe" />
      ) : (
        <>
          {icone && <Icone nome={icone} />}
          {children && <span>{children}</span>}
        </>
      )}
      {!ariaLabel && desativado && razao && (
        <span className="sr-only"> — {razao}</span>
      )}
    </>
  );

  const guarda: MouseEventHandler<HTMLElement> = (e) => {
    if (inerte) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // ligação: interna → next/link; externa → <a>; desactivada → âncora
  // sem href que continua focável para a razão se anunciar
  if (href) {
    if (inerte) {
      return (
        <a
          id={id}
          role="link"
          aria-disabled="true"
          aria-busy={aCarregar ? true : undefined}
          title={razao}
          aria-label={nome}
          tabIndex={0}
          className={cls}
          onClick={guarda}
        >
          {conteudo}
        </a>
      );
    }
    if (externo) {
      return (
        <a
          id={id}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={nome}
          className={cls}
          onClick={guarda}
        >
          {conteudo}
        </a>
      );
    }
    return (
      <Link
        id={id}
        href={href}
        aria-label={nome}
        className={cls}
        onClick={guarda}
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <button
      id={id}
      type={type}
      aria-disabled={inerte || undefined}
      aria-busy={aCarregar ? true : undefined}
      title={desativado ? razao : undefined}
      aria-label={nome}
      className={cls}
      onClick={guarda}
    >
      {conteudo}
    </button>
  );
}
