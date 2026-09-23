import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BarraTracos } from "./BarraTracos";

// S1-05 — a barra de traços: «1 traço = x» escrito no cartão, contagem
// final no HTML do servidor, um equivalente textual sr-only.

const html = renderToStaticMarkup(
  <BarraTracos
    grupos={[
      { n: 12, tom: "neutro", rotulo: "salários mensais" },
      { n: 2, tom: "fica", rotulo: "subsídios" },
    ]}
    unidadeTraco="1 pagamento"
    rotulo="O ano em pagamentos"
    valor="14"
  />
);

const tracos = [...html.matchAll(/class="bt-tq /g)];
const fortes = [...html.matchAll(/bt-tq [^"]*bt-f/g)];

describe("BarraTracos — SSR e equivalente", () => {
  it("desenha exactamente os traços pedidos — 14 = 12 + 2", () => {
    expect(tracos).toHaveLength(14);
  });

  it("a unidade está escrita no cartão — «1 traço = 1 pagamento»", () => {
    expect(html).toContain("1 traço = 1 pagamento");
  });

  it("os tons semânticos chegam ao traço certo", () => {
    expect(html.match(/bt-tom-fica/g)).toHaveLength(2);
    expect(html.match(/bt-tom-neutro/g)).toHaveLength(12);
  });

  it("os traços fortes fecham os blocos de 4 e o fim da barra", () => {
    // 14 traços, blocos de 4 → fortes no 4.º, 8.º, 12.º e no último
    expect(fortes).toHaveLength(4);
  });

  it("o valor de leitura está no HTML final", () => {
    expect(html).toContain('class="bt-val"');
    expect(html).toContain(">14<");
  });

  it("tem exactamente um equivalente textual, sr-only, irmão da pista", () => {
    expect(html.match(/data-bt-equivalente/g)).toHaveLength(1);
    expect(html).toContain("14 traços");
    expect(html).toContain("12 salários mensais + 2 subsídios");
  });

  it("a pista de traços é decorativa", () => {
    expect(html).toMatch(/bt-pista" aria-hidden="true"/);
  });

  it("o SSR serve o estado final — sem classe de entrada armada", () => {
    expect(html).not.toContain("bt-on");
  });
});
