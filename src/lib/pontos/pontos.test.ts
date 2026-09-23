import { describe, it, expect } from "vitest";
import { repartir } from "./repartir";
import {
  faceMoeda,
  geoMontes,
  slotMonte,
  geoGrelha,
  slotGrelha,
  atribuirSectores,
  atribuirSequencia,
  reatribuir,
  molaPasso,
  molaAssentou,
} from "./layouts";

const v = (...ns: number[]) => ns.map((valor) => ({ valor }));

describe("repartir — maior resto, soma sempre o total", () => {
  it("soma exactamente o total em casos arbitrários", () => {
    // varrimento determinista — PRNG próprio, sem Math.random
    let s = 12345;
    const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let k = 0; k < 400; k++) {
      const n = 1 + Math.floor(rnd() * 7);
      const valores = Array.from({ length: n }, () => rnd() * 60);
      const r = repartir(v(...valores));
      expect(r.partes.reduce((a, p) => a + p.pontos, 0)).toBe(100);
      expect(r.livres).toBe(0);
    }
  });

  it("o maior resto é quem recebe o ponto extra", () => {
    // quotas exactas 33,4 / 33,4 / 33,2 → o resto .2 perde
    const r = repartir(v(33.4, 33.4, 33.2));
    expect(r.partes.map((p) => p.pontos)).toEqual([34, 33, 33]);
  });

  it("empate de restos → a parte que vem primeiro ganha", () => {
    const r = repartir(v(33.5, 33.5, 33));
    expect(r.partes.map((p) => p.pontos)).toEqual([34, 33, 33]);
  });

  it("devolve o valor decimal real junto aos pontos", () => {
    const r = repartir(v(63.18, 19.19, 8.74, 8.89));
    expect(r.partes[0].valor).toBeCloseTo(63.18);
    expect(r.partes.map((p) => p.pontos)).toEqual([63, 19, 9, 9]);
  });

  it("parte a 0 não tem pontos — é informação, não erro", () => {
    const r = repartir(v(0, 50, 50));
    expect(r.partes.map((p) => p.pontos)).toEqual([0, 50, 50]);
    const r2 = repartir(v(0, 0, 100));
    expect(r2.partes.map((p) => p.pontos)).toEqual([0, 0, 100]);
  });

  it("valor positivo pequeno demais para um ponto → 0 pontos", () => {
    const r = repartir(v(0.4, 99.6));
    expect(r.partes.map((p) => p.pontos)).toEqual([0, 100]);
    expect(r.partes[0].valor).toBeCloseTo(0.4);
  });

  it("um só elemento recebe o total", () => {
    const r = repartir(v(63.2));
    expect(r.partes[0].pontos).toBe(100);
  });

  it("valores que somam 99,99 ou 100,01 somam na mesma o total", () => {
    const a = repartir(v(19.19, 8.74, 8.89, 63.17)); // 99,99
    const b = repartir(v(19.19, 8.74, 8.89, 63.19)); // 100,01
    expect(a.partes.reduce((s, p) => s + p.pontos, 0)).toBe(100);
    expect(b.partes.reduce((s, p) => s + p.pontos, 0)).toBe(100);
  });

  it("total diferente de 100 soma esse total", () => {
    const r = repartir(v(30, 30, 40), 400);
    expect(r.partes.reduce((s, p) => s + p.pontos, 0)).toBe(400);
    expect(r.partes.map((p) => p.pontos)).toEqual([120, 120, 160]);
  });

  it("todas a zero → pontos livres, sem dono", () => {
    const r = repartir(v(0, 0, 0));
    expect(r.partes.every((p) => p.pontos === 0)).toBe(true);
    expect(r.livres).toBe(100);
  });

  it("negativos e não finitos contam como 0", () => {
    const r = repartir(v(-5, NaN, 100));
    expect(r.partes.map((p) => p.pontos)).toEqual([0, 0, 100]);
  });
});

