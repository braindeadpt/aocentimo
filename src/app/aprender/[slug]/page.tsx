import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ALT_FEED } from "@/lib/meta";
import {
  GLOSSARIO,
  mencoesEm,
  relacionados,
  termoPorSlug,
} from "@/content/glossario";
import { DEMOS } from "@/content/demos";
import { JsonLd, definedTerm } from "@/lib/jsonld";
import { TermoRef } from "@/components/TermoRef";
import { MicroDemo } from "@/components/MicroDemo";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { Source } from "@/components/Source";
import { m } from "@/lib/messages";
import {
  exemploDe,
  FICHA,
  fraseDe,
  grupoDe,
  proximoTermo,
} from "../conteudo";
import type { GrupoId } from "../conteudo";

export const dynamicParams = false;

export function generateStaticParams() {
  return GLOSSARIO.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = termoPorSlug(slug);
  if (!t) return {};
  return {
    title: `${t.termo} — glossário`,
    description: t.definicao,
    alternates: { canonical: `/aprender/${t.slug}`, types: ALT_FEED },
  };
}

const ROTULO_GRUPO: Record<GrupoId, keyof typeof m.nav> = {
  ganhas: "grupoGanhas",
  pagas: "grupoPagas",
  banco: "grupoBanco",
  pais: "grupoPais",
};

/** Texto corrido com glossário inline — cada menção literal a outro termo
 *  vira ligação tracejada com a definição ao foco/passar. Uma ligação por
 *  termo (o primeiro encontro chega). */
function TextoComTermos({ texto, excluir }: { texto: string; excluir: string }) {
  const partes: ReactNode[] = [];
  const ligados = new Set<string>();
  let cursor = 0;
  for (const m of mencoesEm(texto, excluir)) {
    if (ligados.has(m.slug)) continue;
    const t = termoPorSlug(m.slug);
    if (!t) continue;
    ligados.add(m.slug);
    partes.push(texto.slice(cursor, m.inicio));
    partes.push(
      <TermoRef key={`${m.slug}-${m.inicio}`} slug={t.slug} termo={t.termo} definicao={t.definicao}>
        {texto.slice(m.inicio, m.fim)}
      </TermoRef>
    );
    cursor = m.fim;
  }
  partes.push(texto.slice(cursor));
  return <>{partes}</>;
}

export default async function TermoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = termoPorSlug(slug);
  if (!t) notFound();
  const verTambem = relacionados(t.slug);
  const grupo = m.nav[ROTULO_GRUPO[grupoDe(t.slug)]];
  const exemplo = exemploDe(t);
  const ficha = FICHA[t.slug];
  const demo = DEMOS[t.slug];
  const prox = proximoTermo(t.slug);

  return (
    <>
      <JsonLd data={definedTerm(t)} />
      <Pagina
        pergunta={`O que é «${t.termo}»?`}
        rota={`/aprender/${t.slug}`}
        kicker={
          <>
            <Link href="/aprender" className="hover:text-ink2">
              {m.nav.aprender}
            </Link>
            {" · "}
            {grupo}
          </>
        }
        resposta={{
          /* nível 1 do termo: a frase simples (pg-frase) + o exemplo
             com números como instrumento — o conceito aterrissa num
             caso concreto antes de qualquer jargão */
          instrumento: exemplo ? (
            <figure className="border border-line bg-panel px-5 py-5">
              <figcaption className="kicker-xs">
                {m.aprender.exemplo}
              </figcaption>
              <p className="leitura-insight mt-2">
                <TextoComTermos texto={exemplo} excluir={t.slug} />
              </p>
            </figure>
          ) : (
            <p className="sr-only">{t.termo}</p>
          ),
          frase: fraseDe(t),
        }}
        explora={
          <div>
            <p className="kicker mb-3">{m.aprender.demoKicker}</p>
            {demo ? (
              <>
                <MicroDemo slug={t.slug} />
                {/* o equivalente textual também visível — quem aprende
                    lê o desenho E a frase que o descreve */}
                <p className="footnote mt-3 max-w-xl">{demo.alt}</p>
              </>
            ) : (
              <p className="footnote">
                Este termo ainda não tem demonstração desenhada.
              </p>
            )}
          </div>
        }
        confirma={
          <>
            <PaginaDetalhe rotulo={m.aprender.definicaoCompleta}>
              <div className="body-copy max-w-2xl space-y-3">
                <p>
                  <TextoComTermos texto={t.definicao} excluir={t.slug} />
                </p>
                {t.exemplo && (
                  <p className="footnote">
                    <span className="text-muted">Exemplo — </span>
                    <TextoComTermos texto={t.exemplo} excluir={t.slug} />
                  </p>
                )}
              </div>
            </PaginaDetalhe>

            {ficha && (
              <PaginaDetalhe
                rotulo={
                  ficha.legislacao
                    ? m.aprender.fonteLegislacao
                    : m.aprender.conceito
                }
              >
                <div className="body-copy max-w-2xl space-y-3">
                  <p>{ficha.legislacao ?? ficha.conceito}</p>
                </div>
                <div className="mt-3">
                  <Source nome={ficha.fonte} url={ficha.url} />
                </div>
              </PaginaDetalhe>
            )}

            {verTambem.length > 0 && (
              <nav aria-label={m.aprender.verTambem} className="pt-6">
                <p className="kicker-sm">{m.aprender.verTambem}</p>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {verTambem.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/aprender/${r.slug}`}
                        className="text-corpo-sm text-ink2 underline decoration-dashed decoration-line2 underline-offset-4 hover:text-ink hover:decoration-mark"
                      >
                        {r.termo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <p className="footnote mt-8">
              <Link
                href="/aprender"
                className="underline decoration-line2 underline-offset-2"
              >
                {m.aprender.voltarGlossario}
              </Link>
            </p>
          </>
        }
        seguinte={
          prox
            ? {
                href: `/aprender/${prox.slug}`,
                rotulo: `O que é «${prox.termo}»?`,
              }
            : { href: "/metodologia", rotulo: "De onde vêm os números?" }
        }
      />
    </>
  );
}
