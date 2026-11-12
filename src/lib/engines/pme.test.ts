import { describe, expect, it } from "vitest";
import { REGRAS_PME_2026, simularPme } from "./pme";

describe("pme — IVA na caixa, Sócio-Gerente, IRC PME (Lei 64/2025) e Dividendos", () => {
  it("(a) O IVA na caixa não é da empresa: IVA entregue = IVA liquidado nas vendas − IVA dedutível nas compras", () => {
    const r = simularPme({
      faturacaoMensalSemIva: 10000,
      custosMensaisSemIva: 6000,
      remuneracaoGerenteMensal: 1500,
      taxaIvaVendas: 0.23,
      taxaIvaCompras: 0.23,
    });
    expect(r.ivaLiquidadoMensal).toBeCloseTo(2300, 2);
    expect(r.ivaDedutivelMensal).toBeCloseTo(1380, 2);
    expect(r.ivaEntregueEstadoMensal).toBeCloseTo(920, 2);
    expect(r.ivaEntregueEstadoAnual).toBeCloseTo(920 * 12, 2);
  });

  it("(b) Remuneração do sócio-gerente: TSU entidade 23,75 % + SS gerente 11 % + IRS anual sobre 14 meses", () => {
    const r = simularPme({
      faturacaoMensalSemIva: 8000,
      custosMensaisSemIva: 2000,
      remuneracaoGerenteMensal: 1500,
    });
    expect(r.brutoGerenteAnual).toBe(21000);
    expect(r.tsuEmpresaGerenteAnual).toBeCloseTo(21000 * 0.2375, 2); // 4 987,50 €
    expect(r.ssGerenteAnual).toBeCloseTo(21000 * 0.11, 2); // 2 310,00 €
    expect(r.custoTotalGerenteEmpresaAnual).toBeCloseTo(25987.5, 2);
    expect(r.liquidoSalarioGerenteAnual).toBeCloseTo(
      r.brutoGerenteAnual - r.ssGerenteAnual - r.irsGerenteAnual,
      2
    );
  });

  it("(c) IRC PME 2026: 15 % nos primeiros 50 000 € e 19 % no excedente no Continente (10,5 % / 13,3 % nas Ilhas) + derrama 1,5 %", () => {
    expect(REGRAS_PME_2026.irc.pmeSmallMidCap.limiteMateriaColetavelReduzida).toBe(50000);
    expect(REGRAS_PME_2026.irc.pmeSmallMidCap.taxaReduzidaPrimeiroEscalao.continente).toBe(0.15);
    expect(REGRAS_PME_2026.irc.pmeSmallMidCap.taxaExcedente.continente).toBe(0.19);
    expect(REGRAS_PME_2026.irc.pmeSmallMidCap.taxaReduzidaPrimeiroEscalao.acores).toBe(0.105);
    expect(REGRAS_PME_2026.irc.pmeSmallMidCap.taxaExcedente.acores).toBe(0.133);

    // Faturação 10 000 €/mês (120 000 €/ano), custos 3 000 €/mês (36 000 €/ano), gerente 0 € → matéria coletável = 84 000 €
    const cont = simularPme({
      faturacaoMensalSemIva: 10000,
      custosMensaisSemIva: 3000,
      remuneracaoGerenteMensal: 0,
      regiao: "continente",
      taxaDerramaMunicipal: 0.015,
    });
    expect(cont.materiaColetavel).toBe(84000);
    expect(cont.fatiaTaxaReduzida).toBe(50000);
    expect(cont.fatiaTaxaGeral).toBe(34000);
    // IRC base = 50 000 × 0,15 + 34 000 × 0,19 = 7 500 + 6 460 = 13 960 €
    expect(cont.ircBase).toBeCloseTo(13960, 2);
    // Derrama = 84 000 × 0,015 = 1 260 €
    expect(cont.derramaMunicipal).toBeCloseTo(1260, 2);
    expect(cont.ircTotal).toBeCloseTo(15220, 2);
    expect(cont.lucroLiquidoEmpresa).toBeCloseTo(84000 - 15220, 2);

    // Nos Açores: 50 000 × 0,105 + 34 000 × 0,133 = 5 250 + 4 522 = 9 772 €
    const acores = simularPme({
      faturacaoMensalSemIva: 10000,
      custosMensaisSemIva: 3000,
      remuneracaoGerenteMensal: 0,
      regiao: "acores",
      taxaDerramaMunicipal: 0.015,
    });
    expect(acores.ircBase).toBeCloseTo(9772, 2);
  });

  it("(d) Dividendos: compara taxa liberatória de 28 % (art. 71.º CIRS) vs. englobamento em 50 % (art. 40.º-A CIRS)", () => {
    const r = simularPme({
      faturacaoMensalSemIva: 6000,
      custosMensaisSemIva: 2000,
      remuneracaoGerenteMensal: 1200,
      modoDividendos: "englobamento",
    });
    expect(r.impostoDividendosLiberatoria).toBeCloseTo(
      r.lucroLiquidoEmpresa * 0.28,
      2
    );
    // Com salário baixo/médio, englobar apenas 50 % dos dividendos (art. 40.º-A CIRS) paga menos que os 28 % liberatórios
    expect(r.impostoDividendosEnglobamento).toBeLessThan(
      r.impostoDividendosLiberatoria
    );
    expect(r.dividendosLiquidosEnglobamento).toBeGreaterThan(
      r.dividendosLiquidosLiberatoria
    );
  });
});
