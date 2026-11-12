import { describe, it, expect } from "vitest";
import { simularSalario, impostoPorEscaloes, REGRAS_IRS } from "./irs";
import { simularIrsJovem } from "./irs-jovem";
import { reciboMensal, LIMITE_SA } from "./recibo";

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

  it("IRS Jovem (1.º, 5.º e 8.º ano): coerente com simularIrsJovem e com reciboMensal", () => {
    const a1 = simularSalario([1500], 0, 2026, 14, { anoIrsJovem: 1 });
    const a5 = simularSalario([1500], 0, 2026, 14, { anoIrsJovem: 5 });
    const a8 = simularSalario([1500], 0, 2026, 14, { anoIrsJovem: 8 });
    const semJovem = simularSalario([1500], 0, 2026);

    for (const [anoGozo, anual] of [[1, a1], [5, a5], [8, a8]] as const) {
      const jovem = simularIrsJovem(1500 * 14, anoGozo, 2026);
      const recibo = reciboMensal({ bruto: 1500, anoIrsJovem: anoGozo, ano: 2026 });

      // O IRS anual bate exactamente com o motor dedicado simularIrsJovem
      expect(anual.irsAnual).toBeCloseTo(jovem.irsComJovem, 6);
      expect(anual.coletavelTributado).toBeCloseTo(jovem.coletavelTributado, 6);
      // A retenção mensal × 14 cobre o IRS anual apurado na liquidação
      expect(recibo.retencao * 14).toBeGreaterThanOrEqual(anual.irsAnual - 1e-6);

      if (anoGozo === 1) {
        // 1.º ano (100 % isento até 55×IAS): 0 € no recibo mensal e 0 € no IRS anual
        expect(recibo.retencao).toBe(0);
        expect(anual.irsAnual).toBe(0);
        expect(anual.liquidoMensal14).toBeCloseTo(recibo.liquido, 6);
      }
    }

    // Monotonicidade: 1.º ano (0 €) < 5.º ano (50 %) < 8.º ano (25 %) < sem IRS Jovem
    expect(a1.irsAnual).toBe(0);
    expect(a5.irsAnual).toBeGreaterThan(a1.irsAnual);
    expect(a8.irsAnual).toBeGreaterThan(a5.irsAnual);
    expect(semJovem.irsAnual).toBeGreaterThan(a8.irsAnual);

    // Limite de 55×IAS (29 542,15 € em 2026) trava a isenção em salários altos
    const alto = simularSalario([4500], 0, 2026, 14, { anoIrsJovem: 1 });
    const altoJovem = simularIrsJovem(4500 * 14, 1, 2026);
    expect(alto.irsAnual).toBeCloseTo(altoJovem.irsComJovem, 6);
    expect(alto.irsAnual).toBeGreaterThan(0);
  });

  it("subsídio de alimentação anual (11 × 22 dias): cartão isento vs dinheiro com excedente tributável", () => {
    const diasAno = 11 * 22;
    const base = simularSalario([1500], 0, 2026);

    // 8 €/dia em cartão (≤ 10,46 €/dia): totalmente isento → não altera SS, IRS nem TSU
    const recCartao = reciboMensal({ bruto: 1500, saPorDia: 8, formaSA: "cartao", ano: 2026 });
    const saCartaoAnual = Math.min(8, LIMITE_SA.cartao) * diasAno;
    const comCartao = simularSalario([1500], 0, 2026, 14, {
      saIsentoAnual: saCartaoAnual,
      saTributavelAnual: 0,
    });
    expect(recCartao.saTributavel).toBe(0);
    expect(comCartao.ssAnual).toBeCloseTo(base.ssAnual, 6);
    expect(comCartao.irsAnual).toBeCloseTo(base.irsAnual, 6);
    expect(comCartao.liquidoAnual).toBeCloseTo(base.liquidoAnual + saCartaoAnual, 6);
    expect(comCartao.custoEmpresaAnual).toBeCloseTo(base.custoEmpresaAnual + saCartaoAnual, 6);

    // 8 €/dia em dinheiro (> 6,15 €/dia): 6,15 € isentos + 1,85 € sujeitos a SS, IRS e TSU
    const recDinheiro = reciboMensal({ bruto: 1500, saPorDia: 8, formaSA: "dinheiro", ano: 2026 });
    const saIsentoDin = Math.min(8, LIMITE_SA.dinheiro) * diasAno;
    const saTribDin = Math.max(0, 8 - LIMITE_SA.dinheiro) * diasAno;
    const comDinheiro = simularSalario([1500], 0, 2026, 14, {
      saIsentoAnual: saIsentoDin,
      saTributavelAnual: saTribDin,
    });
    expect(recDinheiro.saTributavel).toBeCloseTo(1.85 * 22, 6);
    expect(comDinheiro.brutoAnualTotal).toBeCloseTo(base.brutoAnualTotal + saTribDin, 6);
    expect(comDinheiro.ssAnual).toBeCloseTo(base.ssAnual + saTribDin * 0.11, 6);
    expect(comDinheiro.irsAnual).toBeGreaterThan(base.irsAnual);
    expect(comDinheiro.custoEmpresaAnual).toBeCloseTo(
      (base.brutoAnualTotal + saTribDin) * 1.2375 + saIsentoDin,
      6
    );
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
