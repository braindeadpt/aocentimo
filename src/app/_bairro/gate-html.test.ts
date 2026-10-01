/**
 * O gate do HTML da home, como TESTE (falha no `vitest run` do CI).
 *
 * O §4 do pack impõe 80 KB gzip ao HTML da home. Antes do conserto do
 * flight o mapa viajava DUAS vezes — no DOM e outra vez dentro do
 * payload RSC (o prop `html` do `<Bairro>`) — e o ficheiro pesava
 * ~128 KB gzip. O conserto fez o cliente calcular o mapa
 * (`mundoBairro(montarMapa(marcadores))`) e o peso caiu para ~63 KB.
 *
 * Precisa de `out/index.html` (o build estático). No CI corre depois do
 * `npm run build` (ver ci.yml); localmente, só corre se o build existir
 * — sem ele o teste salta com uma nota, para não bloquear quem só quer
 * os unitários.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { describe, it, expect } from "vitest";

const OUT = "out/index.html";
const LIMITE = 80 * 1024;

describe("o gate do HTML da home (§4 do pack)", () => {
  const existe = existsSync(OUT) && statSync(OUT).mtimeMs > 0;
  it.skipIf(!existe)("o HTML da home pesa ≤ 80 KB gzip", () => {
    const html = readFileSync(OUT, "utf8");
    const gz = gzipSync(Buffer.from(html, "utf8")).length;
    expect(
      gz,
      `a home pesa ${(gz / 1024).toFixed(1)} KB gzip (limite ${(LIMITE / 1024).toFixed(0)} KB) — o mapa voltou a viajar duas vezes?`
    ).toBeLessThanOrEqual(LIMITE);
  });

  it.skipIf(!existe)("o payload RSC não contém o SVG do mapa", () => {
    const html = readFileSync(OUT, "utf8");
    const rscs: string[] = [];
    const re = /<script>self\.__next_f\.push\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const ini = html.lastIndexOf("<script", m.index);
      const fim = html.indexOf("</script>", m.index) + "</script>".length;
      rscs.push(html.slice(ini, fim));
    }
    const flight = rscs.join("\n");
    expect(
      flight.includes("b-camada"),
      "o payload RSC contém o SVG do mapa (b-camada em self.__next_f) — alguém voltou a passar o html do mapa por prop"
    ).toBe(false);
    // e o mapa renderizado segue no DOM (first paint sem JS)
    expect(html.includes("b-camada"), "o mapa desapareceu do HTML renderizado").toBe(true);
  });

  it.skipIf(!existe)("o mapa tem os 13 marcadores e os 11 edifícios no HTML estático", () => {
    const html = readFileSync(OUT, "utf8");
    expect([...html.matchAll(/<g class="pin"/g)]).toHaveLength(13);
    expect([...html.matchAll(/class="ed"/g)]).toHaveLength(11);
  });
});
