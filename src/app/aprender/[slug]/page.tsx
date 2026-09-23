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
import { JsonLd, definedTerm } from "@/lib/jsonld";
import { TermoRef } from "@/components/TermoRef";
import { MicroDemo } from "@/components/MicroDemo";

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

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd data={definedTerm(t)} />
      <p className="kicker">
        <Link href="/aprender" className="hover:text-ink2">
          Glossário
        </Link>
      </p>
      <h1 className="titulo-pagina">
        {t.termo}
      </h1>

      <div className="body-copy mt-6 max-w-2xl">
        <p>
          <TextoComTermos texto={t.definicao} excluir={t.slug} />
        </p>
        <MicroDemo slug={t.slug} />
        {t.exemplo && (
          <p className="footnote mt-3">
            <span className="text-muted">Exemplo — </span>
            <TextoComTermos texto={t.exemplo} excluir={t.slug} />
          </p>
        )}
      </div>

      {verTambem.length > 0 && (
        <nav aria-label="Termos relacionados" className="mt-10 max-w-2xl border-t border-line pt-6">
          <p className="kicker-sm">Ver também</p>
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

      <p className="footnote mt-10">
        <Link href="/aprender" className="underline decoration-line2 underline-offset-2">
          ← Todos os termos
        </Link>
      </p>
    </div>
  );
}
