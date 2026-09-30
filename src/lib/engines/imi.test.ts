import { describe, it, expect } from "vitest";
import { imi, desdobraPrestacoes, taxaDoMunicipio, compararMunicipios, REGRAS_IMI } from "./imi";

describe("IMI — a coleta", () => {
  // VPT 120 000 × 0,324 % = 388,80
  it("Porto: 120 000 € de VPT a 0,324 % dão 388,80 €", () => {
    const r = imi({ vpt: 120000, municipio: "porto" });
    expect(r.coleta).toBe(388.8);
    expect(r.aPagar).toBe(388.8);
    expect(r.taxaEfetiva).toBeCloseTo(0.00324, 6);
  });

  // VPT 250 000 × 0,324 % = 810,00
  it("Porto: 250 000 € de VPT dão 810,00 €", () => {
    expect(imi({ vpt: 250000, municipio: "porto" }).aPagar).toBe(810);
  });

  it("a taxa pode ser passada directamente, sem município", () => {
    expect(imi({ vpt: 120000, taxa: 0.0045 }).aPagar).toBe(540);
    expect(imi({ vpt: 120000, taxa: 0.003 }).aPagar).toBe(360);
  });

  it("taxaDoMunicipio devolve a taxa curada", () => {
    expect(taxaDoMunicipio("porto")).toBe(0.00324);
  });
});

describe("IMI — o que o motor recusa", () => {
  it("não tem taxa por omissão: sem município nem taxa, falha", () => {
    expect(() => imi({ vpt: 120000 })).toThrow(/municipal/);
  });

  it("recusa uma taxa fora do intervalo legal de 0,3 % a 0,45 %", () => {
    expect(() => imi({ vpt: 120000, taxa: 0.005 })).toThrow(/fora do intervalo/);
    expect(() => imi({ vpt: 120000, taxa: 0.002 })).toThrow(/fora do intervalo/);
  });

  it("recusa VPT não positivo", () => {
    expect(() => imi({ vpt: 0, taxa: 0.003 })).toThrow(/positivo/);
  });

  it("recusa um município cuja taxa não foi curada", () => {
    expect(() => taxaDoMunicipio("lisboa" as never)).toThrow(/não foi curada/);
  });

  it("não inventa a taxa de um município que não está nas regras", () => {
    // Só o Porto foi curado. A lista de municípios não pode inventar entradas.
    const conhecidos = compararMunicipios(120000);
    expect(conhecidos).toHaveLength(1);
    expect(conhecidos[0].municipio).toBe("porto");
  });
});

describe("IMI familiar — a redução em euros", () => {
  it("1 dependente: 388,80 − 30 = 358,80", () => {
    const r = imi({
      vpt: 120000,
      municipio: "porto",
      imiFamiliar: true,
      habitacaoPropriaPermanente: true,
      dependentes: 1,
    });
    expect(r.reducaoFamiliar).toBe(30);
    expect(r.aPagar).toBe(358.8);
  });

  it("2 dependentes: 388,80 − 70 = 318,80", () => {
    const r = imi({
      vpt: 120000,
      municipio: "porto",
      imiFamiliar: true,
      habitacaoPropriaPermanente: true,
      dependentes: 2,
    });
    expect(r.reducaoFamiliar).toBe(70);
    expect(r.aPagar).toBe(318.8);
  });

  it("3 ou mais dependentes: 388,80 − 140 = 248,80", () => {
    const r = imi({
      vpt: 120000,
      municipio: "porto",
      imiFamiliar: true,
      habitacaoPropriaPermanente: true,
      dependentes: 4,
    });
    expect(r.reducaoFamiliar).toBe(140);
    expect(r.aPagar).toBe(248.8);
  });

  it("sem deliberação municipal não há dedução, mesmo com três dependentes", () => {
    const r = imi({
      vpt: 120000,
      municipio: "porto",
      imiFamiliar: false,
      habitacaoPropriaPermanente: true,
      dependentes: 3,
    });
    expect(r.reducaoFamiliar).toBe(0);
    expect(r.aPagar).toBe(388.8);
  });

  it("a dedução é em euros, não em percentagem", () => {
    // Numa casa de 120 000 € o tecto de 3+ dependentes tira 140 € (3,6 %);
    // numa de 400 000 € tira os mesmos 140 € (0,9 %).
    const pequena = imi({ vpt: 120000, municipio: "porto", imiFamiliar: true, habitacaoPropriaPermanente: true, dependentes: 3 });
    const grande = imi({ vpt: 400000, municipio: "porto", imiFamiliar: true, habitacaoPropriaPermanente: true, dependentes: 3 });
    expect(pequena.reducaoFamiliar).toBe(140);
    expect(grande.reducaoFamiliar).toBe(140);
    expect(pequena.taxaEfetiva).toBeCloseTo(0.0020733, 6);
    expect(grande.taxaEfetiva).toBeCloseTo(0.00289, 6);
  });

  it("a dedução nunca deixa o imposto abaixo de zero", () => {
    // VPT minúsculo: a coleta é menor do que os 140 € de dedução.
    const r = imi({
      vpt: 20000,
      municipio: "porto",
      imiFamiliar: true,
      habitacaoPropriaPermanente: true,
      dependentes: 3,
    });
    expect(r.coleta).toBe(64.8);
    expect(r.aPagar).toBe(0);
  });
});

