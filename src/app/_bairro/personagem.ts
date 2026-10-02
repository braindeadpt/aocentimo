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
 */

export const EVT_PERSONAGEM = "b:escolhe-personagem";

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
