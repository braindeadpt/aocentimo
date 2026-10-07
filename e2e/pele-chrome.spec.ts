import { test, expect } from "@playwright/test";

// P3(a) — o chrome (cabeçalho, navegação, ticker, rodapé) veste a pele V5
// em TODAS as rotas, e o tema claro/escuro é do site inteiro:
//  · o interruptor está visível em todo o lado, home incluída
//  · a escolha persiste entre rotas e reloads (localStorage)
//  · o tema certo está no DOM antes da hidratação (sem flash)
//  · escuro = «a noite do bairro»: papel/chão/tinta V5 no chrome
//  · o bairro é sempre uma página de papel — em dark o mapa NÃO escurece

const ROTAS = ["/", "/salario", "/dados", "/estilo"];

test.describe("o chrome leva a pele V5", () => {
  for (const rota of ROTAS) {
    test(`${rota}: <html> leva data-pele e o chrome veste papel/tinta`, async ({
      page,
    }) => {
      await page.goto(rota);
      await expect(page.locator("html")).toHaveAttribute(
        "data-pele",
        "v5"
      );
      // o atributo fica no <html> — pô-lo no cabeçalho re-declarava os
      // tokens claros no próprio elemento e em escuro ele nunca anoitecia.
      // A prova é a cor computada: papel/tinta do contrato, não os V4.
      const cab = page.locator("body > header");
      const rodape = page.locator("body > footer");
      const ticker = page.locator(".ticker");
      await expect(cab).toBeVisible();
      await expect(rodape).toBeVisible();
      await expect(ticker).toBeVisible();
      await expect(cab).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(cab).toHaveCSS("color", "rgb(22, 19, 15)");
      await expect(cab).toHaveCSS(
        "border-bottom-color",
        "rgb(22, 19, 15)"
      );
    });
  }

  test("a navegação desenha pílulas com traço grosso e sombra dura", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/salario");
    const btn = page.getByRole("button", { name: "O que ganhas" });
    const css = await btn.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        raio: parseFloat(s.borderTopLeftRadius),
        borda: parseFloat(s.borderTopWidth),
        sombra: s.boxShadow,
        letra: s.fontFamily,
      };
    });
    expect(css.raio).toBeGreaterThanOrEqual(900); // pílula
    expect(css.borda).toBeGreaterThanOrEqual(2.5); // traço grosso
    expect(css.sombra).toContain("rgb(22, 19, 15)"); // --tinta
    expect(css.letra).toContain("Archivo");
  });

  test("em escuro o chrome passa à noite do bairro, não aos tons V4", async ({
    page,
  }) => {
    // a escolha semeia-se como a pessoa a faria — no localStorage antes
    // do load; escrever dataset.theme à mão corre atrás da hidratação,
    // que repõe a escolha guardada a partir do localStorage
    await page.addInitScript(() => {
      try {
        localStorage.setItem("aocentimo-theme", "dark");
      } catch {}
    });
    await page.goto("/dados");
    const cab = page.locator("body > header");
    await expect(cab).toHaveCSS("background-color", "rgb(29, 36, 66)"); // --papel noite
    await expect(cab).toHaveCSS("color", "rgb(244, 239, 228)"); // --tinta noite
    // a home SEGUE o tema (o dono pediu a 2026-10-07: «devia mudar o tema
    // todo»): a superfície, o título e as cartas anoitecem; só o PALCO
    // (mapa, controlos, painel, cenas) fica claro, porque é ilustração
    await page.goto("/");
    await page.waitForFunction(() =>
      document.querySelector(".b-palco")?.classList.contains("b-noite"),
    );
    const noite = await page.evaluate(() => {
      const b5 = document.querySelector(".b5")!;
      const palco = document.querySelector(".b-palco")!;
      return {
        tinta: getComputedStyle(b5).getPropertyValue("--tinta").trim(),
        fundo: getComputedStyle(document.body).backgroundColor,
        carta: getComputedStyle(document.querySelector(".b-carta")!)
          .backgroundColor,
        tintaPalco: getComputedStyle(palco).getPropertyValue("--tinta").trim(),
        noiteNoMapa: palco.classList.contains("b-noite"),
      };
    });
    expect(noite.tinta).toBe("#f4efe4"); // a tinta da noite, na página
    expect(noite.fundo).toBe("rgb(20, 26, 51)"); // o azul-noite das outras rotas
    expect(noite.carta).toBe("rgb(29, 36, 66)"); // cartas de papel da noite
    expect(noite.tintaPalco).toBe("#16130f"); // o palco continua claro
    // o céu já não é o de dia: em escuro o mapa abre em «Noite» (#88);
    // o pormenor da hora vive em bairro-hora-tema.spec.ts
    expect(noite.noiteNoMapa).toBe(true);
  });
});

test.describe("o tema é do site inteiro", () => {
  for (const rota of ["/", "/salario"]) {
    test(`${rota}: o interruptor está visível`, async ({ page }) => {
      await page.goto(rota);
      await expect(
        page.locator("[data-theme-toggle]").first()
      ).toBeVisible();
    });
  }

  test("a escolha persiste ao navegar e ao recarregar", async ({ page }) => {
    await page.goto("/salario");
    await page.locator("[data-theme-toggle]").first().click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "dark"
    );
    // navegar para outra rota mantém a escolha
    await page.goto("/dados");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "dark"
    );
    await expect(
      page.locator("[data-theme-toggle]").first()
    ).toHaveAttribute("aria-pressed", "true");
    // e um reload lê a escolha guardada
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "dark"
    );
  });

  test("o data-theme certo está posto antes da hidratação (sem flash)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("aocentimo-theme", "dark");
      } catch {}
    });
    // logo ao domcontentloaded — antes de qualquer React — o atributo
    // já tem de estar escuro, senão o primeiro paint vem claro
    await page.goto("/estilo", { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(
      "dark"
    );
    // e resiste à hidratação
    await page.waitForLoadState("load");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "dark"
    );
  });
});
