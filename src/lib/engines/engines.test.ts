import { describe, it, expect } from "vitest";
import { simularPrestacao } from "./prestacao";
import {
  simularPoupanca,
  simularCA,
  simularCTPC,
  taxaCAPorAno,
  trajetoriaDeposito,
  trajetoriaCA,
  trajetoriaCTPC,
  trajetoriaColchao,
} from "./poupanca";
import { decomporCombustivel, ivaContido } from "./impostos";
import { contribuicoes, custoDoTrabalho } from "./seg-social";
import { simularTaeg } from "./taeg";
import { retencaoNaFonte, tabelaAplicavel } from "./retencao";
import { imt, imtJovem, custoCompra } from "./imt";
import { simularIrsJovem, pctIsencao } from "./irs-jovem";
import { simularDesemprego, duracaoSubsidio } from "./desemprego";
import { reciboMensal } from "./recibo";
import { simularIrsAnual, limiteGlobalDeducoes, limitePpr } from "./irs-anual";
import { simularIndependente } from "./independente";
import { simularMaisValia } from "./mais-valias";
import { inflacionar, salarioReal } from "./deflator";
import { taxaBaseCA } from "./ca-base";
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

describe("retencaoNaFonte", () => {
  // Casos golden: taxa efetiva publicada no Despacho n.º 233-A/2026,
  // coluna "taxa efetiva mensal de retenção no limite do escalão" (0 dependentes)
  const casosTabI: [number, number][] = [
    [920, 0], [1042, 0.053], [1108, 0.072], [1154, 0.075], [1212, 0.081],
    [1819, 0.135], [2119, 0.16], [2499, 0.188], [3305, 0.236], [5547, 0.301],
    [20221, 0.409],
  ];
  for (const [r, efetiva] of casosTabI) {
    it(`Tabela I: ${r} € → taxa efetiva ≈ ${(efetiva * 100).toFixed(1)} %`, () => {
      expect(retencaoNaFonte(r, "naoCasado", 0).taxaEfetiva).toBeCloseTo(efetiva, 3);
      expect(retencaoNaFonte(r, "casadoDoisTitulares", 0).taxaEfetiva).toBeCloseTo(efetiva, 3);
    });
  }

  const casosTabIII: [number, number][] = [
    [991, 0], [1042, 0.022], [1108, 0.038], [1119, 0.039], [1432, 0.058],
    [1962, 0.085], [2240, 0.098], [2773, 0.123], [3389, 0.148], [5965, 0.208],
    [20265, 0.332],
  ];
  for (const [r, efetiva] of casosTabIII) {
    it(`Tabela III: ${r} € → taxa efetiva ≈ ${(efetiva * 100).toFixed(1)} %`, () => {
      expect(retencaoNaFonte(r, "casadoUnicoTitular", 0).taxaEfetiva).toBeCloseTo(efetiva, 3);
    });
  }

  it("SMN 920 € não retém; casado único titular isento até 991 €", () => {
    expect(retencaoNaFonte(920, "naoCasado").retencao).toBe(0);
    expect(retencaoNaFonte(991, "casadoUnicoTitular").retencao).toBe(0);
    expect(retencaoNaFonte(920.01, "naoCasado").retencao).toBeGreaterThanOrEqual(0);
  });

  it("dependentes baixam a retenção; tabela II só para não casado com dependentes", () => {
    expect(tabelaAplicavel("naoCasado", 0)).toBe("I");
    expect(tabelaAplicavel("naoCasado", 2)).toBe("II");
    expect(tabelaAplicavel("casadoDoisTitulares", 2)).toBe("I");
    const sem = retencaoNaFonte(1500, "naoCasado", 0);
    const com2 = retencaoNaFonte(1500, "naoCasado", 2);
    expect(sem.retencao).toBeCloseTo(1500 * 0.241 - 193.33, 6);
    expect(com2.retencao).toBeCloseTo(sem.retencao - 2 * 34.29, 6);
  });

  it("3+ dependentes: −1 p.p. na marginal, parcelas inalteradas", () => {
    const r = retencaoNaFonte(1500, "naoCasado", 3);
    expect(r.taxaMarginal).toBeCloseTo(0.241 - 0.01, 6);
    expect(r.retencao).toBeCloseTo(1500 * 0.231 - 193.33 - 3 * 34.29, 6);
  });

  it("retenção nunca é negativa", () => {
    expect(retencaoNaFonte(1000, "casadoUnicoTitular", 5).retencao).toBe(0);
  });
});

