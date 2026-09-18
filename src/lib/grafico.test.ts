import { describe, expect, it } from "vitest";
import { chaveSeries, interpDom, interpPts } from "./grafico";
import eventos from "../../data/fiscal/eventos.json";

describe("interpDom", () => {
  it("k=0 devolve a origem, k=1 o destino", () => {
    const a = { t0: 0, t1: 100, lo: 0, hi: 10 };
    const b = { t0: 50, t1: 200, lo: 5, hi: 20 };
    expect(interpDom(a, b, 0)).toEqual(a);
    expect(interpDom(a, b, 1)).toEqual(b);
  });
  it("interpola cada componente", () => {
    const a = { t0: 0, t1: 100, lo: 0, hi: 10 };
    const b = { t0: 50, t1: 200, lo: 5, hi: 20 };
    expect(interpDom(a, b, 0.5)).toEqual({ t0: 25, t1: 150, lo: 2.5, hi: 15 });
  });
});

describe("interpPts", () => {
  it("interpola ponto a ponto", () => {
    const de = [{ t: 0, v: 0 }, { t: 10, v: 10 }];
    const para = [{ t: 0, v: 20 }, { t: 10, v: 40 }];
    expect(interpPts(de, para, 0.5)).toEqual([
      { t: 0, v: 10 },
      { t: 10, v: 25 },
    ]);
  });
  it("comprimentos diferentes: a cauda nova nasce do último ponto velho", () => {
    const de = [{ t: 0, v: 5 }];
    const para = [
      { t: 0, v: 5 },
      { t: 10, v: 50 },
      { t: 20, v: 90 },
    ];
    const meio = interpPts(de, para, 0.5);
    expect(meio).toHaveLength(3);
    expect(meio[2].v).toBeCloseTo(47.5); // 5 → 90
  });
  it("origem vazia: fica o destino (nascer do nada seria inventar)", () => {
    expect(interpPts([], [{ t: 1, v: 2 }], 0.5)).toEqual([{ t: 1, v: 2 }]);
  });
});

describe("chaveSeries", () => {
  const mk = (v: number) => [
    { name: "a", pts: [{ t: 1, v }, { t: 2, v: v + 1 }] },
  ];
  it("dados iguais → mesma chave (sem morph)", () => {
    expect(chaveSeries(mk(3))).toBe(chaveSeries(mk(3)));
  });
  it("valor ou nome diferentes → chave diferente", () => {
    expect(chaveSeries(mk(3))).not.toBe(chaveSeries(mk(4)));
    const outro = [{ name: "b", pts: mk(3)[0].pts }];
    expect(chaveSeries(mk(3))).not.toBe(chaveSeries(outro));
  });
});

// regra nº 1 aplicada a anotações: nenhum evento entra sem fonte e URL
describe("eventos.json — disciplina de fonte", () => {
  it("cada evento tem data ISO válida, rótulo, fonte e URL", () => {
    for (const e of eventos.eventos) {
      expect(e.id.length).toBeGreaterThan(0);
      expect(e.rotulo.length).toBeGreaterThan(0);
      expect(e.fonte.length).toBeGreaterThan(0);
      expect(e.url).toMatch(/^https:\/\//);
      expect(Number.isNaN(Date.parse(e.t))).toBe(false);
      if (e.tFim) {
        expect(Date.parse(e.tFim)).toBeGreaterThanOrEqual(Date.parse(e.t));
      }
    }
  });
  it("os alvos são contextos de gráfico conhecidos", () => {
    for (const e of eventos.eventos) {
      expect(["euribor", "combustiveis", "ihpc"]).toContain(e.alvo);
    }
  });
});
