import { describe, it, expect } from "vitest";
import { marcadorCabe } from "./camara";

/* O critério de «cabe inteiro» que esconde, no telemóvel, os marcadores
   cortados nas pontas. A caixa é a mesma do enquadramento: placa de
   largura `w·k` centrada em `x`, e `64·k` de altura acima da âncora `y`. */
describe("marcadorCabe", () => {
  const L = 390;
  const A = 600;
  // vista 1:1 a começar na origem: unidades do mundo = px de ecrã
  const v = { x: 0, y: 0, w: L, h: A };

  it("um marcador no meio cabe", () => {
    expect(marcadorCabe({ x: 195, w: 100 }, 300, 1, v, L, A)).toBe(true);
  });

  it("meio marcador para fora de um lado não cabe", () => {
    expect(marcadorCabe({ x: 20, w: 100 }, 300, 1, v, L, A)).toBe(false);
    expect(marcadorCabe({ x: 370, w: 100 }, 300, 1, v, L, A)).toBe(false);
  });

  it("cortado pelo tecto ou pelo fundo não cabe", () => {
    expect(marcadorCabe({ x: 195, w: 100 }, 40, 1, v, L, A)).toBe(false);
    expect(marcadorCabe({ x: 195, w: 100 }, 610, 1, v, L, A)).toBe(false);
  });

  it("encostado à borda ainda cabe", () => {
    expect(marcadorCabe({ x: 50, w: 100 }, 64, 1, v, L, A)).toBe(true);
  });

  it("segue a escala da vista e o k do marcador", () => {
    // vista com o dobro da largura: tudo aparece a metade do tamanho
    const larga = { x: 0, y: 0, w: 2 * L, h: 2 * A };
    expect(marcadorCabe({ x: 700, w: 100 }, 300, 1, larga, L, A)).toBe(true);
    // com k = 1,7 a placa cresce e passa a sair pela direita
    expect(marcadorCabe({ x: 720, w: 100 }, 300, 1.7, larga, L, A)).toBe(false);
  });
});