describe("imt", () => {
  // Casos golden: tabela I do Ofício Circulado 40129/2026 (continente, HPP)
  it("escalões HPP 2026: taxa × valor − parcela a abater", () => {
    expect(imt(100000, "hpp")).toBe(0);
    expect(imt(120000, "hpp")).toBeCloseTo(120000 * 0.02 - 2126.92, 6); // 273,08
    expect(imt(250000, "hpp")).toBeCloseTo(250000 * 0.07 - 10457.96, 6); // 7 042,04
    expect(imt(500000, "hpp")).toBeCloseTo(500000 * 0.08 - 13763.35, 6); // 26 236,65
  });

  it("acima de 660 982 €: taxa única sobre todo o valor", () => {
    expect(imt(700000, "hpp")).toBeCloseTo(42000, 6);
    expect(imt(2000000, "hpp")).toBeCloseTo(150000, 6);
  });

  it("habitação secundária começa a 1 % sem isenção", () => {
    expect(imt(100000, "secundaria")).toBeCloseTo(1000, 6);
  });
});

describe("imtJovem", () => {
  it("isento até 330 539 €; 8 % só sobre o excedente até 660 982 €", () => {
    expect(imtJovem(330539)).toBe(0);
    expect(imtJovem(300000)).toBe(0);
    // 8 % sobre o excedente: 400 000 × 0,08 − 26 443,12 = 5 556,88
    expect(imtJovem(400000)).toBeCloseTo(5556.88, 2);
  });

  it("acima de 660 982 € perde o benefício → tabela geral", () => {
    expect(imtJovem(700000)).toBeCloseTo(imt(700000, "hpp"), 6);
  });
});

describe("custoCompra", () => {
  it("250 000 € HPP com crédito de 200 000 €: IMT + IS + registos", () => {
    const r = custoCompra(250000, { montanteCredito: 200000 });
    expect(r.imt).toBeCloseTo(7042.04, 2);
    expect(r.isAquisicao).toBeCloseTo(2000, 6); // 0,8 %
    expect(r.isCredito).toBeCloseTo(1200, 6); // 0,6 % do crédito
    expect(r.registos).toBe(700);
    expect(r.totalCustos).toBeCloseTo(10942.04, 2);
  });

  it("IMT Jovem isenta também o IS de aquisição até 330 539 €", () => {
    const r = custoCompra(300000, { jovem: true, montanteCredito: 240000 });
    expect(r.imt).toBe(0);
    expect(r.isAquisicao).toBe(0);
    expect(r.isCredito).toBeCloseTo(1440, 6); // IS do crédito mantém-se
  });
});

describe("irs-jovem", () => {
  it("percentagens por ano de gozo: 100/75/50/25 %", () => {
    expect(pctIsencao(1)).toBe(1);
    expect(pctIsencao(4)).toBe(0.75);
    expect(pctIsencao(7)).toBe(0.5);
    expect(pctIsencao(10)).toBe(0.25);
    expect(pctIsencao(11)).toBe(0);
  });

  it("21 000 €/ano no 1.º ano: IRS zero (isenção total)", () => {
    const r = simularIrsJovem(21000, 1);
    expect(r.rendimentoIsento).toBe(21000);
    expect(r.irsComJovem).toBe(0);
    // sem jovem: coletável 16 412,91 → 2 520,30 − 250 = 2 270,30
    expect(r.irsSemJovem).toBeCloseTo(2270.3, 0);
    expect(r.poupancaAnual).toBeCloseTo(2270.3, 0);
  });

  it("5.º ano (50 %): tributa a parte não isenta à taxa média do total", () => {
    const r = simularIrsJovem(21000, 5);
    expect(r.rendimentoIsento).toBeCloseTo(10500, 6);
    expect(r.irsComJovem).toBeCloseTo(657.9, 0);
    expect(r.poupancaAnual).toBeGreaterThan(1600);
  });

  it("limite de 55×IAS trava a isenção em salários altos", () => {
    const r = simularIrsJovem(60000, 2); // 75 % de 60 000 = 45 000 > 29 542,15
    expect(r.rendimentoIsento).toBeCloseTo(29542.15, 2);
  });
});

