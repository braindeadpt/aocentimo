import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { m } from "@/lib/messages";
import { LinkVoo, TituloPagina } from "@/components/Voo";

/**
 * Pagina — o template de três níveis (V4, S1-06), obrigatório em todas
 * as rotas de conteúdo (a migração é das sessões 3A–3D):
 *
 *   1 · A resposta — a pergunta (h1) + UM instrumento + UMA frase
 *       simples com o número (≤ ~25 palavras, sem jargão — legível por
 *       alguém de 12 anos);
 *   2 · Explora    — os controlos e a visualização própria da página;
 *   3 · Confirma   — tabelas, legislação, fórmulas, fontes, JSON, em
 *       <PaginaDetalhe> (<details> fechado por omissão, rótulo claro);
 *   e a pergunta seguinte — nenhuma página é um beco.
 *
 * Cada nível é uma <section aria-labelledby>: o nível 1 é etiquetado
 * pelo h1 da página (a pergunta é o nome da secção); os níveis 2 e 3
 * têm h2 próprio. Componente de SERVIDOR — lê os rótulos fixos de
 * `m.pagina` (Explora / Confirma / a pergunta seguinte), por isso não
 * pode ser importada por um client component.
 *
 * Guardas de dev (não falham build — console.warn em NODE_ENV ≠
 * production): mais de UM instrumento na resposta, ou frase com mais
 * de ~25 palavras.
 */

export interface RespostaPagina {
  /** UM instrumento — a peça que mostra a resposta (CampoCentimos,
      Leitura, talão…). Mais de um é um aviso em dev. */
  instrumento: ReactNode;
  /** UMA frase simples com o número — ≤ ~25 palavras, sem jargão */
  frase: ReactNode;
}

export interface PaginaProps {
  /** a pergunta da página — o h1 (o único da rota) */
  pergunta: string;
  /** o caminho desta página ("/salario") — activa a aterragem do voo:
      o h1 ganha o nome partilhado que a «pergunta seguinte» da página
      anterior morfa até aqui. Só com `perguntaAs` h1 (o defeito). */
  rota?: string;
  /** eyebrow sobre o h1 — o tema («Preços no consumidor») */
  kicker?: ReactNode;
  resposta: RespostaPagina;
  /** nível 2 — controlos e a visualização própria da página */
  explora: ReactNode;
  /** nível 3 — em <PaginaDetalhe>, fechado por omissão */
  confirma: ReactNode;
  /** a pergunta seguinte — liga à próxima página lógica */
  seguinte?: { href: string; rotulo: string };
  /** base dos ids dos landmarks — por omissão deriva da pergunta */
  idBase?: string;
  /** "h2" só para embutir a Pagina como demonstração (a /estilo já tem
      o seu h1). Em produção a pergunta é sempre h1. */
  perguntaAs?: "h1" | "h2";
}

/** slug determinista para os ids aria-labelledby — SSR estável */
function slugDe(pergunta: string): string {
  const s = pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "pagina";
}

/** texto de um ReactNode — para a contagem de palavras da frase */
function textoDe(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number")
    return String(node);
  if (Array.isArray(node)) return node.map(textoDe).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textoDe(node.props.children);
  return "";
}

/** conta as peças de nível 1 — achata arrays e fragments: um fragment
    com dois instrumentos são dois instrumentos */
function nInstrumentos(node: ReactNode): number {
  let n = 0;
  for (const el of Children.toArray(node)) {
    if (isValidElement<{ children?: ReactNode }>(el) && el.type === Fragment)
      n += nInstrumentos(el.props.children);
    else n += 1;
  }
  return n;
}

export function Pagina({
  pergunta,
  rota,
  kicker,
  resposta,
  explora,
  confirma,
  seguinte,
  idBase,
  perguntaAs,
}: PaginaProps) {
  if (process.env.NODE_ENV !== "production") {
    const n = nInstrumentos(resposta.instrumento);
    if (n > 1)
      console.warn(
        `[Pagina] «${pergunta}»: o nível 1 tem ${n} instrumentos — o contrato é UM.`
      );
    const palavras = textoDe(resposta.frase)
      .split(/\s+/)
      .filter(Boolean).length;
    if (palavras > 25)
      console.warn(
        `[Pagina] «${pergunta}»: a frase da resposta tem ${palavras} palavras — o contrato é ≤ ~25.`
      );
  }

  const id = idBase ?? slugDe(pergunta);
  const Pergunta = perguntaAs === "h2" ? "h2" : "h1";
  // a aterragem do voo é o h1 real da página — a demo h2 da /estilo
  // não participa (não é o título da rota)
  const aterragem = rota !== undefined && Pergunta === "h1";
  const perguntaEl = aterragem ? (
    <TituloPagina rota={rota} id={`${id}-pergunta`}>
      {pergunta}
    </TituloPagina>
  ) : (
    <Pergunta id={`${id}-pergunta`} className="titulo-pagina">
      {pergunta}
    </Pergunta>
  );

  return (
    <div className="pagina mx-auto max-w-5xl px-5 pt-14">
      <section className="pg-nivel" aria-labelledby={`${id}-pergunta`}>
        {kicker && <p className="kicker">{kicker}</p>}
        {perguntaEl}
        <div className="pg-instrumento">{resposta.instrumento}</div>
        <p className="pg-frase">{resposta.frase}</p>
      </section>

      <section className="pg-nivel" aria-labelledby={`${id}-explora`}>
        <h2 id={`${id}-explora`} className="pg-h">
          <span className="pg-h-num" aria-hidden="true">
            2
          </span>
          {m.pagina.explora}
        </h2>
        {explora}
      </section>

      <section className="pg-nivel" aria-labelledby={`${id}-confirma`}>
        <h2 id={`${id}-confirma`} className="pg-h">
          <span className="pg-h-num" aria-hidden="true">
            3
          </span>
          {m.pagina.confirma}
        </h2>
        {confirma}
      </section>

      {seguinte && (
        <div className="pg-seguinte">
          <p className="kicker-xs">{m.pagina.aSeguir}</p>
          {/* a partida do voo — o selo só existe neste Link: outros
              caminhos para a mesma rota não morfam (regra 1B-04) */}
          <LinkVoo href={seguinte.href} className="pg-seguinte-lnk">
            {seguinte.rotulo}
            <span aria-hidden="true"> →</span>
          </LinkVoo>
        </div>
      )}
    </div>
  );
}

/**
 * PaginaDetalhe — a unidade do nível 3 «Confirma»: um <details>
 * fechado por omissão, com o rótulo claro no <summary>. Tabelas,
 * legislação, fórmulas, fontes e JSON vivem aqui — quem confirma abre.
 */
export function PaginaDetalhe({
  rotulo,
  aberto = false,
  children,
}: {
  /** o rótulo do detalhe — diz o que está dentro («A tabela completa») */
  rotulo: ReactNode;
  /** aberto no SSR — excepção; o defeito é fechado */
  aberto?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="pg-detalhe" open={aberto || undefined}>
      <summary>{rotulo}</summary>
      <div className="pg-detalhe-corpo">{children}</div>
    </details>
  );
}
