import { describe, it, expect } from "vitest";
import {
  FINO,
  MENOS,
  comUnidade,
  fmtData,
  fmtEUR,
  fmtEUR0,
  fmtLitro,
  fmtNum,
  fmtPct,
} from "./format";

describe("fmtData", () => {
  it("formata ano-mês", () => {
    expect(fmtData("2026-08")).toBe("ago 2026");
  });

  it("formata data completa", () => {
    expect(fmtData("2026-08-15")).toBe("15 ago 2026");
  });

  it("devolve — para input malformado", () => {
    for (const lixo of ["2026-09T00", "", "lixo", "2026-13", "2026-00", "2026-08-32"]) {
      expect(fmtData(lixo)).toBe("—");
    }
  });

  it("nunca produz undefined/NaN", () => {
    for (const v of ["2026-09T00", "", "lixo", "2026-13"]) {
      const r = fmtData(v);
      expect(r).not.toContain("undefined");
      expect(r).not.toContain("NaN");
    }
  });
});

describe("formatadores numéricos com valores não-finitos", () => {
  it.each([NaN, Infinity, -Infinity])("fmtEUR(%s) → —", (v) => {
    expect(fmtEUR(v)).toBe("—");
  });
  it.each([NaN, Infinity])("fmtEUR0(%s) → —", (v) => {
    expect(fmtEUR0(v)).toBe("—");
  });
  it.each([NaN, Infinity])("fmtNum(%s) → —", (v) => {
    expect(fmtNum(v)).toBe("—");
  });
  it.each([NaN, Infinity])("fmtPct(%s) → —", (v) => {
    expect(fmtPct(v)).toBe("—");
  });

  it("valores finitos formatam normalmente", () => {
    expect(fmtEUR(1234.5)).toContain("1");
    expect(fmtNum(0.123)).toContain("0,12");
    expect(fmtPct(0.0523)).toBe(`5,2${FINO}%`);
  });
});

// lettering (1B-02): espaço fino inseparável U+202F entre número e
// unidade — nunca espaço normal; menos verdadeiro U+2212 em negativos —
// nunca hífen.
describe("lettering — espaço fino e menos verdadeiro", () => {
  it("comUnidade cola com FINO, nunca espaço normal", () => {
    expect(comUnidade("1 856", "€")).toBe(`1 856${FINO}€`);
    expect(comUnidade("63,2", "c")).toBe(`63,2${FINO}c`);
    expect(comUnidade("3,6", "%")).toBe(`3,6${FINO}%`);
    expect(comUnidade("1", "€")).not.toContain(" ");
  });

  it("a unidade vai sempre a FINO nos formatadores", () => {
    expect(fmtEUR(1500)).toContain(`${FINO}€`);
    expect(fmtEUR(1500)).not.toContain(" €");
    expect(fmtEUR0(1500)).toContain(`${FINO}€`);
    expect(fmtPct(0.036)).toBe(`3,6${FINO}%`);
    expect(fmtLitro(1.685)).toBe(`1,685${FINO}€/L`);
    // nem NBSP largo — só o fino
    expect(fmtEUR(1500)).not.toContain(" ");
  });

  it("o separador de milhares também é o fino", () => {
    expect(fmtEUR0(1500)).toBe(`1${FINO}500${FINO}€`);
    expect(fmtNum(25987.5)).toBe(`25${FINO}987,5`);
  });

  it("negativos trazem o menos verdadeiro, nunca hífen", () => {
    expect(fmtEUR(-1856)).toBe(`−1${FINO}856,00${FINO}€`);
    expect(fmtNum(-5.2, 1)).toBe("−5,2");
    expect(fmtPct(-0.052, 1)).toBe(`−5,2${FINO}%`);
    for (const f of [fmtEUR(-1), fmtNum(-1), fmtPct(-0.01), fmtLitro(-1)]) {
      expect(f).not.toContain("-");
      expect(f.startsWith(MENOS)).toBe(true);
    }
  });
});

// regra de dinheiro (S1-02 defeito 4): milhares agrupados SEMPRE a partir
// de 1 000 — o CLDR pt-PT só agrupa a partir de 5 dígitos, o que punha
// «1 500 €» e «1167 €» no mesmo cartão. O Intl é normalizado
// para FINO (U+202F) em format.ts — o separador exato é contrato.
const SEM_ESPACOS = /[\s ​﻿ ]/g;
// separador de milhares: SEMPRE a NBSP estreita (FINO), nunca quebrável
const SEP_MILHARES = /\d \d/;

describe("agrupamento de milhares — a partir de 1 000, sempre", () => {
  it("fmtEUR0 agrupa 4 dígitos", () => {
    expect(fmtEUR0(1500).replace(SEM_ESPACOS, "")).toBe("1500€");
    expect(fmtEUR0(1500)).toMatch(/^1\D500/);
    expect(fmtEUR0(1167).replace(SEM_ESPACOS, "")).toBe("1167€");
  });

  it("fmtEUR agrupa 4 dígitos com decimais", () => {
    expect(fmtEUR(1166.83).replace(SEM_ESPACOS, "")).toBe("1166,83€");
    expect(fmtEUR(1166.83)).toMatch(/^1\D166,83/);
  });

  it("fmtNum agrupa com e sem casas fixas", () => {
    expect(fmtNum(1234.5, 1).replace(SEM_ESPACOS, "")).toBe("1234,5");
    expect(fmtNum(1234.5, 1)).toMatch(/^1\D234,5/);
    expect(fmtNum(25987.5).replace(SEM_ESPACOS, "")).toBe("25987,5");
    expect(fmtNum(25987.5)).toMatch(/^25\D987,5/);
  });

  it("abaixo de 1 000 não há separador", () => {
    expect(fmtEUR0(999).replace(SEM_ESPACOS, "")).toBe("999€");
    expect(fmtEUR0(999)).toMatch(/^999/);
    expect(fmtNum(999.9, 1)).toMatch(/^999,9/);
  });

  it("o separador de milhares não é espaço simples quebrável", () => {
    // FINO — «1 500 €» nunca parte ao fim da linha
    expect(SEP_MILHARES.test(fmtEUR0(1500))).toBe(true);
    expect(SEP_MILHARES.test(fmtEUR0(999))).toBe(false);
  });
});
