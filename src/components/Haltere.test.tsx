import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Haltere } from "./Haltere";

// S1-05 — o haltere: «antes ● — ○ agora» por categoria sobre grelha
// pontilhada. Valores finais no HTML, variação escrita com ▲/▼ (a cor
// nunca é o único canal), um equivalente textual.

const categorias = [
  { id: "infl", rotulo: "Inflação", rotuloCurto: "Infl.", antes: 2.5, agora: 3.55 },
  { id: "eur", rotulo: "Euribor 12M", rotuloCurto: "E12M", antes: 2.1, agora: 2.95 },
  { id: "desemp", rotulo: "Desemprego", rotuloCurto: "Desemp.", antes: 5.8, agora: 5.7 },
];

const html = renderToStaticMarkup(
  <Haltere
    categorias={categorias}
    rotuloAntes="ago 2025"
    rotuloAgora="ago 2026"
    formato="pct"
  />
);

const htmlBomSubir = renderToStaticMarkup(
  <Haltere
    categorias={[{ id: "a", rotulo: "CA", antes: 2, agora: 2.5 }]}
    rotuloAntes="antes"
    rotuloAgora="agora"
    formato="pct"
    bomSubir
  />
);

describe("Haltere — SSR, direcção e equivalente", () => {
  it("os valores finais estão no HTML — os dois momentos por categoria", () => {
    expect(html).toContain("3,55 %");
    expect(html).toContain("2,50 %");
    expect(html).toContain("5,70 %");
    expect(html).toContain("5,80 %");
  });

  it("a variação fica escrita — ▲/▼ com p.p., nunca só na cor", () => {
    expect(html).toContain("▲ 1,05 p.p.");
    expect(html).toContain("▼ 0,10 p.p.");
  });

  it("a direcção pinta o traço e o ponto «agora» — sem bomSubir, subir é mau", () => {
    expect(html).toContain('hal-link hal-mau');
    expect(html).toContain('hal-agora-dot hal-mau');
    // o desemprego desceu → «bom» mesmo sem bomSubir
    expect(html).toContain('hal-link hal-bom');
  });

  it("bomSubir inverte a leitura — taxa de poupança a subir é boa", () => {
    expect(htmlBomSubir).toContain('hal-link hal-bom');
    expect(htmlBomSubir).not.toContain("hal-mau");
  });

  it("a legenda traz os dois momentos com ●/○", () => {
    expect(html).toContain("ago 2025");
    expect(html).toContain("ago 2026");
  });

  it("a grelha é pontilhada e os pontos «antes» são cheios, «agora» ocos", () => {
    expect(html).toContain('class="hal-grid"');
    expect(html.match(/hal-antes-dot/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it("o svg é decorativo e o equivalente é uma lista única por categoria", () => {
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html.match(/data-hal-equivalente/g)).toHaveLength(1);
    expect(html).toContain("Inflação: 2,50 % (ago 2025) → 3,55 % (ago 2026)");
  });

  it("o SSR serve o estado final — sem classe de entrada armada", () => {
    expect(html).not.toContain("hal-on");
  });
});
