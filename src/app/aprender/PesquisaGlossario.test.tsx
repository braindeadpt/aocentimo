import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PesquisaGlossario } from "./PesquisaGlossario";
import { GLOSSARIO } from "@/content/glossario";
import { gruposDoGlossario, exemploDe } from "./conteudo";

describe("PesquisaGlossario — SSR e filtragem", () => {
  const grupos = gruposDoGlossario().map((g) => ({
    id: g.id,
    rotulo: g.id,
    termos: g.termos.map((t) => ({
      slug: t.slug,
      termo: t.termo,
      definicao: t.definicao,
      exemplo: exemploDe(t),
      sinonimos: t.sinonimos,
    })),
  }));

  const textos = {
    rotulo: "Pesquisar termos",
    placeholder: "Pesquisa por termo ou palavra…",
    contagem: "{n} de {total} termos",
    vazio: "Nenhum termo corresponde a «{q}».",
    vazioNota: "propõe um termo",
  };

  it("renderiza todos os 42 termos no HTML inicial SSR sem JS", () => {
    const html = renderToStaticMarkup(
      <PesquisaGlossario
        grupos={grupos}
        total={GLOSSARIO.length}
        textos={textos}
      />
    );
    expect(html).toContain('role="search"');
    expect(html).toContain('type="search"');
    expect(html).toContain('id="pesquisa-glossario"');
    expect(html).toContain("42 de 42 termos");
    for (const t of GLOSSARIO) {
      expect(html).toContain(`/aprender/${t.slug}`);
      expect(html).toContain(t.termo);
    }
  });

  it("input tem acessibilidade completa (label com htmlFor, min-h-[44px])", () => {
    const html = renderToStaticMarkup(
      <PesquisaGlossario
        grupos={grupos}
        total={GLOSSARIO.length}
        textos={textos}
      />
    );
    expect(html).toContain('for="pesquisa-glossario"');
    expect(html).toContain("min-h-[44px]");
  });
});
