import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Cartao } from "./Cartao";

// S1-06 — o Cartao: a anatomia Ledger fixa. Cabeçalho (breadcrumb mono
// · meta · selo de estado), corpo com UMA ideia, controlos opcionais e
// rodapé (fonte + acções «ver →» / «JSON»). O mesmo DOM da gramática
// .leitura — o Leitura nasce sobre ele sem mudar uma virgula.

const html = renderToStaticMarkup(
  <Cartao
    breadcrumb="PREÇOS / CABAZ · EUROSTAT"
    meta={["leitura ago 2026"]}
    estado="em-dia"
    estadoRotulo="em dia"
    controlos={<button type="button">preset</button>}
    fonte={{
      rotulo: "Fonte",
      itens: [{ nome: "Eurostat", url: "https://ec.europa.eu/eurostat" }],
    }}
    acoes={[
      { href: "/precos", rotulo: "página →", ariaLabel: "Preços" },
      { href: "/api/hicp.json", rotulo: "JSON", externo: true },
    ]}
  >
    <p className="leitura-insight">Uma ideia.</p>
  </Cartao>
);

describe("Cartao — a anatomia Ledger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("cabeçalho: breadcrumb mono + meta + selo de estado com texto", () => {
    expect(html).toContain('class="leitura-head"');
    expect(html).toContain('class="leitura-breadcrumb"');
    expect(html).toContain("PREÇOS / CABAZ · EUROSTAT");
    expect(html).toContain("leitura ago 2026");
    // o estado existe como forma (o orbe, aria-hidden) E texto — nunca
    // só a forma
    expect(html).toContain("orbe-estado orbe-em-dia");
    expect(html).toContain("em dia");
  });

  it("corpo, controlos e rodapé na ordem da anatomia", () => {
    const corpo = html.indexOf('class="leitura-corpo"');
    const controlos = html.indexOf('class="leitura-controlos"');
    const pe = html.indexOf('class="leitura-foot"');
    expect(corpo).toBeGreaterThan(-1);
    expect(controlos).toBeGreaterThan(corpo);
    expect(pe).toBeGreaterThan(controlos);
  });

  it("rodapé: fonte externa abre em separador novo com noopener", () => {
    expect(html).toContain("Fonte:");
    expect(html).toContain(
      'href="https://ec.europa.eu/eurostat" target="_blank" rel="noopener noreferrer"'
    );
  });

  it("acções: «ver →» é ligação interna, «JSON» é <a> simples", () => {
    expect(html).toContain('href="/precos"');
    expect(html).toContain('aria-label="Preços"');
    expect(html).toContain('href="/api/hicp.json"');
  });

  it("sem meta nem estado não há barra de meta; sem pe não há footer", () => {
    const limpo = renderToStaticMarkup(
      <Cartao breadcrumb="X">{null}</Cartao>
    );
    expect(limpo).not.toContain("leitura-meta");
    expect(limpo).not.toContain("leitura-foot");
    expect(limpo).not.toContain("leitura-controlos");
  });

  it("amplo abre a variante de largura total", () => {
    const h = renderToStaticMarkup(
      <Cartao breadcrumb="X" amplo>{null}</Cartao>
    );
    expect(h).toContain("leitura-amplo");
  });

  it("fonte interna usa link de navegação; várias fontes separam-se com ·", () => {
    const h = renderToStaticMarkup(
      <Cartao
        breadcrumb="X"
        fonte={{
          rotulo: "Fontes",
          itens: [
            { nome: "Metodologia", url: "/metodologia" },
            { nome: "Eurostat", url: "https://ec.europa.eu/eurostat" },
          ],
        }}
      >
        {null}
      </Cartao>
    );
    expect(h).toContain('href="/metodologia"');
    expect(h).not.toContain('"/metodologia" target="_blank"');
    expect(h).toContain(" · ");
  });

  it("estado sem rótulo de texto avisa em dev — a forma nunca é o único canal", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToStaticMarkup(<Cartao breadcrumb="X" estado="atrasada">{null}</Cartao>);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("estadoRotulo")
    );
  });
});
