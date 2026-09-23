import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EstadoVazio } from "./EstadoVazio";
import { EmptyState } from "./EmptyState";
import { ACarregar } from "./ACarregar";
import { ZeroInformativo } from "./ZeroInformativo";
import { Regua } from "./Regua";

// 1B-05 — os estados partilhados: cada estado tem desenho E texto.
// A regra nº1 com desenho: a falha mostra-se (orbe atrasada + frase
// honesta + fonte oficial), nunca um número inventado.

describe("EstadoVazio — a falha com desenho", () => {
  const html = renderToStaticMarkup(
    <EstadoVazio
      titulo="a série da Euribor 12M"
      falha="a série não chegou da fonte"
      desde="ago 2026"
      fonte={{
        nome: "Banco de Portugal — BPstat",
        url: "https://bpstat.bportugal.pt",
      }}
    />
  );

  it("orbe atrasada + selo em texto — a forma nunca é o único canal", () => {
    expect(html).toContain("orbe-atrasada");
    expect(html).toContain("fonte indisponível");
    expect(html).toContain('role="status"');
  });

  it("a frase honesta: o que falhou, desde quando, onde ver a fonte", () => {
    expect(html).toContain("a série da Euribor 12M — a série não chegou da fonte");
    expect(html).toContain("último dado conhecido: ago 2026");
    expect(html).toContain("ver na fonte oficial");
    expect(html).toContain(
      'href="https://bpstat.bportugal.pt" target="_blank" rel="noopener noreferrer"'
    );
  });

  it("a peça em falta desenha-se a tracejado — e a ilustração é decorativa", () => {
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('stroke-dasharray="5 4"');
    expect(html).toContain("ev-iso");
  });

  it("não inventa número: sem valor, sem percentagem forjada", () => {
    const txt = html.replace(/ago 2026/g, "");
    expect(txt).not.toMatch(/\d[,.]?\d*\s*(€|%)/);
  });

  it("sem url a fonte diz-se, não se liga", () => {
    const h = renderToStaticMarkup(
      <EstadoVazio titulo="X" fonte={{ nome: "Eurostat" }} />
    );
    expect(h).toContain("fonte oficial: Eurostat");
    expect(h).not.toContain("ver na fonte oficial");
    expect(h).not.toContain("<a href");
  });

  it("a falha por omissão é a série que não chegou; compacto existe", () => {
    const h = renderToStaticMarkup(
      <EstadoVazio titulo="Gasóleo simples" compacto />
    );
    expect(h).toContain("a série não chegou da fonte");
    expect(h).toContain("estado-vazio-c");
  });
});

describe("EmptyState — o fallback dos gráficos delega no EstadoVazio", () => {
  it("série forçada a falhar → orbe atrasada + frase, nunca número", () => {
    const h = renderToStaticMarkup(
      <EmptyState titulo="Série indisponível" />
    );
    expect(h).toContain("estado-vazio");
    expect(h).toContain("orbe-atrasada");
    expect(h).toContain("Série indisponível");
    expect(h).not.toMatch(/\d[,.]?\d*\s*(€|%)/);
  });
});

describe("ACarregar — a espera real", () => {
  const html = renderToStaticMarkup(
    <ACarregar rotulo="A calcular…" />
  );

  it("mini-orbe a-recolher + o rótulo do que se passa + status", () => {
    expect(html).toContain("orbe-a-recolher");
    expect(html).toContain("A calcular…");
    expect(html).toContain('role="status"');
    expect(html).toContain("acarregar");
  });
});

describe("ZeroInformativo — o zero como informação", () => {
  it("«0 c — não te toca»: ponto oco + valor + nota", () => {
    const h = renderToStaticMarkup(
      <ZeroInformativo valor="0" unidade="c" />
    );
    expect(h).toContain("zero-info");
    expect(h).toContain("zero-info-ponto");
    expect(h).toContain(">0<");
    expect(h).toContain("c");
    expect(h).toContain("— não te toca");
    // o fino inseparável cola o número à unidade
    expect(h).toContain(" ");
  });

  it("nota por omissão é «não te toca»; null omite-a", () => {
    const com = renderToStaticMarkup(<ZeroInformativo valor="0,00" unidade="€" />);
    expect(com).toContain("não te toca");
    const sem = renderToStaticMarkup(
      <ZeroInformativo valor="0" nota={null} />
    );
    expect(sem).not.toContain("não te toca");
    expect(sem).toContain("zero-info-ponto");
  });
});

describe("Regua — o limite explica-se (contrato estático)", () => {
  it("em repouso não há nota; o live region existe, vazio", () => {
    const h = renderToStaticMarkup(
      <Regua
        valor={5}
        onChange={() => {}}
        min={0}
        max={10}
        passo={1}
        formato={(v) => String(v)}
        rotulo="Taxa"
      />
    );
    expect(h).not.toContain("regua-nota");
    // a região sr-only existe desde o primeiro render — pronta a
    // anunciar a primeira tentativa para lá do fim
    expect(h).toContain('role="status"');
  });
});
