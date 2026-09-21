import { describe, it, expect } from "vitest";
import { fmtData, fmtEUR, fmtEUR0, fmtNum, fmtPct } from "./format";

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
    expect(fmtPct(0.0523)).toBe("5,2 %");
  });
});
