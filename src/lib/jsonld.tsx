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

const ORG = { "@type": "Organization", name: "AO CÊNTIMO" } as const;
const BASE = "https://aocentimo.js.org";

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
