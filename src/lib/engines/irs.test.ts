import { describe, it, expect } from "vitest";
import { simularSalario, impostoPorEscaloes, REGRAS_IRS } from "./irs";

describe("simularSalario — casos golden 2026", () => {
  it("salário mínimo 920 €: isento de IRS, líquido 818,80 €/mês (14 meses)", () => {
    const r = simularSalario([920], 0, 2026);
    expect(r.irsAnual).toBe(0);
    expect(r.ssAnual).toBeCloseTo(1416.8, 1);
    expect(r.liquidoMensal14).toBeCloseTo(818.8, 1);
  });

  it("1500 € solteiro sem dependentes: IRS anual ≈ 2 270 €", () => {
    const r = simularSalario([1500], 0, 2026);
    // rendimento coletável = 21 000 − 4 587,09 = 16 412,91
    // imposto por fatias: 1 042,75 + 666,47 + 811,09 = 2 520,31; −250 despesas gerais
    expect(r.irsAnual).toBeCloseTo(2270.31, 0);
    expect(r.taxaMarginal).toBeCloseTo(0.212, 3);
    expect(r.taxaEfetiva).toBeCloseTo(0.108, 2);
    expect(r.liquidoAnual).toBeCloseTo(16419.69, 0);
  });

  it("casal 2 titulares a 1500 €: quociente conjugal duplica o imposto de metade", () => {
    const r = simularSalario([1500, 1500], 0, 2026);
    expect(r.irsAnual).toBeCloseTo(4540.63, 0);
    expect(r.ssAnual).toBeCloseTo(4620, 0);
  });

  it("dependentes reduzem a coleta (726 € cada)", () => {
    const sem = simularSalario([1500], 0, 2026);
    const com = simularSalario([1500], 2, 2026);
    expect(sem.irsAnual - com.irsAnual).toBeCloseTo(1452, 0);
  });

  it("custo para a empresa inclui TSU 23,75 %", () => {
    const r = simularSalario([1500], 0, 2026);
    expect(r.custoEmpresaAnual).toBeCloseTo(21000 * 1.2375, 1);
  });

  it("mínimo de existência: nunca gera coletável negativo nem IRS em rendimentos ≤ VR", () => {
    for (const bruto of [700, 800, 920]) {
      const r = simularSalario([bruto], 0, 2026);
      expect(r.titulares[0].coletavel).toBeGreaterThanOrEqual(0);
      expect(r.irsAnual).toBe(0);
    }
  });
});

describe("impostoPorEscaloes", () => {
  const regras = REGRAS_IRS[2026];

  it("1.º escalão: 8 342 × 12,5 %", () => {
    expect(impostoPorEscaloes(8000, regras)).toBeCloseTo(1000, 1);
  });

  it("progressivo no limiar do 3.º escalão", () => {
    // 8 342×12,5% + 4 245×15,7% + 1 000×21,2%
    expect(impostoPorEscaloes(13587, regras)).toBeCloseTo(1042.75 + 666.47 + 212, 0);
  });

  it("adicional de solidariedade acima de 80 000 €", () => {
    const base = impostoPorEscaloes(86634, regras);
    const comSol = impostoPorEscaloes(100000, regras);
    // 13 366 × 48 % (9.º escalão) + solidariedade: (20 000 − 6 634) × 2,5 %
    expect(comSol - base).toBeCloseTo(13366 * 0.48 + 13366 * 0.025, 0);
  });
});
