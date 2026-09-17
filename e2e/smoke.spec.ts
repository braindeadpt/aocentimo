import { test, expect } from "@playwright/test";

test("home renderiza com os números-chave", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/para onde vai o teu dinheiro/i);
  await expect(
    page.getByText("Salário mínimo", { exact: true })
  ).toBeVisible();
});

test("calculadora de salário produz resultado", async ({ page }) => {
  await page.goto("/salario");
  await page.getByLabel("Salário bruto mensal").fill("1500");
  await expect(page.getByText("Líquido anual")).toBeVisible();
  await expect(page.getByText("Taxa marginal")).toBeVisible();
});

test("páginas principais respondem", async ({ page }) => {
  for (const path of ["/inflacao", "/impostos", "/credito", "/casa", "/irs", "/trabalho", "/poupanca", "/precos", "/dados", "/aprender", "/metodologia", "/sobre", "/estilo"]) {
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

test("nenhuma rota transborda na horizontal a 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const rotas = [
    "/",
    "/salario",
    "/inflacao",
    "/impostos",
    "/credito",
    "/casa",
    "/irs",
    "/trabalho",
    "/poupanca",
    "/precos",
    "/dados",
    "/aprender",
    "/metodologia",
    "/sobre",
    "/estilo",
    "/rota-que-nao-existe", // 404
  ];
  for (const path of rotas) {
    await page.goto(path);
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(excesso, `${path} tem overflow horizontal`).toBeLessThanOrEqual(1);
  }
});

test("nenhuma página mostra undefined, NaN ou Invalid Date", async ({ page }) => {
  const rotas = [
    "/",
    "/salario",
    "/inflacao",
    "/impostos",
    "/credito",
    "/casa",
    "/irs",
    "/trabalho",
    "/poupanca",
    "/precos",
    "/dados",
    "/aprender",
    "/metodologia",
    "/sobre",
  ];
  const proibidas = ["undefined", "NaN", "Invalid Date"];
  for (const path of rotas) {
    await page.goto(path);
    const texto = await page.locator("body").innerText();
    for (const s of proibidas) {
      expect(texto, `${path} mostra "${s}" no texto visível`).not.toContain(s);
    }
  }
});

test("o primeiro Tab foca o skip-link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focado = page.locator(":focus");
  await expect(focado).toHaveClass(/skip-link/);
  await expect(focado).toHaveAttribute("href", "#conteudo");
});

test("painéis de dados, API e feed servem", async ({ page }) => {
  await page.goto("/dados");
  await expect(page.getByText("Euribor — médias mensais")).toBeVisible();
  await expect(page.getByText("Calendário fiscal 2026")).toBeVisible();

  await page.goto("/precos");
  await expect(page.getByText("Preço médio nacional, por litro")).toBeVisible();
  await expect(page.getByText("Gasóleo simples").first()).toBeVisible();

  const api = await page.goto("/api/index.json");
  expect(api?.status()).toBe(200);
  const feed = await page.goto("/feed.xml");
  expect(feed?.status()).toBe(200);
});
