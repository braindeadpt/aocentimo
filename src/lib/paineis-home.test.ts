import { describe, expect, it, vi } from "vitest";
import {
  comporPainel,
  cortarJanela,
  linhaFecha,
  linhasPainel,
  validarVizinhanca,
} from "@/lib/painel";
import { cartoesHome } from "@/lib/paineis";
import { loadFonte } from "@/lib/data";
import eventos from "@data/fiscal/eventos.json";

// S2-02 — «Hoje em Portugal»: cada cartão usa a codificação certa
// para o seu dado (catálogo §5 do PRODUTO), a grelha fecha sem
// órfãos e nenhuma fonte em falha derruba a composição — o slot
// fica em EstadoVazio («isometrico»).

/** fontes que falham no teste — o resto passa para o loader real */
const falhas = vi.hoisted(() => ({ nomes: new Set<string>() }));

vi.mock("@/lib/data", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/data")>();
  return {
    ...actual,
    loadFonte: (dir: string, nome: string) =>
      falhas.nomes.has(nome) ? null : actual.loadFonte(dir, nome),
  };
});

const porId = (cartoes: ReturnType<typeof cartoesHome>) =>
  Object.fromEntries(cartoes.map((c) => [c.id, c]));

const diasEntre = (a: string, b: string) =>
  (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000;

describe("cartoesHome — a composição de «Hoje em Portugal» (S2-02)", () => {
  it("seis cartões na ordem editorial", () => {
    expect(cartoesHome().map((c) => c.id)).toEqual([
      "inflacao",
      "desemprego",
      "euribor",
      "gasoleo",
      "pib",
      "habitacao",
    ]);
  });

  it("a codificação pedida por dado — catálogo §5", () => {
    const por = porId(cartoesHome());
    expect(por.inflacao.codificacao).toBe("linha"); // série + pico + mediana
    expect(por.euribor.codificacao).toBe("linha"); // série + evento BCE
    expect(por.desemprego.codificacao).toBe("tracos"); // contagem em 100
    expect(por.gasoleo.codificacao).toBe("pontos"); // haltere antes→agora
    expect(por.pib.codificacao).toBe("linha"); // série + mínimo
    expect(por.habitacao.codificacao).toBe("tracos"); // duração da risca
  });

  it("nenhum par seguido repete a codificação", () => {
    const cartoes = cartoesHome();
    expect(
      validarVizinhanca(cartoes.map((c) => c.codificacao)),
      cartoes.map((c) => `${c.id}:${c.codificacao}`).join(" · ")
    ).toEqual([]);
  });

  it("a grelha fecha — [L][S+M][S+S+S], zero órfãos", () => {
    const tams = comporPainel(cartoesHome());
    expect(tams).not.toBeNull();
    expect(linhasPainel(tams!).every(linhaFecha)).toBe(true);
  });

  it("inflação: linha anotada com o pico E a mediana de referência", () => {
    const c = porId(cartoesHome()).inflacao;
    if (c.codificacao !== "linha") throw new Error("inflação vazia?");
    // o pico — uma anotação real da janela por recorte
    expect(c.linha.anotacoes?.max).toBeDefined();
    expect(c.linha.anotacoes?.max?.rotulo).toContain("pico");
    const tPico = c.linha.anotacoes?.max?.t;
    expect(c.linha.serie.some((p) => p.t === tPico)).toBe(true);
    // a mediana — a referência tracejada do gráfico
    expect(c.linha.referencia).toBeDefined();
    expect(
      c.linha.referencia && "valor" in c.linha.referencia
        ? c.linha.referencia.rotulo
        : ""
    ).toContain("mediana");
  });

  it("euribor: linha anotada com o evento BCE mais recente da janela", () => {
    const c = porId(cartoesHome()).euribor;
    if (c.codificacao !== "linha") throw new Error("euribor vazio?");
    // o evento curado mais recente dentro do recorte (fonte em
    // data/fiscal/eventos.json) — nunca um evento inventado
    const evs = eventos.eventos.filter((e) => e.alvo === "euribor");
    for (const janela of ["max", "5a"] as const) {
      const meses = new Set(
        cortarJanela(c.linha.serie, janela).map((p) => p.t)
      );
      const esperado = evs
        .filter((e) => meses.has(e.t.slice(0, 7)))
        .sort((a, b) => a.t.localeCompare(b.t))
        .pop();
      expect(esperado, `evento BCE na janela ${janela}`).toBeDefined();
      expect(c.linha.anotacoes?.[janela]?.t).toBe(esperado!.t.slice(0, 7));
      expect(c.linha.anotacoes?.[janela]?.rotulo).toBe(esperado!.rotulo);
    }
    // «1a» não tem evento BCE → cai no mínimo factual do recorte
    const a1 = c.linha.anotacoes?.["1a"];
    expect(a1).toBeDefined();
    expect(a1!.rotulo).toContain("mínimo");
    expect(
      cortarJanela(c.linha.serie, "1a").some((p) => p.t === a1!.t)
    ).toBe(true);
  });

  it("desemprego: «de cada 100 pessoas ativas» — 1 traço = 1 pessoa", () => {
    const c = porId(cartoesHome()).desemprego;
    if (c.codificacao !== "tracos") throw new Error("desemprego vazio?");
    const total = c.tracos.grupos.reduce((a, g) => a + g.n, 0);
    expect(total).toBe(100);
    // o grupo marcado é a taxa arredondada — N procuram trabalho
    const marca = c.tracos.grupos.find((g) => g.tom === "marca");
    expect(marca?.n).toBe(Math.round(c.tracos.valor!.v));
    expect(marca?.rotulo).toContain("procuram trabalho");
    expect(c.tracos.rotulo).toContain("de cada 100 pessoas ativas");
    expect(c.tracos.unidadeTraco).toContain("pessoa");
    // a comparação europeia fica no insight (pontos são cêntimos)
    expect(c.tracos.insight).toContain("europeia");
  });

  it("gasóleo: valor do dia em odómetro + variação a 30 dias", () => {
    const c = porId(cartoesHome()).gasoleo;
    if (c.codificacao !== "pontos") throw new Error("gasóleo vazio?");
    // valor do dia — o último PMD real da DGEG, no Odometer do corpo
    const fonte = loadFonte("dgeg", "pmd-gasoleo-diario")!;
    const ultimo = fonte.series[fonte.series.length - 1];
    expect(c.pontos.valor).toEqual({ v: ultimo.v, casas: 3, unidade: "€/L" });
    // o haltere liga o ponto ~30 dias antes ao de hoje — só pontos
    // reais da série, nunca interpolados
    const serie = c.pontos.categorias[0].serie;
    expect(serie).toHaveLength(2);
    expect(serie[1]).toEqual(ultimo);
    const dias = diasEntre(serie[0].t, serie[1].t);
    expect(dias).toBeGreaterThanOrEqual(25);
    expect(dias).toBeLessThanOrEqual(45);
    expect(c.pontos.unidadeDelta).toContain("30 dias");
    expect(c.pontos.formato).toBe("litro");
  });

  it("fonte em falha → o slot fica em EstadoVazio (isometrico)", () => {
    for (const [fonte, id] of [
      ["euribor-12m-mensal", "euribor"],
      ["une-pt-total", "desemprego"],
      ["pmd-gasoleo-diario", "gasoleo"],
      ["hpi-pt", "habitacao"],
    ] as const) {
      falhas.nomes.add(fonte);
      const c = porId(cartoesHome())[id];
      falhas.nomes.clear();
      expect(c.codificacao, id).toBe("isometrico");
      if (c.codificacao === "isometrico") {
        expect(c.isometrico.tipo).toBe("vazio");
      }
    }
  });

  it("mesmo com uma falha, a grelha continua a fechar", () => {
    falhas.nomes.add("euribor-12m-mensal");
    const cartoes = cartoesHome();
    falhas.nomes.clear();
    const tams = comporPainel(cartoes);
    expect(tams).not.toBeNull();
    expect(linhasPainel(tams!).every(linhaFecha)).toBe(true);
    expect(validarVizinhanca(cartoes.map((c) => c.codificacao))).toEqual(
      []
    );
  });
});
