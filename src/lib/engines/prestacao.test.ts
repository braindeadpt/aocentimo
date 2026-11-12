import { describe, expect, it } from "vitest";
import creditoHabitacao from "@data/fiscal/credito-habitacao.json";
import {
  avaliarLimitesMacroprudenciais,
  simularAmortizacaoAntecipada,
  simularPrestacao,
  simularPrestacaoMista,
} from "./prestacao";

describe("prestacao — taxa mista, amortização antecipada e limites macroprudenciais BdP", () => {
  it("simularPrestacaoMista coincide com variável pura quando anosFixos = 0 e com fixa pura quando anosFixos = prazo", () => {
    const varPura = simularPrestacao(200000, 360, 0.025, 0.01);
    const mistaZero = simularPrestacaoMista(200000, 360, 0, 0.03, 0.025, 0.01);

    expect(mistaZero.mesesFixos).toBe(0);
    expect(mistaZero.prestacao).toBeCloseTo(varPura.prestacao, 2);
    expect(mistaZero.jurosTotais).toBeCloseTo(varPura.jurosTotais, 2);

    const fixaPura = simularPrestacao(200000, 360, 0.032, 0);
    const mistaTotal = simularPrestacaoMista(200000, 360, 30, 0.032, 0.025, 0.01);

    expect(mistaTotal.mesesFixos).toBe(360);
    expect(mistaTotal.mesesVariaveis).toBe(0);
    expect(mistaTotal.prestacao).toBeCloseTo(fixaPura.prestacao, 2);
    expect(mistaTotal.jurosTotais).toBeCloseTo(fixaPura.jurosTotais, 2);
  });

  it("simularPrestacaoMista recalcula a prestação ao fim do período fixo sobre o capital remanescente", () => {
    // 200 000 € a 30 anos (360 meses): 5 anos fixos (60 meses) a TAN 2,8 %, seguidos de 25 anos (300 meses) a TAN 3,8 % (Euribor 2,8 % + spread 1,0 %)
    const mista = simularPrestacaoMista(200000, 360, 5, 0.028, 0.028, 0.01);

    expect(mista.mesesFixos).toBe(60);
    expect(mista.mesesVariaveis).toBe(300);
    // Nos primeiros 60 meses, a prestação é igual à de um crédito de 360 meses a 2,8 %
    const refFixa = simularPrestacao(200000, 360, 0.028, 0);
    expect(mista.prestacaoFixa).toBeCloseTo(refFixa.prestacao, 2);
    expect(mista.capitalAposFixo).toBeCloseTo(refFixa.linhas[59].divida, 2);

    // Nos 300 meses seguintes, a prestação equivale a um crédito de capitalAposFixo a 300 meses com TAN 3,8 %
    const refVariavelDepois = simularPrestacao(
      mista.capitalAposFixo,
      300,
      0.028,
      0.01
    );
    expect(mista.prestacaoVariavel).toBeCloseTo(refVariavelDepois.prestacao, 2);
    expect(mista.prestacaoVariavel).toBeGreaterThan(mista.prestacaoFixa);
    expect(mista.linhas).toHaveLength(360);
    expect(mista.linhas[359].divida).toBeCloseTo(0, 2);
  });

  it("simularAmortizacaoAntecipada aplica comissão legal (0,5 % variável vs 2,0 % fixa) e mostra que amortizar no ano 2 poupa muito mais do que no ano 25", () => {
    const taxasComissao = {
      variavel: creditoHabitacao.reembolsoAntecipado.comissaoMaximaVariavel,
      fixa: creditoHabitacao.reembolsoAntecipado.comissaoMaximaFixa,
    };

    const cedo = simularAmortizacaoAntecipada({
      capital: 200000,
      prazoMeses: 360,
      tan: 0.038,
      anoAmortizacao: 2,
      montanteExtra: 15000,
      regimeTaxa: "variavel",
      taxasComissao,
    });

    const tarde = simularAmortizacaoAntecipada({
      capital: 200000,
      prazoMeses: 360,
      tan: 0.038,
      anoAmortizacao: 25,
      montanteExtra: 15000,
      regimeTaxa: "variavel",
      taxasComissao,
    });

    // Comissão máxima em taxa variável: 0,5 % de 15 000 € = 75 €
    expect(cedo.comissao).toBeCloseTo(75, 2);

    // Amortizar no ano 2 poupa substancialmente mais juros do que no ano 25
    expect(cedo.reduzirPrestacao.poupancaLiquida).toBeGreaterThan(
      tarde.reduzirPrestacao.poupancaLiquida * 3
    );

    // Reduzir o prazo mantendo a prestação poupa ainda mais juros do que reduzir a prestação mantendo o prazo
    expect(cedo.reduzirPrazo.poupancaLiquida).toBeGreaterThan(
      cedo.reduzirPrestacao.poupancaLiquida
    );
    expect(cedo.reduzirPrazo.mesesPoupados).toBeGreaterThan(24);

    // Em taxa fixa, a comissão máxima é 2,0 % (300 € sobre 15 000 €)
    const fixa = simularAmortizacaoAntecipada({
      capital: 200000,
      prazoMeses: 360,
      tan: 0.038,
      anoAmortizacao: 2,
      montanteExtra: 15000,
      regimeTaxa: "fixa",
      taxasComissao,
    });
    expect(fixa.comissao).toBeCloseTo(300, 2);
  });

  it("avaliarLimitesMacroprudenciais valida maturidade por idade (40/37/35 anos) e DSTI com choque +1,5 p.p.", () => {
    const limites = creditoHabitacao.recomendacaoMacroprudencialBdP;

    const jovemOk = avaliarLimitesMacroprudenciais({
      capital: 180000,
      prazoAnos: 38,
      tanAtual: 0.035,
      rendimentoLiquidoMensal: 2200,
      faixaEtaria: "ate30",
      regimeTaxa: "variavel",
      limites,
    });
    expect(jovemOk.prazoMaximoRecomendado).toBe(40);
    expect(jovemOk.excedeMaturidade).toBe(false);
    expect(jovemOk.choqueAplicado).toBeCloseTo(0.015, 4);
    expect(jovemOk.dstiChoqueBdP).toBeGreaterThan(jovemOk.dstiAtual);

    const mais35Excede = avaliarLimitesMacroprudenciais({
      capital: 250000,
      prazoAnos: 38,
      tanAtual: 0.04,
      rendimentoLiquidoMensal: 2000,
      faixaEtaria: "mais35",
      regimeTaxa: "variavel",
      limites,
    });
    expect(mais35Excede.prazoMaximoRecomendado).toBe(35);
    expect(mais35Excede.excedeMaturidade).toBe(true);
    expect(mais35Excede.excedeDstiChoque).toBe(true);
  });
});
