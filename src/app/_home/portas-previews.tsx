import type { CSSProperties } from "react";
import { OrbeEstado, type EstadoOrbe } from "@/components/OrbeEstado";
import { fmtEUR, fmtEUR0, fmtLitro, fmtPct } from "@/lib/format";
import { t, type Messages } from "@/lib/messages";

/** a copy da secção — o bloco `home.portas` do pt.json */
export type PortasStrings = Messages["home"]["portas"];

/**
 * As quatro mini-prévias de «Escolhe a tua pergunta» (S2-03).
 *
 * Componentes de servidor puros — toda a vida é CSS (portas.css):
 * em repouso mostram os dados reais já impressos; ao passar/focar o
 * cartão, o papel imprime (`.pq-imprime` escalonado por `--i`), o IVA
 * separa-se das linhas para o cupão, o juro e o capital trocam de peso
 * e os orbes respiram. Em reduced-motion o bloco global corta tudo —
 * o estado base é sempre o final, honesto e completo.
 *
 * Tudo o que é número vem por props do servidor (o motor fiscal e a
 * prestação nunca entram no cliente); toda a copy vem na prop `s`
 * (o bloco `home.portas` do pt.json).
 * Os valores dentro do cartão são `aria-hidden` — a frase do cartão é
 * o equivalente textual com os números-chave.
 */

/** recibo canónico resumido — o que a page extrai de cenarioCanonico()
    + a tabela de retenção (da linha de cenarios-salario.json) */
export interface PortaRecibo {
  bruto: number;
  ss: number;
  irs: number;
  liquido: number;
  /** ex.: "I" — null esconde a linha de meta em vez de inventar */
  tabela: string | null;
  ano: number;
}

/** linha do mini-talão já decomposta — taxa real de iva.json,
    iva/semIva do motor (ivaContido) */
export interface PortaIvaLinha {
  nome: string;
  preco: number;
  taxa: number;
  iva: number;
  semIva: number;
}

/** a prestação canónica — extremos do plano do motor
    (simularPrestacao), nunca interpolados */
export interface PortaPrestacao {
  /** prestação mensal constante (sistema francês) */
  valor: number;
  /** o empréstimo — capital inicial do plano */
  capital: number;
  meses: number;
  /** TAN em percentagem (ex.: 3.5131) — para a nota do cartão */
  tan: number;
  primeiro: { juro: number; capital: number };
  ultimo: { juro: number; capital: number };
}

export interface PortaOrbe {
  id: string;
  rotulo: string;
  estado: EstadoOrbe;
  estadoRotulo: string;
}

const varI = (i: number) => ({ "--i": i }) as CSSProperties;

/** «O que ganhas» — o recibo de vencimento em miniatura: bruto, os
    dois cortes e o líquido do cenário canónico. Ao foco imprime-se
    linha a linha, de cima para baixo, como na impressora térmica. */
export function PreviewRecibo({
  d,
  s,
}: {
  d: PortaRecibo;
  s: PortasStrings["ganhas"]["recibo"];
}) {
  return (
    <div className="pq-doc pq-recibo">
      <p className="pq-doc-head">{s.titulo}</p>
      <p className="pq-doc-sub pq-doc-dim">{s.sub}</p>
      <dl className="pq-doc-body">
        <div className="pq-linha pq-doc-sep pq-imprime" style={varI(0)}>
          <dt className="pq-doc-dim">{s.bruto}</dt>
          <dd>{fmtEUR(d.bruto)}</dd>
        </div>
        <div className="pq-linha pq-doc-sep pq-imprime" style={varI(1)}>
          <dt className="pq-doc-dim">{s.ss}</dt>
          <dd>
            {fmtEUR(d.ss)} −
          </dd>
        </div>
        <div className="pq-linha pq-doc-sep pq-imprime" style={varI(2)}>
          <dt className="pq-doc-dim">{s.irs}</dt>
          <dd>
            {fmtEUR(d.irs)} −
          </dd>
        </div>
        <div className="pq-linha pq-doc-cut pq-imprime" style={varI(3)}>
          <dt className="pq-doc-total">{s.liquido}</dt>
          <dd className="pq-doc-hero">{fmtEUR(d.liquido)}</dd>
        </div>
      </dl>
      <p className="pq-doc-meta pq-doc-dim pq-imprime" style={varI(4)}>
        {d.tabela
          ? t(s.meta, { tabela: d.tabela, ano: d.ano })
          : t(s.metaSemTabela, { ano: d.ano })}
      </p>
    </div>
  );
}

/** «O que pagas» — o talão de combustível com o IVA a separar-se:
    cada linha traz a mini-barra [sem IVA | IVA]; ao foco a fatia
    destacada sai da linha e o cupão RESUMO IVA recebe-a. Preços
    médios do dia da DGEG (prop), IVA a 23 % de iva.json pelo motor
    (ivaContido), fonte e data da série carimbadas no talão.
    linhas = null → a série falhou: frase honesta, nunca um número. */
