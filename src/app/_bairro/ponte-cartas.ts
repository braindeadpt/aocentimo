import { EVT_PERSONAGEM, type EscolhaPersonagem } from "./personagem";

/**
 * A ponte carta → bairro, sem janela de perda.
 *
 * O problema: uma carta tocada antes de o React hidratar não tem
 * `onClick` nenhum — o toque vai ao vazio. E mesmo depois de
 * hidratada, o `<Bairro>` só passa a ouvir no `useEffect`, que corre
 * depois do commit: há uma segunda janela. Medido a 40× de CPU, 6 em
 * 15 toques não despachavam evento nenhum e mais 3 despachavam para
 * um `<Bairro>` que ainda não tinha ouvinte. O painel nunca abria e o
 * utilizador pensava que a carta não funcionava.
 *
 * A correcção é uma fila: quem pede guarda o pedido, e quem chega
 * depois aplica-o. Nenhum dos dois lados tem de estar pronto à mesma
 * hora — é o que torna o toque confiável num telemóvel lento.
 *
 * O alvo é argumento (e não o `window` global) para o teste correr em
 * Node sem jsdom. O browser passa o `window`; o script inline da
 * carta escreve no `window` directamente, que é o mesmo sítio.
 */

// o script inline da carta (Cartas.tsx) escreve nisto sem tipos
declare global {
  interface Window {
    /** pedidos à espera de o <Bairro> os aplicar (ver drenarEscolhas). */
    __bEscolhas?: EscolhaPersonagem[];
    /** contador de toques: o onClick do React aumenta-o, e é assim que
        a captura inline sabe que já houve quem tratasse do toque. */
    __bToque?: number;
  }
}

/** O mínimo de que a ponte precisa — o `window` no browser. */
export interface AlvoEscolhas extends EventTarget {
  __bEscolhas?: EscolhaPersonagem[];
}

function filaDe(alvo: AlvoEscolhas): EscolhaPersonagem[] {
  return (alvo.__bEscolhas ??= []);
}

/** O pedido é anunciado E fica à espera de quem o sirva. */
export function pedirPersonagem(
  detalhe: EscolhaPersonagem,
  alvo: AlvoEscolhas
): void {
  filaDe(alvo).push(detalhe);
  alvo.dispatchEvent(
    new CustomEvent(EVT_PERSONAGEM, { detail: detalhe })
  );
}

/**
 * O `<Bairro>` drena a fila ao montar. Devolve quantos aplicou — o
 * teste usa-o para provar que um pedido que chegou cedo foi servido em
 * vez de perdido.
 */
export function drenarEscolhas(
  aoServir: (d: EscolhaPersonagem) => void,
  alvo: AlvoEscolhas
): number {
  const fila = filaDe(alvo);
  if (fila.length === 0) return 0;
  // esvazia ANTES de servir: um `aoServir` lento não pode fazer o
  // mesmo pedido ser aplicado duas vezes
  alvo.__bEscolhas = [];
  for (const d of fila) aoServir(d);
  return fila.length;
}

/** O alvo real no browser. */
export function janela(): AlvoEscolhas {
  return window as unknown as AlvoEscolhas;
}
