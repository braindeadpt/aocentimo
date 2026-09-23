import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Botao } from "./Botao";
import { BotaoCopiar } from "./BotaoCopiar";
import { Chip } from "./Chip";
import { Interruptor } from "./Interruptor";
import { Segmentado } from "./Segmentado";
import { Cartao } from "./Cartao";

// 1B-03 — o sistema de controlos: Botao (4 variantes, todos os
// estados), Interruptor (role=switch), Chip (preset com marca),
// Segmentado (radiogroup partilhado) e BotaoCopiar («Copiado»).
// Testes SSR de marcação — a geometria de interacção vive no e2e.

describe("Botao — as quatro variantes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("primário é a pílula de tinta; secundário é a pílula com contorno", () => {
    const h = renderToStaticMarkup(
      <>
        <Botao variante="primario">Calcular</Botao>
        <Botao variante="secundario">Ver</Botao>
      </>
    );
    expect(h).toContain("botao botao-primario");
    expect(h).toContain("botao botao-secundario");
    expect(h).toContain(">Calcular</span>");
    expect(h).toContain(">Ver</span>");
  });

  it("com href é uma ligação, sem href é um botão — a semântica fica certa", () => {
    const h = renderToStaticMarkup(
      <>
        <Botao href="/salario" variante="primario">
          Ir
        </Botao>
        <Botao href="https://eurostat.ec.europa.eu" externo>
          Eurostat
        </Botao>
      </>
    );
    expect(h).toContain('href="/salario"');
    expect(h).toContain(
      'href="https://eurostat.ec.europa.eu" target="_blank" rel="noreferrer noopener"'
    );
    const b = renderToStaticMarkup(<Botao>Clique</Botao>);
    expect(b).toContain("<button");
    expect(b).not.toContain("href=");
  });

  it("a variante ícone leva nome acessível e avisa em dev sem ele", () => {
    const h = renderToStaticMarkup(
      <Botao variante="icone" icone="repor" ariaLabel="Repor valores" />
    );
    expect(h).toContain('aria-label="Repor valores"');
    expect(h).toContain("botao-icone");
    expect(h).toContain("icone-repor");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToStaticMarkup(<Botao variante="icone" icone="repor" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("ariaLabel"));
  });

  it("desativado fica focável com a razão acessível — aria-disabled + title + nome", () => {
    const h = renderToStaticMarkup(
      <Botao desativado razao="sem dados da Euribor">
        Calcular
      </Botao>
    );
    expect(h).toContain('aria-disabled="true"');
    expect(h).toContain('title="sem dados da Euribor"');
    // a razão entra no nome via texto escondido — anunciada a AT
    expect(h).toContain("sem dados da Euribor");
    expect(h).toContain("sr-only");
    // sem razão avisa em dev
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToStaticMarkup(<Botao desativado>Calcular</Botao>);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("razao"));
  });

  it("a carregar: orbe no lugar do ícone + rótulo do que se passa + busy", () => {
    const h = renderToStaticMarkup(
      <Botao variante="primario" icone="repor" aCarregar="A calcular…">
        Calcular
      </Botao>
    );
    expect(h).toContain("orbe-a-recolher");
    expect(h).toContain("A calcular…");
    expect(h).not.toContain(">Calcular</span>");
    expect(h).toContain('aria-busy="true"');
    expect(h).toContain('aria-disabled="true"');
    expect(h).toContain("botao-carga");
  });
});

describe("Interruptor — a pílula com nó", () => {
  it("é um switch: role + aria-checked; desactivado mostra a razão em texto", () => {
    const h = renderToStaticMarkup(
      <Interruptor ligado onChange={() => {}} rotulo="Simular choque" />
    );
    expect(h).toContain('role="switch"');
    expect(h).toContain('aria-checked="true"');
    expect(h).toContain("interruptor-trilho");
    expect(h).toContain("interruptor-no");
    const d = renderToStaticMarkup(
      <Interruptor
        ligado={false}
        onChange={() => {}}
        desativado
        razao="só com dados em dia"
        rotulo="Comparar"
      />
    );
    expect(d).toContain('aria-disabled="true"');
    expect(d).toContain('title="só com dados em dia"');
    expect(d).toContain("só com dados em dia");
  });
});

describe("Chip — o preset com marca", () => {
  it("seleccionado tem aria-pressed; desactivado leva razão", () => {
    const h = renderToStaticMarkup(<Chip ativo>1 500 €</Chip>);
    expect(h).toContain('aria-pressed="true"');
    const d = renderToStaticMarkup(
      <Chip desativado razao="série sem esse prazo">
        1S
      </Chip>
    );
    expect(d).toContain('aria-disabled="true"');
    expect(d).toContain('title="série sem esse prazo"');
  });
});

describe("Segmentado — a janela temporal partilhada", () => {
  const opcoes = [
    { id: "1a", rotulo: "1A" },
    { id: "5a", rotulo: "5A", desativado: true, razao: "só há 2 anos de série" },
    { id: "max", rotulo: "Máx" },
  ];

  it("é um radiogroup com radios e roving tabindex", () => {
    const h = renderToStaticMarkup(
      <Segmentado
        rotulo="Janela temporal"
        valor="1a"
        onChange={() => {}}
        opcoes={opcoes}
      />
    );
    expect(h).toContain('role="radiogroup"');
    expect(h).toContain('aria-label="Janela temporal"');
    expect(h.match(/role="radio"/g)?.length).toBe(3);
    expect(h).toContain('aria-checked="true"');
    // seleccionado tabbable, os outros -1; desactivado fora da rotação
    expect(h).toContain('aria-checked="true" tabindex="0"');
    expect(h.match(/tabindex="-1"/g)?.length).toBe(2);
  });

  it("a opção desactivada anuncia a razão no nome", () => {
    const h = renderToStaticMarkup(
      <Segmentado
        rotulo="Janela"
        valor="max"
        onChange={() => {}}
        opcoes={opcoes}
      />
    );
    expect(h).toContain('aria-disabled="true"');
    expect(h).toContain("só há 2 anos de série");
  });
});

describe("BotaoCopiar — «Copiado» junto ao botão", () => {
  it("a região viva existe já em repouso (vazia) — pronta a anunciar", () => {
    const h = renderToStaticMarkup(
      <BotaoCopiar texto="/api/x.json" variante="ligacao" rotulo="JSON" />
    );
    expect(h).toContain('role="status"');
    expect(h).toContain("copiado-nota");
    expect(h).toContain("JSON");
    expect(h).toContain("<button");
  });

  it("a acção copiar do Cartao desenha o botão de copiar", () => {
    const h = renderToStaticMarkup(
      <Cartao
        breadcrumb="X"
        acoes={[
          { href: "/precos", rotulo: "página →", ariaLabel: "Preços" },
          { copiar: "/api/x.json", rotulo: "JSON", ariaLabel: "copiar o endereço do JSON" },
        ]}
      >
        {null}
      </Cartao>
    );
    expect(h).toContain('role="status"');
    expect(h).toContain("copiar-lig");
    expect(h).toContain('href="/precos"');
  });
});
