import { test, expect } from "@playwright/test";

/**
 * A gente do bairro (P1-gente).
 *
 * O mapa publicado tinha 3 pessoas (a fila da Segurança Social); o
 * protótipo tem 14 `.pessoa` no mapa — as 8 do elenco, a fila, o
 * pescador e os dois miúdos da ponte — e testes que só lêem texto
 * deixaram passar um bairro vazio. Estes medem o DOM e a geometria.
 *
 * O contrato com a sessão das cartas: cada personagem do elenco fica
 * num `<g class="pessoa" data-pessoa="…">` exactamente uma vez.
 */

test.describe("a gente do bairro", () => {
  test("as oito do elenco estão no mapa, uma vez cada, com caixa real", async ({
    page,
  }) => {
    await page.goto("/");

    const elenco = page.locator(".b-mundo .pessoa[data-pessoa]");
    await expect(elenco).toHaveCount(8);

    const chaves = await elenco.evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-pessoa"))
    );
    expect([...chaves].sort()).toEqual(
      ["arminda", "diana", "goncalo", "ines", "manuel", "marta", "pedro", "rui"].sort()
    );

    // geometria, não texto: cada uma tem de ocupar pixéis de verdade
    const caixas = await page.$$eval(".b-mundo .pessoa[data-pessoa]", (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { k: e.getAttribute("data-pessoa"), w: r.width, h: r.height };
      })
    );
    for (const c of caixas) {
      expect(c.w, `${c.k} sem largura`).toBeGreaterThan(0);
      expect(c.h, `${c.k} sem altura`).toBeGreaterThan(0);
    }
  });

  test("«Ver o bairro todo» deixa a Dona Arminda e o Pedro dentro da janela", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Ver o bairro todo" }).click();
    await page.waitForTimeout(1200); // a câmara vai suave (power2.inOut, ~1 s)

    const res = await page.evaluate(() => {
      const janela = document.querySelector(".b-janela")!.getBoundingClientRect();
      const dentroDe = (sel: string) => {
        const el = document.querySelector<SVGGElement>(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          r: { t: r.top, b: r.bottom, l: r.left, rr: r.right },
          dentro:
            r.top >= janela.top && r.bottom <= janela.bottom &&
            r.left >= janela.left && r.right <= janela.right,
        };
      };
      return {
        arminda: dentroDe('.pessoa[data-pessoa="arminda"]'),
        pedro: dentroDe('.pessoa[data-pessoa="pedro"]'),
      };
    });

    expect(res.arminda?.dentro, `Arminda fora da janela: ${JSON.stringify(res.arminda)}`).toBe(true);
    expect(res.pedro?.dentro, `Pedro fora da janela: ${JSON.stringify(res.pedro)}`).toBe(true);
  });

  test("de noite os miúdos não são visíveis", async ({ page }) => {
    await page.goto("/");
    const miudos = page.locator(".b-mundo [data-b-jumper]");
    await expect(miudos).toHaveCount(2);

    // a hora é a do relógio: de dia vêem-se, de noite o CSS apaga-os
    await page.getByRole("button", { name: "Dia", exact: true }).click();
    for (let i = 0; i < 2; i++) await expect(miudos.nth(i)).toBeVisible();

    await page.getByRole("button", { name: "Noite", exact: true }).click();
    for (let i = 0; i < 2; i++) await expect(miudos.nth(i)).toBeHidden();
  });

  test("o passeio do Pedro pausa fora da janela e retoma ao voltar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const janela = page.locator(".b-janela");
    const pedro = page.locator('[data-b-andador="pedro"]');
    const transformInicial = await pedro.getAttribute("transform");
    const contarAves = () => page.locator(".b-mundo .b-gaivota").count();
    const contarBrilhos = () => page.locator(".b-mundo .b-brilho-agua").count();
    await expect.poll(contarAves).toBe(3);
    await expect.poll(contarBrilhos).toBe(8);

    // O primeiro percurso começa após 1,2 s; prova movimento real, não só
    // que o HTML tem os ganchos de animação.
    await page.waitForFunction(
      () => Number(document.querySelector<SVGGElement>('[data-b-andador="pedro"]')?.dataset.bI) !== 5,
      { timeout: 8_000 }
    );

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => janela.evaluate((el) => el.classList.contains("amb-off"))).toBe(true);
    await expect.poll(() => pedro.getAttribute("transform")).toBe(transformInicial);
    await expect.poll(() => pedro.getAttribute("data-b-i")).toBe("5");
    await expect.poll(contarAves).toBe(0);
    await expect.poll(contarBrilhos).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => janela.evaluate((el) => el.classList.contains("amb-off"))).toBe(false);
    await expect.poll(contarAves).toBe(3);
    await expect.poll(contarBrilhos).toBe(8);
    await page.waitForFunction(
      () => Number(document.querySelector<SVGGElement>('[data-b-andador="pedro"]')?.dataset.bI) !== 5,
      { timeout: 8_000 }
    );
  });

  test("sem erros de consola nem transbordo a 375 px", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") erros.push(m.text());
    });
    page.on("pageerror", (e) => erros.push(String(e)));

    await page.setViewportSize({ width: 375, height: 760 });
    await page.goto("/");
    await page.waitForTimeout(2500); // o ambiente inteiro arranca

    expect(erros, `erros na consola:\n${erros.join("\n")}`).toEqual([]);
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(excesso, "a página transborda na horizontal").toBeLessThanOrEqual(1);
  });
});