describe("desemprego", () => {
  it("1 500 €/mês: RR 1 750 €, teto de 75 % da RR líquida domina", () => {
    const r = simularDesemprego(1500, 35, 5);
    expect(r.remReferencia).toBeCloseTo(1750, 6);
    // RR líquida = 1 750 − 192,5 (SS) − 228,42 (retenção) = 1 329,08 → 75 % = 996,81
    expect(r.mensal).toBeCloseTo(996.81, 0);
    expect(r.apos180Dias).toBeCloseTo(r.mensal * 0.9, 6);
  });

  it("salário alto: teto de 2,5×IAS = 1 342,83 €", () => {
    expect(simularDesemprego(5000, 40, 10).mensal).toBeCloseTo(1342.83, 2);
  });

  it("salário baixo: piso de 1×IAS se RR líquida o permitir", () => {
    const r = simularDesemprego(600, 25, 1);
    expect(r.mensal).toBeCloseTo(537.13, 2);
  });

  it("majoração de 10 % e duração por idade/descontos", () => {
    expect(simularDesemprego(1500, 35, 5, { majoracao: true }).mensal)
      .toBeCloseTo(996.81 * 1.1, 0);
    expect(duracaoSubsidio(25, 1)).toBe(150);
    expect(duracaoSubsidio(35, 2)).toBe(420);
    expect(duracaoSubsidio(45, 10)).toBe(540 + 2 * 45);
    expect(duracaoSubsidio(55, 20)).toBe(540 + 4 * 60);
  });

  it("sem prazo de garantia: não elegível", () => {
    expect(simularDesemprego(1500, 30, 0).elegivel).toBe(false);
  });
});

describe("reciboMensal", () => {
  it("1 500 € com SA 8 €/dia em cartão: SA isento, retenção da tabela I", () => {
    const r = reciboMensal({ bruto: 1500, saPorDia: 8, formaSA: "cartao" });
    expect(r.saTotal).toBe(176);
    expect(r.saTributavel).toBe(0);
    expect(r.ss).toBeCloseTo(165, 6);
    expect(r.retencao).toBeCloseTo(168.17, 2); // 1500×0,241 − 193,33
    expect(r.liquido).toBeCloseTo(1342.83, 2);
    expect(r.custoEmpresa).toBeCloseTo(1500 * 1.2375, 6);
  });

  it("SA em dinheiro acima de 6,15 €/dia tributa IRS + SS no excedente", () => {
    const r = reciboMensal({ bruto: 1500, saPorDia: 8, formaSA: "dinheiro" });
    expect(r.saIsento).toBeCloseTo(6.15 * 22, 6);
    expect(r.saTributavel).toBeCloseTo(1.85 * 22, 6);
    expect(r.ss).toBeCloseTo(1540.7 * 0.11, 4);
    expect(r.retencao).toBeCloseTo(1540.7 * 0.241 - 193.33, 2);
  });

  it("IRS Jovem 1.º ano: retenção zero", () => {
    const r = reciboMensal({ bruto: 1500, anoIrsJovem: 1 });
    expect(r.retencao).toBe(0);
    expect(r.liquido).toBeCloseTo(1500 - 165, 6);
  });
});

describe("simularCTPC", () => {
  const taxas = ca.ctpc.taxasPorAno;
  const premio = ca.ctpc.premio.atual;
  const imposto = capitais.retencaoLiberatoria.taxa;

  it("10 000 € a 7 anos com prémio 0,81 %: ≈ 11 100 € líquidos", () => {
    const r = simularCTPC(10000, 7, taxas, premio, imposto);
    expect(r.capitalFinalLiquido).toBeCloseTo(11099.5, 0);
  });

  it("prémio só conta do 2.º ano; ano 1 = taxa fixa", () => {
    const r = simularCTPC(10000, 1, taxas, premio, imposto);
    expect(r.capitalFinalLiquido).toBeCloseTo(10000 * (1 + 0.0075 * (1 - imposto)), 4);
  });
});

