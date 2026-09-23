import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OrbeEstado } from "./OrbeEstado";

// S1-08 — o orbe de estado: a FORMA diz o estado. em-dia = disco
// cheio (19 pontos); no-limite = cheio + anel oco; atrasada =
// esburacado (sem centro); sem-sla = só o anel oco; a-recolher = anel
// em rotação. O svg é aria-hidden — o estado vive sempre em texto ao
// lado.

const nCirculos = (html: string) => (html.match(/<circle/g) ?? []).length;
const nOcos = (html: string) => (html.match(/fill="none"/g) ?? []).length;

describe("OrbeEstado — a forma diz o estado", () => {
  it("em-dia: disco completo de pontos, nada oco", () => {
    const html = renderToStaticMarkup(<OrbeEstado estado="em-dia" />);
    expect(nCirculos(html)).toBe(19);
    expect(nOcos(html)).toBe(0);
    expect(html).toContain("orbe-estado orbe-em-dia");
  });

  it("no-limite: cheio por dentro, anel oco na borda", () => {
    const html = renderToStaticMarkup(<OrbeEstado estado="no-limite" />);
    expect(nCirculos(html)).toBe(19);
    expect(nOcos(html)).toBe(12);
  });

  it("atrasada: esburacado — falta o centro ao disco", () => {
    const html = renderToStaticMarkup(<OrbeEstado estado="atrasada" />);
    expect(nCirculos(html)).toBe(18);
    expect(html).not.toContain('cx="12" cy="12"');
  });

  it("sem-sla: só o anel oco — não há como dizer", () => {
    const html = renderToStaticMarkup(<OrbeEstado estado="sem-sla" />);
    expect(nCirculos(html)).toBe(12);
    expect(nOcos(html)).toBe(12);
  });

  it("a-recolher: anel em rotação com ponto-líder", () => {
    const html = renderToStaticMarkup(<OrbeEstado estado="a-recolher" />);
    expect(html).toContain("orbe-roda");
    expect(nCirculos(html)).toBe(8);
  });

  it("decorativo: aria-hidden e sem foco — o texto ao lado é o canal", () => {
    const html = renderToStaticMarkup(<OrbeEstado estado="em-dia" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
  });
});
