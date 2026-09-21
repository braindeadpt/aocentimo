import { describe, expect, it } from "vitest";
import { dataDePeriodo, escalaTempo, escalaValor } from "./escalas";
import { rotuloValor, ticksTempo, ticksValor } from "./eixos";
import { pathArco, pathArea, pathLinha, pathStep } from "./formas";
import { corQuantil, corSeq, corSerie } from "./cores";
import { regioesEntre } from "./entre";

describe("dataDePeriodo — rótulos resolvem no fim do período (UTC)", () => {
  it("ano → 31 de dezembro", () => {
    expect(dataDePeriodo("2026").toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });
  it("mês → último dia do mês (bissexto incluído)", () => {
    expect(dataDePeriodo("2026-08").toISOString()).toBe("2026-08-31T00:00:00.000Z");
    expect(dataDePeriodo("2024-02").toISOString()).toBe("2024-02-29T00:00:00.000Z");
  });
  it("dia → a própria data", () => {
    expect(dataDePeriodo("2026-09-17").toISOString()).toBe("2026-09-17T00:00:00.000Z");
  });
  it("trimestre/semestre Eurostat → fim do período", () => {
    expect(dataDePeriodo("2026-Q1").toISOString()).toBe("2026-03-31T00:00:00.000Z");
    expect(dataDePeriodo("2026-Q2").toISOString()).toBe("2026-06-30T00:00:00.000Z");
    expect(dataDePeriodo("2025-S2").toISOString()).toBe("2025-12-31T00:00:00.000Z");
  });
  it("malformado → data inválida", () => {
    expect(Number.isNaN(dataDePeriodo("ontem").getTime())).toBe(true);
    expect(Number.isNaN(dataDePeriodo("2026-13").getTime())).toBe(true);
  });
});

describe("escalaTempo / escalaValor", () => {
  const pts = [{ t: "2025-01" }, { t: "2025-12" }];

  it("domínio = fim do primeiro ao fim do último período", () => {
    const s = escalaTempo(pts, [0, 100]);
    expect(s.domain()[0].toISOString()).toBe("2025-01-31T00:00:00.000Z");
    expect(s.domain()[1].toISOString()).toBe("2025-12-31T00:00:00.000Z");
    expect(s(dataDePeriodo("2025-01"))).toBe(0);
    expect(s(dataDePeriodo("2025-12"))).toBe(100);
  });

  it("escalaValor: zero força o zero no domínio; nice arredonda", () => {
    const s = escalaValor([2, 9], [100, 0], { zero: true });
    expect(s.domain()[0]).toBe(0);
    const n = escalaValor([2.13, 8.97], [100, 0], { nice: true });
    expect(n.domain()[0]).toBeLessThanOrEqual(2);
    expect(n.domain()[1]).toBeGreaterThanOrEqual(9);
    expect(Number.isInteger(n.domain()[1])).toBe(true);
  });

  it("escalaValor: domínio explícito nunca é auto-escalado", () => {
    const s = escalaValor([5], [0, 100], { dominio: [0, 20] });
    expect(s.domain()).toEqual([0, 20]);
    expect(s(10)).toBe(50);
  });

  it("escalaTempo com pontos Q/S: espaçamento proporcional ao tempo real", () => {
    // trimestres — Q1→Q2 ≈ 91 dias, Q3→Q4 ≈ 92: distâncias quase iguais
    const sq = escalaTempo(
      [{ t: "2025-Q1" }, { t: "2025-Q4" }],
      [0, 300]
    );
    const d12 = sq(dataDePeriodo("2025-Q2")) - sq(dataDePeriodo("2025-Q1"));
    const d34 = sq(dataDePeriodo("2025-Q4")) - sq(dataDePeriodo("2025-Q3"));
    expect(Math.abs(d12 - d34)).toBeLessThan(4); // px
    expect(sq(dataDePeriodo("2025-Q1"))).toBe(0);
    expect(sq(dataDePeriodo("2025-Q4"))).toBe(300);

    // semestres — S1→S2 = 184 dias: o meio da escala cai em S2? não —
    // S2 acaba no fim do ano: x de S2 > meio do intervalo S1→S2 seguinte
    const ss = escalaTempo(
      [{ t: "2025-S1" }, { t: "2026-S1" }],
      [0, 400]
    );
    const xS2 = ss(dataDePeriodo("2025-S2"));
    expect(xS2).toBeGreaterThan(190);
    expect(xS2).toBeLessThan(210);

    // misto Q com mês no mesmo eixo — ordenação cronológica mantém-se
    const sm = escalaTempo(
      [{ t: "2025-Q1" }, { t: "2025-09" }],
      [0, 100]
    );
    expect(sm(dataDePeriodo("2025-Q2"))).toBeLessThan(
      sm(dataDePeriodo("2025-09"))
    );
  });
});

describe("ticksTempo — rótulos pela amplitude", () => {
  const escalaDe = (a: string, b: string) =>
    escalaTempo([{ t: a }, { t: b }], [0, 600]);

  it("meses de amplitude → «jan 24»", () => {
    const s = escalaDe("2024-01", "2024-06");
    const ticks = ticksTempo(s, 5);
    expect(ticks.length).toBeGreaterThan(2);
    expect(ticks[0].rotulo).toBe("fev 24");
  });

  it("ano e pouco → trimestres «T1 24»", () => {
    const s = escalaDe("2024-01", "2025-04");
    const ticks = ticksTempo(s, 5);
    expect(ticks[0].rotulo).toBe("T2 24");
    expect(ticks.every((t) => /^T[1-4] \d{2}$/.test(t.rotulo))).toBe(true);
  });

  it("dois anos e meio → semestres «S1 25»", () => {
    const s = escalaDe("2024-01", "2026-06");
    const ticks = ticksTempo(s, 5);
    expect(ticks.every((t) => /^S[12] \d{2}$/.test(t.rotulo))).toBe(true);
    expect(ticks.map((t) => t.rotulo)).toContain("S1 25");
  });

  it("décadas → anos «2024»", () => {
    const s = escalaDe("2000-01", "2026-09");
    const ticks = ticksTempo(s, 6);
    expect(ticks.every((t) => /^\d{4}$/.test(t.rotulo))).toBe(true);
    expect(ticks.map((t) => t.rotulo)).toContain("2010");
  });
});

describe("ticksValor — rótulos PT-PT por unidade", () => {
  it("% com vírgula decimal e espaço fino", () => {
    const s = escalaValor([0, 5.7], [100, 0], { nice: true });
    const ticks = ticksValor(s, 4, "%");
    expect(ticks[0].rotulo).toMatch(/^\d(,\d)?\u202F%$/);
    expect(ticks.every((t) => Number.isFinite(t.y))).toBe(true);
  });

  it("€/kWh mantém a unidade", () => {
    const s = escalaValor([0, 0.25], [100, 0], { nice: true });
    const ticks = ticksValor(s, 4, "€/kWh");
    expect(ticks[1].rotulo).toMatch(/\u202F€\/kWh$/);
  });

  it("índice sem unidade → número limpo", () => {
    expect(rotuloValor(104.07, "Índice 2025=100")).toBe("104,07");
    expect(rotuloValor(-0.4, "p.p.")).toBe("-0,4\u202Fp.p.");
  });
});

describe("formas", () => {
  const pts: [number, number][] = [
    [0, 50],
    [10, 20],
    [20, 40],
    [30, 10],
  ];

  it("pathLinha: move + curvas monotone", () => {
    const d = pathLinha(pts);
    expect(d.startsWith("M 0,50") || d.startsWith("M0,50")).toBe(true);
    expect(d).toContain("C");
  });

  it("pathArea: fecha na linha de base", () => {
    const d = pathArea(pts, 60);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("60");
  });

  it("pathStep: segmentos rectos (step-after)", () => {
    const d = pathStep(pts);
    expect(d.startsWith("M")).toBe(true);
    expect(d).not.toContain("C");
  });

  it("pathArco: 240° de −210° a 30°, 0°=12h sentido horário", () => {
    const d = pathArco(50, 50, 40, -210, 30);
    // −210° → x=cx+r·sin(−210°)=cx+0.5r, y=cy−r·cos(−210°)=cy+0.866r
    expect(d).toMatch(/^M 70 84\.64 A 40 40 0 1 1 70 15\.36$/);
  });

  it("pathArco: arco curto usa large-arc 0", () => {
    const d = pathArco(50, 50, 40, -30, 30);
    expect(d).toMatch(/A 40 40 0 0 1 /);
  });
});

describe("regioesEntre — a área entre duas séries, partida nos cruzamentos", () => {
  // lembrete do referencial: y cresce para baixo — "acima" = a.y < b.y
  it("série sempre por cima → uma região acima", () => {
    const a: [number, number][] = [[0, 10], [50, 10], [100, 10]];
    const b: [number, number][] = [[0, 60], [100, 60]];
    const r = regioesEntre(a, b);
    expect(r).toHaveLength(1);
    expect(r[0].acima).toBe(true);
    expect(r[0].d.startsWith("M")).toBe(true);
    expect(r[0].d.endsWith("Z")).toBe(true);
  });

  it("cruzamento único → duas regiões com sinais opostos", () => {
    // A desce de 10 para 90 enquanto B fica em 50 — cruzam a meio (x=50)
    const a: [number, number][] = [[0, 10], [100, 90]];
    const b: [number, number][] = [[0, 50], [100, 50]];
    const r = regioesEntre(a, b);
    expect(r).toHaveLength(2);
    expect(r[0].acima).toBe(true);
    expect(r[1].acima).toBe(false);
    // o cruzamento partilha o mesmo x nas duas regiões (~50)
    for (const reg of r) expect(reg.d).toContain("50");
  });

  it("referência constante → recta de dois pontos funciona", () => {
    const a: [number, number][] = [[0, 80], [50, 20], [100, 80]];
    const mediana: [number, number][] = [[0, 50], [100, 50]];
    const r = regioesEntre(a, mediana);
    expect(r).toHaveLength(3);
    expect(r.map((x) => x.acima)).toEqual([false, true, false]);
  });

  it("séries coladas → sem regiões (não inventa área)", () => {
    const a: [number, number][] = [[0, 30], [100, 30]];
    expect(regioesEntre(a, a)).toEqual([]);
  });

  it("intervalo comum: B mais curta limita a hachura", () => {
    const a: [number, number][] = [[0, 10], [100, 10]];
    const b: [number, number][] = [[40, 60], [60, 60]];
    const r = regioesEntre(a, b);
    expect(r).toHaveLength(1);
    // a região não estende para lá de B — o path fica entre 40 e 60
    expect(r[0].d).not.toContain("100");
  });

  it("menos de dois pontos → vazio", () => {
    expect(regioesEntre([[0, 1]], [[0, 2], [9, 3]])).toEqual([]);
    expect(regioesEntre([], [])).toEqual([]);
  });
});

describe("cores — só nomes de variável", () => {
  it("rampas e família", () => {
    expect(corSeq(2)).toBe("var(--seq-2)");
    expect(corQuantil(0)).toBe("var(--seq-1)");
    expect(corQuantil(3)).toBe("var(--seq-4)");
    expect(corSerie(0)).toBe("var(--dink-1)");
    expect(corSerie(5)).toBe("var(--dink-2)");
  });
});
