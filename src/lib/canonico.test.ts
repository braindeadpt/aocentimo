import { describe, it, expect } from "vitest";
import { BRUTO_CANONICO, cenarioCanonico } from "./canonico";
import { reciboMensal } from "./engines/recibo";

// S1-02 defeito 6 — a história canónica do euro: começa no custo total
// para a empresa (bruto + TSU patronal) e o «líquido» é sempre o do
// recibo mensal com retenção real × 12. Home e /salario consomem
// daqui — nenhum recalcula por si.
describe("cenarioCanonico", () => {
  const c = cenarioCanonico();

  it("o caso-base é solteiro, sem dependentes, sem SA — igual ao recibo", () => {
    const r = reciboMensal({ bruto: BRUTO_CANONICO, ano: 2026 });
    expect(c.ssMes).toBeCloseTo(r.ss, 6);
    expect(c.irsRetidoMes).toBeCloseTo(r.retencao, 6);
    expect(c.liquidoMes).toBeCloseTo(r.liquido, 6);
    expect(c.custoEmpresaMes).toBeCloseTo(r.custoEmpresa, 6);
  });

  it("invariante: custo − tsu − irs − ss = líquido", () => {
    expect(
      c.custoEmpresaMes - c.tsuEntidadeMes - c.irsRetidoMes - c.ssMes
    ).toBeCloseTo(c.liquidoMes, 6);
  });

  it("o custo total inclui a TSU patronal — a empresa paga mais que o bruto", () => {
    expect(c.custoEmpresaMes).toBeGreaterThan(c.brutoMes);
    expect(c.tsuEntidadeMes).toBeCloseTo(c.custoEmpresaMes - c.brutoMes, 6);
  });

  it("o líquido anual canónico é o recibo × 12 — não a média a 14", () => {
    expect(c.liquidoAno12).toBeCloseTo(c.liquidoMes * 12, 6);
    expect(c.custoAno12).toBeCloseTo(c.custoEmpresaMes * 12, 6);
  });

  it("cêntimos por euro de custo — a resposta da adivinha", () => {
    expect(c.centimosPorEuroCusto).toBeGreaterThan(0);
    expect(c.centimosPorEuroCusto).toBeLessThan(100);
    expect(c.centimosPorEuroCusto).toBeCloseTo(
      (c.liquidoMes / c.custoEmpresaMes) * 100,
      6
    );
  });
});