describe("trajetorias de poupança", () => {
  const imposto = capitais.retencaoLiberatoria.taxa;
  const premios = ca.serieF.premiosPermanencia;

  it("depósito: último ponto bate com simularPoupanca, juro cresce por ano", () => {
    const t = trajetoriaDeposito(10000, 10, 0.025, imposto, 0.02);
    const r = simularPoupanca(10000, 10, 0.025, imposto, 0.02);
    expect(t).toHaveLength(10);
    expect(t[9].saldo).toBeCloseTo(r.capitalFinalLiquido, 6);
    expect(t[9].real).toBeCloseTo(r.valorReal, 6);
    expect(t[1].juro).toBeGreaterThan(t[0].juro); // juro composto
    expect(t[0].juro).toBeCloseTo(250, 6);
    expect(t[0].imposto).toBeCloseTo(70, 6);
  });

  it("CA: último ponto bate com simularCA mesmo capitalizando por trimestre", () => {
    const t = trajetoriaCA(10000, 15, ca.serieF.taxaBrutaNovasSubscricoes, premios, imposto, 0.02);
    const r = simularCA(10000, 15, ca.serieF.taxaBrutaNovasSubscricoes, premios, imposto, 0.02);
    expect(t).toHaveLength(15);
    expect(t[14].saldo).toBeCloseTo(r.capitalFinalLiquido, 6);
    expect(t[14].real).toBeCloseTo(r.valorReal, 6);
    // o imposto acumulado do caminho bate com o total do simular
    const impostoTotal = t.reduce((a, p) => a + p.imposto, 0);
    expect(impostoTotal).toBeCloseTo(r.imposto, 6);
  });

  it("CTPC: último ponto bate com simularCTPC; não passa dos 7 anos", () => {
    const t = trajetoriaCTPC(10000, 10, ca.ctpc.taxasPorAno, ca.ctpc.premio.atual, imposto);
    const r = simularCTPC(10000, 10, ca.ctpc.taxasPorAno, ca.ctpc.premio.atual, imposto);
    expect(t).toHaveLength(7);
    expect(t[6].saldo).toBeCloseTo(r.capitalFinalLiquido, 6);
    expect(t[1].juro / t[0].juro).toBeGreaterThan(1); // taxa sobe + prémio
  });

  it("colchão: nominal parado, real a escorregar", () => {
    const t = trajetoriaColchao(10000, 10, 0.02);
    expect(t).toHaveLength(10);
    expect(t[9].saldo).toBe(10000);
    expect(t[9].real).toBeCloseTo(10000 / Math.pow(1.02, 10), 6);
    expect(t.every((p) => p.juro === 0 && p.imposto === 0)).toBe(true);
  });
});

describe("irs-anual (deduções à coleta)", () => {
  const zero = { saude: 0, educacao: 0, rendas: 0, lares: 0, ivaFatura: 0, pprEntregas: 0 };

  it("categorias com teto próprio: saúde 15 %, educação 30 %, rendas 15 % (máx 900)", () => {
    const r = simularIrsAnual(1500, 0, {
      ...zero, saude: 500, educacao: 1000, rendas: 6000, ivaFatura: 150,
    });
    const d = Object.fromEntries(r.linhasDeducao.map((l) => [l.categoria, l.deducao]));
    expect(d["Saúde"]).toBeCloseTo(75, 6);
    expect(d["Educação"]).toBeCloseTo(300, 6);
    expect(d["Rendas"]).toBeCloseTo(900, 6); // 15 % de 6 000 = 900, no teto
    expect(d["IVA das faturas"]).toBeCloseTo(150, 6);
    // coleta 2 520,30 − 1 425 − 250 (gerais) = 845,30
    expect(r.irsAnual).toBeCloseTo(845.3, 1);
    // retido 168,17 × 14 = 2 354,38 → reembolso ≈ 1 509
    expect(r.reembolsoEstimado).toBeCloseTo(1509, 0);
  });

  it("limite global do art. 78.º: interpolação e teto 1 000 € no último escalão", () => {
    const lg = limiteGlobalDeducoes(16412.91, 0);
    expect(lg).toBeCloseTo(2345, 0); // 1 000 + 1 500 × (86 634−RC)/(86 634−8 342)
    expect(limiteGlobalDeducoes(5000, 0)).toBe(Infinity); // 1.º escalão
    expect(limiteGlobalDeducoes(90000, 0)).toBe(1000);
    const alto = simularIrsAnual(7000, 0, { ...zero, saude: 10000, educacao: 3000, ivaFatura: 250 });
    expect(alto.dentroDoLimiteGlobal).toBe(1000);
  });

  it("PPR: 20 % das entregas com teto por idade", () => {
    expect(limitePpr(30)).toBe(400);
    expect(limitePpr(45)).toBe(350);
    expect(limitePpr(60)).toBe(300);
    const r = simularIrsAnual(1500, 0, { ...zero, pprEntregas: 2000, idadeTitular: 30 });
    expect(r.deducaoPpr).toBe(400);
  });
});

