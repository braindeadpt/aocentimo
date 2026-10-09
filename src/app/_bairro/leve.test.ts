import { describe, it, expect } from "vitest";
import { aparelhoFraco, mediana, LIMITE_MS } from "./leve";

describe("aparelhoFraco()", () => {
  it("Android de gama baixa (2 GB) é fraco", () => {
    expect(aparelhoFraco({ nucleos: 8, memoria: 2 })).toBe(true);
  });
  it("4 núcleos e 4 GB é fraco; 8 núcleos e 4 GB não", () => {
    expect(aparelhoFraco({ nucleos: 4, memoria: 4 })).toBe(true);
    expect(aparelhoFraco({ nucleos: 8, memoria: 4 })).toBe(false);
  });
  it("sem memória anunciada (iPhone, Firefox) não decide só pelos núcleos", () => {
    expect(aparelhoFraco({ nucleos: 4 })).toBe(false);
    expect(aparelhoFraco({})).toBe(false);
  });
  it("poupança de dados pedida → leve", () => {
    expect(aparelhoFraco({ nucleos: 8, memoria: 8, poupanca: true })).toBe(true);
  });
});

describe("mediana()", () => {
  it("ímpar, par e vazia", () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([])).toBe(0);
  });
  it("60 fps fica muito abaixo do limite", () => {
    expect(mediana(Array(60).fill(16.7))).toBeLessThan(LIMITE_MS);
  });
});
