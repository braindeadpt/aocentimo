import { describe, it, expect } from "vitest";
import { isv, iuc, custoAnualCarro, REGRAS_ISV, REGRAS_IUC } from "./carro";

describe("ISV — tabela A (Ligeiros de passageiros)", () => {
  // Cilindrada: escalão 1251+ → 1400 × 5,61 − 6 194,88 = 1 659,12
  // Ambiental WLTP gasolina, 140 g/km: escalão 131–145 → 140 × 6,38 − 762,73 = 130,47
  it("gasolina 1400 cm³, 140 g CO2 WLTP", () => {
    const r = isv({ cilindrada: 1400, co2: 140, norma: "WLTP", combustivel: "gasolina" });
    expect(r.componenteCilindrada).toBeCloseTo(1659.12, 2);
    expect(r.componenteAmbiental).toBeCloseTo(130.47, 2);
    expect(r.total).toBeCloseTo(1789.59, 2);
  });

  // Cilindrada 2000 × 5,61 − 6 194,88 = 5 025,12
  // Ambiental gasóleo WLTP 230 g/km: escalão 191+ → 230 × 282,35 − 38 271,32 = 26 669,18
  // Agravamento do gasóleo: 500 € (partículas não declaradas)
  it("gasóleo 2000 cm³, 230 g CO2 WLTP: agravamento de 500 €", () => {
    const r = isv({ cilindrada: 2000, co2: 230, norma: "WLTP", combustivel: "gasoleo" });
    expect(r.componenteCilindrada).toBeCloseTo(5025.12, 2);
    expect(r.componenteAmbiental).toBeCloseTo(26669.18, 2);
    expect(r.agravamentoGasoleo).toBe(500);
    expect(r.total).toBeCloseTo(32194.3, 2);
  });

  // Partículas 0,0005 g/km < 0,001 → sem agravamento
  // Ambiental gasóleo WLTP 190: escalão 171–190 → 190 × 274,08 − 36 987,98 = 15 087,22
  it("gasóleo com filtro de partículas não paga o agravamento", () => {
    const r = isv({
      cilindrada: 2000,
      co2: 190,
      norma: "WLTP",
      combustivel: "gasoleo",
      particulas: 0.0005,
    });
    expect(r.agravamentoGasoleo).toBe(0);
    expect(r.total).toBeCloseTo(20112.34, 2);
  });

  // Componente ambiental negativa: 0 × 0,44 − 43,02 = −43,02, deduzida à cilindrada
  // Cilindrada 850 × 1,09 − 849,03 = 77,47 → total 34,45 → mínimo de 100 € (art. 7.º n.º 4)
  it("componente ambiental negativa é deduzida e o total nunca desce de 100 €", () => {
    const r = isv({ cilindrada: 850, co2: 0, norma: "WLTP", combustivel: "gasolina" });
    expect(r.componenteCilindrada).toBeCloseTo(77.47, 2);
    expect(r.componenteAmbiental).toBeCloseTo(-43.02, 2);
    expect(r.total).toBe(100);
  });

  // Escalão 1001–1250: 1200 × 1,18 − 850,69 = 565,31
  // WLTP 100 g/km: primeiro escalão → 100 × 0,44 − 43,02 = 0,98
  it("escalão intermédio de cilindrada", () => {
    const r = isv({ cilindrada: 1200, co2: 100, norma: "WLTP" });
    expect(r.componenteCilindrada).toBeCloseTo(565.31, 2);
    expect(r.componenteAmbiental).toBeCloseTo(0.98, 2);
    expect(r.total).toBeCloseTo(566.29, 2);
  });

  it("NEDC e WLTP são tabelas distintas — o mesmo CO2 dá valores diferentes", () => {
    const nedc = isv({ cilindrada: 1600, co2: 120, norma: "NEDC", combustivel: "gasolina" });
    const wltp = isv({ cilindrada: 1600, co2: 120, norma: "WLTP", combustivel: "gasolina" });
    // NEDC 116–145: 120 × 52,56 − 5 903,94 = 403,26
    expect(nedc.componenteAmbiental).toBeCloseTo(403.26, 2);
    // WLTP 116–120: 120 × 1,38 − 147,79 = 17,81
    expect(wltp.componenteAmbiental).toBeCloseTo(17.81, 2);
    expect(nedc.total).not.toBe(wltp.total);
  });
});

