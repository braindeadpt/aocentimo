"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Botao, type VarianteBotao } from "@/components/Botao";
import type { NomeIcone } from "@/components/Icone";

/**
 * BotaoCopiar — copiar uma ligação ou um JSON para a área de
 * transferência com confirmação «Copiado» (1B-03). A confirmação é
 * uma nota discreta junto ao botão, anunciada a leitores de ecrã por
 * `role="status"` (aria-live polite) — a região vive sempre no DOM e
 * o texto é que muda; em repouso está vazia e escondida (:empty).
 *
 * Honesto quando falha: se a Clipboard API e o fallback não copiarem,
 * a nota diz «Não copiado» — nunca finge sucesso. Caminhos relativos
 * («/api/x.json») vão para a clipboard resolvidos em URL absoluta —
 * uma ligação copiada tem de ser colável fora do site.
 *
 * Variantes: as mesmas do <Botao> («icone» pede `ariaLabel`) mais
 * «ligacao» — a cara de lq-link das acções do rodapé do <Cartao>,
 * para a acção «JSON»/«copiar ligação» ficar igual por fora e ser
 * botão por dentro.
 */

async function copiarTexto(t: string): Promise<boolean> {
  // caminho interno → URL absoluta (a ligação tem de servir fora do site)
  const texto = t.startsWith("/")
    ? new URL(t, window.location.origin).href
    : t;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* cai no fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export interface BotaoCopiarProps {
  /** o texto que vai para a área de transferência (URL ou conteúdo) */
  texto: string;
  /** o rótulo visível — na variante «icone» não há: usa `ariaLabel` */
  rotulo?: ReactNode;
  icone?: NomeIcone;
  /** «ligacao» = visual lq-link (acções do Cartao); as outras são as
      variantes do <Botao>. Omissão: «terciario» */
  variante?: VarianteBotao | "ligacao";
  /** nome acessível — obrigatório na variante «icone» */
  ariaLabel?: string;
  /** a nota de sucesso — «Copiado» por omissão */
  rotuloCopiado?: string;
  /** a nota de falha — «Não copiado» por omissão */
  rotuloFalha?: string;
  className?: string;
  id?: string;
}

export function BotaoCopiar({
  texto,
  rotulo,
  icone,
  variante = "terciario",
  ariaLabel,
  rotuloCopiado = "Copiado",
  rotuloFalha = "Não copiado",
  className,
  id,
}: BotaoCopiarProps) {
  const [estado, setEstado] = useState<"ocioso" | "ok" | "falha">("ocioso");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (process.env.NODE_ENV !== "production" && variante === "icone" && !ariaLabel) {
    console.warn(
      "[BotaoCopiar] variante «icone» sem ariaLabel — o controlo fica sem nome acessível."
    );
  }

  const copiar = async () => {
    if (timer.current) clearTimeout(timer.current);
    const ok = await copiarTexto(texto);
    setEstado(ok ? "ok" : "falha");
    timer.current = setTimeout(() => setEstado("ocioso"), 2000);
  };

  const nota =
    estado === "ok" ? rotuloCopiado : estado === "falha" ? rotuloFalha : "";

  const gatilho =
    variante === "ligacao" ? (
      <button
        type="button"
        className="lq-link copiar-lig"
        aria-label={ariaLabel}
        onClick={copiar}
      >
        {rotulo}
      </button>
    ) : (
      <Botao
        variante={variante}
        icone={icone}
        ariaLabel={ariaLabel}
        onClick={copiar}
      >
        {rotulo}
      </Botao>
    );

  return (
    <span id={id} className={`copiar${className ? ` ${className}` : ""}`}>
      {gatilho}
      <span className={`copiado-nota${estado === "falha" ? " copiado-falha" : ""}`} role="status">
        {nota}
      </span>
    </span>
  );
}
