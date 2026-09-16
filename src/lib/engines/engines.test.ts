import { describe, it, expect } from "vitest";
import { simularPrestacao } from "./prestacao";
import { simularPoupanca, simularCA, taxaCAPorAno } from "./poupanca";
import { decomporCombustivel, ivaContido } from "./impostos";
import { contribuicoes, custoDoTrabalho } from "./seg-social";
import { simularTaeg } from "./taeg";
import ca from "@data/fiscal/ca.json";
import capitais from "@data/fiscal/capitais.json";

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
    const r = simularPoupanca(10000, 10, 0.025, 0.28);
    expect(r.taxaLiquida).toBeCloseTo(0.018, 6);
    expect(r.capitalFinalLiquido).toBeCloseTo(11953.3, 0);
  });

  it("inflação corrói o valor real", () => {
    const r = simularPoupanca(10000, 10, 0.015, 0.28, 0.03);
    expect(r.valorReal).toBeLessThan(10000);
  });
});

describe("simularCA", () => {
  const premios = ca.serieF.premiosPermanencia;
  const imposto = capitais.retencaoLiberatoria.taxa;

  it("prémio de permanência aplica-se por ano de vida", () => {
    expect(taxaCAPorAno(1, 0.025, premios)).toBeCloseTo(0.025, 6);
    expect(taxaCAPorAno(3, 0.025, premios)).toBeCloseTo(0.0275, 6);
    expect(taxaCAPorAno(8, 0.025, premios)).toBeCloseTo(0.03, 6);
    expect(taxaCAPorAno(15, 0.025, premios)).toBeCloseTo(0.0425, 6);
  });

  it("ano 1 sem prémio ≈ capitalização trimestral da taxa base", () => {
    const r = simularCA(10000, 1, 0.025, premios, imposto);
    // juro líquido trimestral: 2,5 %/4 × 0,72
    const esperado = 10000 * Math.pow(1 + (0.025 / 4) * (1 - imposto), 4);
    expect(r.capitalFinalLiquido).toBeCloseTo(esperado, 6);
  });

  it("prémios de permanência fazem o CA bater um depósito à mesma base", () => {
    const ca15 = simularCA(10000, 15, 0.02, premios, imposto);
    const dep15 = simularPoupanca(10000, 15, 0.02, imposto);
    expect(ca15.capitalFinalLiquido).toBeGreaterThan(dep15.capitalFinalLiquido);
  });

  it("imposto retido = juros do caminho líquido × taxa", () => {
    const r = simularCA(10000, 5, 0.025, premios, imposto);
    const jurosCaminhoLiquido = r.imposto / imposto; // juros antes da retenção
    expect(r.capitalFinalLiquido).toBeCloseTo(
      10000 + jurosCaminhoLiquido * (1 - imposto),
      4
    );
  });
});

describe("seg-social", () => {
  it("TSU trabalhador 11 % + entidade 23,75 %", () => {
    const c = contribuicoes(1000);
    expect(c.trabalhador).toBeCloseTo(110, 6);
    expect(c.entidade).toBeCloseTo(237.5, 6);
    expect(c.custoEmpresa).toBeCloseTo(1237.5, 6);
  });

  it("peso da SS no custo do trabalho ≈ 28,1 %", () => {
    const r = custoDoTrabalho(1700);
    expect(r.pesoSS).toBeCloseTo((0.11 + 0.2375) / 1.2375, 6);
    expect(r.antesDeIrs).toBeCloseTo(1700 * 0.89, 6);
  });
});

describe("simularTaeg", () => {
  it("sem custos, TAEG = taxa efetiva da TAN nominal", () => {
    const r = simularTaeg(200000, 360, 0.025, 0.005);
    const esperada = Math.pow(1 + 0.03 / 12, 12) - 1;
    expect(r.taeg).toBeCloseTo(esperada, 4);
    expect(r.mtic).toBeCloseTo(360 * r.prestacao, 4);
  });

  it("custos iniciais e mensais sobem a TAEG acima da TAN efetiva", () => {
    const r = simularTaeg(200000, 360, 0.025, 0.005, {
      iniciais: 2000,
      mensais: 30,
    });
    const semCustos = Math.pow(1 + 0.03 / 12, 12) - 1;
    expect(r.taeg).toBeGreaterThan(semCustos);
    expect(r.mtic).toBeCloseTo(360 * (r.prestacao + 30) + 2000, 4);
    expect(r.custosTotais).toBeCloseTo(r.mtic - 200000, 4);
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
