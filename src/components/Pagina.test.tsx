import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Pagina, PaginaDetalhe } from "./Pagina";

// S1-06 — a Pagina: o template de três níveis obrigatório nas rotas de
// conteúdo. 1 · a resposta (h1 + UM instrumento + UMA frase ≤ ~25
// palavras), 2 · Explora, 3 · Confirma em <details> fechados, e a
// pergunta seguinte. Cada nível é uma <section aria-labelledby>. Os
// avisos de dev não falham o build — são console.warn.

const base = {
  pergunta: "Quanto fica de cada euro?",
  kicker: "Exemplo",
  resposta: {
    instrumento: <div data-testid="instrumento" />,
    frase: "De cada euro, 63 cêntimos chegam-te à conta.",
  },
  explora: <div>controlos</div>,
  confirma: (
    <PaginaDetalhe rotulo="A tabela completa">
      <table />
    </PaginaDetalhe>
  ),
  seguinte: { href: "/salario", rotulo: "Quanto fica do teu salário?" },
};

const html = renderToStaticMarkup(<Pagina {...base} />);

describe("Pagina — o template de três níveis", () => {
  afterEach(() => vi.restoreAllMocks());

  it("nível 1: a pergunta é o h1 e etiqueta a primeira secção", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(">Quanto fica de cada euro?</h1>");
    expect(html).toContain('aria-labelledby="quanto-fica-de-cada-euro-pergunta"');
    expect(html).toContain('id="quanto-fica-de-cada-euro-pergunta"');
  });

  it("níveis 2 e 3: secções aria-labelledby com h2 Explora / Confirma", () => {
    expect(html).toContain('aria-labelledby="quanto-fica-de-cada-euro-explora"');
    expect(html).toContain('aria-labelledby="quanto-fica-de-cada-euro-confirma"');
    expect(html).toContain(">Explora</h2>");
    expect(html).toContain(">Confirma</h2>");
    // os ordinais são decorativos — o nome do nível é o texto
    expect(html.match(/aria-hidden="true">2</g)).toHaveLength(1);
    expect(html.match(/aria-hidden="true">3</g)).toHaveLength(1);
  });

  it("nível 3: o detalhe é <details> fechado por omissão com rótulo", () => {
    expect(html).toContain("<details");
    expect(html).toContain("<summary>A tabela completa</summary>");
    expect(html).not.toContain("<details open");
  });

  it("a pergunta seguinte liga à próxima página lógica", () => {
    expect(html).toContain("A pergunta seguinte");
    expect(html).toContain('href="/salario"');
    expect(html).toContain("Quanto fica do teu salário?");
  });

  it("sem seguinte não há bloco; perguntaAs=h2 para demos embutidas", () => {
    const h = renderToStaticMarkup(<Pagina {...base} seguinte={undefined} />);
    expect(h).not.toContain("pg-seguinte");
    const demo = renderToStaticMarkup(<Pagina {...base} perguntaAs="h2" />);
    expect(demo).not.toContain("<h1");
    expect(demo).toContain(">Quanto fica de cada euro?</h2>");
  });

  it("mais de UM instrumento no nível 1 avisa em dev", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToStaticMarkup(
      <Pagina
        {...base}
        resposta={{
          instrumento: (
            <>
              <div />
              <div />
            </>
          ),
          frase: "ok",
        }}
      />
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("2 instrumentos")
    );
  });

  it("frase com mais de ~25 palavras avisa em dev", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToStaticMarkup(
      <Pagina
        {...base}
        resposta={{
          instrumento: <div />,
          frase: Array.from({ length: 30 }, (_, i) => `palavra${i}`).join(" "),
        }}
      />
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("30 palavras"));
  });
});
