"use client";

/**
 * As sete cartas do elenco (P1-4 do PACK; o `CARTAS` do mapa.tpl.html).
 *
 * Componente de cliente PEQUENO de propósito: só liga o clique ao
 * bairro, despachando `EVT_PERSONAGEM`. Todo o texto chega pronto do
 * servidor — nada de `pt.json` nem `data/` aqui dentro.
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
import { ELENCO, pessoa, type ChaveElenco } from "@/lib/bairro/personagens";
import type { EscolhaPersonagem } from "./personagem";
import { janela, pedirPersonagem } from "./ponte-cartas";

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

/**
 * A captura sem React, em texto para ir num <script> inline. Tem de
 * ser uma função SEM dependências (vive no HTML do servidor) e sem
 * TypeScript — daí não exportada em tipos.
 * Guarda o pedido na fila do window; o <Bairro> drena ao montar.
 */
function capturaCarta() {
  document.addEventListener(
    "click",
    (e) => {
      const marca = (window.__bToque = (window.__bToque || 0) + 1);
      let alvo = e.target as HTMLElement | null;
      while (alvo) {
        if (
          alvo.classList &&
          alvo.classList.contains("b-carta") &&
          alvo.getAttribute("data-d")
        ) {
          // este ouvinte é de CAPTURA: corre ANTES do React. Se o
          // onClick da carta também levar a cabo este mesmo toque,
          // ele aumenta o contador e nós recuamos — abrir duas vezes
          // era abrir e fechar o painel.
          const carta = alvo;
          const aplica = function () {
            let pedido;
            try {
              pedido = JSON.parse(carta.getAttribute("data-d") ?? "");
            } catch {
              return; /* data-d corrompido: deixa o React tratar */
            }
            (window.__bEscolhas = window.__bEscolhas || []).push(pedido);
            window.dispatchEvent(
              new CustomEvent("b:escolhe-personagem", { detail: pedido })
            );
          };
          // o React trata o toque no mesmo evento, logo ainda não
          // atendeu: agendamos para depois do ciclo de propagação
          setTimeout(() => {
            if ((window.__bToque || 0) === marca) aplica();
          }, 0);
          return;
        }
        alvo = alvo.parentElement;
      }
    },
    true
  );
}

export function Cartas({
  cartas,
  comum,
}: {
  cartas: readonly CartaDados[];
  comum: CartasComum;
}) {
  return (
    <div className="b-cartas">
      {/* Rede de segurança SEM React: um toque pode chegar antes de a
          carta hidratar (num telemóvel lento), e aí o onClick não
          existe. Este script inline corre no HTML do servidor — liga
          um ouvinte de captura que guarda o pedido na fila; quando o
          <Bairro> montar, drena-a. O detalhe viaja em data-d (JSON),
          não em JS: zero bundle, zero closure. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(${capturaCarta.toString()})();`,
        }}
      />
      {cartas.map((c) => {
        const [chave, nome, papel, , perfil, aprende] = c;
        const { svg, viewBox } = figuraDaCarta(chave);
        return (
          <button
            key={chave}
            type="button"
            className="b-carta"
            data-k={chave}
            data-d={JSON.stringify(escolha(c, comum))}
            aria-label={`${nome}, ${papel[0].toLowerCase()}${papel.slice(1)}`}
            aria-describedby={`b-a-${chave}`}
            onClick={() => pedirPersonagem(escolha(c, comum), janela())}
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
