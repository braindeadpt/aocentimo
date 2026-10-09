import { test, expect } from "@playwright/test";

// Modo leve (leve.ts) — relato do dono, 2026-10-09: em Android fracos as
// animações falham e o mapa fica lento. Aparelho fraco → bairro parado.
test.describe("o bairro — modo leve", () => {
  test("um Android de 2 GB abre o bairro parado, com as janelas acesas", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "deviceMemory", { get: () => 2 });
    });
    await page.goto("/");
    const janela = page.locator(".b-janela");
    await expect(janela).toHaveClass(/b-leve/);
    await janela.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const aCorrer = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              a.playState === "running" &&
              a.effect instanceof KeyframeEffect &&
              a.effect.target instanceof Element &&
              a.effect.target.closest(".b-mundo")
          ).length
    );
    expect(aCorrer, "há animações a correr no mundo em modo leve").toBe(0);
    // os marcadores e os edifícios continuam lá e clicáveis
    await expect(page.locator(".b-mundo .ed")).toHaveCount(11);
  });

  test("?leve=0 desliga-o mesmo num aparelho fraco", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "deviceMemory", { get: () => 2 });
    });
    await page.goto("/?leve=0");
    await page.waitForTimeout(500);
    await expect(page.locator(".b-janela")).not.toHaveClass(/b-leve/);
  });

  test("um aparelho com folga fica com o bairro animado", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    });
    await page.goto("/");
    await page.waitForTimeout(500);
    await expect(page.locator(".b-janela")).not.toHaveClass(/b-leve/);
  });
});
