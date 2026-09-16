import { describe, it, expect } from "vitest";
import { simularPrestacao } from "./prestacao";
import { simularPoupanca } from "./poupanca";
import { decomporCombustivel, ivaContido } from "./impostos";

describe("simularPrestacao", () => {
  it("200 000 € a 30 anos com TAN 3 %: prestação ≈ 843 €", () => {
    const r = simularPrestacao(200000, 360, 0.025, 0.005);
    expect(r.prestacao).toBeCloseTo(843.2, 0);
    expect(r.custoTotal).toBeCloseTo(200000 + r.jurosTotais, 6);
    expect(r.linhas).toHaveLength(360);
    expect(r.linhas[359].divida).toBeCloseTo(0, 1);
  });

  it("taxa 0 %: prestação = capital / n", () => {
    const r = simularPrestacao(12000, 120, -0.0, 0);
    expect(r.prestacao).toBeCloseTo(100, 6);
  });

  it("+1 p.p. na Euribor aumenta a prestação", () => {
    const a = simularPrestacao(200000, 360, 0.02, 0.01);
    const b = simularPrestacao(200000, 360, 0.03, 0.01);
    expect(b.prestacao).toBeGreaterThan(a.prestacao);
  });
});

describe("simularPoupanca", () => {
  it("10 000 € a 10 anos a 2,5 % com 28 % de imposto: ≈ 11 953 €", () => {
    const r = simularPoupanca(10000, 10, 0.025);
    expect(r.taxaLiquida).toBeCloseTo(0.018, 6);
    expect(r.capitalFinalLiquido).toBeCloseTo(11953.3, 0);
  });

  it("inflação corrói o valor real", () => {
    const r = simularPoupanca(10000, 10, 0.015, 0.28, 0.03);
    expect(r.valorReal).toBeLessThan(10000);
  });
});

describe("impostos", () => {
  it("gasolina a 1,85 €/L: impostos ≈ 51 % do preço", () => {
    const d = decomporCombustivel(1.85, 0.44354, 0.159);
    expect(d.iva).toBeCloseTo(0.3459, 3);
    expect(d.pesoImpostos).toBeCloseTo(0.513, 2);
    expect(d.produto + d.impostos).toBeCloseTo(1.85, 6);
  });

  it("IVA contido: 1,23 € a 23 % → 0,23 € de imposto", () => {
    const r = ivaContido(1.23, 0.23);
    expect(r.iva).toBeCloseTo(0.23, 6);
    expect(r.semIva).toBeCloseTo(1.0, 6);
  });
});
