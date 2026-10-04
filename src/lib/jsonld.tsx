import { SITE_URL } from "@/lib/site";

/**
 * JSON-LD estruturado (schema.org) — um <script> por página, derivado de
 * conteúdo e dados reais. REGRA Nº1 aplica-se também aqui: nenhuma data
 * nem licença que não exista nas fontes.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const ORG_ID = `${SITE_URL}/#organizacao`;
const ORG = { "@type": "Organization", "@id": ORG_ID, name: "AO CÊNTIMO" } as const;
const BASE = SITE_URL;

/**
 * A casa e o site, num GRAFO só — a home (P4 · SEO).
 *
 * A home já trazia um `WebSite` solto. O que faltava era a
 * `Organization`: um site que publica dados e simula nada é, para os
 * crawlers, uma página sem quem a assine. Sai aqui, no mesmo `<script>`,
 * ligado por `@id` — não um segundo bloco: duplicar o `WebSite` seria
 * dizer ao crawler que o site tem duas identidades.
 *
 * `description` é a mesma frase do `WebSite`: a casa não tem uma
 * descrição própria e separada, e inventar uma seria inventar.
 */
export function casaESite(descricao: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...ORG, url: BASE, description: descricao },
      {
        "@type": "WebSite",
        "@id": `${BASE}/#website`,
        name: ORG.name,
        url: BASE,
        description: descricao,
        inLanguage: "pt-PT",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

/**
 * O caminho de migalhas de uma página.
 *
 * Só é emitido nas páginas que têm «Voltar ao bairro» (`Pagina` exige o
 * `edificio`), porque é aí que existe uma hierarquia real: a casa, a
 * secção e a folha. `/metodologia`, `/sobre` e `/estilo` não têm
 * edifício e por isso não ganham migalhas — uma migalha que não se
 * pode seguir não é migalha.
 */
export function breadcrumb(
  tracos: readonly { nome: string; rota: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: tracos.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.nome,
      item: `${BASE}${t.rota}`,
    })),
  };
}

/** Simuladores — rotas com ferramenta interativa. */
export function webApplication(nome: string, rota: string, descricao: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: nome,
    url: `${BASE}${rota}`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    inLanguage: "pt-PT",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
    publisher: ORG,
    description: descricao,
  };
}

/** Glossário /aprender → FAQPage derivada do conteúdo (não duplicada). */
export function faqPage(
  itens: { pergunta: string; resposta: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-PT",
    mainEntity: itens.map((i) => ({
      "@type": "Question",
      name: i.pergunta,
      acceptedAnswer: { "@type": "Answer", text: i.resposta },
    })),
  };
}

/** /aprender/[slug] → DefinedTerm dentro do DefinedTermSet do glossário.
 *  A FAQPage fica no índice — aqui vai o termo individual, sem duplicar. */
export function definedTerm(t: { slug: string; termo: string; definicao: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: t.termo,
    description: t.definicao,
    url: `${BASE}/aprender/${t.slug}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Glossário AO CÊNTIMO",
      url: `${BASE}/aprender`,
    },
    inLanguage: "pt-PT",
    publisher: ORG,
  };
}

/** Painéis de dados oficiais → Dataset com proveniência real. */
export function dataset(opts: {
  nome: string;
  descricao: string;
  fontes: { nome: string; url?: string }[];
  /** ISO date/partial date real — serieAte/recolhidoEm da fonte. */
  atualizadoEm: string;
  licenca?: string;
  cobertura?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: opts.nome,
    description: opts.descricao,
    inLanguage: "pt-PT",
    creator: opts.fontes.map((f) => ({
      "@type": "Organization",
      name: f.nome,
      ...(f.url ? { url: f.url } : {}),
    })),
    ...(opts.licenca ? { license: opts.licenca } : {}),
    dateModified: opts.atualizadoEm,
    ...(opts.cobertura ? { temporalCoverage: opts.cobertura } : {}),
    publisher: ORG,
  };
}