export function PreviewIva({
  linhas,
  total,
  totalIva,
  quando,
  fonte,
  s,
}: {
  linhas: PortaIvaLinha[] | null;
  total: number;
  totalIva: number;
  quando: string;
  fonte: string;
  s: PortasStrings["pagas"]["talao"];
}) {
  if (!linhas) {
    return (
      <p className="pq-doc pq-vazio pq-doc-meta pq-doc-dim">{s.falhou}</p>
    );
  }
  return (
    <div className="pq-doc pq-iva">
      <p className="pq-doc-head">{s.titulo}</p>
      <p className="pq-doc-sub pq-doc-dim">{s.sub}</p>
      <ul className="pq-doc-body">
        {linhas.map((l, i) => (
          <li
            key={l.nome}
            className="pq-iva-item pq-doc-sep pq-imprime"
            style={varI(i)}
          >
            <span className="pq-iva-row">
              <span className="pq-doc-dim">{l.nome}</span>
              <span>{fmtLitro(l.preco)}</span>
            </span>
            <span className="pq-iva-row">
              <span className="pq-doc-meta pq-doc-dim">
                IVA {fmtPct(l.taxa, 0)} · {fmtEUR(l.iva)}
              </span>
              <span className="pq-iva-mini" aria-hidden="true">
                <span
                  className="pq-iva-base"
                  style={{ width: `${(l.semIva / l.preco) * 100}%` }}
                />
                <span
                  className="pq-iva-fatia"
                  style={{ width: `${(l.iva / l.preco) * 100}%` }}
                />
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div
        className="pq-linha pq-doc-cut pq-imprime"
        style={varI(linhas.length)}
      >
        <span className="pq-doc-total">{s.total}</span>
        <span className="pq-doc-num">{fmtEUR(total)}</span>
      </div>
      <div className="pq-iva-cupao pq-imprime" style={varI(linhas.length + 1)}>
        <span className="pq-doc-meta pq-doc-dim">{s.resumo}</span>
        <span className="pq-iva-barra" aria-hidden="true">
          <span className="pq-iva-barra-f" />
        </span>
        <span className="pq-doc-num">{fmtEUR(totalIva)}</span>
      </div>
      <p
        className="pq-doc-meta pq-doc-dim pq-imprime"
        style={varI(linhas.length + 2)}
      >
        {t(s.meta, { fonte, quando })}
      </p>
    </div>
  );
}

/** «O banco» — a prestação constante em que o juro e o capital trocam
    de peso: a barra nasce no mês 1 (quase tudo juro) e, ao foco, a
    divisória oscila até ao último mês (quase tudo capital). Números
    reais do plano do motor, passados por props; null = a série da
    Euribor falhou — diz-se, sem inventar. */
export function PreviewBanco({
  d,
  s,
}: {
  d: PortaPrestacao | null;
  s: PortasStrings["banco"];
}) {
  if (!d) {
    return (
      <p className="pq-doc pq-vazio pq-doc-meta pq-doc-dim">{s.falhou}</p>
    );
  }
  const j1 = (d.primeiro.juro / d.valor) * 100;
  const jN = (d.ultimo.juro / d.valor) * 100;
  return (
    <div className="pq-doc pq-banco">
      <div className="pq-linha pq-imprime" style={varI(0)}>
        <span className="pq-doc-meta pq-doc-dim">{s.prestacao}</span>
        <span className="pq-doc-num">{fmtEUR(d.valor)}</span>
      </div>
      <div className="pq-banco-barra pq-imprime" style={varI(1)}>
        <span
          className="pq-banco-juro"
          style={
            {
              width: `${j1}%`,
              "--j1": `${j1}%`,
              "--jN": `${jN}%`,
            } as CSSProperties
          }
        />
        <span className="pq-banco-cap" />
      </div>
      <div
        className="pq-banco-escala pq-doc-meta pq-doc-dim pq-imprime"
        style={varI(2)}
      >
        <span>{s.mesA}</span>
        <span>{t(s.mesB, { meses: d.meses })}</span>
      </div>
      <div className="pq-banco-leg pq-doc-meta pq-imprime" style={varI(3)}>
        <span className="pq-doc-dim">
          <span
            className="pq-sw"
            style={{ background: "var(--pq-accent)" }}
            aria-hidden="true"
          />
          {s.legJuro}
        </span>
        <span className="pq-doc-dim">
          <span
            className="pq-sw"
            style={{ background: "var(--pq-ink2)" }}
            aria-hidden="true"
          />
          {s.legCap}
        </span>
      </div>
      <p className="pq-doc-meta pq-doc-dim pq-imprime" style={varI(4)}>
        {t(s.juros, {
          a: fmtEUR(d.primeiro.juro),
          n: d.meses,
          b: fmtEUR(d.ultimo.juro),
        })}
      </p>
      <p className="pq-doc-meta pq-doc-dim pq-imprime" style={varI(5)}>
        {t(s.nota, {
          capital: fmtEUR0(d.capital),
          meses: d.meses,
          tan: fmtPct(d.tan / 100),
        })}
      </p>
    </div>
  );
}

/** «O país» — a grelha de orbes de estado com as séries reais do
    painel: a forma diz a frescura e o texto ao lado repete-a. Ao foco
    os orbes respiram, escalonados por `--i`. */
export function PreviewOrbes({ series }: { series: PortaOrbe[] }) {
  return (
    <ul className="pq-orbes">
      {series.map((serie, i) => (
        <li key={serie.id} className="pq-orbe-celula" style={varI(i)}>
          <OrbeEstado estado={serie.estado} tamanho={15} className="pq-orbe" />
          <span className="pq-orbe-nome">{serie.rotulo}</span>
          <span className="pq-orbe-estado">{serie.estadoRotulo}</span>
        </li>
      ))}
    </ul>
  );
}
