import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  dataDeTitulo,
  decodificarBlocos,
  documentosDeHtml,
  avaliamNovos,
  FONTES,
  type Documento,
} from "./imi-porto-2027";

/**
 * Testes do detetor da vigilância IMI Familiar do Porto 2027
 * (docs/VIGILANCIA-IMI-PORTO-2027.md). A fixture é uma captura real de
 * https://www.cm-porto.pt/deliberacoes-minutas feita com curl a 2026-10-01,
 * aparada ao bloco <script> que transporta a lista (optionsJson) — é a
 * estrutura que o parser tem de saber ler; se o site mudar, estes testes
 * partem e o detetor falha alto, nunca «nada de novo».
 */

const FIXTURE = path.join(__dirname, "imi-porto-2027.fixture-minutas.html");

describe("FONTES", () => {
  it("vê as três páginas de deliberações da CM Porto (verificadas a 2026-10-01)", () => {
    expect(FONTES.map((f) => f.url)).toEqual([
      "https://www.cm-porto.pt/deliberacoes-minutas",
      "https://www.cm-porto.pt/deliberacoes-propostas",
      "https://www.cm-porto.pt/deliberacoes-recomendacoes",
    ]);
  });
});

describe("decodificarBlocos", () => {
  it("descodifica o optionsJson da captura real", () => {
    const blocos = decodificarBlocos(readFileSync(FIXTURE, "utf8"));
    expect(blocos.length).toBeGreaterThanOrEqual(1);
    expect(blocos.some((b) => b.includes("Minuta"))).toBe(true);
  });

  it("ignora string literals curtas e sem codificação", () => {
    expect(decodificarBlocos('<script>let x = "olá mundo";</script>')).toEqual([]);
  });
});

describe("documentosDeHtml", () => {
  const docs = documentosDeHtml(readFileSync(FIXTURE, "utf8"));

  it("lê as minutas da captura real (centenas, 2018→2026)", () => {
    expect(docs.length).toBeGreaterThan(200);
  });

  it("acha a 23.ª reunião (14-09-2026) com URL e data certos", () => {
    const d = docs.find((x) => x.url.includes("20260914_MinutaAta23"));
    expect(d).toBeDefined();
    expect(d!.data).toBe("2026-09-14");
    expect(d!.titulo).toContain("23.ª Reunião");
    expect(d!.url).toMatch(/^https:\/\/www\.cm-porto\.pt\/files\/uploads\//);
  });

  it("acha a minuta da sessão de 19-12-2025 (a que fixou a taxa de 0,324 %)", () => {
    const d = docs.find((x) => x.url.includes("20251219_MinutaAta3"));
    expect(d).toBeDefined();
    expect(d!.data).toBe("2025-12-19");
  });

  it("deduplica por URL", () => {
    const urls = new Set(docs.map((d) => d.url));
    expect(urls.size).toBe(docs.length);
  });
});

describe("dataDeTitulo", () => {
  it("lê «dia 14 de setembro de 2026» e variantes", () => {
    expect(dataDeTitulo("Minuta da Ata realizada no dia 14 de setembro de 2026.")).toBe(
      "2026-09-14"
    );
    expect(dataDeTitulo("realizada no 28 de novembro de 2024")).toBe("2024-11-28");
    expect(dataDeTitulo("Sessão de 09 de dezembro de 2025")).toBe("2025-12-09");
  });

  it("devolve null quando não há data (nunca inventar)", () => {
    expect(dataDeTitulo("Deliberação sobre cedência de imóvel")).toBeNull();
    expect(dataDeTitulo("")).toBeNull();
    // datas em formato curto (19.12.2025) não são lidas — ficam null
    expect(dataDeTitulo("sessão iniciada em 19.12.2025")).toBeNull();
  });
});

describe("avaliamNovos", () => {
  const conhecido: Documento = {
    titulo: "Minuta da Ata, 23.ª Reunião, Sessão Extraordinária de 14 de setembro de 2026.",
    url: "https://www.cm-porto.pt/files/uploads/cms/20260914_MinutaAta23.pdf",
    data: "2026-09-14",
  };
  const novaMinuta: Documento = {
    titulo:
      "Minuta da Ata, 30.ª reunião, Sessão Ordinária da Assembleia Municipal do Porto realizada no dia 21 de dezembro de 2026.",
    url: "https://www.cm-porto.pt/files/uploads/cms/20261221_MinutaAta30.pdf",
    data: "2026-12-21",
  };
  const propostaImi: Documento = {
    titulo:
      "Deliberação sobre a fixação das taxas do IMI e a redução para agregados familiares com dependentes (IMI Familiar) para 2027.",
    url: "https://www.cm-porto.pt/files/uploads/cms/20261210_Ponto3_IMI2027.pdf",
    data: "2026-12-10",
  };

  it("marca como novos só os documentos que não estavam vistos", () => {
    const { novos } = avaliamNovos([conhecido], [conhecido, novaMinuta, propostaImi]);
    expect(novos.map((d) => d.url)).toEqual([novaMinuta.url, propostaImi.url]);
  });

  it("destaca os que mencionam IMI/taxas no título — triagem primeiro", () => {
    const { novos, destacados } = avaliamNovos([conhecido], [conhecido, novaMinuta, propostaImi]);
    expect(destacados.map((d) => d.url)).toEqual([propostaImi.url]);
    expect(novos.length).toBe(2);
  });

  it("sem anteriores, tudo é novo (primeira corrida / estado semente em falta)", () => {
    const { novos } = avaliamNovos([], [conhecido]);
    expect(novos).toHaveLength(1);
  });

  it("nada de novo quando a lista é a mesma — base normal", () => {
    const r = avaliamNovos([conhecido, novaMinuta], [conhecido, novaMinuta]);
    expect(r.novos).toEqual([]);
    expect(r.destacados).toEqual([]);
  });
});
