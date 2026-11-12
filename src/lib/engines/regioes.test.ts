import { describe, expect, it } from "vitest";
import regioes2026 from "@data/fiscal/regioes-autonomas-2026.json";
import smn from "@data/fiscal/smn.json";
import { ivaContido } from "./impostos";
import { REGRAS_IRS, regrasIrsRegionais, simularSalario } from "./irs";
import { reciboMensal, TAXA_ADSE_RECIBO } from "./recibo";

describe("reciboMensal — Duodécimos (art. 99.º-C CIRS) e ADSE (DL 118/83)", () => {
  it("duodécimos a 50 % e 100 % retêm autonomamente sem subir o escalão mensal e batem ao cêntimo em 14 meses", () => {
    const r14 = reciboMensal({ bruto: 1500, duodecimos: "14", ano: 2026 });
    const r50 = reciboMensal({ bruto: 1500, duodecimos: "50", ano: 2026 });
    const r100 = reciboMensal({ bruto: 1500, duodecimos: "100", ano: 2026 });

    expect(r14.duodecimosBruto).toBe(0);
    expect(r50.duodecimosBruto).toBeCloseTo(1500 / 12, 6);
    expect(r100.duodecimosBruto).toBeCloseTo((1500 * 2) / 12, 6);

    // A taxa efetiva de retenção não sobe com duodécimos (retenção autónoma art. 99.º-C CIRS)
    expect(r50.taxaEfetiva).toBeCloseTo(r14.taxaEfetiva, 6);
    expect(r100.taxaEfetiva).toBeCloseTo(r14.taxaEfetiva, 6);

    // 12 meses com duodécimos a 100 % = 14 meses normais ao cêntimo
    expect(r100.liquido * 12).toBeCloseTo(r14.liquido * 14, 4);
    expect(r100.retencao * 12).toBeCloseTo(r14.retencao * 14, 4);
    expect(r100.ss * 12).toBeCloseTo(r14.ss * 14, 4);
  });

  it("ADSE (3,5 % × 14 meses) acumula com os 11 % de SS para trabalhadores admitidos desde 2006", () => {
    expect(TAXA_ADSE_RECIBO).toBe(0.035);
    const semAdse = reciboMensal({ bruto: 1800, adse: false, ano: 2026 });
    const comAdse = reciboMensal({ bruto: 1800, adse: true, ano: 2026 });

    expect(comAdse.adse).toBeCloseTo(1800 * 0.035, 4); // 63,00 €
    expect(comAdse.ss).toBeCloseTo(1800 * 0.11, 4); // 198,00 €
    expect(semAdse.liquido - comAdse.liquido).toBeCloseTo(63.0, 4);

    const anualSem = simularSalario([1800], 0, 2026, 14, { adse: false });
    const anualCom = simularSalario([1800], 0, 2026, 14, { adse: true });
    expect(anualCom.adseAnual).toBeCloseTo(1800 * 14 * 0.035, 4);
    expect(anualSem.liquidoAnual - anualCom.liquidoAnual).toBeCloseTo(
      1800 * 14 * 0.035,
      4
    );
  });
});

describe("Regiões Autónomas — Açores e Madeira (SMN, IRS e IVA 2026)", () => {
  it("SMN regional 2026: 920 € Continente, 966 € Açores, 980 € Madeira", () => {
    expect(smn.regioes.continente).toBe(920);
    expect(smn.regioes.acores).toBe(966);
    expect(smn.regioes.madeira).toBe(980);
  });

  it("IRS Açores: redução oficial de 30 % em todos os escalões do art. 68.º CIRS (DLR 15-A/2021/A)", () => {
    const rAcores = regrasIrsRegionais(REGRAS_IRS[2026], "acores");
    for (let i = 0; i < rAcores.escaloes.length; i++) {
      expect(rAcores.escaloes[i].taxa).toBeCloseTo(
        regioes2026.irs.acores.taxasEscaloes2026[i].taxaAcores,
        6
      );
    }

    const cont = simularSalario([2000], 0, 2026, 14, { regiao: "continente" });
    const acores = simularSalario([2000], 0, 2026, 14, { regiao: "acores" });
    expect(acores.irsBruto).toBeCloseTo(cont.irsBruto * 0.7, 2);
    expect(acores.irsAnual).toBeCloseTo(
      Math.max(0, cont.irsBruto * 0.7 - cont.deducoesColeta),
      2
    );
    expect(acores.liquidoAnual).toBeGreaterThan(cont.liquidoAnual);
  });

  it("IVA regional: Açores (4 / 9 / 16 %) e Madeira (4 / 12 / 22 %) reduzem o IVA contido no preço", () => {
    expect(regioes2026.iva.acores.taxaReduzida).toBe(0.04);
    expect(regioes2026.iva.acores.taxaIntermedia).toBe(0.09);
    expect(regioes2026.iva.acores.taxaNormal).toBe(0.16);
    expect(regioes2026.iva.madeira.taxaReduzida).toBe(0.04);
    expect(regioes2026.iva.madeira.taxaIntermedia).toBe(0.12);
    expect(regioes2026.iva.madeira.taxaNormal).toBe(0.22);

    const ivaCont = ivaContido(100, 0.23).iva;
    const ivaMad = ivaContido(100, 0.22).iva;
    const ivaAco = ivaContido(100, 0.16).iva;
    expect(ivaAco).toBeLessThan(ivaMad);
    expect(ivaMad).toBeLessThan(ivaCont);
  });
});
