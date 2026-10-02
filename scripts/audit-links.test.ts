import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveHref, temAlvo, ehFicheiro } from "./audit-links.mjs";

// o defeito real do deploy do #39: «/#financas» resolvia à PASTA out/
// (existsSync de uma pasta é true) e o readFile rebentava com EISDIR;
// e mesmo resolvendo bem, os edifícios do bairro não têm id="" —
// têm data-id="" porque as âncoras abrem cenas por JavaScript.

let out = "";
beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), "audit-links-"));
  // a home traz o mapa: os edifícios são data-id, não id
  writeFileSync(
    join(out, "index.html"),
    '<html><body><div data-id="financas"></div><a id="topo"></a></body></html>'
  );
  writeFileSync(join(out, "pagina.html"), "<html><body></body></html>");
  mkdirSync(join(out, "pasta")); // pasta sem index — a armadilha
});

describe("resolveHref", () => {
  it("«/» resolve a index.html, nunca à pasta", () => {
    const { file } = resolveHref(out, join(out, "pagina.html"), "/#financas");
    expect(file).toBe(join(out, "index.html"));
    expect(statSync(file!).isFile()).toBe(true);
  });

  it("uma pasta sem index.html nunca é candidata", () => {
    const { file } = resolveHref(out, join(out, "pagina.html"), "/pasta");
    // devolve o caminho cru (pasta) para o chamador marcar como partido
    expect(ehFicheiro(file!)).toBe(false);
  });

  it("rotas normais continuam a resolver por index.html e .html", () => {
    mkdirSync(join(out, "rota"));
    writeFileSync(join(out, "rota", "index.html"), "<html></html>");
    expect(resolveHref(out, join(out, "pagina.html"), "/rota").file).toBe(
      join(out, "rota", "index.html")
    );
    expect(resolveHref(out, join(out, "pagina.html"), "/pagina").file).toBe(
      join(out, "pagina.html")
    );
    expect(resolveHref(out, join(out, "pagina.html"), "#aqui").file).toBeNull();
  });
});

describe("temAlvo", () => {
  const home = '<div data-id="financas"></div><a id="topo"></a>';

  it("aceita data-id — as âncoras de edifício do bairro", () => {
    const { file, hash } = resolveHref(out, join(out, "pagina.html"), "/#financas");
    expect(file).toBe(join(out, "index.html"));
    expect(temAlvo(home, hash!)).toBe(true);
  });

  it("aceita o id clássico", () => {
    expect(temAlvo(home, "topo")).toBe(true);
  });

  it("um hash inexistente continua a falhar", () => {
    const { file, hash } = resolveHref(out, join(out, "pagina.html"), "/#naoexiste");
    expect(file).toBe(join(out, "index.html"));
    expect(temAlvo(home, hash!)).toBe(false);
    // e na mesma página
    expect(temAlvo("<div></div>", "naoexiste")).toBe(false);
  });

  it("não faz match parcial (financas ≠ financas-extra)", () => {
    expect(temAlvo('<div data-id="financas-extra"></div>', "financas")).toBe(false);
  });
});
