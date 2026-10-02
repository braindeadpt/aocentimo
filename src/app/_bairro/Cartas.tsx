"use client";

/**
 * As sete cartas do elenco (P1-4 do PACK; o `CARTAS` do mapa.tpl.html).
 *
 * Componente de cliente PEQUENO de propósito: só liga o clique ao
 * bairro, despachando `EVT_PERSONAGEM`. Todo o texto e até a figura SVG
 * (`pessoa(ELENCO[·])`, a mesma do mapa) chegam prontos do servidor —
 * nada de `pt.json` nem `data/` aqui dentro.
 *
 * Cada carta é um `<button>`: foco visível pelo CSS (`:focus-visible`
 * levanta-a como o hover), Enter/Espaço disparam o clique, a figura é
 * `aria-hidden` e o nome acessível é «Nome, papel». O `b-aprende` fica
 * ligado por `aria-describedby` — o perfil e a promessa lêem-se a seguir
 * ao nome.
 */
import { EVT_PERSONAGEM, type EscolhaPersonagem } from "./personagem";

export interface CartaDados {
  /** ines | diana | pedro | manuel | arminda | goncalo | rui */
  chave: string;
  nome: string;
  papel: string;
  /** O nome acessível do botão — «Inês, operária da fábrica». */
  acessivel: string;
  /** O perfil económico — «Conta de outrem · setor privado». */
  perfil: string;
  /** O que se aprende, já com os números dos dados lá dentro. */
  aprende: string;
  /** A cor do fundo da carta. */
  cor: string;
  viewBox: string;
  /** O interior do `<svg>` da figura, gerado no servidor com `pessoa()`. */
  figura: string;
  /** O que o painel mostra ao abrir (texto pronto do servidor). */
  painel: EscolhaPersonagem;
}

export function Cartas({ cartas }: { cartas: readonly CartaDados[] }) {
  return (
    <div className="b-cartas">
      {cartas.map((c) => (
        <button
          key={c.chave}
          type="button"
          className="b-carta"
          data-k={c.chave}
          aria-label={c.acessivel}
          aria-describedby={`b-aprende-${c.chave}`}
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent(EVT_PERSONAGEM, { detail: c.painel })
            )
          }
        >
          <div className="b-fundo-carta" style={{ background: c.cor }}>
            {/* a figura é decorativa — o nome acessível já diz quem é */}
            <svg
              viewBox={c.viewBox}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: c.figura }}
            />
          </div>
          <b>{c.nome}</b>
          <span className="b-papel">{c.papel}</span>
          <span className="b-aprende" id={`b-aprende-${c.chave}`}>
            <i>{c.perfil}.</i> {c.aprende}
          </span>
        </button>
      ))}
    </div>
  );
}
