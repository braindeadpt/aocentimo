import { test, expect } from "@playwright/test";

// 1B-05 — os estados partilhados: vazio/fonte indisponível (desenho +
// frase honesta + orbe atrasada), a carregar (mini-orbe + rótulo),
// zero informativo («não te toca») e o limite da régua explicado
// junto ao polegar — discreto, sem vermelho, anunciado ao leitor de
// ecrã. E a regra nº1: série em falha → orbe + frase, nunca número.

test.describe("/estilo — a família de estados", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/estilo");
  });

  test("vazio: peça em falta a tracejado + orbe atrasada + frase honesta + fonte oficial", async ({
    page,
  }) => {
    const sec = page.locator("#estados");
    const vazio = sec.locator(".estado-vazio").first();
    await expect(vazio).toBeVisible();
    // o selo: a forma (orbe atrasada) E o texto — nunca só a forma
    await expect(vazio.locator(".orbe-atrasada")).toBeVisible();
    await expect(vazio).toContainText("fonte indisponível");
    // a frase honesta: o que falhou, desde quando, onde ver a fonte
    await expect(vazio).toContainText("a série da Euribor 12M");
    await expect(vazio).toContainText("não chegou da fonte");
    await expect(vazio).toContainText("último dado conhecido:");
    const link = vazio.getByRole("link", { name: /fonte oficial/ });
    await expect(link).toHaveAttribute("href", /bpstat\.bportugal\.pt/);
    await expect(link).toHaveAttribute("target", "_blank");
    // a peça em falta existe só a tracejado — decorativa
    const iso = vazio.locator("svg.ev-iso");
    await expect(iso).toHaveAttribute("aria-hidden", "true");
    expect(
      await iso.locator("[stroke-dasharray]").count()
    ).toBeGreaterThan(0);
    // e nenhum número inventado: o único dígito do bloco é a data
    const txt = (await vazio.textContent()) ?? "";
    expect(txt.replace(/último dado conhecido:[^·]*/g, "")).not.toMatch(
      /\d[,.]?\d*\s*(€|%)/
    );
  });

  test("a carregar: mini-orbe + rótulo do que se passa", async ({ page }) => {
    const sec = page.locator("#estados");
    const carga = sec.locator(".acarregar").first();
    await expect(carga).toBeVisible();
    await expect(carga.locator(".orbe-a-recolher")).toBeVisible();
    await expect(carga).toContainText("A calcular…");
    await expect(carga).toHaveAttribute("role", "status");
  });

  test("zero informativo: «0 c — não te toca» com o ponto oco", async ({
    page,
  }) => {
    const sec = page.locator("#estados");
    const zero = sec.locator(".zero-info").first();
    await expect(zero).toBeVisible();
    await expect(zero.locator(".zero-info-ponto")).toBeVisible();
    await expect(zero).toContainText("0");
    await expect(zero).toContainText("não te toca");
  });

  test("a régua explica o limite junto ao polegar — sem vermelho", async ({
    page,
  }) => {
    const sec = page.locator("#estados");
    const input = sec.getByLabel("Salário bruto mensal");
    await input.focus();
    // começa no mínimo: seta para a esquerda = tentativa de sair
    expect(Number(await input.inputValue())).toBe(920);
    await page.keyboard.press("ArrowLeft");
    // o valor não saiu
    expect(Number(await input.inputValue())).toBe(920);
    // a nota aparece no lugar do rótulo do extremo, com a razão
    const nota = sec.locator(".regua-nota");
    await expect(nota).toBeVisible();
    await expect(nota).toContainText("limite — 920 € · o salário mínimo");
    // anunciada ao leitor de ecrã — live region sr-only com o mesmo texto
    await expect(
      sec.locator("[role='status']").last()
    ).toHaveText(/limite — 920\s€ · o salário mínimo/);
    // sem vermelho de erro: a cor da nota não é a do acento
    const cores = await page.evaluate(() => {
      const nota = document.querySelector(".regua-nota")!;
      const fill = document.querySelector(".regua-fill")!;
      return {
        nota: getComputedStyle(nota).color,
        acento: getComputedStyle(fill).backgroundColor,
      };
    });
    expect(cores.nota).not.toBe(cores.acento);
    // insistir re-anuncia (o nonce rearma a região)
    await page.keyboard.press("ArrowLeft");
    await expect(nota).toBeVisible();
    // End → máximo: seta para a direita explica o outro limite
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowRight");
    expect(Number(await input.inputValue())).toBe(6000);
    await expect(nota).toContainText("limite — 6 000");
    // voltar para dentro limpa a nota
    await page.keyboard.press("ArrowLeft");
    await expect(sec.locator(".regua-nota")).toHaveCount(0);
    // o preset para lá do fim: o pedido cru passa, a régua explica
    await sec.getByRole("button", { name: "para lá do fim" }).click();
    expect(Number(await input.inputValue())).toBe(6000);
    await expect(sec.locator(".regua-nota")).toBeVisible();
  });
});

test.describe("os estados no produto", () => {
  test("/salario ao mínimo: o IRS é zero como informação, carimbo neutro «Não retido»", async ({
    page,
  }) => {
    await page.goto("/salario");
    const input = page.locator("#bruto");
    await input.focus();
    await page.keyboard.press("Home"); // 920 € — o salário mínimo
    const talao = page.locator(".talao");
    // a linha do IRS diz o zero que é informação + carimbo NEUTRO
    // «Não retido» (1D-02) — nunca o vermelho «Retido» nem o verde
    const linhaIrs = talao.locator(".talao-linha", { hasText: "IRS RETIDO" });
    await expect(linhaIrs.locator(".zero-info")).toContainText(
      "0,00 € — não te toca"
    );
    const carimbo = linhaIrs.locator(".talao-retido");
    await expect(carimbo).toHaveCount(1);
    await expect(carimbo).toHaveClass(/talao-retido-neutro/);
    await expect(carimbo).toHaveText("Não retido");
    // a cascata também diz porque o corte é zero — na linha do IRS
    await expect(
      page.locator(".chart-hit", { hasText: "IRS retido" })
    ).toContainText("não te toca");
    await expect(page.locator(".chart-hit").last()).not.toContainText(
      "não te toca"
    ); // o líquido — só o IRS a zero tem a nota
    // e o ano inteiro — a estimativa de IRS ao mínimo também é zero
    await expect(
      page.locator("div.flex.justify-between", {
        hasText: "IRS 2026 (estimativa)",
      })
    ).toContainText("não te toca");
    // a explosão do custo: a placa do IRS a zero diz-se na lista
    await expect(page.locator(".iso-card")).toContainText("não te toca");
  });
});
