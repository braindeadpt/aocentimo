import { test, expect } from "@playwright/test";

test("home renderiza com os números-chave", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/para onde vai o teu dinheiro/i);
  await expect(page.getByText("Salário mínimo")).toBeVisible();
});

test("calculadora de salário produz resultado", async ({ page }) => {
  await page.goto("/salario");
  await page.getByLabel("Salário bruto mensal").fill("1500");
  await expect(page.getByText("Líquido anual")).toBeVisible();
  await expect(page.getByText("Taxa marginal")).toBeVisible();
});

test("páginas principais respondem", async ({ page }) => {
  for (const path of ["/inflacao", "/impostos", "/credito", "/casa", "/irs", "/trabalho", "/poupanca", "/precos", "/aprender", "/metodologia", "/sobre", "/estilo"]) {
    const res = await page.goto(path);
    expect(res?.status(), `${path} deve responder 200`).toBe(200);
  }
});

test("simuladores novos produzem resultado", async ({ page }) => {
  await page.goto("/casa");
  await expect(page.getByText("Precisas à entrada")).toBeVisible();

  await page.goto("/irs");
  await expect(page.getByText("Poupança por ano")).toBeVisible();

  await page.goto("/trabalho");
  await page.getByLabel("A tua idade").fill("35");
  await expect(page.getByText("O teu subsídio")).toBeVisible();
});
