import type { Metadata } from "next";
import Link from "next/link";
import { ALT_FEED } from "@/lib/meta";
import { GLOSSARIO } from "@/content/glossario";
import { JsonLd, faqPage } from "@/lib/jsonld";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { m } from "@/lib/messages";
import {
  exemploDe,
  gruposDoGlossario,
  type GrupoId,
} from "./conteudo";
import { PesquisaGlossario } from "./PesquisaGlossario";

export const metadata: Metadata = {
  title: "Aprender — glossário de dinheiro",
  description:
    "Euribor, spread, TAN, TAEG, MTIC, escalões, retenção na fonte: os termos do dinheiro em Portugal explicados em português simples, com exemplos.",
  alternates: { canonical: "/aprender", types: ALT_FEED },
};

/** as páginas de cada pergunta — os mesmos grupos da navegação do site,
 *  para o glossário e a nav contarem a mesma história */
const PAGINAS_GRUPO: Record<GrupoId, string> = {
  ganhas: "Salário · IRS · Trabalho",
  pagas: "Impostos · Preços · Inflação",
  banco: "Crédito · Casa · Poupança",
  pais: "Dados",
};

export default function AprenderPage() {
  // FAQPage derivada do glossário — mesma fonte, sem duplicação
  const ld = faqPage(
    GLOSSARIO.map((t) => ({
      pergunta: `O que é ${t.termo}?`,
      resposta: t.exemplo
        ? `${t.definicao} Exemplo: ${t.exemplo}`
        : t.definicao,
    }))
  );

  const rotulosNav: Record<GrupoId, string> = {
    ganhas: m.nav.grupoGanhas,
    pagas: m.nav.grupoPagas,
    banco: m.nav.grupoBanco,
    pais: m.nav.grupoPais,
  };
  const grupos = gruposDoGlossario().map((g) => ({
    ...g,
    rotulo: rotulosNav[g.id],
    paginas: PAGINAS_GRUPO[g.id],
  }));

  return (
    <>
      <JsonLd data={ld} />
      <Pagina
        pergunta="O que querem dizer estes termos?"
        rota="/aprender"
        kicker={m.aprender.kicker}
        resposta={{
          /* o instrumento do glossário é o mapa das quatro perguntas —
             a mesma organização da navegação, com a contagem à vista */
          instrumento: (
            <nav
              aria-label={m.aprender.navGrupos}
              className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4"
            >
              {grupos.map((g) => (
                <a
                  key={g.id}
                  href={`#ap-${g.id}`}
                  className="group bg-panel px-4 py-4 transition-colors hover:bg-raised"
                >
                  <span className="kicker-xs block">{g.rotulo}</span>
                  <span className="num mt-2 block text-display-sm text-ink">
                    {g.termos.length}
                  </span>
                  <span className="footnote mt-1 block">
                    {g.termos.length === 1
                      ? "1 termo"
                      : `${g.termos.length} termos`}
                    {" · "}
                    {g.paginas}
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 block text-rotulo text-muted transition-colors group-hover:text-ink group-hover:underline group-hover:decoration-mark group-hover:underline-offset-2"
                  >
                    ↓
                  </span>
                </a>
              ))}
            </nav>
          ),
          frase: m.aprender.frase.replace("{total}", String(GLOSSARIO.length)),
        }}
        explora={
          <PesquisaGlossario
            total={GLOSSARIO.length}
            grupos={grupos.map((g) => ({
              id: g.id,
              rotulo: g.rotulo,
              notaVazio: g.id === "pais" ? m.aprender.paisVazio : undefined,
              termos: g.termos.map((t) => ({
                slug: t.slug,
                termo: t.termo,
                definicao: t.definicao,
                /* exemploDe — não só t.exemplo: a frase do índice
                   promete um exemplo por termo e o mapa editorial
                   cobre os que o glossário ainda não tem */
                exemplo: exemploDe(t),
              })),
            }))}
            textos={{
              rotulo: m.aprender.pesquisa,
              placeholder: m.aprender.pesquisaPlaceholder,
              contagem: m.aprender.contagem,
              vazio: m.aprender.vazio,
              vazioNota: m.aprender.vazioNota,
            }}
          />
        }
        confirma={
          <>
            <PaginaDetalhe rotulo={m.aprender.comoFeito}>
              <div className="body-copy space-y-3 max-w-2xl">
                <p>
                  Cada termo tem três camadas: a frase simples e o exemplo
                  com números à entrada, a ideia desenhada em baixo, e a
                  definição completa com a legislação no fim.
                </p>
                <p>
                  Os «termos relacionados» não são escritos à mão: quando a
                  definição de um termo menciona outro, a ligação nasce
                  sozinha — uma relação inventada seria um dado inventado.
                  Dentro dos textos, uma ligação tracejada abre a definição
                  sem sair da página.
                </p>
                <p>
                  Os números dos exemplos são ilustrações do conceito;
                  quando citam valores em vigor (IAS, salário mínimo,
                  taxas legais), a ficha do termo aponta a fonte oficial.
                </p>
              </div>
            </PaginaDetalhe>

            <PaginaDetalhe rotulo={m.aprender.faltaTermo}>
              <div className="body-copy space-y-3 max-w-2xl">
                <p>
                  O glossário cresce por sugestão: se um termo do dinheiro
                  em Portugal não está aqui, diz-nos qual — as propostas
                  chegam por{" "}
                  <Link
                    href="/sobre"
                    className="underline decoration-line2 underline-offset-2"
                  >
                    contacto
                  </Link>
                  .
                </p>
              </div>
            </PaginaDetalhe>
          </>
        }
        seguinte={{
          href: "/metodologia",
          rotulo: "De onde vêm os números?",
        }}
      />
    </>
  );
}
