import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import path from "path";
import {
  loadSerie,
  loadFonte,
  loadDerivado,
  loadFontes,
  listSeries,
  variacao,
  variacaoDesdeInicio,
  poderDeCompra,
  type Serie,
} from "./data";

const FIXTURE = path.join(process.cwd(), "data", "sources", "_teste_fixture");

const serie = (pontos: [string, number][]): Serie => ({
  meta: {
    id: "t",
    fonte: "T",
    dataset: "t",
    url: "",
    unidade: "i",
    recolhidoEm: "2026-01-01T00:00:00Z",
    serieAte: "2026-01",
  },
  series: pontos.map(([t, v]) => ({ t, v })),
});

describe("loaders", () => {
  beforeAll(() => {
    mkdirSync(FIXTURE, { recursive: true });
    writeFileSync(
      path.join(FIXTURE, "meta-malformada.json"),
      JSON.stringify({ meta: { id: "x" }, series: "não é array" })
    );
    writeFileSync(path.join(FIXTURE, "json-partido.json"), "{não é json");
  });

  afterAll(() => {
    rmSync(FIXTURE, { recursive: true, force: true });
  });

  it("série inexistente devolve null — não lança, não inventa", () => {
    expect(loadSerie("ZZ99")).toBeNull();
    expect(loadFonte("bpstat", "serie-que-nao-existe")).toBeNull();
    expect(loadDerivado("derivado-que-nao-existe")).toBeNull();
  });

  it("meta malformada é rejeitada pelo zod → null", () => {
    expect(loadFonte("_teste_fixture", "meta-malformada")).toBeNull();
    expect(loadFonte("_teste_fixture", "json-partido")).toBeNull();
  });

  it("série real carrega com meta + pontos", () => {
    const s = loadSerie("CP00");
    expect(s).not.toBeNull();
    expect(s!.meta.id).toBe("hicp-pt-cp00");
    expect(s!.series.length).toBeGreaterThan(0);
    expect(s!.series.every((p) => typeof p.t === "string" && typeof p.v === "number")).toBe(
      true
    );
  });

  it("listSeries inclui os COICOP recolhidos", () => {
    expect(listSeries()).toContain("CP00");
  });

  it("loadFontes devolve metas validadas", () => {
    const fontes = loadFontes();
    expect(fontes.length).toBeGreaterThan(0);
    expect(fontes.every((f) => f.id && f.recolhidoEm && f.serieAte)).toBe(true);
  });
});

describe("variacao", () => {
  it("devolve null quando a série tem menos pontos que o período pedido", () => {
    const s = serie([
      ["2026-01", 100],
      ["2026-02", 101],
    ]);
    expect(variacao(s, 12)).toBeNull();
    expect(variacao(s, 2)).toBeNull(); // n pontos não chegam para Δn
  });

  it("devolve null quando o valor anterior é zero — nunca Infinity", () => {
    const s = serie([
      ["2026-01", 0],
      ["2026-02", 42],
    ]);
    expect(variacao(s, 1)).toBeNull();
  });

  it("calcula a variação certa", () => {
    const s = serie([
      ["2026-01", 100],
      ["2026-02", 110],
    ]);
    expect(variacao(s, 1)).toBeCloseTo(0.1);
  });
});

describe("variacaoDesdeInicio / poderDeCompra", () => {
  it("variacaoDesdeInicio com base zero devolve null", () => {
    const s = serie([
      ["2026-01", 0],
      ["2026-02", 100],
    ]);
    expect(variacaoDesdeInicio(s)).toBeNull();
  });

  it("poderDeCompra interpola contra o último ponto", () => {
    const s = serie([
      ["2020-01", 100],
      ["2026-01", 120],
    ]);
    expect(poderDeCompra(s, 100, "2020-01")).toBeCloseTo(120);
  });

  it("poderDeCompra devolve null com índice base zero — nunca Infinity", () => {
    const s = serie([
      ["2020-01", 0],
      ["2026-01", 120],
    ]);
    expect(poderDeCompra(s, 100, "2020-01")).toBeNull();
  });
});
