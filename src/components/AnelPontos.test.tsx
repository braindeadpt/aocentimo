import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnelPontos } from "./AnelPontos";

// S1-05 — o anel de pontos: o ciclo em pontos contáveis, o número ao
// centro em HTML, o «agora» marcado, um equivalente sr-only.

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const html = renderToStaticMarkup(
  <AnelPontos
    pontos={MESES.map((rotulo, i) => ({
      id: `m${i + 1}`,
      rotulo,
      rotuloCurto: rotulo.slice(0, 3),
      tom: i === 5 ? "fica" : "neutro",
      atual: i === 7,
    }))}
    centro={{ valor: "14 004 €", rotulo: "no ano" }}
  />
);

describe("AnelPontos — SSR e equivalente", () => {
  it("desenha um ponto por mês — 12 pontos no anel", () => {
    expect(html.match(/class="ap-dot ap-tom-/g)).toHaveLength(12);
  });

  it("o número do ciclo é HTML ao centro — nítido a qualquer escala", () => {
    expect(html).toContain('class="ap-num"');
    expect(html).toContain("14 004 €");
    expect(html).toContain("no ano");
  });

  it("o «agora» ganha o anel de marca e a classe ap-atual", () => {
    expect(html.match(/ap-ponto ap-atual/g)).toHaveLength(1);
    expect(html.match(/ap-anel-agora/g)).toHaveLength(1);
  });

  it("o tom semântico chega ao ponto — junho fica contigo", () => {
    expect(html.match(/ap-tom-fica/g)).toHaveLength(1);
  });

  it("os rótulos curtos rodeiam o anel (≤ 16 pontos)", () => {
    expect(html).toContain("jan");
    expect(html).toContain("dez");
  });

  it("o svg é decorativo e o equivalente é um e um só", () => {
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html.match(/data-ap-equivalente/g)).toHaveLength(1);
    expect(html).toContain("12 pontos em anel");
    expect(html).toContain("Agora: agosto.");
  });

  it("o SSR serve o estado final — sem classe de entrada armada", () => {
    expect(html).not.toContain("ap-on");
  });
});
