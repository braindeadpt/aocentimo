import { describe, it, expect } from "vitest";
import {
  arestaRasgada,
  furos,
  prng,
  r1,
  sementeDe,
  sombraPeca,
} from "./materia";

describe("prng", () => {
  it("a mesma semente dá a mesma sequência", () => {
    const a = prng(42);
    const b = prng(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });
  it("sementes diferentes dão sequências diferentes", () => {
    const a = prng(1)();
    const b = prng(2)();
    expect(a).not.toBe(b);
  });
  it("devolve valores em [0,1)", () => {
    const rand = prng(7);
    for (let i = 0; i < 200; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("arestaRasgada", () => {
  it("a mesma semente produz o mesmo caminho (não salta)", () => {
    expect(arestaRasgada(300, { semente: 123 })).toBe(
      arestaRasgada(300, { semente: 123 })
    );
  });
  it("sementes diferentes produzem rasgos diferentes", () => {
    expect(arestaRasgada(300, { semente: 1 })).not.toBe(
      arestaRasgada(300, { semente: 2 })
    );
  });
  it("não tem NaN nem coordenadas vazias", () => {
    for (const semente of [0, 1, 999, 123456]) {
      const d = arestaRasgada(300, { semente });
      expect(d).not.toMatch(/NaN|undefined|Infinity/);
      expect(d).toMatch(/^M0,0/);
    }
  });
  it("começa em (0,0) e acaba em (comprimento,0)", () => {
    const d = arestaRasgada(300, { semente: 5 });
    expect(d.startsWith("M0,0")).toBe(true);
    expect(d.endsWith("L300,0")).toBe(true);
  });
  it("é irregular — nem todos os passos são iguais", () => {
    const d = arestaRasgada(400, { semente: 11 });
    const xs = [...d.matchAll(/L([\d.]+),0/g)].map((m) => Number(m[1]));
    const passos = xs.slice(1).map((x, i) => x - xs[i]);
    expect(new Set(passos.map((p) => p.toFixed(1))).size).toBeGreaterThan(3);
  });
  it("grosseria controla a amplitude média", () => {
    const ys = (d: string) =>
      [...d.matchAll(/,(-?[\d.]+)/g)].map((m) => Math.abs(Number(m[1])));
    const suave = Math.max(...ys(arestaRasgada(500, { semente: 3, grosseria: 0 })));
    const bruto = Math.max(...ys(arestaRasgada(500, { semente: 3, grosseria: 1 })));
    expect(bruto).toBeGreaterThan(suave);
  });
  it("o lado inverte a direção dos dentes", () => {
    const baixo = arestaRasgada(200, { semente: 8, lado: 1 });
    const cima = arestaRasgada(200, { semente: 8, lado: -1 });
    const maxBaixo = Math.max(
      ...[...baixo.matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1]))
    );
    const minCima = Math.min(
      ...[...cima.matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1]))
    );
    expect(maxBaixo).toBeGreaterThan(0);
    expect(minCima).toBeLessThan(0);
  });
});

describe("furos", () => {
  it("espaçamento regular de máquina", () => {
    const f = furos(140, { espacamento: 14 });
    expect(f.length).toBeGreaterThan(5);
    for (let i = 1; i < f.length; i++) {
      expect(f[i] - f[i - 1]).toBeCloseTo(14, 1);
    }
  });
  it("respeita as margens", () => {
    const f = furos(100, { margem: 10 });
    expect(f[0]).toBeGreaterThanOrEqual(10);
    expect(f[f.length - 1]).toBeLessThanOrEqual(90);
  });
});

describe("sementeDe", () => {
  it("é estável para o mesmo valor", () => {
    expect(sementeDe(1234.56)).toBe(sementeDe(1234.56));
  });
  it("valores diferentes dão sementes diferentes", () => {
    expect(sementeDe(100)).not.toBe(sementeDe(101));
  });
});

describe("sombraPeca", () => {
  it("altura maior = sombra mais distante e difusa", () => {
    const baixa = sombraPeca({ altura: 0 });
    const alta = sombraPeca({ altura: 1 });
    expect(alta).not.toBe(baixa);
    const dy = (s: string) => Number(/ (\d+(?:\.\d+)?)px/.exec(s)![1]);
    expect(dy(alta)).toBeGreaterThan(dy(baixa));
  });
  it("ângulo desvia a sombra na horizontal", () => {
    const esq = sombraPeca({ angulo: -10 });
    const dir = sombraPeca({ angulo: 10 });
    const dx = (s: string) => Number(/drop-shadow\((-?[\d.]+)px/.exec(s)![1]);
    expect(dx(dir)).toBeGreaterThan(dx(esq));
  });
});

describe("r1", () => {
  it("arredonda a 1 casa decimal", () => {
    expect(r1(1.26)).toBe(1.3);
    expect(r1(-0.04)).toBe(0);
  });
});
