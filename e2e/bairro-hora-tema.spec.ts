import { test, expect, type Page } from "@playwright/test";

/**
 * O mapa segue o tema (decisão do dono, 2026-10-07): em escuro abre em
 * «Noite» por omissão. Prioridade: o que a pessoa clicou > o tema escuro >
 * a hora do relógio. Trocar o tema esquece o clique.
 *
 * O relógio fica fixo às 12:00 de Lisboa: de dia, para que «noite» só possa
 * vir do TEMA e nunca da hora.
 */
test.use({ timezoneId: "Europe/Lisbon" });

const MEIO_DIA = new Date("2026-10-07T12:00:00+01:00");

async function abrir(page: Page, tema: "dark" | "light") {
  await page.clock.setFixedTime(MEIO_DIA);
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("aocentimo-theme", t);
    } catch {}
  }, tema);
  await page.goto("/");
  await page.waitForSelector(".b-palco .b-mundo[data-vivo=\"1\"]", { state: "attached" });
}

const classe = (page: Page) => page.locator(".b-palco").getAttribute("class");
const noite = async (page: Page) => /b-noite/.test((await classe(page)) ?? "");
const botao = (page: Page, nome: string) =>
  page.getByRole("button", { name: nome, exact: true });

test.describe("o mapa segue o tema", () => {
  test("em escuro, ao meio-dia, o mapa abre em «Noite»", async ({ page }) => {
    await abrir(page, "dark");
    await expect.poll(() => noite(page)).toBe(true);
    await expect(botao(page, "Noite")).toHaveAttribute("aria-pressed", "true");
    await expect(botao(page, "Dia")).toHaveAttribute("aria-pressed", "false");
  });

  test("em claro, ao meio-dia, o mapa é de dia", async ({ page }) => {
    await abrir(page, "light");
    expect(await noite(page)).toBe(false);
    await expect(botao(page, "Dia")).toHaveAttribute("aria-pressed", "true");
  });

  test("em escuro, o clique em «Dia» manda sobre o tema", async ({ page }) => {
    await abrir(page, "dark");
    await expect.poll(() => noite(page)).toBe(true);
    await botao(page, "Dia").click();
    await expect.poll(() => noite(page)).toBe(false);
    await expect(botao(page, "Dia")).toHaveAttribute("aria-pressed", "true");
  });

  test("trocar o tema esquece o clique e o mapa segue o tema", async ({
    page,
  }) => {
    await abrir(page, "dark");
    await botao(page, "Dia").click();
    await expect.poll(() => noite(page)).toBe(false);

    // escuro → claro: ao meio-dia, dia
    await page.locator("[data-theme-toggle]").first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect.poll(() => noite(page)).toBe(false);

    // claro → escuro: o clique em «Dia» já foi esquecido, volta a noite
    await page.locator("[data-theme-toggle]").first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => noite(page)).toBe(true);
  });

  test("em escuro nunca há um fotograma de dia (o script em linha chega antes da pintura)", async ({
    page,
  }) => {
    await page.clock.setFixedTime(MEIO_DIA);
    await page.addInitScript(() => {
      try {
        localStorage.setItem("aocentimo-theme", "dark");
      } catch {}
      const w = window as unknown as { __quadros: boolean[] };
      w.__quadros = [];
      const tick = () => {
        const p = document.querySelector(".b-palco");
        if (p) w.__quadros.push(p.classList.contains("b-noite"));
        if (w.__quadros.length < 90) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/");
    await page.waitForSelector(".b-palco .b-mundo[data-vivo=\"1\"]", { state: "attached" });
    await page.waitForFunction(
      () =>
        (window as unknown as { __quadros: boolean[] }).__quadros.length >= 30,
    );
    const quadros = await page.evaluate(
      () => (window as unknown as { __quadros: boolean[] }).__quadros,
    );
    expect(quadros.length).toBeGreaterThan(0);
    expect(
      quadros.filter((e) => !e).length,
      `fotogramas de dia em escuro: ${quadros.map((e) => (e ? "N" : "d")).join("")}`,
    ).toBe(0);
  });

  test("sem avisos de hidratação nem erros de consola em escuro", async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") erros.push(m.text());
    });
    await abrir(page, "dark");
    await page.waitForTimeout(1500);
    expect(erros).toEqual([]);
  });
});