describe("independente (recibos verdes)", () => {
  it("24 000 €/ano: SS ≈ 15 % do bruto, IRS sobre 75 %", () => {
    const r = simularIndependente(24000);
    expect(r.ss).toBeCloseTo(24000 * 0.7 * 0.214, 4); // 3 595,20
    expect(r.coletavel).toBeCloseTo(18000, 6);
    expect(r.irs).toBeCloseTo(2611.47, 1); // 2 861,47 por escalões − 250 gerais
    expect(r.retido).toBeCloseTo(24000 * 0.23, 6);
    expect(r.liquidoAnual).toBeCloseTo(17793.33, 1);
  });

  it("1.º ano de atividade isento de SS; base mínima 1,5×IAS", () => {
    expect(simularIndependente(24000, { primeiroAno: true }).ss).toBe(0);
    expect(simularIndependente(6000).ss).toBeCloseTo(805.7 * 12 * 0.214, 1);
  });
});

describe("mais-valias", () => {
  it("ações 3 anos: exclusão de 10 %, compara autónomo vs englobado", () => {
    const r = simularMaisValia(15000, 10000, {
      despesas: 50, anosDetencao: 3, coletavelOutros: 16412.91,
    });
    expect(r.maisValia).toBeCloseTo(4950, 6);
    expect(r.tributavel).toBeCloseTo(4455, 6);
    expect(r.impostoAutonomo).toBeCloseTo(1247.4, 1);
    expect(r.impostoEnglobado).toBeCloseTo(1032.34, 1);
    expect(r.melhor).toBe("englobado");
  });

  it("cripto ≥365 dias isenta; <365 paga 28 %", () => {
    expect(simularMaisValia(20000, 10000, { tipo: "cripto", diasDetencao: 400 }).tributavel).toBe(0);
    const r = simularMaisValia(20000, 10000, { tipo: "cripto", diasDetencao: 100 });
    expect(r.impostoAutonomo).toBeCloseTo(2800, 6);
  });

  it("imóvel: engloba 50 %, reinvestimento reduz proporcionalmente", () => {
    const r = simularMaisValia(200000, 150000, {
      tipo: "imovel", despesas: 5000, pctReinvestida: 0.5,
    });
    expect(r.tributavel).toBeCloseTo(11250, 6); // 45 000 × 50 % × 50 %
    expect(r.impostoAutonomo).toBeNull();
    expect(r.melhor).toBe("impovel");
  });
});

describe("deflator IHPC", () => {
  const serie = [
    { t: "2020-01", v: 50 },
    { t: "2026-08", v: 60 },
  ];
  it("inflaciona pelo índice e compara salário real", () => {
    expect(inflacionar(1000, "2020-01", serie)).toBeCloseTo(1200, 6);
    const r = salarioReal(1000, 1100, "2020-01", serie);
    expect(r!.equivalenteHoje).toBeCloseTo(1200, 6);
    expect(r!.variacaoReal).toBeCloseTo(-0.0833, 3); // perdeu ~8,3 % reais
  });
});

describe("taxa base CA (série F)", () => {
  it("Euribor 3M abaixo do cap passa direta; acima corta a 2,5 %", () => {
    expect(taxaBaseCA(2.474)).toBeCloseTo(2.474, 6);
    expect(taxaBaseCA(2.5131)).toBe(2.5);
    expect(taxaBaseCA(-0.5)).toBe(0);
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
