import { describe, expect, it } from "vitest";
import {
  DEDUCAO_ESPECIFICA_PENSAO_2026,
  LIMIAR_SALVAGUARDA_ADSE_PENSAO,
  TAXA_ADSE,
  descontoAdsePensao,
  reciboPensaoMensal,
  retencaoPensaoNaFonte,
  simularPensao,
  tabelaPensaoAplicavel,
} from "./pensao";

describe("pensao — Retenção na fonte (Tabelas VIII e IX, Despacho n.º 233-A/2026)", () => {
  it("seleciona Tabela VIII para não casado ou casado 2 titulares e Tabela IX para casado único titular", () => {
    expect(tabelaPensaoAplicavel("naoCasado")).toBe("VIII");
    expect(tabelaPensaoAplicavel("casadoDoisTitulares")).toBe("VIII");
    expect(tabelaPensaoAplicavel("casadoUnicoTitular")).toBe("IX");
  });

  it("Tabela VIII — fronteiras de transição e escalões (920 €, 1 042 €, 1 100 €, 1 500 €, 2 500 €)", () => {
    // Até 920 €: isento (0 €)
    const r920 = retencaoPensaoNaFonte(920, "naoCasado", 0);
    expect(r920.tabela).toBe("VIII");
    expect(r920.retencao).toBe(0);
    expect(r920.taxaMarginal).toBe(0);

    // 1 042 € (1.ª linha de transição: taxa 12,5 %, parcela = 0,125 × 2,6 × (1320,92 − 1042) = 90,649)
    // retencao = 1042 × 0,125 − 90,649 = 130,25 − 90,649 = 39,601
    const r1042 = retencaoPensaoNaFonte(1042, "naoCasado", 0);
    expect(r1042.taxaMarginal).toBe(0.125);
    expect(r1042.parcelaAbater).toBeCloseTo(90.649, 3);
    expect(r1042.retencao).toBeCloseTo(39.601, 3);

    // 1 100 € (2.ª linha de transição: taxa 15,7 %, parcela = 0,157 × 1,35 × (1627,01 − 1100) = 111,6997695)
    // retencao = 1100 × 0,157 − 111,6997695 = 172,70 − 111,70 = 61,00 (continuidade com linha 1133!)
    const r1100 = retencaoPensaoNaFonte(1100, "naoCasado", 0);
    expect(r1100.taxaMarginal).toBe(0.157);
    expect(r1100.parcelaAbater).toBeCloseTo(111.7, 2);
    expect(r1100.retencao).toBeCloseTo(61.0, 2);

    // 1 500 € (escalão até 1 869 €: taxa 24,1 %, parcela 209,96 €)
    // retencao = 1500 × 0,241 − 209,96 = 361,50 − 209,96 = 151,54 €
    const r1500 = retencaoPensaoNaFonte(1500, "naoCasado", 0);
    expect(r1500.taxaMarginal).toBe(0.241);
    expect(r1500.parcelaAbater).toBe(209.96);
    expect(r1500.retencao).toBeCloseTo(151.54, 2);

    // 2 500 € (escalão até 3 462 €: taxa 43,1 %, parcela 614,74 €)
    // retencao = 2500 × 0,431 − 614,74 = 1077,50 − 614,74 = 462,76 €
    const r2500 = retencaoPensaoNaFonte(2500, "naoCasado", 0);
    expect(r2500.taxaMarginal).toBe(0.431);
    expect(r2500.parcelaAbater).toBe(614.74);
    expect(r2500.retencao).toBeCloseTo(462.76, 2);
  });

  it("Tabela IX (casado único titular) — fronteiras (920 €, 1 042 €, 1 100 €, 1 500 €, 2 500 €)", () => {
    expect(retencaoPensaoNaFonte(920, "casadoUnicoTitular", 0).retencao).toBe(0);

    // 1 042 €: 0,125 × 2,6 × (1381,69 − 1042) = 110,39925 → 130,25 − 110,39925 = 19,85075
    const r1042 = retencaoPensaoNaFonte(1042, "casadoUnicoTitular", 0);
    expect(r1042.tabela).toBe("IX");
    expect(r1042.retencao).toBeCloseTo(19.85, 2);

    // 1 100 €: 0,125 × 1,728 × (1553,11 − 1100) = 97,87176 → 137,50 − 97,87176 = 39,62824
    const r1100 = retencaoPensaoNaFonte(1100, "casadoUnicoTitular", 0);
    expect(r1100.parcelaAbater).toBeCloseTo(97.87, 2);
    expect(r1100.retencao).toBeCloseTo(39.63, 2);

    // 1 500 € (escalão até 1 526 €: taxa 15,9 %, parcela 137,66 €) → 238,50 − 137,66 = 100,84 €
    const r1500 = retencaoPensaoNaFonte(1500, "casadoUnicoTitular", 0);
    expect(r1500.taxaMarginal).toBe(0.159);
    expect(r1500.retencao).toBeCloseTo(100.84, 2);

    // 2 500 € (escalão até 3 245 €: taxa 27,92 %, parcela 378,48 €) → 698,00 − 378,48 = 319,52 €
    const r2500 = retencaoPensaoNaFonte(2500, "casadoUnicoTitular", 0);
    expect(r2500.taxaMarginal).toBe(0.2792);
    expect(r2500.retencao).toBeCloseTo(319.52, 2);
  });

  it("aplica as parcelas adicionais por dependente (34,29 € não casado, 21,43 € casado 2, 42,86 € casado 1)", () => {
    const base1500 = retencaoPensaoNaFonte(1500, "naoCasado", 0).retencao;
    const nc1 = retencaoPensaoNaFonte(1500, "naoCasado", 1).retencao;
    const c21 = retencaoPensaoNaFonte(1500, "casadoDoisTitulares", 1).retencao;
    expect(base1500 - nc1).toBeCloseTo(34.29, 2);
    expect(base1500 - c21).toBeCloseTo(21.43, 2);

    const baseIx = retencaoPensaoNaFonte(1500, "casadoUnicoTitular", 0).retencao;
    const ix1 = retencaoPensaoNaFonte(1500, "casadoUnicoTitular", 1).retencao;
    expect(baseIx - ix1).toBeCloseTo(42.86, 2);
  });
});

