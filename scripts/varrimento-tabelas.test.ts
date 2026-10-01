import { describe, it, expect } from "vitest";
import {
  varrer,
  numeroDe,
  numerosDeLinha,
  numerosDeTexto,
} from "./varrimento-tabelas";

/**
 * Item A da 2.ª auditoria — teste do varrimento número a número das tabelas
 * do ISV (arts. 7.º, 10.º, 11.º, 53.º e 54.º do CISV) e do IUC (arts. 9.º e
 * 10.º do CIUC) contra o texto literal do Diário da República consolidado
 * (fixtures em scripts/varrimento/fixtures/, extraídas em 2026-09-30/10-01;
 * coeficientes IUC via AT, que não renderizam no DR).
 *
 * É isto que o CI trava: qualquer alteração ao JSON fiscal que não bata
 * número a número com o DR (ou qualquer fixture desatualizada) parte aqui.
 */

describe("varrimento das tabelas ISV/IUC contra o DR consolidado", () => {
  const resultados = varrer();

  it("todas as linhas de todas as tabelas batem com o DR", () => {
    for (const r of resultados) {
      expect(r.dif, r.tabela).toEqual([]);
      expect(r.ok, r.tabela).toBe(r.total);
    }
  });

  // Se isto falhar, o varrimento perdeu uma tabela (ou o DR mudou de estrutura):
  // 11 do ISV + 5 do IUC. Ver docs/VARRIMENTO-TABELAS-ISV-IUC-2026.md.
  it("cobre as 16 tabelas do varrimento", () => {
    expect(resultados).toHaveLength(16);
  });

  // Contagem "de ouro" das linhas verificadas em 2026: se cair, houve perda de
  // cobertura (o matching contíguo pode continuar a bater sem uma linha do JSON).
  it("verifica 74 linhas no total", () => {
    const total = resultados.reduce((s, r) => s + r.total, 0);
    expect(total).toBe(74);
  });
});

describe("numeroDe", () => {
  it("lê milhares com espaço, espaço fino e ponto", () => {
    expect(numeroDe("1 234")).toBe(1234);
    expect(numeroDe("1\u00A0234")).toBe(1234); // nbsp que o DR usa
    expect(numeroDe("1.234")).toBe(1234);
    expect(numeroDe("12 345")).toBe(12345);
  });

  it("lê decimais com vírgula, incl. 3 casas (coeficientes da AT)", () => {
    expect(numeroDe("31,77")).toBeCloseTo(31.77);
    expect(numeroDe("245,14")).toBeCloseTo(245.14);
    expect(numeroDe("0,001")).toBeCloseTo(0.001);
  });

  it("rejeita o que não é número", () => {
    expect(numeroDe("abc")).toBeNull();
    expect(numeroDe("")).toBeNull();
  });
});

describe("numerosDeLinha", () => {
  it("separa por tab/newline e lê os números da linha", () => {
    expect(numerosDeLinha("Até 1250\t73,78\t55,84")).toEqual([1250, 73.78, 55.84]);
    expect(numerosDeLinha("Mais de 1 250\t245,14")).toEqual([1250, 245.14]);
    expect(numerosDeLinha("sem números")).toEqual([]);
  });
});

describe("numerosDeTexto", () => {
  it("remove os ordinais que o DR intercala e as linhas de alterações", () => {
    // Sem os filtros, «artigo 10.º», «(índice 2)», «n.º 123/2025» e «Ver
    // alterações» injectavam números falsos na sequência (ver relatório, §3).
    const texto = [
      "artigo 10.º do Código do ISV",
      "111-A · aditamento",
      "Alterado pelo Decreto-Lei n.º 123/2025 de 15 de setembro",
      "Até 1250\t73,78",
      "(índice 2)",
      "Ver alterações",
    ].join("\n");
    expect(numerosDeTexto(texto)).toEqual([111, 1250, 73.78]);
  });
});
