import { describe, expect, it } from "vitest";
import { FITA, geometriaFita } from "@/lib/fita";
import { rasgoCantoPts, sementeDe } from "@/lib/materia";

// salário de 1 500 €, solteiro — os mesmos números da home
const CASO = { custo: 1856, tsu: 356, irs: 162, ss: 165, liquido: 1173 };
const geo = () => geometriaFita(CASO.custo, [CASO.tsu, CASO.irs, CASO.ss], CASO.liquido);

describe("geometriaFita — validação dos dados", () => {
  it("aceita o caso normal", () => {
    expect(geo().ok).toBe(true);
  });
  it("rejeita custo não positivo", () => {
    expect(geometriaFita(0, [1], 0).ok).toBe(false);
    expect(geometriaFita(-100, [1], 0).ok).toBe(false);
  });
  it("rejeita cortes negativos ou NaN", () => {
    expect(geometriaFita(100, [-5], 95).ok).toBe(false);
    expect(geometriaFita(100, [NaN], 95).ok).toBe(false);
  });
  it("rejeita soma que excede o custo", () => {
    expect(geometriaFita(100, [60, 50], 10).ok).toBe(false);
  });
  it("rejeita líquido negativo", () => {
    expect(geometriaFita(100, [10], -1).ok).toBe(false);
  });
});

describe("geometriaFita — escala única", () => {
  it("a largura máxima é sempre o custo", () => {
    const g = geo();
    expect(g.larguras[0]).toBeCloseTo(FITA.LARG_MAX, 1);
    expect(g.k).toBeCloseTo(FITA.LARG_MAX / CASO.custo, 5);
  });
  it("a fita nunca sai do viewBox — valores grandes", () => {
    const g = geometriaFita(99999, [30000, 20000, 10000], 39999);
    expect(g.larguras[0]).toBeCloseTo(FITA.LARG_MAX, 1);
    for (const p of g.pecas) {
      expect(p.fx + p.w).toBeLessThanOrEqual(560);
    }
  });
  it("larguras decrescem monotonicamente até ao líquido", () => {
    const g = geo();
    for (let i = 1; i < g.larguras.length; i++) {
      expect(g.larguras[i]).toBeLessThan(g.larguras[i - 1]);
    }
    expect(g.larguras[g.larguras.length - 1]).toBeCloseTo(
      CASO.liquido * g.k,
      1
    );
  });
});

describe("geometriaFita — casos limite", () => {
  it("corte zero: sem notch, sem path, com marca zero", () => {
    const g = geometriaFita(1139, [219, 0, 101], 819); // SMN: irs = 0
    expect(g.ok).toBe(true);
    expect(g.pecas[1].zero).toBe(true);
    expect(g.pecas[1].path).toBe("");
    expect(g.pecas[0].zero).toBe(false);
    expect(g.pecas[2].zero).toBe(false);
    // a fita continua à mesma largura através do corte zero
    expect(g.larguras[1]).toBeCloseTo(g.larguras[2], 5);
  });
  it("pedaço minúsculo: largura mínima + flag naoProp", () => {
    const g = geometriaFita(2000, [500, 5, 400], 1095);
    expect(g.pecas[1].w).toBe(FITA.LARG_MIN);
    expect(g.pecas[1].naoProp).toBe(true);
    expect(g.pecas[0].naoProp).toBe(false);
  });
  it("corte enorme não invade a pilha", () => {
    const g = geometriaFita(1000, [700, 10, 10], 280);
    expect(g.pecas[0].fx + g.pecas[0].w).toBeLessThanOrEqual(560);
  });
});

describe("geometriaFita — determinismo e partitura", () => {
  it("o mesmo salário produz a mesma silhueta", () => {
    expect(geo().fita).toBe(geo().fita);
    expect(geo().pecas[0].path).toBe(geo().pecas[0].path);
  });
  it("salários diferentes rasgam diferente", () => {
    const outro = geometriaFita(2000, [356, 162, 165], 1317);
    expect(outro.fita).not.toBe(geo().fita);
  });
  it("os rasgos são sequenciais — delays crescem com a posição", () => {
    const g = geo();
    for (let i = 1; i < g.pecas.length; i++) {
      expect(g.pecas[i].delay).toBeGreaterThan(g.pecas[i - 1].delay);
    }
    // todos dentro da janela do wipe
    for (const p of g.pecas) {
      expect(p.delay).toBeLessThanOrEqual(FITA.WIPE_MS);
    }
  });
});

describe("rasgoCantoPts — a linha partilhada fita↔pedaço", () => {
  it("vai de (comp,0) a (0,alt)", () => {
    const pts = rasgoCantoPts(40, 30, { semente: sementeDe(35600) });
    expect(pts[0]).toEqual([40, 0]);
    expect(pts[pts.length - 1]).toEqual([0, 30]);
  });
  it("é determinista por semente", () => {
    const a = rasgoCantoPts(40, 30, { semente: 42 });
    const b = rasgoCantoPts(40, 30, { semente: 42 });
    expect(a).toEqual(b);
    const c = rasgoCantoPts(40, 30, { semente: 43 });
    expect(c).not.toEqual(a);
  });
  it("tem dentes nas duas pernas — não é um L recto", () => {
    const pts = rasgoCantoPts(60, 40, { semente: 7 });
    const desvioH = pts.some(([x, y]) => y > 0.5 && x > 1);
    const desvioV = pts.some(([x, y]) => x > 0.5 && y > 1);
    expect(desvioH).toBe(true);
    expect(desvioV).toBe(true);
  });
});
