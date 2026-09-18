import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import Link from "next/link";
import { GLOSSARIO } from "@/content/glossario";
import { JsonLd, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Aprender — glossário de dinheiro",
  description:
    "Euribor, spread, TAN, TAEG, MTIC, escalões, retenção na fonte: os termos do dinheiro em Portugal explicados em português simples, com exemplos.",
  alternates: { canonical: "/aprender", types: ALT_FEED },
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
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd data={ld} />
      <p className="kicker">Glossário</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Os termos, explicados
      </h1>
      <p className="lede mt-5">
        Cada termo em trinta segundos de leitura, com um exemplo numérico.
        Sem jargão — se não cabe numa frase simples, é porque está mal
        explicado.
      </p>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {GLOSSARIO.map((t) => (
          <article key={t.slug} id={t.slug} className="py-6 grid md:grid-cols-[220px_1fr] gap-2 md:gap-8">
            <h2 className="font-display text-xl text-ink">
              <Link
                href={`/aprender/${t.slug}`}
                className="underline decoration-dashed decoration-line2 underline-offset-4 hover:decoration-mark"
              >
                {t.termo}
              </Link>
            </h2>
            <div className="body-copy">
              <p>{t.definicao}</p>
              {t.exemplo && (
                <p className="footnote mt-2">
                  <span className="text-muted">Exemplo — </span>
                  {t.exemplo}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="footnote mt-8">
        Um termo em falta? Sugestões bem-vindas via{" "}
        <Link href="/sobre" className="underline decoration-line2 underline-offset-2">contacto</Link>.
      </p>
    </div>
  );
}
