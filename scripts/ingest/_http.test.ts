import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { ErroVigilancia, fetchJson, fetchTexto, lerComRetentativas } from "./_http";

/** Servidor fake por teste — porta efémera, comportamento por resposta. */
let server: Server | null = null;
afterEach(() => server?.close());

function servir(
  handler: (n: number) => { status: number; corpo?: unknown } | null
): Promise<string> {
  let n = 0;
  server = createServer((req, res) => {
    n += 1;
    const r = handler(n);
    if (r === null) return; // nunca responde — força timeout
    res.writeHead(r.status, { "content-type": "application/json" });
    res.end(JSON.stringify(r.corpo ?? {}));
  });
  return new Promise<string>((resolve) =>
    server!.listen(0, "127.0.0.1", () =>
      resolve(`http://127.0.0.1:${(server!.address() as AddressInfo).port}`)
    )
  );
}

const url = (h: Parameters<typeof servir>[0]) => servir(h);

/** Como o servir, mas com status/cabeçalhos/corpo à mão (HTML cru, WAF, etc.). */
function servirBruto(
  handler: (n: number) => { status: number; headers?: Record<string, string>; corpo?: string } | null
): Promise<string> {
  let n = 0;
  server = createServer((req, res) => {
    n += 1;
    const r = handler(n);
    if (r === null) return; // nunca responde — força timeout
    res.writeHead(r.status, r.headers ?? { "content-type": "text/html" });
    res.end(r.corpo ?? "");
  });
  return new Promise<string>((resolve) =>
    server!.listen(0, "127.0.0.1", () =>
      resolve(`http://127.0.0.1:${(server!.address() as AddressInfo).port}`)
    )
  );
}

describe("fetchJson", () => {
  it("sucesso à primeira devolve o JSON", async () => {
    const u = await url(() => ({ status: 200, corpo: { ok: 1 } }));
    expect(await fetchJson<{ ok: number }>(u)).toEqual({ ok: 1 });
  });

  it("sucesso à 2.ª após um 500", async () => {
    const u = await url((n) =>
      n === 1 ? { status: 500 } : { status: 200, corpo: { v: "sim" } }
    );
    expect(await fetchJson<{ v: string }>(u, { backoffMs: 1 })).toEqual({ v: "sim" });
  });

  it("retry após 500: esgota as tentativas e falha", async () => {
    let n = 0;
    const u = await url(() => {
      n += 1;
      return { status: 500 };
    });
    await expect(fetchJson(u, { tentativas: 3, backoffMs: 1 })).rejects.toThrow("HTTP 500");
    expect(n).toBe(3);
  });

  it("timeout: servidor que nunca responde falha por tempo", async () => {
    const u = await url(() => null);
    await expect(
      fetchJson(u, { timeoutMs: 60, tentativas: 1 })
    ).rejects.toThrow();
  });
});

describe("fetchTexto — o desafio do AWS WAF (caso do EUR-Lex)", () => {
  it("rejeita o 202 do WAF pelo cabeçalho x-amzn-waf-action", async () => {
    const u = await servirBruto(() => ({
      status: 202,
      headers: { "x-amzn-waf-action": "challenge", "x-cache": "Error from cloudfront" },
      corpo: "",
    }));
    await expect(fetchTexto(u, { tentativas: 1 })).rejects.toThrow(/desafio WAF/);
  });

  it("rejeita a página de desafio JS mesmo sem o cabeçalho", async () => {
    const u = await servirBruto(() => ({
      status: 200,
      corpo:
        '<script src="https://3e3378af7cd0.awswaf.com/x/challenge.js"></script>' +
        '<div id="challenge-container"></div>',
    }));
    await expect(fetchTexto(u, { tentativas: 1 })).rejects.toThrow(/desafio WAF/);
  });

  it("o desafio é retentável: à 2.ª tentativa aceita a resposta boa", async () => {
    const u = await servirBruto((n) =>
      n === 1
        ? { status: 202, headers: { "x-amzn-waf-action": "challenge" }, corpo: "" }
        : { status: 200, corpo: '<div id="PRT_numOfNims">0</div>' }
    );
    await expect(fetchTexto(u, { tentativas: 2, backoffMs: 1 })).resolves.toContain(
      "PRT_numOfNims"
    );
  });
});

/** Validador de brinquedo: só serve o corpo que contenha «OK». */
const validar = (corpo: string) => (corpo.includes("OK") ? null : "corpo sem «OK»");

describe("lerComRetentativas — a política comum dos monitores", () => {
  it("devolve logo o corpo quando a 1.ª leitura é válida", async () => {
    let leituras = 0;
    const corpo = await lerComRetentativas("https://exemplo.pt/x", validar, {
      esperaMs: 0,
      ler: async () => {
        leituras += 1;
        return "tudo OK";
      },
    });
    expect(corpo).toBe("tudo OK");
    expect(leituras).toBe(1);
  });

  it("retenta o erro HTTP — 503 à 1.ª, boa à 2.ª", async () => {
    let leituras = 0;
    const corpo = await lerComRetentativas("https://exemplo.pt/x", validar, {
      esperaMs: 0,
      ler: async () => {
        leituras += 1;
        if (leituras === 1) throw new Error("HTTP 503");
        return "OK";
      },
    });
    expect(corpo).toBe("OK");
    expect(leituras).toBe(2);
  });

  it("retenta o corpo recusado pela validação — desafio do WAF à 1.ª, boa à 2.ª", async () => {
    let leituras = 0;
    const corpo = await lerComRetentativas("https://exemplo.pt/x", validar, {
      esperaMs: 0,
      ler: async () => {
        leituras += 1;
        return leituras === 1 ? "<html>challenge-container</html>" : "OK";
      },
    });
    expect(corpo).toBe("OK");
    expect(leituras).toBe(2);
  });

  it("esgotadas as leituras, lança ErroVigilancia com o motivo da última falha", async () => {
    let leituras = 0;
    const erro = await lerComRetentativas("https://exemplo.pt/x", validar, {
      leituras: 3,
      esperaMs: 0,
      rotulo: "Monitor X",
      ler: async () => {
        leituras += 1;
        return "sem marca nenhuma";
      },
    }).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroVigilancia);
    expect((erro as ErroVigilancia).motivo).toBe("corpo sem «OK»");
    expect((erro as ErroVigilancia).leituras).toBe(3);
    expect((erro as Error).message).toContain("Monitor X");
    expect(leituras).toBe(3);
  });

  it("com leituras: 1 só tenta uma vez", async () => {
    let leituras = 0;
    await expect(
      lerComRetentativas("https://exemplo.pt/x", validar, {
        leituras: 1,
        esperaMs: 0,
        ler: async () => {
          leituras += 1;
          throw new Error("HTTP 500");
        },
      })
    ).rejects.toThrow(/HTTP 500/);
    expect(leituras).toBe(1);
  });

  it("sem `ler` injetado usa o fetchTexto e rejeita o desafio do WAF mesmo em 202", async () => {
    const u = await servirBruto((n) =>
      n === 1
        ? { status: 202, headers: { "x-amzn-waf-action": "challenge" }, corpo: "" }
        : { status: 200, corpo: "lista OK" }
    );
    await expect(
      lerComRetentativas(u, validar, { esperaMs: 0, rotulo: "servidor de teste" })
    ).resolves.toBe("lista OK");
  });
});
