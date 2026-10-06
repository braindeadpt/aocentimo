import { describe, it, expect, afterEach } from "vitest";
import {
  construirQuery,
  extrairWorkUri,
  lerEstadoAnterior,
  parseSparqlPortugal,
  runCcd2225,
  SPARQL_URL,
  validarRedirect,
  validarSparql,
} from "./ccd2225";
import { readFileSync, mkdtempSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

/**
 * Resposta real do endpoint SPARQL do Cellar (publications.europa.eu) à
 * consulta de Portugal, capturada a 2026-10-06: **zero medidas**. Zero
 * resultados é resposta — não transposto — e é o que a página NIM do EUR-Lex
 * também mostrava para Portugal (0 medidas).
 */
const FIXTURE_PRT = readFileSync(
  path.join(__dirname, "ccd2225.fixture-sparql.json"),
  "utf8"
);

/**
 * Caso sintético de Portugal transposto: emparelhado com a forma real das
 * linhas do Cellar (medida irlandesa capturada a 2026-10-06), duas medidas e
 * dois tipos de ato — para o parser ser testado a contar e a rotular.
 */
const FIXTURE_PT = readFileSync(
  path.join(__dirname, "ccd2225.fixture-sparql-pt.json"),
  "utf8"
);

/** Location real do recurso do CELEX (303 para o work no Cellar). */
const LOCATION =
  "http://publications.europa.eu/resource/cellar/12d92010-76c8-11ee-99ba-01aa75ed71a1/rdf/object/full";

describe("parseSparqlPortugal — a resposta real do Cellar", () => {
  it("Portugal sem medidas: 0 medidas, sem datas, sem ligações", () => {
    const r = parseSparqlPortugal(JSON.parse(FIXTURE_PRT));
    expect(r.medidas).toBe(0);
    expect(r.prazos).toEqual([]);
    expect(r.ligacoes).toEqual([]);
  });

  it("Portugal transposto (sintético com 2 medidas) é contado e rotulado", () => {
    const r = parseSparqlPortugal(JSON.parse(FIXTURE_PT));
    expect(r.medidas).toBe(2);
    expect(r.prazos).toEqual(["2026-11-10", "2026-11-12"]);
    expect(r.ligacoes).toHaveLength(2);
    expect(r.ligacoes[0].titulo).toContain("Decreto-Lei");
    expect(r.ligacoes[0].titulo).toContain("72023L2225PRT_202603456");
    expect(r.ligacoes[0].url).toContain("uri=CELEX:72023L2225PRT_202603456");
    expect(r.ligacoes[1].titulo).toContain("Portaria");
    expect(r.ligacoes[1].titulo).toContain("1234/2026");
  });

  it("deduplica por medida: duas linhas da mesma medida contam 1", () => {
    const base = JSON.parse(FIXTURE_PT) as {
      results: { bindings: Record<string, unknown>[] };
    };
    const dobrada = {
      results: { bindings: [base.results.bindings[0], { ...base.results.bindings[0] }] },
    };
    expect(parseSparqlPortugal(dobrada).medidas).toBe(1);
  });

  it("sem results.bindings falha alto — o sinal não se lê às cegas", () => {
    expect(() => parseSparqlPortugal({ erro: "nada" })).toThrow(/results\.bindings/);
  });
});

describe("validarSparql — resposta ilegível não passa por resposta", () => {
  it("aceita as duas respostas SPARQL (mesmo com zero medidas)", () => {
    expect(validarSparql(FIXTURE_PRT)).toBeNull();
    expect(validarSparql(FIXTURE_PT)).toBeNull();
  });

  it("recusa uma página de bloqueio em HTML", () => {
    const motivo = validarSparql("<html><body>Access denied</body></html>");
    expect(motivo).toBeTruthy();
    expect(motivo).not.toBeNull();
  });

  it("recusa JSON sem results.bindings (ex.: erro do endpoint)", () => {
    expect(validarSparql('{"message":"Bad request"}')).toMatch(/results\.bindings/);
  });
});

describe("URI do work no Cellar — resolvido a partir do CELEX", () => {
  it("extrai o work do Location real", () => {
    expect(extrairWorkUri(LOCATION)).toBe(
      "http://publications.europa.eu/resource/cellar/12d92010-76c8-11ee-99ba-01aa75ed71a1"
    );
  });

  it("um Location que não é do Cellar é recusado com motivo", () => {
    expect(validarRedirect("https://exemplo.pt/pagina")).toMatch(/não redirecionou/);
    expect(validarRedirect("")).toMatch(/não redirecionou/);
  });

  it("a consulta filtra por Portugal e pelo work resolvido", () => {
    const q = construirQuery(extrairWorkUri(LOCATION));
    expect(q).toContain("measure_national_implementing_implemented_by_country");
    expect(q).toContain("/country/PRT");
    expect(q).toContain("/cellar/12d92010-76c8-11ee-99ba-01aa75ed71a1");
    expect(q).toContain("GRAPH ?g");
  });
});

/** dataDir temporário com data/meta/ — o teste nunca toca no estado real. */
let tempDir: string | null = null;
afterEach(() => {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  tempDir = null;
});
function dataDir(): string {
  tempDir = mkdtempSync(path.join(tmpdir(), "ccd2225-"));
  mkdirSync(path.join(tempDir, "meta"), { recursive: true });
  return tempDir;
}

const depsBase = { lerRedirect: async () => LOCATION, esperaMs: 0 };

/** Corre o monitor e devolve o erro; lança se ele tiver corrido bem. */
function colherErro(promessa: Promise<unknown>): Promise<Error> {
  return promessa.then(
    () => {
      throw new Error("esperava uma falha, mas o monitor correu até ao fim");
    },
    (e: unknown) => e as Error
  );
}

describe("runCcd2225 — retenta erros de rede e falha honesto se persistirem", () => {
  it("retenta o erro HTTP (503) do SPARQL e só desiste à 4.ª leitura", async () => {
    let leituras = 0;
    const err = await colherErro(
      runCcd2225(dataDir(), {
        ...depsBase,
        lerSparql: async () => {
          leituras += 1;
          throw new Error("HTTP 503");
        },
      })
    );
    expect(leituras).toBe(4);
    expect(err.message).toMatch(/HTTP 503/);
    expect(err.message).toMatch(/NÃO interpretar como ausência de transposição/);
  });

  it("uma página de bloqueio (não-SPARQL) conta como falha, não como «0 medidas»", async () => {
    let leituras = 0;
    const err = await colherErro(
      runCcd2225(dataDir(), {
        ...depsBase,
        lerSparql: async () => {
          leituras += 1;
          return "<html>desafio do CDN</html>";
        },
      })
    );
    expect(leituras).toBe(4);
    expect(err.message).toContain("Cellar: a consulta SPARQL");
  });

  it("aceita a resposta boa à 4.ª leitura", async () => {
    let leituras = 0;
    const estado = await runCcd2225(dataDir(), {
      ...depsBase,
      lerSparql: async () => {
        leituras += 1;
        if (leituras < 4) throw new Error("HTTP 500");
        return FIXTURE_PT;
      },
    });
    expect(leituras).toBe(4);
    expect(estado.medidas).toBe(2);
    expect(estado.transposto).toBe(true);
  });

  it("zero medidas com resposta válida é resposta: grava o estado e não falha", async () => {
    const dir = dataDir();
    const estado = await runCcd2225(dir, { ...depsBase, lerSparql: async () => FIXTURE_PRT });
    expect(estado.medidas).toBe(0);
    expect(estado.transposto).toBe(false);
    expect(estado.fonteUrl).toBe(SPARQL_URL);
    expect(estado.nota).toContain("/cellar/12d92010-76c8-11ee-99ba-01aa75ed71a1");
    // O estado gravado é o mesmo ficheiro versionado de sempre.
    const gravado = lerEstadoAnterior(path.join(dir, "meta", "ccd2225-vigilia.json"));
    expect(gravado?.medidas).toBe(0);
    expect(gravado?.fonteUrl).toBe(SPARQL_URL);
  });

  it("se o CELEX não resolver para um work, falha honesto (não inventa 0 medidas)", async () => {
    let leituras = 0;
    const err = await colherErro(
      runCcd2225(dataDir(), {
        esperaMs: 0,
        lerRedirect: async () => {
          leituras += 1;
          return "https://exemplo.pt/sem-work";
        },
      })
    );
    expect(leituras).toBe(4);
    expect(err.message).toMatch(/não consegui o URI do work/);
  });
});
