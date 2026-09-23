import { test, expect } from "@playwright/test";

// S1-07 — a navegação das quatro perguntas. Contratos:
//  · desktop: grupos abrem ao passar/focar, aria-current na página
//    activa, indicador partilhado nav-ind mantém-se
//  · mobile: folha inferior fecha com Escape e clique fora, foco preso
//  · sem JS os menus de desktop abrem na mesma (CSS) e a folha navega

const PERGUNTAS = ["O que ganhas", "O que pagas", "O banco", "O país"];

test.describe("desktop @1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("os quatro grupos estão na barra; Aprender é ligação directa", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Principal" });
    for (const p of PERGUNTAS)
      await expect(nav.getByRole("button", { name: p })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Aprender" })
    ).toBeVisible();
    // os itens dos grupos não estão à vista antes de abrir
    await expect(
      nav.getByRole("link", { name: "Salário", exact: true })
    ).toBeHidden();
  });

  test("o menu abre ao passar e fecha ao sair; aria-expanded acompanha", async ({
    page,
  }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: "O que ganhas" });
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await btn.hover();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    const salario = page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("link", { name: "Salário", exact: true });
    await expect(salario).toBeVisible();
    await page.locator("main").first().hover();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(salario).toBeHidden();
  });

  test("o menu abre com o foco do teclado e Escape fecha", async ({
    page,
  }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: "O que pagas" });
    await btn.focus();
    const impostos = page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("link", { name: "Impostos", exact: true });
    await expect(impostos).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(impostos).toBeHidden();
  });

  test("aria-current marca a página activa dentro do grupo", async ({
    page,
  }) => {
    await page.goto("/salario");
    const btn = page.getByRole("button", { name: "O que ganhas" });
    await btn.hover();
    await expect(
      page
        .getByRole("navigation", { name: "Principal" })
        .getByRole("link", { name: "Salário", exact: true })
    ).toHaveAttribute("aria-current", "page");
    // o grupo da página activa está assinalado (acento) no botão
    await expect(btn).toHaveClass(/text-accent/);
  });

  test("sem JS os menus abrem na mesma (hover/focus-within em CSS)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto("/");
    const btn = page.getByRole("button", { name: "O banco" });
    await btn.hover();
    await expect(
      page
        .getByRole("navigation", { name: "Principal" })
        .getByRole("link", { name: "Crédito", exact: true })
    ).toBeVisible();
    await ctx.close();
  });
});

test.describe("mobile @375", () => {
  test.use({ viewport: { width: 375, height: 720 } });

  test("a folha inferior abre com os grupos e fecha com Escape", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("summary", { hasText: "Índice" }).click();
    const folha = page.getByRole("dialog", { name: "Principal" });
    await expect(folha).toBeVisible();
    for (const p of PERGUNTAS) await expect(folha.getByText(p)).toBeVisible();
    await expect(folha.getByRole("link", { name: "IRS" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(folha).toBeHidden();
  });

  test("o foco fica preso na folha enquanto aberta", async ({ page }) => {
    await page.goto("/");
    await page.locator("summary", { hasText: "Índice" }).click();
    // Tab a partir do fim volta ao princípio — nunca sai da folha
    for (let i = 0; i < 30; i++) await page.keyboard.press("Tab");
    const dentro = await page.evaluate(
      () =>
        document
          .querySelector(".nav-sheet")
          ?.contains(document.activeElement) ?? false
    );
    expect(dentro).toBe(true);
    // Shift+Tab também não sai
    for (let i = 0; i < 30; i++)
      await page.keyboard.press("Shift+Tab");
    const dentro2 = await page.evaluate(
      () =>
        document
          .querySelector(".nav-sheet")
          ?.contains(document.activeElement) ??
        document.activeElement?.tagName === "SUMMARY"
    );
    expect(dentro2).toBe(true);
  });

  test("clique fora fecha; mudar de rota fecha", async ({ page }) => {
    await page.goto("/");
    const indice = page.locator("summary", { hasText: "Índice" });
    const folha = page.getByRole("dialog", { name: "Principal" });
    await indice.click();
    await expect(folha).toBeVisible();
    await page.mouse.click(10, 10); // scrim
    await expect(folha).toBeHidden();
    await indice.click();
    await expect(folha).toBeVisible();
    await folha.getByRole("link", { name: "Preços" }).click();
    await expect(folha).toBeHidden();
    await expect(page).toHaveURL(/\/precos/);
  });
});