describe("ISV — taxa intermédia (art. 8.º)", () => {
  // Total 1 789,59: híbrido 60 % → 1 073,75; plug-in 25 % → 447,40
  it("híbrido elegível paga 60 % da totalidade", () => {
    expect(
      isv({ cilindrada: 1400, co2: 140, norma: "WLTP", taxaIntermedia: 60 }).total
    ).toBeCloseTo(1073.75, 2);
  });

  it("híbrido plug-in paga 25 % da totalidade", () => {
    expect(
      isv({ cilindrada: 1400, co2: 140, norma: "WLTP", taxaIntermedia: 25 }).total
    ).toBeCloseTo(447.4, 2);
  });

  it("as taxas do art. 8.º são 60/40/25 % e a de 2026 é a do PHEV Euro 6e-bis", () => {
    const pcts = REGRAS_ISV[2026].taxasIntermedias.regra.map((r) => r.percentagem);
    expect(pcts).toEqual([60, 40, 40, 25, 25, 25]);
  });
});

describe("ISV — usados importados da União Europeia (tabela D, art. 11.º)", () => {
  // 1 789,59 − 10 % = 1 610,63
  it("até 1 ano de uso: redução de 10 %", () => {
    const r = isv({
      cilindrada: 1400,
      co2: 140,
      norma: "WLTP",
      matriculaUE: true,
      anosDeUso: 0.5,
    });
    expect(r.reducaoUsadoUE).toBeCloseTo(178.96, 2);
    expect(r.total).toBeCloseTo(1610.63, 2);
  });

  // 1 789,59 − 35 % (3 a 4 anos) = 1 163,23
  it("3 a 4 anos de uso: redução de 35 %", () => {
    const r = isv({
      cilindrada: 1400,
      co2: 140,
      norma: "WLTP",
      matriculaUE: true,
      anosDeUso: 3.5,
    });
    expect(r.total).toBeCloseTo(1163.23, 2);
  });

  it("usado nacional não recebe qualquer redução", () => {
    const r = isv({ cilindrada: 1400, co2: 140, norma: "WLTP", anosDeUso: 3.5 });
    expect(r.reducaoUsadoUE).toBe(0);
    expect(r.total).toBeCloseTo(1789.59, 2);
  });
});

describe("ISV — o que o motor não aceita", () => {
  it("rejeita uma taxa intermédia que não existe na lei", () => {
    const validas = new Set(REGRAS_ISV[2026].taxasIntermedias.regra.map((r) => r.percentagem));
    expect(validas.has(50)).toBe(false);
  });

  it("rejeita um ano sem regras", () => {
    expect(() => isv({ cilindrada: 1400, ano: 2019 })).toThrow();
    expect(() => iuc({ cilindrada: 1400, anoMatricula: 2020, ano: 2019 })).toThrow();
  });
});

describe("IUC — categoria A (gasolina)", () => {
  // 1301–1750 cm³, matrícula posterior a 1995 → 62,40
  it("gasolina 1400 cm³ matriculada em 2022", () => {
    const r = iuc({ cilindrada: 1400, anoMatricula: 2022, combustivel: "gasolina" });
    expect(r.categoria).toBe("A");
    expect(r.total).toBe(62.4);
    expect(r.coeficiente).toBe(1);
  });

  // 2601–3500 cm³: 287,49 (pós-1995) / 156,54 (1990–1995) / 79,72 (1981–1989)
  it("a antiguidade escolhe a coluna da tabela", () => {
    expect(iuc({ cilindrada: 3000, anoMatricula: 2022 }).total).toBe(287.49);
    expect(iuc({ cilindrada: 3000, anoMatricula: 1992 }).total).toBe(156.54);
    expect(iuc({ cilindrada: 3000, anoMatricula: 1985 }).total).toBe(79.72);
  });

  // Limites: 1000 cm³ → 19,90; 1001 cm³ → 39,95
  it("fronteira dos 1000 cm³", () => {
    expect(iuc({ cilindrada: 1000, anoMatricula: 2022 }).total).toBe(19.9);
    expect(iuc({ cilindrada: 1001, anoMatricula: 2022 }).total).toBe(39.95);
  });
});

