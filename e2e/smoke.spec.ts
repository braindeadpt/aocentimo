import { test, expect } from "@playwright/test";

test("home renderiza com os números-chave", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Para onde vai o teu dinheiro");
  await expect(page.getByText("Salário mínimo 2026")).toBeVisible();
});

test("calculadora de salário produz resultado", async ({ page }) => {
  await page.goto("/salario");
  await page.getByLabel("Salário bruto mensal").fill("1500");
  await expect(page.getByText("Líquido anual")).toBeVisible();
  await expect(page.getByText("Taxa marginal")).toBeVisible();
});

test("páginas principais respondem", async ({ page }) => {
  for (const path of ["/inflacao", "/impostos", "/credito", "/poupanca", "/precos", "/aprender", "/metodologia", "/sobre", "/estilo"]) {
    const res = await page.goto(path);
    expect(res?.status(), `${path} deve responder 200`).toBe(200);
  }
});