describe("layouts", () => {
  it("a face da moeda tem `total` pontos e metais pelos dois anéis", () => {
    const face = faceMoeda(100);
    expect(face).toHaveLength(100);
    const ouro = face.filter((p) => p.metal === "ouro").length;
    // o anel exterior é ~26 % do raio mas ~45 % da área
    expect(ouro).toBeGreaterThan(30);
    expect(ouro).toBeLessThan(60);
    // tudo dentro da face
    expect(face.every((p) => Math.hypot(p.ux, p.uy) <= 0.94)).toBe(true);
  });

  it("a grelha 10×10 cobre os 100 pontos sem sair do palco", () => {
    const g = geoGrelha(1200, 460, 100);
    expect(g.cols).toBe(10);
    expect(g.linhas).toBe(10);
    for (let i = 0; i < 100; i++) {
      const s = slotGrelha(g, i);
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(1200);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(460);
    }
  });

  it("os montes cobrem os pontos de cada parte e ficam dentro do palco", () => {
    const pontos = [19, 9, 9, 63];
    const gm = geoMontes(1200, 460, pontos);
    expect(gm.montes).toHaveLength(4);
    expect(gm.montes.map((m) => m.cols)).toEqual([4, 3, 3, 7]);
    pontos.forEach((c, i) => {
      for (let k = 0; k < c; k++) {
        const s = slotMonte(gm.montes[i], k);
        expect(s.x).toBeGreaterThan(0);
        expect(s.x).toBeLessThan(1200);
        expect(s.y).toBeLessThanOrEqual(gm.montes[i].base + 0.01);
        expect(s.y).toBeGreaterThan(0);
      }
    });
    // centros em fracções crescentes e dentro de ]0,1[
    const fxs = gm.montes.map((m) => m.fx);
    expect(fxs.every((f) => f > 0 && f < 1)).toBe(true);
    expect([...fxs].sort((a, b) => a - b)).toEqual(fxs);
  });

  it("monte vazio não tem colunas mas mantém o centro do rótulo", () => {
    const gm = geoMontes(1200, 460, [50, 0, 50]);
    expect(gm.montes[1].cols).toBe(0);
    expect(gm.montes[1].fx).toBeGreaterThan(0);
  });

  it("a grelha com total 400 mantém-se dentro do palco", () => {
    const g = geoGrelha(1200, 460, 400);
    const ultimo = slotGrelha(g, 399);
    expect(ultimo.x).toBeLessThan(1200);
    expect(ultimo.y).toBeLessThan(460);
  });
});

describe("atribuição de pontos a partes", () => {
  it("sectores: contagens por parte batem a repartição", () => {
    const face = faceMoeda(100);
    const donos = atribuirSectores(face, [19, 9, 9, 63]);
    const conta = [0, 0, 0, 0];
    donos.forEach((d) => conta[d.part]++);
    expect(conta).toEqual([19, 9, 9, 63]);
    // ranks únicos 0..n-1 por parte
    for (let p = 0; p < 4; p++) {
      const ranks = donos.filter((d) => d.part === p).map((d) => d.rank);
      expect([...ranks].sort((a, b) => a - b)).toEqual(
        Array.from({ length: conta[p] }, (_, i) => i)
      );
    }
  });

  it("sequência: preenchimento por ordem das partes", () => {
    const donos = atribuirSequencia(10, [3, 7]);
    expect(donos.map((d) => d.part)).toEqual([0, 0, 0, 1, 1, 1, 1, 1, 1, 1]);
  });

  it("sequência com pontos livres marca part −1", () => {
    const donos = atribuirSequencia(100, [0, 0]);
    expect(donos.every((d) => d.part === -1)).toBe(true);
  });

  it("reatribuir migra pontos dos montes a mais para os a menos", () => {
    const donos = atribuirSequencia(100, [50, 50]);
    const novos = reatribuir(donos, [30, 70]);
    const conta = [0, 0];
    novos.forEach((d) => conta[d.part]++);
    expect(conta).toEqual([30, 70]);
    // ranks contíguos por parte
    const r0 = novos.filter((d) => d.part === 0).map((d) => d.rank);
    expect([...r0].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 30 }, (_, i) => i)
    );
  });
});

describe("mola", () => {
  it("converge para o alvo", () => {
    const c = { x: 0, y: 0, vx: 0, vy: 0, tx: 100, ty: -50 };
    for (let i = 0; i < 300; i++) molaPasso(c, 0.08, 0.72);
    expect(molaAssentou(c)).toBe(true);
    expect(c.x).toBeCloseTo(100, 0);
    expect(c.y).toBeCloseTo(-50, 0);
  });
});
