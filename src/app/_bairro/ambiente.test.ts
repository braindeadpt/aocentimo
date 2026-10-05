import { describe, it, expect } from "vitest";
import { casca, cruz, dentro, silParaCascas, type Ponto } from "./ambiente";
import { mundoBairro, type RotulosCamada } from "../../lib/bairro/mundo";
import pt from "../../../messages/pt.json";
import { montarMapa, type MarcadoresBairro } from "../../lib/bairro/planta";

/** Marcadores de mentira: só interessa o desenho, não os números. */
const D = {
  salario: "1 500 €", tsu: "23,75 %", irs: "168 €", liquido: "1 167 €",
  cabaz: "+35 %", cafes: "+47 %", euribor: "2,95 %", ca: "2,50 %",
  gasoleo: "2,181", gasolina: "2,097",
  gasoleoUn: "2,181\u202F€/L", gasolinaUn: "2,097\u202F€/L",
  inflacao: "+3,6 %", desemprego: "5,7 %",
} as unknown as MarcadoresBairro;

const M = montarMapa(D);

/** Os nomes reais das duas camadas com edifícios — `messages/pt.json`. */
const ROTULOS: RotulosCamada = {
  avenida: pt.bairro.mapa.rotuloAvenida,
  ribeira: pt.bairro.mapa.rotuloRibeira,
};

/**
 * A animação ambiente (P1-2).
 *
 * Testamos a GEOMETRIA em vez do DOM: o `calcularLuzes()` completo precisa
 * de `getScreenCTM` e `getBBox`, que só o browser tem, e a casa não
 * instala o jsdom para um teste. O que se leva para o servidor é a
 * casca convexa — é ela que decide que janela se acende, e é a parte
 * com mais lógica a testar.
 *
 * O resto do ficheiro confere o que o mapa SERVE: se as peças que a
 * animação procura já lá estão, e se as classes levam o prefixo `b-`
 * (sem o qual apanham no CSS da V4).
 */

describe("cruz — o produto vectorial que decide de que lado está um ponto", () => {
  it("dá zero quando os três pontos são colineares", () => {
    expect(cruz([0, 0], [1, 1], [2, 2])).toBe(0);
  });

  it("muda de sinal conforme o ponto passa de um lado ao outro", () => {
    // o `y` do SVG cresce para BAIXO, por isso o sinal sai ao contrário do
    // que se espera de uma cartesiana — o teste fixa o sinal que a função
    // dá, que é o que `dentro()` e `casca()` precisam
    const a: Ponto = [0, 0];
    const b: Ponto = [10, 0];
    expect(cruz(a, b, [5, 5])).toBeGreaterThan(0);
    expect(cruz(a, b, [5, -5])).toBeLessThan(0);
  });
});

describe("casca — o envelope convexo da silhueta de uma caixa", () => {
  it("um quadrado devolve os seus quatro cantos, sem repetir o primeiro", () => {
    const c = casca([
      [0, 0],
      [40, 0],
      [40, 40],
      [0, 40],
    ]);
    expect(c).toHaveLength(4);
  });

  it("o ponto no meio de uma caixa está dentro; o de fora, não", () => {
    const c = casca([
      [0, 0],
      [40, 0],
      [40, 40],
      [0, 40],
    ]);
    expect(dentro(c, [20, 20])).toBe(true);
    expect(dentro(c, [60, 20])).toBe(false);
  });

  it("um ponto exactamente na bordo não conta como dentro", () => {
    // é o que evita a janela a acender quando a caixa só a raspa
    const c = casca([
      [0, 0],
      [40, 0],
      [40, 40],
      [0, 40],
    ]);
    expect(dentro(c, [0, 20])).toBe(false);
  });

  it("um losango dá a casca que o rodeia, não o próprio losango", () => {
    const c = casca([
      [20, 0],
      [40, 20],
      [20, 40],
      [0, 20],
    ]);
    expect(dentro(c, [20, 20])).toBe(true);
    expect(dentro(c, [38, 3])).toBe(false);
  });
});

describe("silParaCascas — a data-sil da planta", () => {
  it("lê a lista de pontos que o SVG traz", () => {
    const c = silParaCascas("0,0 40,0 40,40 0,40");
    expect(c).toHaveLength(4);
    expect(dentro(c, [20, 20])).toBe(true);
  });

  it("uma silhueta ausente dá uma casca vazia, e não uma excepção", () => {
    // uma caixa sem data-sil não pode partir o mapa inteiro
    expect(silParaCascas(undefined)).toEqual([]);
    expect(silParaCascas("")).toEqual([]);
  });

  it("lida com os espaços a mais que a serialização deixa", () => {
    expect(silParaCascas(" 0,0  40,0 40,40 0,40 ")).toHaveLength(4);
  });
});

describe("o mapa servido já traz as peças que a animação procura", () => {
  const { html } = mundoBairro(M, ROTULOS);

  it("o elétrico está montado, para a animação o poder mover", () => {
    // sem isto o effect procuraria #b-eletrico e não encontraria nada —
    // o protótipo montava-o em JavaScript, e aí não havia servidor
    expect(html).toContain("b-eletrico");
  });

  it("o nadador está no céu, com o braço que a animação mexe", () => {
    expect(html).toContain("b-nadador");
    expect(html).toContain("b-braço-n");
  });

  it("as classes de animação levam o prefixo b-, para não apanhar no CSS da V4", () => {
    // sem o prefixo, uma regra da V4 apanharia o fumo da fábrica
    expect(html).not.toMatch(/class="(?:fumo|baforada|corpo-pombo|gaivota)"/);
  });

  it("a caixa de luzes existe e nasce vazia: é o browser que a preenche", () => {
    expect(html).toContain('id="b-gLuzes"');
  });

  it("as janelas que a animação procura têm a classe .vidro com data-sil", () => {
    // `calcularLuzes` assenta nestas duas: uma sem a outra, ou acendem
    // janelas tapadas, ou o mapa fica às escuras
    expect(html).toContain('class="vidro"');
    expect(html).toContain("data-sil=");
  });
});