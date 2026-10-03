"use client";

/**
 * As sete cartas do elenco (P1-4 do PACK; o `CARTAS` do mapa.tpl.html).
 *
 * Componente de cliente PEQUENO de propósito: só liga o clique ao
 * bairro, despachando `EVT_PERSONAGEM`. Todo o texto chega pronto do
 * servidor — nada de `pt.json` nem `data/` aqui dentro.
 *
 * E, ao montar, entrega uma escolha que tenha chegado antes de haver
 * hydration (a ponte de `personagem.ts`).
 *
 * As figuras NÃO chegam por props: um SVG por carta viajava duplicado
 * no payload RSC (+8,4 KB gzip na home). Desenham-se aqui com
 * `pessoa(ELENCO[·])` — o kit é puro, determinístico e já está no
 * bundle do mapa; o SSR do build continua a pô-las no HTML.
 *
 * Cada carta é um `<button>`: foco visível pelo CSS (`:focus-visible`
 * levanta-a como o hover), Enter/Espaço disparam o clique, a figura é
 * `aria-hidden` e o nome acessível é «Nome, papel». O `b-aprende` fica
 * ligado por `aria-describedby` — o perfil e a promessa lêem-se a seguir
 * ao nome.
 */
import { useEffect } from "react";
import { ELENCO, pessoa, type ChaveElenco } from "@/lib/bairro/personagens";
import {
  EVT_BAIRRO_PRONTO,
  EVT_PERSONAGEM,
  escolhaPendente,
  consumirPendente,
  type EscolhaPersonagem,
} from "./personagem";

/** O que uma carta precisa — tuplo porque os nomes das chaves de um
    objeto repetem-se sete vezes no payload RSC (~60 B gzip de nada). */
export type CartaDados = [
  /** ines | diana | pedro | manuel | arminda | goncalo | rui */
  chave: ChaveElenco,
  nome: string,
  papel: string,
  /** O vocativo do «Olá!» — «a Inês», «o Rui, e esta é a Marta». */
  ola: string,
  /** O perfil económico — «Conta de outrem · setor privado». */
  perfil: string,
  /** O que se aprende, já com os números dos dados lá dentro. */
  aprende: string,
];

/** O que as sete cartas partilham — vem uma vez, não sete. */
export type CartasComum = [
  /** O molde do «Olá!» — «Olá! Sou {quem}.» */
  olaTpl: string,
  emBreve: string,
  segue: string,
  fechar: string,
];

/** A figura da carta — a do «rui» é o casal, como no protótipo. O
    `pessoa()` formata o SVG com indentação; nas cartas isso é peso
    morto na home, por isso o whitespace entre tags sai aqui. */
function figuraDaCarta(chave: ChaveElenco): { svg: string; viewBox: string } {
  const cru =
    chave === "rui"
      ? `<g transform="translate(-18 0)">${pessoa(ELENCO.rui)}</g><g transform="translate(20 0)">${pessoa(ELENCO.marta)}</g>`
      : pessoa(ELENCO[chave]);
  return {
    viewBox: chave === "rui" ? "-60 -142 120 150" : "-42 -142 84 150",
    svg: cru
      // nas cartas a figura é decorativa: data-nome e as classes são
      // ganchos do mapa (o aceno, o e2e) — aqui não servem e é HTML morto
      .replace(/ (data-nome|class)="[^"]*"/g, "")
      .replace(/ transform="scale\(1\)"/g, "") // o kit emite o no-op
      .replace(/>\s+</g, "><")
      .trim(),
  };
}

/** Monta o detalhe do evento — as partes repetidas vêm do `comum`. */
function escolha(c: CartaDados, cm: CartasComum): EscolhaPersonagem {
  const [chave, nome, papel, ola, perfil, aprende] = c;
  return {
    chave,
    quem: `${nome} · ${papel}`,
    fala: `${cm[0].replace("{quem}", ola)} ${aprende} <span class="b-a">${cm[1]}</span> ${cm[2]}`,
    extra: perfil,
    fechar: cm[3],
  };
}

export function Cartas({
  cartas,
  comum,
}: {
  cartas: readonly CartaDados[];
  comum: CartasComum;
}) {
  /**
   * Um clique pode ter chegado ANTES desta hidratação (ver a ponte em
   * `personagem.ts`). A `PONTE_JS` guardou a chave; aqui traduz-se para
   * o pedido completo e entrega-se ao bairro.
   *
   * A entrega só acontece quando as DUAS partes estão prontas: o bairro
   * tem de estar à escuta e estas cartas têm de estar montadas. Se o
   * bairro ainda não estiver, espera-se pelo aviso dele — assim a ordem
   * em que o React hidrata as duas árvores não decide se o pedido se
   * perde. A escolha só se gasta quando foi mesmo entregue.
   */
  useEffect(() => {
    const g = globalThis as { __bBairroPronto?: boolean; __bCartasPronto?: boolean };
    const entregar = () => {
      if (!g.__bBairroPronto) return; // ainda ninguém à escuta: tenta-se outra vez
      const chave = escolhaPendente();
      const c = chave ? cartas.find((x) => x[0] === chave) : undefined;
      if (!c) return;
      consumirPendente();
      window.dispatchEvent(
        new CustomEvent(EVT_PERSONAGEM, { detail: escolha(c, comum) })
      );
    };
    g.__bCartasPronto = true;
    if (g.__bBairroPronto) {
      entregar();
      return;
    }
    window.addEventListener(EVT_BAIRRO_PRONTO, entregar, { once: true });
    return () => window.removeEventListener(EVT_BAIRRO_PRONTO, entregar);
  }, [cartas, comum]);

  return (
    <div className="b-cartas">
      {cartas.map((c) => {
        const [chave, nome, papel, , perfil, aprende] = c;
        const { svg, viewBox } = figuraDaCarta(chave);
        return (
          <button
            key={chave}
            type="button"
            className="b-carta"
            data-k={chave}
            aria-label={`${nome}, ${papel[0].toLowerCase()}${papel.slice(1)}`}
            aria-describedby={`b-a-${chave}`}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent(EVT_PERSONAGEM, { detail: escolha(c, comum) })
              )
            }
          >
            {/* a cor vem do CSS por [data-k] — não é texto, não é
                dado: não gasta HTML nem payload */}
            <div className="b-fundo-carta">
              {/* a figura é decorativa — o nome acessível já diz quem é */}
              <svg
                viewBox={viewBox}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
            <b>{nome}</b>
            <span className="b-papel">{papel}</span>
            <span className="b-aprende" id={`b-a-${chave}`}>
              <i>{perfil}.</i> {aprende}
            </span>
          </button>
        );
      })}
    </div>
  );
}
