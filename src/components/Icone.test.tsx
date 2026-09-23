import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Icone, IconeEmblema, ICONES, type NomeIcone } from "./Icone";

// 1B-01 — o sistema de ícones: conjunto FECHADO, traço próprio 20×20,
// aria-hidden por omissão (o significado mora no texto/controlo ao lado).

const CONJUNTO = [
  // páginas — um sinal por pergunta
  "salario", "irs", "trabalho", "impostos", "precos", "inflacao",
  "credito", "casa", "poupanca", "dados", "aprender",
  // acções
  "ver", "json", "copiar-ligacao", "repor", "abrir", "menu",
  "pesquisa", "sol", "lua",
  // estado — a família do OrbeEstado em traço
  "em-dia", "a-recolher", "atrasado", "aviso", "informacao",
] as const;

describe("Icone — conjunto fechado", () => {
  it("o conjunto é exactamente este — nem mais nem menos", () => {
    expect(Object.keys(ICONES).sort()).toEqual([...CONJUNTO].sort());
    expect(CONJUNTO).toHaveLength(25);
  });

  it("um nome fora do conjunto falha", () => {
    expect(() =>
      renderToStaticMarkup(<Icone nome={"bitcoin" as NomeIcone} />)
    ).toThrow(/conjunto fechado/);
  });

  it("cada nome desenha pelo menos um traço na grelha 20×20", () => {
    for (const nome of CONJUNTO) {
      const html = renderToStaticMarkup(<Icone nome={nome} />);
      expect(html, nome).toContain('viewBox="0 0 20 20"');
      expect(html, nome).toContain("<path");
      expect(html, nome).toContain(`icone-${nome}`);
    }
  });

  it("nenhum traço tem preenchimento nem pathLength diferente de 1", () => {
    for (const nome of CONJUNTO) {
      const html = renderToStaticMarkup(<Icone nome={nome} />);
      expect(html, nome).toContain('fill="none"');
      const paths = html.match(/<path[^>]*>/g) ?? [];
      expect(paths.length, nome).toBeGreaterThan(0);
      for (const p of paths) {
        expect(p, `${nome}: ${p}`).toContain('pathLength="1"');
        expect(p, `${nome}: ${p}`).not.toContain("fill=");
      }
    }
  });

  it("o traço é 1,5 px com terminações e juntas redondas em currentColor", () => {
    const html = renderToStaticMarkup(<Icone nome="salario" />);
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.5"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('stroke-linejoin="round"');
  });
});

describe("Icone — acessibilidade", () => {
  it("é decorativo por omissão: aria-hidden, sem foco", () => {
    const html = renderToStaticMarkup(<Icone nome="ver" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).not.toContain('role="img"');
  });

  it("com rotulo passa a role=img nomeado — o caso raro do ícone sozinho", () => {
    const html = renderToStaticMarkup(
      <Icone nome="informacao" rotulo="Informação" />
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Informação"');
    expect(html).not.toContain("aria-hidden");
  });
});

describe("IconeEmblema — o quadrado tracejado dos cartões", () => {
  it("envolve o ícone na moldura, decorativa", () => {
    const html = renderToStaticMarkup(<IconeEmblema nome="casa" />);
    expect(html).toContain("icone-emblema");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("icone-casa");
    expect(html).toContain('viewBox="0 0 20 20"');
  });

  it("nome inválido também falha através do emblema", () => {
    expect(() =>
      renderToStaticMarkup(<IconeEmblema nome={"banana" as NomeIcone} />)
    ).toThrow(/conjunto fechado/);
  });
});
