import { describe, it, expect } from "vitest";
import { parseNimPortugal } from "./ccd2225";
import { readFileSync } from "fs";
import path from "path";

/**
 * A página real do NIM (baixada a 2026-09-30, com Portugal a 0 medidas e a
 * Eslovénia já com 1) é a fixture: o parser tem de ler a estrutura verdadeira
 * do EUR-Lex, não um HTML imaginado.
 */
const FIXTURE = readFileSync(path.join(__dirname, "ccd2225.fixture.html"), "utf8");

describe("parseNimPortugal — a página real do EUR-Lex", () => {
  it("Portugal sem medidas: medidas = 0, sem prazos, sem ligações", () => {
    const r = parseNimPortugal(FIXTURE);
    expect(r.medidas).toBe(0);
    expect(r.prazos).toEqual([]);
    expect(r.ligacoes).toEqual([]);
  });

  it("não confunde Portugal com a Eslovénia (que já tem 1 medida e prazo 20/11/2025)", () => {
    // A fixture contém o bloco SVN com medidas: se o parser pegasse no bloco
    // errado, contaria 1 medida para Portugal.
    expect(FIXTURE).toContain('id="SVN_numOfNims"');
    expect(FIXTURE).toContain("20/11/2025");
    const r = parseNimPortugal(FIXTURE);
    expect(r.medidas).toBe(0);
  });

  it("bloco ausente falha alto — a página mudou e o sinal não se lê às cegas", () => {
    expect(() => parseNimPortugal("<html>outra coisa</html>")).toThrow(/não encontrado/);
  });

  it("um Portugal transposto (fixture sintética com 1 medida) é detetado", () => {
    const sintetica = FIXTURE.replace(
      'id="PRT_numOfNims" class="col-sm-4 hidden-xs" aria-expanded="true">\n                     <p class="ViewMoreInfo ntmMore collapsed countryToggle noNimsBtn">\n                        <span class="VMIMore">0</span>',
      'id="PRT_numOfNims" class="col-sm-4 hidden-xs" aria-expanded="true">\n                     <p class="ViewMoreInfo ntmMore collapsed countryToggle">\n                        <a href="/eli/pt/dec-lei/2026/999/oj">Decreto-Lei n.º 999/2026 de transposição</a>\n                        <span class="VMIMore">1</span>'
    );
    const r = parseNimPortugal(sintetica);
    expect(r.medidas).toBe(1);
    expect(r.prazos).toEqual([]);
    expect(r.ligacoes).toHaveLength(1);
    expect(r.ligacoes[0].url).toContain("/eli/pt/dec-lei/2026/999/oj");
    expect(r.ligacoes[0].titulo).toContain("Decreto-Lei n.º 999/2026");
  });
});
