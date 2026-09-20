import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { fetchJson } from "./_http";

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
