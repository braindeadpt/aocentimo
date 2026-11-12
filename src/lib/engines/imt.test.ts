import { describe, expect, it } from "vitest";
import { custoCompra, imt, imtJovem } from "./imt";

describe("imt — tabelas gerais, IMT Jovem e compra a dois (umDeDois)", () => {
  it("calcula IMT geral HPP e IMT Jovem a 100 % para 250 000 €", () => {
    // 250 000 € está no 4.º escalão HPP: 250000 * 0.07 - 10457.96 = 7042.04 €
    expect(imt(250000, "hpp")).toBeCloseTo(7042.04, 2);
    // IMT Jovem isento até 330 539 €
    expect(imtJovem(250000)).toBe(0);

    const geral = custoCompra(250000, {
      tipo: "hpp",
      compradoresJovens: "nenhum",
      montanteCredito: 200000,
    });
    expect(geral.imt).toBeCloseTo(7042.04, 2);
    expect(geral.isAquisicao).toBeCloseTo(2000, 2); // 0.8 % de 250 000 €
    expect(geral.isCredito).toBeCloseTo(1200, 2); // 0.6 % de 200 000 €
    expect(geral.registos).toBe(700);

    const jovemTotal = custoCompra(250000, {
      tipo: "hpp",
      compradoresJovens: "todos",
      montanteCredito: 200000,
    });
    expect(jovemTotal.imt).toBe(0);
    expect(jovemTotal.isAquisicao).toBe(0);
    // IS do crédito e registos mantêm-se
    expect(jovemTotal.isCredito).toBeCloseTo(1200, 2);
    expect(jovemTotal.registos).toBe(700);
  });

  it("mantém retrocompatibilidade com jovem: true quando compradoresJovens omitido", () => {
    const legado = custoCompra(300000, { tipo: "hpp", jovem: true });
    const novo = custoCompra(300000, {
      tipo: "hpp",
      compradoresJovens: "todos",
    });
    expect(legado).toEqual(novo);
    expect(legado.imt).toBe(0);
    expect(legado.isAquisicao).toBe(0);
  });

  it("calcula compra a dois (umDeDois = 50 % Jovem + 50 % geral HPP) abaixo do limiar de isenção (250 000 €)", () => {
    // 250 000 €: quota jovem (50 %) paga 0 € IMT e 0 € IS; quota geral (50 %) paga metade de 7 042,04 € IMT e metade de 2 000 € IS
    const mista = custoCompra(250000, {
      tipo: "hpp",
      compradoresJovens: "umDeDois",
      montanteCredito: 200000,
    });
    expect(mista.imt).toBeCloseTo(3521.02, 2);
    expect(mista.isAquisicao).toBeCloseTo(1000, 2);
    expect(mista.isCredito).toBeCloseTo(1200, 2);
    expect(mista.registos).toBe(700);
    expect(mista.totalCustos).toBeCloseTo(3521.02 + 1000 + 1200 + 700, 2);
  });

  it("calcula compra a dois (umDeDois) na faixa marginal do IMT Jovem (400 000 €)", () => {
    // A 400 000 € (entre 330 539 € e 660 982 €):
    // IMT Jovem (100 %) = 400000 * 0.08 - 26443.12 = 5556.88 €
    // IMT Geral HPP (100 %) = 400000 * 0.08 - 13763.35 = 18236.65 €
    // IS Jovem (100 %) = (400000 - 330539) * 0.008 = 555.688 €
    // IS Geral (100 %) = 400000 * 0.008 = 3200 €
    const mista = custoCompra(400000, {
      tipo: "hpp",
      compradoresJovens: "umDeDois",
    });
    expect(mista.imt).toBeCloseTo(0.5 * 5556.88 + 0.5 * 18236.65, 2);
    expect(mista.isAquisicao).toBeCloseTo(0.5 * 555.688 + 0.5 * 3200, 2);
  });

  it("ignora compradoresJovens em habitação secundária", () => {
    const sec = custoCompra(250000, {
      tipo: "secundaria",
      compradoresJovens: "todos",
    });
    expect(sec.imt).toBeCloseTo(imt(250000, "secundaria"), 2);
    expect(sec.isAquisicao).toBeCloseTo(250000 * 0.008, 2);
  });
});