describe("IMI — prédios degradados", () => {
  // 388,80 × 30 % = 116,64 → 505,44
  it("majoração de 30 % no Porto", () => {
    const r = imi({ vpt: 120000, municipio: "porto", predioDegradado: true });
    expect(r.majoracaoDegradado).toBe(116.64);
    expect(r.aPagar).toBe(505.44);
  });

  it("a majoração não se aplica a outros municípios", () => {
    const r = imi({ vpt: 120000, taxa: 0.00324, predioDegradado: true });
    expect(r.majoracaoDegradado).toBe(0);
  });
});

describe("IMI — prestações (art. 120.º)", () => {
  it("até 100 €: uma prestação em maio", () => {
    const p = desdobraPrestacoes(88.8);
    expect(p).toHaveLength(1);
    expect(p[0]).toEqual({ mes: 5, valor: 88.8 });
  });

  it("100,01 € a 500 €: duas prestções, maio e novembro", () => {
    const p = desdobraPrestacoes(388.8);
    expect(p).toHaveLength(2);
    expect(p.map((x) => x.mes)).toEqual([5, 11]);
    expect(p[0].valor).toBe(194.4);
  });

  it("acima de 500 €: três prestações, maio, agosto e novembro", () => {
    const p = desdobraPrestacoes(810);
    expect(p).toHaveLength(3);
    expect(p.map((x) => x.mes)).toEqual([5, 8, 11]);
    expect(p[0].valor).toBe(270);
  });

  it("as prestações somam ao total, sem perder cêntimos", () => {
    for (const total of [88.8, 100, 100.01, 388.8, 500, 500.01, 1234.56]) {
      const soma = Math.round(desdobraPrestacoes(total).reduce((a, b) => a + b.valor, 0) * 100) / 100;
      expect(soma).toBeCloseTo(total, 2);
    }
  });

  it("os limites são 100 € e 500 €, não 100 € e 499 €", () => {
    expect(desdobraPrestacoes(100)).toHaveLength(1);
    expect(desdobraPrestacoes(500)).toHaveLength(2);
    expect(desdobraPrestacoes(500.01)).toHaveLength(3);
  });
});

describe("IMI — a diferença entre municípios", () => {
  it("mesmo imóvel, taxa mínima e taxa máxima: a diferença é de 50 %", () => {
    const minimo = imi({ vpt: 200000, taxa: 0.003 }).aPagar;
    const maximo = imi({ vpt: 200000, taxa: 0.0045 }).aPagar;
    expect(minimo).toBe(600);
    expect(maximo).toBe(900);
    // 900 / 600 = 1,5 — o intervalo legal é exactamente metade do imposto
    expect(maximo / minimo).toBeCloseTo(1.5, 6);
  });

  it("o Porto fica entre a mínima e a máxima", () => {
    const taxa = taxaDoMunicipio("porto");
    const { min, max } = REGRAS_IMI[2026].taxasLegais.urbanos;
    expect(taxa).toBeGreaterThan(min);
    expect(taxa).toBeLessThan(max);
  });
});
