/**
 * OS ORÇAMENTOS DE PERFORMANCE — NA FONTE ÚNICA.
 *
 * Estes testes fazem duas coisas, e a segunda é a que interessa: fixam os
 * valores do pack (para que uma mudança seja deliberada) e garantem que
 * nenhum medidor voltou a copiar os números. Um orçamento com várias cópias
 * acaba sempre com a cópia errada a mandar — foi assim que o medidor de JS
 * por rota comparou bytes *raw* contra um tecto em gzip.
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { ORCAMENTOS, APLICADO_POR, FONTE, excedente } from "./_orcamentos.mjs";

describe("os orçamentos de performance", () => {
  it("são os do pack: 80 KB na home, 350 KB de JS inicial por rota", () => {
    expect(ORCAMENTOS.htmlHomeGzipBytes).toBe(80 * 1024);
    expect(ORCAMENTOS.jsInicialRotaGzipBytes).toBe(350 * 1024);
  });

  it("cada orçamento diz quem o aplica, e a fonte de onde vem", () => {
    expect(APLICADO_POR.htmlHomeGzipBytes).toContain("_gate-html.mjs");
    expect(APLICADO_POR.jsInicialRotaGzipBytes).toContain("_js-por-rota.mjs");
    expect(FONTE).toContain("pack");
  });

  it("excedente() dá falta (positivo) e folga (negativo)", () => {
    expect(excedente(90 * 1024, 80 * 1024)).toBe(10 * 1024);
    expect(excedente(70 * 1024, 80 * 1024)).toBe(-10 * 1024);
    expect(excedente(80 * 1024, 80 * 1024)).toBe(0);
  });
});

describe("os medidores não repetem os números", () => {
  // A fonte única é `_orcamentos.mjs`; qualquer cópia literal num medidor
  // volta a permitir que a cópia errada mande.
  const copiasProibidas = [
    /(?<![\d.])80\s*\*\s*1024(?![\d])/,
    /(?<![\d.])350\s*\*\s*1024(?![\d])/,
  ];
  const medidores = [
    "scripts/_gate-html.mjs",
    "scripts/_dieta-html.mjs",
    "scripts/_js-por-rota.mjs",
    "scripts/_sweep.mjs",
    "scripts/_verifica-cdn.mjs",
    "src/app/_bairro/gate-html.test.ts",
  ];
  for (const f of medidores) {
    it(`${f} lê os orçamentos da fonte única`, () => {
      const src = readFileSync(f, "utf8");
      expect(src, `${f} deixou de importar _orcamentos.mjs`).toContain("_orcamentos.mjs");
      for (const re of copiasProibidas) {
        expect(src, `${f} voltou a copiar o tecto (${re})`).not.toMatch(re);
      }
    });
  }

  it("a CI imprime a tabela da fonte única", () => {
    for (const wf of [".github/workflows/ci.yml", ".github/workflows/ci-pos-ingestao.yml"]) {
      const src = readFileSync(wf, "utf8");
      expect(src, `${wf} devia imprimir scripts/_orcamentos.mjs`).toContain(
        "node scripts/_orcamentos.mjs"
      );
    }
  });
});
