import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request } from "node:http";
import type { Server } from "node:http";
import { resolverNaRaiz, servirEstatico, HOST } from "./_estatico.mjs";

// um pedido cru (curl --path-as-is, socket) não passa pela normalização
// do browser: `/../` e `%2e%2e%2f` têm de morrer à porta do out/

let pai = "";
let out = "";
let srv: Server;

beforeAll(async () => {
  pai = mkdtempSync(join(tmpdir(), "estatico-"));
  out = join(pai, "out");
  mkdirSync(join(out, "aprender"), { recursive: true });
  writeFileSync(join(out, "index.html"), "home");
  writeFileSync(join(out, "estilo.html"), "estilo");
  writeFileSync(join(out, "404.html"), "nao-existe");
  writeFileSync(join(pai, "segredo.txt"), "SEGREDO");
  srv = await servirEstatico(out);
});
afterAll(() => srv?.close());

function pedir(caminho: string): Promise<{ status: number; corpo: string }> {
  const { port } = srv.address() as { port: number };
  return new Promise((ok, falha) => {
    request({ host: HOST, port, path: caminho }, (res) => {
      let corpo = "";
      res.on("data", (c) => (corpo += c));
      res.on("end", () => ok({ status: res.statusCode ?? 0, corpo }));
    })
      .on("error", falha)
      .end();
  });
}

describe("resolverNaRaiz", () => {
  it("fica dentro da raiz", () => {
    expect(resolverNaRaiz(out, "/estilo?x=1")).toBe(join(out, "estilo"));
    expect(resolverNaRaiz(out, "/")).toBe(out);
    // o parser de URL já desfaz `..` e `%2e%2e` como segmentos inteiros
    expect(resolverNaRaiz(out, "/../segredo.txt")).toBe(join(out, "segredo.txt"));
    expect(resolverNaRaiz(out, "/%2e%2e/segredo.txt")).toBe(join(out, "segredo.txt"));
  });
  it("recusa o que sai da raiz", () => {
    expect(resolverNaRaiz(out, "/%2e%2e%2fsegredo.txt")).toBeNull();
    expect(resolverNaRaiz(out, "/..%2f..%2fetc%2fpasswd")).toBeNull();
    expect(resolverNaRaiz(join(pai, "ou"), "/..%2fout/index.html")).toBeNull();
    expect(resolverNaRaiz(out, "/%E0%A4%A")).toBeNull();
    expect(resolverNaRaiz(out, "/a%00b")).toBeNull();
  });
});

describe("servirEstatico", () => {
  it("escuta só em 127.0.0.1", () => {
    expect((srv.address() as { address: string }).address).toBe("127.0.0.1");
  });
  it("serve a home, a rota sem .html e responde 404 ao resto", async () => {
    expect(await pedir("/")).toEqual({ status: 200, corpo: "home" });
    expect(await pedir("/estilo")).toEqual({ status: 200, corpo: "estilo" });
    expect(await pedir("/nada")).toEqual({ status: 404, corpo: "nao-existe" });
  });
  it("não deixa ler ficheiros fora da raiz", async () => {
    for (const p of ["/../segredo.txt", "/%2e%2e/segredo.txt", "/%2e%2e%2fsegredo.txt", "/aprender/..%2f..%2fsegredo.txt"]) {
      const r = await pedir(p);
      expect(r.status, p).toBe(404);
      expect(r.corpo, p).not.toContain("SEGREDO");
    }
  });
});
