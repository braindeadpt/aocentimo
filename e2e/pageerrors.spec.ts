import { test, expect } from "@playwright/test";
import { rotasDoSite } from "./rotas";

/**
 * Guarda de hidratação — percorre TODAS as rotas exportadas e falha se
 * alguma disparar `pageerror` ou um erro de consola de hidratação
 * (HTML inválido, mismatch SSR↔cliente). Nasceu do defeito React #418
 * em /irs (<p> dentro de <p> via NumHero na nota de liquidação): este
 * teste teria apanhado.
 *
 * No build de produção os erros de hidratação do React chegam como
 * console.error ("Minified React error #418/#423/…" ou "didn't match
 * the client"), não como pageerror — daí os dois canais.
 */
const PADRAO_HIDRATACAO =
  /hydrat|didn't match|cannot be a descendant|cannot contain a nested|Minified React error #41[89]|Minified React error #42[0-9]/i;

test("nenhuma rota dispara pageerror nem erro de hidratação", async ({
  page,
}) => {
  test.setTimeout(180_000);
  for (const path of rotasDoSite()) {
    const erros: string[] = [];
    const onErr = (e: Error) => erros.push(`pageerror: ${e.message}`);
    const onConsole = (m: import("@playwright/test").ConsoleMessage) => {
      if (m.type() === "error" && PADRAO_HIDRATACAO.test(m.text()))
        erros.push(`console.error: ${m.text().slice(0, 300)}`);
    };
    page.on("pageerror", onErr);
    page.on("console", onConsole);
    await page.goto(path, { waitUntil: "domcontentloaded" });
    // a hidratação e os primeiros effects precisam de uma janela para disparar
    await page.waitForTimeout(500);
    page.off("pageerror", onErr);
    page.off("console", onConsole);
    expect(erros, `${path} disparou erros de página/hidratação`).toEqual([]);
  }
});
