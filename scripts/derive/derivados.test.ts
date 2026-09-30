import { describe, it, expect } from "vitest";
import path from "path";
import { depositoReal } from "./derivados";

const DATA = path.resolve(__dirname, "..", "..", "data");

/**
 * Caso conhecido, conferido à mão sobre as séries gravadas em
 * data/sources/ (lidas do BPstat e do Eurostat, não inventadas):
 *
 *   2026-07 · HICP 103,76 contra 100,60 em 2025-07 → 3,1412 % de inflação
 *          taxa nominal do depósito a prazo até 1 ano: 1,59 %
 *          1,59 − 3,1412 = −1,5512 → −1,55 pontos percentuais
 *
 * É a diferença entre duas séries oficiais. Não é o juro que alguém recebe
 * no bolso: não conta com impostos.
 */
describe("depositoReal", () => {
  const doc = depositoReal(DATA);

  it("lê as duas séries oficiais que o derivado precisa", () => {
    expect(doc).not.toBeNull();
  });

  it("2026-07: 1,59 % menos 3,14 % de inflação = −1,55", () => {
    const p = doc!.series.find((x) => x.t === "2026-07");
    expect(p).toBeDefined();
    expect(p!.v).toBe(-1.55);
  });

  it("2026-06: 1,55 % menos 3,14 % de inflação = −1,59", () => {
    const p = doc!.series.find((x) => x.t === "2026-06");
    expect(p!.v).toBe(-1.59);
  });

  it("cada ponto é a subtracção, arredondada a duas casas e sem -0", () => {
    for (const p of doc!.series) {
      expect(Number(p.v.toFixed(2))).toBe(p.v);
      expect(Object.is(p.v, -0)).toBe(false);
    }
  });

  it("só meses com HICP do ano anterior podem ser calculados", () => {
    // o HICP começa em 1996-01; os depósitos em 2003-01 — não há ponto
    // antes do HICP ter doze meses de histórico
    expect(doc!.series[0].t >= "1997-01").toBe(true);
  });

  it("guarda as duas fontes e a fórmula no meta — nada de número sem origem", () => {
    expect(doc!.meta.fontes).toHaveLength(2);
    expect(doc!.meta.fontes![0]).toContain("series_ids=12519805");
    expect(doc!.meta.fontes![1]).toContain("prc_hicp_minr");
    expect(doc!.meta.formula).toMatch(/Taxa de juro/);
  });

  it("avisa que é aproximação e ignora impostos", () => {
    expect(doc!.meta.nota).toMatch(/não conta com impostos/);
  });

  it("série sem HICP não devolve nada — melhor vazio que número inventado", () => {
    expect(depositoReal("/caminho/que/não/existe")).toBeNull();
  });

  it("aceita o total de prazos como alternativa, com o mesmo contrato", () => {
    const total = depositoReal(DATA, "total");
    expect(total).not.toBeNull();
    expect(total!.series.length).toBeGreaterThan(0);
    expect(total!.meta.frequencia).toBe("mensal");
  });
});