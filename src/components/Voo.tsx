"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

/**
 * Voo — a transição-assinatura (1B-04): a «pergunta seguinte» de uma
 * página MORFA no h1 da página de destino — a pergunta voa e assenta
 * como título.
 *
 * Como não contamina outros links para a mesma rota: o par
 * view-transition-name só existe durante a navegação-assinatura.
 * O clique no <LinkVoo> marca `vooAlvo = rota` (singleton de módulo)
 * e dá o nome `pg-voo` ao próprio link — capturado no fotograma VELHO.
 * A página nova monta <TituloPagina>, que lê o marcador no initializer
 * do useState (corre durante o commit da transição, com o marcador
 * ainda presente): se a rota bate, o h1 leva o mesmo nome — capturado
 * no fotograma NOVO. O browser emparelha velho↔novo e morfa.
 * O <VooLimpeza> (layout) apaga o marcador DEPOIS do commit — as
 * navegações seguintes correm sem nome nenhum.
 *
 * Porquê não `transitionTypes` + `share` por tipo: nesta versão
 * (Next 16.3.5 / React 19.3) addTransitionType corre fora de qualquer
 * transition e os tipos só se registam se já houver lanes de
 * transition pendentes — com a página idle são descartados e o morph
 * torna-se dependente de prefetch em voo (flaky). O marcador é
 * determinístico: existe exactamente entre o clique e o commit.
 *
 * Porquê nomes inline e não CSS: o nome tem de ser ÚNICO em cada
 * fotograma — o h1 da página velha não pode levar o mesmo nome que o
 * link, nem o link seguinte da página nova o do h1. Inline só toca
 * nos dois elementos certos.
 *
 * Sem View Transitions (browsers sem a API) a navegação é normal; em
 * prefers-reduced-motion o bloco global corta as animações dos
 * pseudo-elementos — o conteúdo chega na mesma, sem voo.
 */

/** o nome partilhado — um só: cada fotograma tem no máximo um
    elemento com ele (o link no velho, o h1 no novo) */
export const NOME_VOO = "pg-voo";

/* ——— o marcador: singleton de módulo partilhado por LinkVoo e
   TituloPagina (o webpack deduplica — é a mesma instância) ——— */
let vooAlvo: string | null = null;

/** a rota sem barra final — "/salario/" ≡ "/salario" */
function norm(rota: string): string {
  const s = rota.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  return s || "/";
}

/** <LinkVoo> — o link «a pergunta seguinte». Um Link normal + o selo
    do voo no clique simples (modificados/novo separador não selam —
    a navegação desses não usa a transição do documento). */
export function LinkVoo({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0 ||
          e.defaultPrevented
        )
          return;
        vooAlvo = norm(href);
        // a partida: o link ganha o nome para o fotograma velho
        e.currentTarget.style.viewTransitionName = NOME_VOO;
        // salvaguarda: se a navegação falhar ou demorar demais, o
        // selo não pode contaminar uma navegação normal posterior
        window.setTimeout(() => {
          if (vooAlvo === norm(href)) vooAlvo = null;
        }, 4000);
      }}
    >
      {children}
    </Link>
  );
}

/** <TituloPagina> — o h1 das páginas de conteúdo: a aterragem do
    voo. Se o marcador aponta a ESTA rota no momento da montagem, o
    h1 leva o nome partilhado e o browser morfa-o a partir do link
    origem. Fora dessa janela é um h1 comum, sem custo. */
export function TituloPagina({
  rota,
  children,
  className = "titulo-pagina",
  id,
}: {
  /** caminho desta página — "/irs", "/aprender/o-que-e-o-irs"… */
  rota: string;
  children: ReactNode;
  className?: string;
  /** id opcional — o <Pagina> usa-o para o aria-labelledby do nível 1 */
  id?: string;
}) {
  // o initializer corre na montagem — dentro da transição, antes da
  // limpeza pós-commit; no SSR e na hidratação o marcador não existe
  const [voo] = useState(
    () => vooAlvo !== null && vooAlvo === norm(rota)
  );
  return (
    <h1
      id={id}
      className={className}
      style={voo ? { viewTransitionName: NOME_VOO } : undefined}
    >
      {children}
    </h1>
  );
}

/** <VooLimpeza> — montada uma vez no layout. Depois de cada commit de
    navegação (o useEffect corre após a captura do fotograma novo)
    apaga o marcador: as navegações seguintes ficam limpas. */
export function VooLimpeza() {
  const pathname = usePathname();
  useEffect(() => {
    vooAlvo = null;
  }, [pathname]);
  return null;
}
