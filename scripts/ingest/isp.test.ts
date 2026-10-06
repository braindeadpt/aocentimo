import { describe, it, expect, vi } from "vitest";
import {
  compararPortarias,
  extrairPortariaIspJson,
  idadeDiasVigencia,
  LIMIAR_IDADE_DIAS,
  novasDesde,
  parseRssPortarias,
  precisaAlarmeIdade,
  runIsp,
  validarFeed,
} from "./isp";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

/**
 * O feed real do Google Notícias (baixado a 2026-10-02, 100 itens do DR com
 * a 437-B/2026/1 de 25 set e a 432-A/2026/1) é a fixture: o parser tem de
 * ler títulos verdadeiros «Portaria n.º … — Diário da República», não um
 * RSS imaginado.
 */
const FIXTURE = readFileSync(path.join(__dirname, "isp.fixture.xml"), "utf8");
const ISP_JSON = readFileSync(
  path.join(__dirname, "..", "..", "data", "fiscal", "isp.json"),
  "utf8"
);

describe("parseRssPortarias — o feed real restrito ao DR", () => {
  it("extrai a 437-B/2026/1 com a data do título (25 de setembro)", () => {
    const { portarias } = parseRssPortarias(FIXTURE);
    const b = portarias.find((p) => p.numero === "437-B/2026/1");
    expect(b).toBeDefined();
    expect(b!.data).toBe("2026-09-25");
    expect(b!.link).toContain("news.google.com");
  });

  it("apanha a 432-A mesmo sem data no título (recurso ao pubDate)", () => {
    const { portarias } = parseRssPortarias(FIXTURE);
    const a = portarias.find((p) => p.numero === "432-A/2026/1");
    expect(a).toBeDefined();
    expect(a!.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("não inventa portarias: todas têm número, data ISO e link", () => {
    const { portarias } = parseRssPortarias(FIXTURE);
    expect(portarias.length).toBeGreaterThan(0);
    for (const p of portarias) {
      expect(p.numero).toMatch(/^\d{1,4}(?:-[A-Z])?\/\d{4}(?:\/\d+)?$/);
      expect(p.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.link.length).toBeGreaterThan(0);
    }
  });

  it("itens do DR sem número vão para aConferir, sem alarme", () => {
    const { aConferir } = parseRssPortarias(FIXTURE);
    expect(aConferir.length).toBeGreaterThan(0);
    expect(aConferir[0].titulo.length).toBeGreaterThan(0);
  });

  it("feed vazio ou sem DR falha alto — o sinal não se lê às cegas", () => {
    expect(() => parseRssPortarias("<rss></rss>")).toThrow(/sem itens/);
    expect(() =>
      parseRssPortarias(
        `<rss><channel><item><title>x</title><link>https://exemplo.pt/y</link><source url="https://exemplo.pt">Exemplo</source></item></channel></rss>`
      )
    ).toThrow(/nenhum item do DR/);
  });
});

describe("validarFeed — feed ilegível conta como falha, não como «nada de novo»", () => {
  it("aceita o feed real", () => {
    expect(validarFeed(FIXTURE)).toBeNull();
  });

  it("recusa uma página de bloqueio em vez de RSS (sem itens)", () => {
    expect(validarFeed("<html><body>Access denied</body></html>")).toMatch(/sem itens/);
  });

  it("recusa um feed sem nenhum item do DR", () => {
    const semDr =
      '<?xml version="1.0"?><rss><channel><item><title>Outra coisa</title>' +
      '<link>https://exemplo.pt/x</link></item></channel></rss>';
    expect(validarFeed(semDr)).toMatch(/nenhum item do DR/);
  });
});

describe("compararPortarias — a ordem da numeração do DR", () => {
  it("437-B > 432-A > 372-A (a sequência real do outono)", () => {
    expect(compararPortarias("437-B/2026/1", "432-A/2026/1")).toBeGreaterThan(0);
    expect(compararPortarias("432-A/2026/1", "372-A/2026/1")).toBeGreaterThan(0);
    expect(compararPortarias("372-A/2026/1", "437-B/2026/1")).toBeLessThan(0);
  });

  it("a letra desempata o dia (437-A < 437-B) e o ano manda primeiro", () => {
    expect(compararPortarias("437-A/2026/1", "437-B/2026/1")).toBeLessThan(0);
    expect(compararPortarias("427-A/2025/1", "107-G/2026/1")).toBeLessThan(0);
    expect(compararPortarias("437-B/2026/1", "437-B/2026/1")).toBe(0);
  });

  it("formato inesperado falha alto", () => {
    expect(() => compararPortarias("portaria x", "437-B/2026/1")).toThrow(/inesperado/);
  });
});

describe("novasDesde — o despertador", () => {
  it("as novas são sempre posteriores à citada no isp.json — seja ela qual for hoje", () => {
    // Lição do #31 e do DGEG no #36, aprendida aqui à força: a PR #43
    // atualizou o isp.json para a 437-B com o teste ainda a fixar a 372-A.
    // A base lê-se dos dados, nunca se fixa no teste.
    const base = extrairPortariaIspJson(ISP_JSON);
    expect(base).not.toBeNull();
    const { portarias } = parseRssPortarias(FIXTURE);
    for (const n of novasDesde(portarias, base)) {
      expect(compararPortarias(n.numero, base!)).toBeGreaterThan(0);
    }
  });

  it("caso histórico fixo: contra a 372-A, a fixture traz a 432-A e a 437-B", () => {
    const { portarias } = parseRssPortarias(FIXTURE);
    const novas = novasDesde(portarias, "372-A/2026/1").map((n) => n.numero);
    expect(novas).toContain("432-A/2026/1");
    expect(novas).toContain("437-B/2026/1");
    expect(novas).not.toContain("372-A/2026/1");
  });

  it("sem base (isp.json sem portaria) nada é novo sem referência humana", () => {
    const { portarias } = parseRssPortarias(FIXTURE);
    expect(novasDesde(portarias, null)).toEqual([]);
  });

  it("o mesmo número duas vezes (detalhe + análise jurídica) conta uma só, com a data de publicação", () => {
    const { portarias } = parseRssPortarias(FIXTURE);
    const vezes437 = portarias.filter((p) => p.numero === "437-B/2026/1");
    expect(vezes437.length).toBeGreaterThan(1);
    const novas = novasDesde(portarias, "372-A/2026/1");
    expect(novas.filter((n) => n.numero === "437-B/2026/1")).toHaveLength(1);
    expect(novas.find((n) => n.numero === "437-B/2026/1")!.data).toBe("2026-09-25");
  });

  it("uma 449-C sintética de outubro é detetada acima da 437-B", () => {
    const { portarias } = parseRssPortarias(FIXTURE);
    const comFutura = [
      ...portarias,
      {
        numero: "449-C/2026/1",
        data: "2026-10-03",
        titulo: "Portaria n.º 449-C/2026/1, de 3 de outubro - Diário da República",
        link: "https://news.google.com/rss/articles/futura",
      },
    ];
    const novas = novasDesde(comFutura, "437-B/2026/1").map((n) => n.numero);
    expect(novas).toEqual(["449-C/2026/1"]);
  });
});

describe("idadeDiasVigencia + precisaAlarmeIdade — a segunda protecção", () => {
  it("conta dias completos de calendário", () => {
    expect(idadeDiasVigencia("2026-09-28", "2026-10-07")).toBe(9);
    expect(idadeDiasVigencia("2026-10-07", "2026-10-07")).toBe(0);
  });

  it("o limiar é 8: com 8 dias cala, com 9 fala; vigência inválida nunca alarma", () => {
    expect(LIMIAR_IDADE_DIAS).toBe(8);
    expect(precisaAlarmeIdade(8)).toBe(false);
    expect(precisaAlarmeIdade(9)).toBe(true);
    expect(precisaAlarmeIdade(Number.NaN)).toBe(false);
  });
});

describe("runIsp com idade — o despertador que não depende do feed", () => {
  // A base é sempre a 437-B (a mais recente da fixture real): o feed
  // quieto é a própria fixture, sem nada inventado.
  const ITEM_449_C =
    `<item><title>Portaria n.º 449-C/2026/1, de 2 de outubro - Diário da República</title>` +
    `<link>https://news.google.com/rss/articles/teste-449-C</link>` +
    `<pubDate>Fri, 02 Oct 2026 18:00:00 GMT</pubDate>` +
    `<source url="https://diariodarepublica.pt">Diário da República</source></item>`;
  const RSS_COM_NOVA = FIXTURE.replace("</channel>", `${ITEM_449_C}</channel>`);

  function hojeMenos(dias: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - dias);
    return d.toISOString().slice(0, 10);
  }

  function dirComIsp(vigencia: string): string {
    const dir = mkdtempSync(path.join(tmpdir(), "isp-idade-"));
    mkdirSync(path.join(dir, "meta"), { recursive: true });
    mkdirSync(path.join(dir, "fiscal"), { recursive: true });
    writeFileSync(
      path.join(dir, "fiscal", "isp.json"),
      JSON.stringify({ vigencia, fonte: "Portaria n.º 437-B/2026/1, de 25 de setembro" })
    );
    return dir;
  }

  it("vigência de 3 dias + feed quieto → sem alarme", async () => {
    const estado = await runIsp(dirComIsp(hojeMenos(3)), {
      lerFeed: async () => FIXTURE,
    });
    expect(estado.novas).toEqual([]);
    expect(estado.alarmeIdade).toBe(false);
    expect(estado.alarme).toBe(false);
    expect(estado.motivo).toBe("nenhum");
  });

  it("vigência de 9 dias + feed quieto → alarme de idade", async () => {
    const estado = await runIsp(dirComIsp(hojeMenos(9)), {
      lerFeed: async () => FIXTURE,
    });
    expect(estado.idadeDias).toBe(9);
    expect(estado.alarmeIdade).toBe(true);
    expect(estado.alarme).toBe(true);
    expect(estado.motivo).toBe("idade");
  });

  it("9 dias + portaria nova no feed → um só alarme (motivo ambos, uma linha)", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const estado = await runIsp(dirComIsp(hojeMenos(9)), {
        lerFeed: async () => RSS_COM_NOVA,
      });
      expect(estado.novas.map((n) => n.numero)).toEqual(["449-C/2026/1"]);
      expect(estado.alarme).toBe(true);
      expect(estado.motivo).toBe("ambos");
      const alarmes = erro.mock.calls.filter((c) => String(c[0]).includes("⚠ ISP:"));
      expect(alarmes).toHaveLength(1);
    } finally {
      erro.mockRestore();
    }
  });

  it("feed em falha + vigência velha → alarme de idade mesmo assim", async () => {
    const estado = await runIsp(dirComIsp(hojeMenos(9)), {
      lerFeed: async () => {
        throw new Error("HTTP 429");
      },
    });
    expect(estado.novas).toEqual([]);
    expect(estado.alarme).toBe(true);
    expect(estado.motivo).toBe("idade");
    expect(estado.falhaFeed).toMatch(/429/);
  });

  it("feed em falha + vigência recente → falha honesta (lança, sem alarme)", async () => {
    await expect(
      runIsp(dirComIsp(hojeMenos(3)), {
        lerFeed: async () => {
          throw new Error("HTTP 429");
        },
      })
    ).rejects.toThrow(/429/);
  });
});
