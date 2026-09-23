import Link from "next/link";
import type { CSSProperties, ReactNode, Ref } from "react";
import { OrbeEstado } from "@/components/OrbeEstado";
import { IconeEmblema, type NomeIcone } from "@/components/Icone";
import { BotaoCopiar } from "@/components/BotaoCopiar";

/**
 * Cartao — a anatomia Ledger fixa (V3 regra 1, S1-06): cabeçalho
 * (breadcrumb mono · meta · selo de estado), corpo com UMA ideia,
 * controlos opcionais e rodapé (fonte + acções «ver →» / «JSON»).
 *
 * É a casca partilhada dos cartões-instrumento — `Leitura` (linha
 * anotada) já nasce sobre ela; as sessões 3A–3D migram os restantes
 * cartões para a mesma anatomia. Não tem estado nem hooks: serve em
 * componentes de servidor e de cliente. A inversão para papel em
 * hover/focus-within é CSS (vars --l-* em .leitura) — herda-a quem a
 * usar. Container queries: .leitura é `container-type: inline-size`,
 * o conteúdo reage à largura do cartão, não da viewport.
 *
 * O selo de frescura é o <OrbeEstado> (S1-08) — a forma diz o estado;
 * a prop `estado` é a API estável e o estado existe sempre também em
 * texto (`estadoRotulo`) — nunca só a forma.
 */

/** selos de frescura — os estados do orbe (sem «a-recolher»: a
    ingestão ainda não o expõe) */
export type EstadoCartao = "em-dia" | "atrasada" | "sem-sla" | "no-limite";

export interface AcaoCartao {
  /** destino da acção — omitir quando a acção é `copiar` */
  href?: string;
  /** texto da acção — «ver →», «JSON»… (já com a seta, se a tiver) */
  rotulo: ReactNode;
  /** presente → a acção é um botão de copiar (1B-03): põe este texto
      na área de transferência e mostra «Copiado» junto ao botão,
      anunciado a leitores de ecrã — ex.: «JSON» copia o URL do
      endpoint */
  copiar?: string;
  /** nome acessível quando o rótulo não chega («página» → o título) */
  ariaLabel?: string;
  /** true → <a> simples (ficheiro JSON, ligação que sai do app);
      omitido → next/link (navegação interna) */
  externo?: boolean;
}

export interface FonteCartao {
  /** rótulo à esquerda — «Fonte:» / «Fontes:» */
  rotulo: string;
  /** uma ou mais fontes; url interna ("/…") usa next/link, externa
      abre em separador novo com noopener */
  itens: { nome: ReactNode; url?: string }[];
}

export interface CartaoProps {
  /** breadcrumb mono do cabeçalho — "PREÇOS / CABAZ · EUROSTAT" */
  breadcrumb: ReactNode;
  /** ícone do cartão (1B-01) — o nome do conjunto fechado; desenha o
      <IconeEmblema> (quadrado tracejado) à esquerda do breadcrumb */
  icone?: NomeIcone;
  /** spans do lado direito do cabeçalho, antes do selo de estado
      (ex.: "leitura set 2026") */
  meta?: ReactNode[];
  /** selo de frescura — o orbe (S1-08) troca o quadrado sem mudar a API */
  estado?: EstadoCartao;
  /** o estado em texto — nunca omitir: a forma nunca é o único canal */
  estadoRotulo?: string;
  /** controlos físicos do cartão (réguas, presets, toggles) — ficam
      entre o corpo e o rodapé, separados por hairline tracejada */
  controlos?: ReactNode;
  /** fonte do rodapé — «Fonte: Eurostat» com link */
  fonte?: FonteCartao;
  /** acções do rodapé — «ver →» (interna) e «JSON» (externa) */
  acoes?: AcaoCartao[];
  /** variante em largura total — o cartão-herói do painel */
  amplo?: boolean;
  className?: string;
  /** estilos inline do <article> — uso de casa: custom props como o
      --ei do escalonamento de grupo (1B-04) */
  style?: CSSProperties;
  /** ref do <article> — ex.: o useArmado que liga o desenho de entrada */
  ref?: Ref<HTMLElement>;
  /** o corpo — UMA ideia (insight + instrumento) */
  children: ReactNode;
}

function ItemFonte({ nome, url }: { nome: ReactNode; url?: string }) {
  if (!url) return <>{nome}</>;
  if (url.startsWith("/")) {
    return (
      <Link href={url} className="lq-link">
        {nome}
      </Link>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="lq-link"
    >
      {nome}
    </a>
  );
}

export function Cartao({
  breadcrumb,
  icone,
  meta,
  estado,
  estadoRotulo,
  controlos,
  fonte,
  acoes,
  amplo = false,
  className,
  style,
  ref,
  children,
}: CartaoProps) {
  if (
    process.env.NODE_ENV !== "production" &&
    estado !== undefined &&
    !estadoRotulo
  ) {
    // o estado nunca é só a forma — S1-08: o orbe vem acompanhado de texto
    console.warn("[Cartao] `estado` sem `estadoRotulo` — o selo fica mudo.");
  }
  if (process.env.NODE_ENV !== "production") {
    for (const a of acoes ?? []) {
      if (!a.href && a.copiar === undefined) {
        console.warn(
          "[Cartao] acção sem `href` nem `copiar` — um controlo que não faz nada não é honesto."
        );
      }
    }
  }

  const temMeta = (meta && meta.length > 0) || estado !== undefined;
  const temPe = (fonte && fonte.itens.length > 0) || (acoes && acoes.length > 0);

  return (
    <article
      ref={ref}
      style={style}
      className={`leitura ${amplo ? "leitura-amplo" : ""} ${className ?? ""}`}
    >
      <header className="leitura-head">
        {icone && <IconeEmblema nome={icone} />}
        <p className="leitura-breadcrumb">{breadcrumb}</p>
        {temMeta && (
          <p className="leitura-meta num">
            {meta?.map((item, i) => <span key={i}>{item}</span>)}
            {estado && (
              <span className="leitura-estado">
                <OrbeEstado estado={estado} />
                {estadoRotulo}
              </span>
            )}
          </p>
        )}
      </header>

      <div className="leitura-corpo">{children}</div>

      {controlos && <div className="leitura-controlos">{controlos}</div>}

      {temPe && (
        <footer className="leitura-foot">
          {fonte && fonte.itens.length > 0 && (
            <p className="leitura-fonte">
              {fonte.rotulo}:{" "}
              {fonte.itens.length === 1 ? (
                <ItemFonte {...fonte.itens[0]} />
              ) : (
                fonte.itens.map((f, i) => (
                  <span key={i}>
                    {i > 0 && " · "}
                    <ItemFonte {...f} />
                  </span>
                ))
              )}
            </p>
          )}
          {acoes && acoes.length > 0 && (
            <p className="leitura-acoes">
              {acoes.map((a, i) =>
                a.copiar !== undefined ? (
                  <BotaoCopiar
                    key={i}
                    texto={a.copiar}
                    rotulo={a.rotulo}
                    variante="ligacao"
                    ariaLabel={a.ariaLabel}
                  />
                ) : a.externo ? (
                  <a key={a.href} href={a.href} className="lq-link">
                    {a.rotulo}
                  </a>
                ) : (
                  <Link
                    key={a.href}
                    href={a.href!}
                    className="lq-link"
                    aria-label={a.ariaLabel}
                  >
                    {a.rotulo}
                  </Link>
                )
              )}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