describe("pensao — ADSE, recibo mensal e liquidação anual Cat. H", () => {
  it("respeita o limiar de salvaguarda da ADSE nas pensões (635,00 €)", () => {
    expect(LIMIAR_SALVAGUARDA_ADSE_PENSAO).toBe(635);
    expect(TAXA_ADSE).toBe(0.035);
    expect(descontoAdsePensao(635, true)).toBe(0);
    // A 640 € brutos, 3,5 % seriam 22,40 €, mas o líquido não pode descer de 635 € → máx 5,00 €
    expect(descontoAdsePensao(640, true)).toBeCloseTo(5.0, 2);
    // A 1 500 €, 3,5 % = 52,50 €
    expect(descontoAdsePensao(1500, true)).toBeCloseTo(52.5, 2);
  });

  it("reciboPensaoMensal: isento de SS (0 €), retém pela Tabela VIII e trata duodécimos autonomamente", () => {
    const r14 = reciboPensaoMensal({ bruto: 1500, situacao: "naoCasado", adse: false, duodecimos: "14" });
    expect(r14.ss).toBe(0);
    expect(r14.retencao).toBeCloseTo(151.54, 2);
    expect(r14.liquido).toBeCloseTo(1348.46, 2);

    const r100 = reciboPensaoMensal({ bruto: 1500, situacao: "naoCasado", adse: false, duodecimos: "100" });
    // Com duodécimos 100 %, recebe +250 € brutos/mês e retém autonomamente à mesma taxa efetiva
    expect(r100.duodecimosMensal).toBeCloseTo(250, 2);
    expect(r100.taxaEfetiva).toBeCloseTo(r14.taxaEfetiva, 6);
    expect(r100.liquido * 12).toBeCloseTo(r14.liquido * 14, 2);
  });

  it("simularPensao: usa dedução específica de 4 587,09 € (art. 53.º CIRS) e aplica −30 % nos Açores", () => {
    expect(DEDUCAO_ESPECIFICA_PENSAO_2026).toBe(4587.09);
    const cont = simularPensao([1500], 0, 2026, 14, { regiao: "continente" });
    const acores = simularPensao([1500], 0, 2026, 14, { regiao: "acores" });
    expect(cont.titulares[0].deducaoEspecifica).toBe(4587.09);
    expect(cont.ssAnual).toBe(0);
    expect(acores.irsBruto).toBeCloseTo(cont.irsBruto * 0.7, 2);
    expect(acores.irsAnual).toBeLessThan(cont.irsAnual);
  });
});
