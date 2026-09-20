import { describe, it, expect } from "vitest";
import { fmtData, fmtEUR, fmtEUR0, fmtNum, fmtPct, fmtPeriodo } from "./format";

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

describe("fmtPeriodo", () => {
  it("trimestres e semestres em PT curto", () => {
    expect(fmtPeriodo("2026-Q1")).toBe("1.º trim. 2026");
    expect(fmtPeriodo("2025-Q4")).toBe("4.º trim. 2025");
    expect(fmtPeriodo("2025-S2")).toBe("2.º sem. 2025");
    expect(fmtPeriodo("2026-S1")).toBe("1.º sem. 2026");
  });

  it("delega meses, dias e anos em fmtData", () => {
    expect(fmtPeriodo("2026-08")).toBe("ago 2026");
    expect(fmtPeriodo("2026-09-17")).toBe("17 set 2026");
    expect(fmtPeriodo("2026")).toBe("2026");
  });

  it("malformado → —", () => {
    expect(fmtPeriodo("2026-Q7")).toBe("—");
    expect(fmtPeriodo("lixo")).toBe("—");
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
    expect(fmtPct(0.0523)).toBe("5,2 %");
  });
});
