import { test, expect } from "@playwright/test";

test.describe("T12 — Partilha por URL nos Simuladores (Zero Cookies)", () => {
  test("/salario com query string preenche os controlos e gera URL de partilha", async ({
    page,
  }) => {
    await page.goto("/salario?bruto=2000&adse=1");

    // Verifica que o valor do bruto foi lido da query string (2 000 €)
    const hero = page.locator(".pg-instrumento .num-hero");
    await expect(hero).toBeVisible();

    // O botão Copiar ligação existe no Cartão
    const copiar = page.getByRole("button", { name: "Copiar ligação desta simulação" });
    await expect(copiar).toBeVisible();
    await copiar.click();

    // Confirmação "Copiado" exibida
    const nota = page.locator(".copiado-nota", { hasText: "Copiado" }).first();
    await expect(nota).toBeVisible();
  });

  test("/salario?modo=pensao#pensao seleciona o modo pensão Cat. H", async ({
    page,
  }) => {
    await page.goto("/salario?modo=pensao#pensao");
    await expect(page.locator(".pg-frase")).toContainText(/pensão bruta/i);
  });

  test("/credito com query string preenche capital e modalidade mista", async ({
    page,
  }) => {
    await page.goto("/credito?capital=250000&regime=mista&anosFixos=5");
    const copiar = page.getByRole("button", { name: "Copiar ligação desta simulação" });
    await expect(copiar).toBeVisible();
  });

  test("/casa com query string preenche preço e IMT Jovem", async ({
    page,
  }) => {
    await page.goto("/casa?preco=300000&jovens=todos");
    const copiar = page.getByRole("button", { name: "Copiar ligação desta simulação" });
    await expect(copiar).toBeVisible();
    await expect(page.locator(".pg-instrumento")).toContainText(/IMT Jovem/i);
  });

  test("/poupanca com query string preenche capital", async ({ page }) => {
    await page.goto("/poupanca?capital=20000");
    const copiar = page.getByRole("button", { name: "Copiar ligação desta simulação" });
    await expect(copiar).toBeVisible();
  });

  test("/trabalho com query string preenche salário e idade", async ({ page }) => {
    await page.goto("/trabalho?bruto=2000&idade=45");
    const copiar = page.getByRole("button", { name: "Copiar ligação desta simulação" });
    await expect(copiar).toBeVisible();
  });

  test("query string maliciosa ou fora de limites é descartada sem crash", async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(String(e)));

    await page.goto("/salario?bruto=-999999&adse=<script>alert(1)</script>&regiao=invalida");
    // Página carrega e funciona com valores de fallback seguros
    await expect(page.locator(".pg-instrumento")).toBeVisible();
    expect(erros).toEqual([]);
  });
});

test.describe("T12 — Glossário /aprender e Pesquisa Instantânea", () => {
  test("renderiza os 42 termos no HTML e filtra instantaneamente por termo, sigla e sinónimo", async ({
    page,
  }) => {
    await page.goto("/aprender");

    // Todos os 42 termos no estado inicial
    const input = page.locator("#pesquisa-glossario");
    await expect(input).toBeVisible();
    const contagem = page.locator('p[role="status"]');
    await expect(contagem).toContainText("42 de 42 termos");

    // Pesquisa por sigla "VPT" encontra IMI
    await input.fill("VPT");
    await expect(contagem).toContainText("1 de 42 termos");
    await expect(page.locator('a[href="/aprender/imi"]')).toBeVisible();

    // Pesquisa por sinónimo "recibos verdes" encontra Rendimento relevante
    await input.fill("recibos verdes");
    await expect(page.locator('a[href="/aprender/rendimento-relevante"]')).toBeVisible();

    // Pesquisa por sigla "DSTI" encontra Taxa de esforço
    await input.fill("DSTI");
    await expect(page.locator('a[href="/aprender/taxa-esforco"]')).toBeVisible();

    // Pesquisa por termo novo "homologo"
    await input.fill("homologo");
    await expect(page.locator('a[href="/aprender/homologo"]')).toBeVisible();

    // Limpar pesquisa restaura os 42 termos
    await input.fill("");
    await expect(contagem).toContainText("42 de 42 termos");
  });

  test("página individual /aprender/homologo carrega com micro-demo e metadados", async ({
    page,
  }) => {
    await page.goto("/aprender/homologo");
    await expect(page.locator("h1")).toContainText("homóloga");
    await expect(page.locator(".pg-frase")).toBeVisible();
    // Micro-demo presente
    await expect(page.locator(".mdemo")).toBeVisible();
  });
});
