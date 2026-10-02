/**
 * `graficoLinhas` (src/lib/viz/grafico-linhas.ts) — o desenhador
 * reutilizável das cenas P2c, porta de `graficoLinhas()` do protótipo
 * (`cena-base.js`). Os testes prendem: escalas, anos no eixo, a mancha
 * entre séries, as marcas, o equivalente textual com os MESMOS números
 * e a honestidade de dados (falhas quebram a linha; série vazia mostra
 * «—», nunca um gráfico de zeros — regra nº1).
 */
import { describe, expect, it } from "vitest";
import { graficoLinhas, rebase, type SerieLinhas } from "./grafico-linhas";

const fmt = (v: number) => String(Math.round(v));

const A: SerieLinhas = {
  pts: [
    { t: "2019-01", v: 100 },
    { t: "2020-01", v: 110 },
    { t: "2021-01", v: 130 },
  ],
  cor: "#e2412a",
  rotulo: "preço das casas",
};
const B: SerieLinhas = {
  pts: [
    { t: "2019-01", v: 100 },
    { t: "2020-01", v: 104 },
    { t: "2021-01", v: 112 },
  ],
  cor: "#16130f",
  traco: "6 4",
  rotulo: "custo do trabalho",
};

describe("graficoLinhas", () => {
  it("devolve um svg com role=img, o aria-label e a grelha pedida", () => {
    const { svg } = graficoLinhas({
      series: [A, B],
      y: { min: 50, max: 150, passo: 50, fmt, realce: 100 },
      aria: "teste",
    });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="teste"');
    // os três riscos de y (50, 100, 150) com o 100 realçado
    expect(svg).toContain(">50</text>");
    expect(svg).toContain(">100</text>");
    expect(svg).toContain(">150</text>");
    expect(svg.match(/stroke-dasharray="3 3"/)).toBeTruthy();
    // duas linhas de série, cada uma com a sua cor
    expect(svg).toContain('stroke="#e2412a"');
    expect(svg).toContain('stroke="#16130f"');
    // as legendas à mão (Caveat) por cima do gráfico
    expect(svg).toContain("preço das casas");
    expect(svg).toContain("custo do trabalho");
    // os anos no eixo
    expect(svg).toContain(">2019</text>");
    expect(svg).toContain(">2021</text>");
  });

  it("a mancha (faixa) fecha entre a série a e a b invertida", () => {
    const { svg } = graficoLinhas({
      series: [A, B],
      y: { min: 50, max: 150, passo: 50, fmt },
      faixa: [0, 1],
      faixaCor: "#ffc2b3",
      aria: "x",
    });
    expect(svg).toContain('fill="#ffc2b3"');
    expect(svg).toContain("Z\"");
  });

  it("as marcas desenham círculo e texto no ponto pedido", () => {
    const { svg } = graficoLinhas({
      series: [A],
      y: { min: 50, max: 150, passo: 50, fmt },
      marcas: [{ s: 0, k: -1, texto: "130", cor: "#e2412a" }],
      aria: "x",
    });
    expect(svg).toContain(">130</text>");
    expect(svg).toMatch(/<circle[^>]*r="5.5"/);
  });

  it("uma falha na série QUEBRA a linha (pen up), não a afila a zero", () => {
    const comFalha: SerieLinhas = {
      pts: [
        { t: "2019-01", v: 100 },
        // falta 2020-01
        { t: "2021-01", v: 130 },
      ],
      cor: "#e2412a",
    };
    const semFalha = graficoLinhas({ series: [A], y: { min: 50, max: 150, passo: 50, fmt }, aria: "x" });
    const comGap = graficoLinhas({ series: [comFalha, B], y: { min: 50, max: 150, passo: 50, fmt }, aria: "x" });
    // a série com falha tem dois segmentos (um M extra além do primeiro)
    const tag = (comGap.svg.match(/<path[^>]*stroke="#e2412a"[^>]*>/) ?? [""])[0];
    const d = /d="([^"]+)"/.exec(tag)![1];
    expect(d.split("M").length - 1).toBe(2); // M … M … — levanta a pena na falha
    expect(semFalha.svg).not.toBe(comGap.svg);
  });

  it("uma série vazia não desenha linha e o equivalente textual diz «—»", () => {
    const vazia: SerieLinhas = { pts: [], cor: "#e2412a", rotulo: "sem dados" };
    const { svg, texto } = graficoLinhas({
      series: [vazia, B],
      y: { min: 50, max: 150, passo: 50, fmt },
      aria: "x",
    });
    // só uma linha desenhada (a B); a vazia não gera path
    expect(svg.match(/<path[^>]*stroke="#e2412a"/g)).toBeNull();
    expect(texto).toContain("sem dados");
    expect(texto).toContain("—");
  });

  it("TODAS as séries vazias: não sai um gráfico de zeros, sai o equivalente", () => {
    const { svg, texto } = graficoLinhas({
      series: [{ pts: [], cor: "#e2412a", rotulo: "a" }],
      y: { min: 0, max: 10, passo: 5, fmt },
      aria: "x",
    });
    expect(svg).not.toContain("<svg");
    expect(texto).toContain("—");
  });

  it("o equivalente textual leva os mesmos números do desenho", () => {
    const { texto } = graficoLinhas({
      series: [A, B],
      y: { min: 50, max: 150, passo: 50, fmt },
      aria: "x",
    });
    expect(texto).toContain("preço das casas");
    expect(texto).toContain("custo do trabalho");
    expect(texto).toContain("100"); // primeiro ponto
    expect(texto).toContain("130"); // último da A
    expect(texto).toContain("112"); // último da B
  });

  it("séries com comprimentos diferentes partilham o eixo dos t", () => {
    const curta: SerieLinhas = { pts: [{ t: "2021-01", v: 112 }], cor: "#000", rotulo: "curta" };
    const { svg } = graficoLinhas({
      series: [A, curta],
      y: { min: 50, max: 150, passo: 50, fmt },
      aria: "x",
    });
    // a série de um ponto desenha um círculo solto (não um path vazio)
    expect(svg).toContain('stroke="#e2412a"');
    expect(svg).toMatch(/<circle[^>]*r="4"/);
  });
});

describe("rebase", () => {
  it("reindexa a série para 100 no ponto t0", () => {
    const r = rebase(
      [
        { t: "2020-08", v: 105 },
        { t: "2020-09", v: 110 },
        { t: "2020-10", v: 115.5 },
      ],
      "2020-08"
    );
    expect(r[0].v).toBe(100);
    expect(r[2].v).toBeCloseTo(110);
  });

  it("t0 em falta devolve pontos vazios — a cena mostra «—», não 100 inventado", () => {
    const r = rebase([{ t: "2020-08", v: 105 }], "1999-01");
    expect(r).toEqual([]);
  });
});
