/**
 * O contrato das cartas (P1-4 do PACK V5 PRODUÇÃO).
 *
 * A secção «Escolhe a tua personagem» vive no `<main>`, FORA do palco —
 * e um componente de servidor não pode passar funções a um componente
 * de cliente. A ponte é este `CustomEvent` na janela: a carta anuncia
 * a escolha e o `<Bairro>` faz o resto — o scroll ao palco, a câmara
 * ao `[data-pessoa]` do mapa, o painel e o aceno.
 *
 * Todo o texto vem pronto do servidor: o componente das cartas não vê
 * `messages/pt.json` nem `data/`, como a casa manda.
 *
 * O `CustomEvent` sozinho não chega: o `<onClick>` das cartas só existe
 * depois de o React hidratar, e o ouvinte do `<Bairro>` só se liga no
 * `useEffect`. Medido no site (2026-10-03): num telemóvel com o CPU 4×
 * mais lento, o clique na carta chegava 1,2 a 11 s **antes** de o
 * `<Bairro>` registar o ouvinte — e o pedido ia para ninguém, sem painel
 * nenhum. Quem toca cedo num ecrã lento ficava a falar com uma carta
 * morta. Por isso a escolha passa por uma ponte de três tempos:
 *
 *   1. `PONTE_JS` — um script de duas linhas que vai no HTML, antes das
 *      cartas, e anota a chave de uma carta tocada ainda sem hydration
 *      (é o único que pode correr nessa altura). Só se cala quando as
 *      DUAS partes estão prontas: se se calasse quando o `<Bairro>` está,
 *      um clique entre o bairro montar e as cartas ligarem o seu `onClick`
 *      deixaria de ter quem o apanhe — e voltar a perdê-lo;
 *   2. o `<Cartas>`, ao montar, entrega essa chave em `EVT_PERSONAGEM`,
 *      já com o texto completo que só ele tem;
 *   3. o `<Bairro>`, ao montar, anuncia `EVT_BAIRRO_PRONTO` — assim a
 *      entrega acima nunca chega antes do ouvinte estar ligado, venha o
 *      React na ordem que vier.
 */

export const EVT_PERSONAGEM = "b:escolhe-personagem";

/** O `<Bairro>` anuncia que já está à escuta. */
export const EVT_BAIRRO_PRONTO = "b:bairro-pronto";

/** O que uma carta entrega ao bairro — tudo texto pronto do servidor. */
export interface EscolhaPersonagem {
  /** ines | diana | pedro | manuel | arminda | goncalo | rui */
  chave: string;
  /** «Nome · papel» — o título do painel. */
  quem: string;
  /** A fala «Olá! Sou …», em HTML com o realce `.b-a` do «Em breve». */
  fala: string;
  /** O perfil económico — a linha a negrito por baixo da fala. */
  extra: string;
  /** O rótulo do botão de fechar. */
  fechar: string;
}

/**
 * A chave que a `PONTE_JS` anotou por um clique anterior à hidratação.
 *
 * Lê-se sem se consumir: a escolha só se gasta quando foi entregue a sério
 * (ver `consumirPendente`), para que uma entrega que chegue cedo demais
 * possa ser repetida quando a outra parte estiver pronta. Como a ponte só
 * guarda a chave (nunca o texto), é o `<Cartas>` que a traduz — o texto
 * do «Olá!» não é duplicado no HTML.
 */
export function escolhaPendente(): string | null {
  const ponte = globalThis as { __bEscolhaPendente?: string };
  return ponte.__bEscolhaPendente ?? null;
}

/** Gasta a escolha anotada: uma escolha, uma entrega. */
export function consumirPendente(): void {
  const ponte = globalThis as { __bEscolhaPendente?: string };
  ponte.__bEscolhaPendente = undefined;
}

/**
 * O script que vai no HTML, antes das cartas (ver `HomeBairro`).
 *
 * Minúsculo de propósito: tem de correr no parse, muito antes do React,
 * e não pode pesar. Anota só a chave, e cala-se quando o bairro E as
 * cartas já estão montados — depois disso é o `onClick` do React que
 * trabalha, e não pode haver dois handlers para o mesmo clique.
 */
export const PONTE_JS = `(function(){var w=window;if(w.__bPonte)return;w.__bPonte=1;document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;if(w.__bBairroPronto&&w.__bCartasPronto)return;var c=t.closest(".b-carta[data-k]");if(c)w.__bEscolhaPendente=c.getAttribute("data-k");},true);})();`;
