import { describe, it, expect } from "vitest";
import {
  gerarCenarios,
  grelhaSalarial,
  PASSO_GRELHA,
  FIM_GRELHA,
} from "./cenarios";
import { reciboMensal } from "./engines/recibo";
import { simularSalario } from "./engines/irs";
import smn from "@data/fiscal/smn.json";

describe("grelha salarial canónica", () => {
  const grelha = grelhaSalarial();

  it("começa no salário mínimo e acaba no fim da grelha", () => {
    expect(grelha[0]).toBe(smn.regioes.continente);
    expect(grelha[grelha.length - 1]).toBe(FIM_GRELHA);
  });

  it("depois do mínimo são múltiplos exactos de 50 €", () => {
    for (const v of grelha.slice(1)) {
      expect(v % PASSO_GRELHA).toBe(0);
    }
    // sem duplicados e sempre a subir
    for (let i = 1; i < grelha.length; i++) {
      expect(grelha[i]).toBeGreaterThan(grelha[i - 1]);
    }
  });

  it("inclui pontos redondos usados pela história", () => {
    expect(grelha).toContain(1500);
    expect(grelha).toContain(2000);
  });
});

describe("cenários pré-calculados", () => {
  const cen = gerarCenarios();

  it("uma linha por ponto da grelha, sem interpolação", () => {
    expect(cen.linhas.map((l) => l.bruto)).toEqual(grelhaSalarial());
    expect(cen.meta.n).toBe(cen.linhas.length);
    expect(cen.meta.passo).toBe(PASSO_GRELHA);
  });

  it("cada linha bate certo com o motor fiscal, campo a campo", () => {
    for (const l of cen.linhas) {
      const r = reciboMensal({ bruto: l.bruto, ano: cen.meta.ano });
      expect(l.ss).toBe(r.ss);
      expect(l.irs).toBe(r.retencao);
      expect(l.liquido).toBe(r.liquido);
      expect(l.custo).toBe(r.custoEmpresa);
      expect(l.tsu).toBe(r.tsuEntidade);
      expect(l.tabela).toBe(r.tabela);
      expect(l.taxaEfetiva).toBe(r.taxaEfetiva);

      const a = simularSalario([l.bruto], 0, cen.meta.ano);
      expect(l.ano14.liquidoAnual).toBe(a.liquidoAnual);
      expect(l.ano14.liquidoMensal12).toBe(a.liquidoMensal12);
      expect(l.ano14.pesoEstado).toBe(a.pesoEstado);
    }
  });

  it("invariante do desenho: custo − tsu − irs − ss = líquido", () => {
    for (const l of cen.linhas) {
      expect(l.custo - l.tsu - l.irs - l.ss).toBeCloseTo(l.liquido, 6);
    }
  });

  it("os pontos de cêntimos somam sempre 100", () => {
    for (const l of cen.linhas) {
      const soma = l.pontos.tsu + l.pontos.irs + l.pontos.ss + l.pontos.fica;
      expect(soma).toBe(100);
      // os pontos inteiros acompanham os cêntimos reais (≤ 0,6 de erro)
      expect(Math.abs(l.pontos.fica - l.centimos.fica)).toBeLessThanOrEqual(0.6);
    }
  });

  it("o ponto canónico 1 500 € reproduz a história da home", () => {
    const l = cen.linhas.find((x) => x.bruto === 1500)!;
    expect(l.ss).toBeCloseTo(165, 2);
    expect(l.irs).toBeCloseTo(168.17, 2);
    expect(l.liquido).toBeCloseTo(1166.83, 2);
    expect(l.custo).toBeCloseTo(1856.25, 2);
  });
});