describe("IUC — categoria B (gasóleo)", () => {
  // 127,35 (1751–2500) + 212,04 (CO2 181–260) + 31,77 (adicional) = 371,16
  // × coeficiente 1,15 (2010 e seguintes) = 426,83
  it("gasóleo 2000 cm³, 230 g CO2 WLTP, matriculado em 2020", () => {
    const r = iuc({
      cilindrada: 2000,
      anoMatricula: 2020,
      combustivel: "gasoleo",
      co2: 230,
      norma: "WLTP",
    });
    expect(r.categoria).toBe("B");
    expect(r.componenteCilindrada).toBe(127.35);
    expect(r.componenteCo2).toBe(212.04);
    expect(r.adicionalCo2).toBe(31.77);
    expect(r.coeficiente).toBe(1.15);
    expect(r.total).toBeCloseTo(426.83, 2);
  });

  // 63,74 + 65,15 = 128,89; sem adicional (2015 ≤ 2017); × 1,15 = 148,22
  it("matrícula anterior a 2017 não paga a taxa adicional de CO2", () => {
    const r = iuc({
      cilindrada: 1600,
      anoMatricula: 2015,
      combustivel: "gasoleo",
      co2: 130,
      norma: "WLTP",
    });
    expect(r.adicionalCo2).toBe(0);
    expect(r.total).toBeCloseTo(148.22, 2);
  });

  // Coeficientes: 2008 → 1,05; 2009 → 1,10; 2010+ → 1,15
  it("o coeficiente acompanha o ano de matrícula", () => {
    const base = { cilindrada: 1600, combustivel: "gasoleo" as const, co2: 130, norma: "WLTP" as const };
    // (63,74 + 65,15) = 128,89
    expect(iuc({ ...base, anoMatricula: 2008 }).total).toBeCloseTo(135.33, 2); // × 1,05
    expect(iuc({ ...base, anoMatricula: 2009 }).total).toBeCloseTo(141.78, 2); // × 1,10
    expect(iuc({ ...base, anoMatricula: 2010 }).total).toBeCloseTo(148.22, 2); // × 1,15
  });

  it("NEDC e WLTP têm limites de CO2 diferentes na categoria B", () => {
    const base = { cilindrada: 1600, anoMatricula: 2015, combustivel: "gasoleo" as const };
    // 200 g/km: em NEDC sobe para o escalão 181–250 (212,04); em WLTP fica em 141–205 (97,63)
    expect(iuc({ ...base, co2: 200, norma: "NEDC" }).componenteCo2).toBe(212.04);
    expect(iuc({ ...base, co2: 200, norma: "WLTP" }).componenteCo2).toBe(97.63);
    // 130 g/km: em NEDC já passou dos 120 do primeiro escalão (97,63);
    // em WLTP ainda está dentro dos 140 (65,15) — a mesma medição, imposition diferente
    expect(iuc({ ...base, co2: 130, norma: "NEDC" }).componenteCo2).toBe(97.63);
    expect(iuc({ ...base, co2: 130, norma: "WLTP" }).componenteCo2).toBe(65.15);
  });
});

describe("IUC — o custo de manter um carro na estrada", () => {
  it("o IUC não depende do preço de compra", () => {
    const entrada = { cilindrada: 1400, anoMatricula: 2022, combustivel: "gasolina" as const };
    const barato = custoAnualCarro(entrada, 10000);
    const caro = custoAnualCarro(entrada, 40000);
    expect(barato.iuc).toBe(caro.iuc);
    expect(barato.iucSobrePreco).toBeCloseTo(0.62, 2);
    expect(caro.iucSobrePreco).toBeCloseTo(0.16, 2);
  });

  it("as tabelas gravadas são as da Lei n.º 82/2023, iguais em 2024–2026", () => {
    expect(REGRAS_ISV[2026].vigencia).toBe("2026-01-01");
    expect(REGRAS_IUC[2026].vigencia).toBe("2026-01-01");
  });
});
