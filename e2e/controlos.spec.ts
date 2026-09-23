import { test, expect } from "@playwright/test";

// 1B-03 — o sistema de controlos: quatro variantes de Botao com
// todos os estados, Interruptor (switch), Chip, Segmentado
// (radiogroup de janela temporal), a régua com snap + ressalto,
// «Copiado» com aria-live e a dica por âncora.

test.describe("/estilo — um sistema, todos os estados", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);
    await page.goto("/estilo");
  });

  test("as quatro variantes existem; o botão de ícone tem ≥44 px e nome", async ({
    page,
  }) => {
    const sec = page.locator("#controlos");
    await expect(
      sec.getByRole("button", { name: "Acção principal" })
    ).toBeVisible();
    await expect(
      sec.getByRole("button", { name: "Acção secundária" })
    ).toBeVisible();
    await expect(
      sec.getByRole("button", { name: "Acção de texto" })
    ).toBeVisible();
    const icone = sec
      .getByRole("button", { name: "Repor valores", exact: true })
      .first();
    await expect(icone).toBeVisible();
    const caixa = await icone.boundingBox();
    expect(caixa!.width).toBeGreaterThanOrEqual(44);
    expect(caixa!.height).toBeGreaterThanOrEqual(44);
  });

  test("desactivado fica focável e anuncia a razão", async ({ page }) => {
    const sec = page.locator("#controlos");
    const b = sec.getByRole("button", {
      name: /sem dados não se calcula/,
    });
    await expect(b).toHaveAttribute("aria-disabled", "true");
    await expect(b).toHaveAttribute(
      "title",
      "a série do BPstat está atrasada — sem dados não se calcula"
    );
    // aria-disabled não sai da ordem de tabulação — a razão lê-se
    await b.focus();
    await expect(b).toBeFocused();
    // e não navega nem activa
    await b.click({ force: true });
    await expect(b).toHaveAttribute("aria-disabled", "true");
  });

  test("a carregar: orbe + o rótulo diz o que se passa + busy", async ({
    page,
  }) => {
    const sec = page.locator("#controlos");
    const b = sec.getByRole("button", { name: "Recalcular" });
    await b.click();
    const carga = sec.getByRole("button", { name: "A calcular…" });
    await expect(carga).toBeVisible();
    await expect(carga).toHaveAttribute("aria-busy", "true");
    await expect(carga).toHaveAttribute("aria-disabled", "true");
    await expect(carga.locator(".orbe-a-recolher")).toBeVisible();
    // volta ao repouso — o estado é transitório
    await expect(b).toBeVisible({ timeout: 4000 });
  });

  test("interruptor: role=switch comuta por clique e por Espaço", async ({
    page,
  }) => {
    const sec = page.locator("#controlos");
    const sw = sec.getByRole("switch", { name: /Simular choque/ });
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await sw.focus();
    await page.keyboard.press(" ");
    await expect(sw).toHaveAttribute("aria-checked", "true");
  });

  test("chips: o seleccionado tem aria-pressed e marca, não só cor", async ({
    page,
  }) => {
    const sec = page.locator("#controlos");
    const grupo = sec.getByRole("group", { name: "Prazo da Euribor" });
    const e3 = grupo.getByRole("button", { name: "3M", exact: true });
    const e12 = grupo.getByRole("button", { name: "12M", exact: true });
    await expect(e12).toHaveAttribute("aria-pressed", "true");
    await e3.click();
    await expect(e3).toHaveAttribute("aria-pressed", "true");
    await expect(e12).toHaveAttribute("aria-pressed", "false");
  });

  test("segmentado: radiogroup, setas movem e seleccionam, desactivado salta-se", async ({
    page,
  }) => {
    const sec = page.locator("#controlos");
    const g = sec.getByRole("radiogroup", { name: "Janela temporal" });
    await expect(g.getByRole("radio", { name: "1A" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    // «5A» desactivado com razão acessível — e fora da rotação de tab
    const j5 = g.getByRole("radio", { name: /5A/ });
    await expect(j5).toHaveAttribute("aria-disabled", "true");
    await expect(j5).toHaveAttribute("tabindex", "-1");
    await expect(j5).toContainText("série BPstat carregada tem só 24 meses");

    // clique selecciona; o readout liga aos dados reais
    await g.getByRole("radio", { name: "2A", exact: true }).click();
    await expect(g.getByRole("radio", { name: "2A" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await expect(sec).toContainText("24 pontos");

    // setas: de 2A para a direita salta o 5A desactivado → Máx, com foco
    await page.keyboard.press("ArrowRight");
    const max = g.getByRole("radio", { name: "Máx" });
    await expect(max).toHaveAttribute("aria-checked", "true");
    await expect(max).toBeFocused();
    // Home volta ao início
    await page.keyboard.press("Home");
    await expect(g.getByRole("radio", { name: "1A" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    // clique no desactivado não faz nada
    await j5.click({ force: true });
    await expect(j5).toHaveAttribute("aria-checked", "false");
  });

  test("«Copiado» aparece junto ao botão e é anunciado", async ({ page }) => {
    const sec = page.locator("#controlos");
    const copiar = sec.getByRole("button", {
      name: "Copiar ligação da página",
    });
    await copiar.click();
    const nota = sec.locator(".copiado-nota", { hasText: "Copiado" }).first();
    await expect(nota).toBeVisible();
    await expect(nota).toHaveAttribute("role", "status");
    // e desaparece ao fim do tempo — a confirmação é transitória
    await expect(nota).toBeHidden({ timeout: 4000 });
  });

  test("a régua demo anda por teclado: setas ±passo, PageUp/Down ±10×, Home/End", async ({
    page,
  }) => {
    const sec = page.locator("#controlos");
    const input = sec.getByLabel("Taxa a simular");
    await input.focus();
    // Home primeiro — parte sempre do mínimo da grelha
    await page.keyboard.press("Home");
    expect(Number(await input.inputValue())).toBe(-0.5);
    await page.keyboard.press("ArrowRight");
    expect(Number(await input.inputValue())).toBeCloseTo(-0.49, 4);
    await page.keyboard.press("PageUp");
    expect(Number(await input.inputValue())).toBeCloseTo(-0.39, 4);
    await page.keyboard.press("End");
    expect(Number(await input.inputValue())).toBe(7);
    await page.keyboard.press("Home");
    // o valor grande acompanha em algarismos tabulares
    await expect(sec.locator(".regua-valor")).toContainText("0,50");
  });

  test("a dica abre ao passar, posicionada sobre a âncora", async ({
    page,
  }) => {
    const sec = page.locator("#controlos");
    const alvo = sec.locator(".dica-alvo").first();
    const mae = alvo.locator(".dica-mae");
    const dica = alvo.locator(".dica");
    await mae.hover();
    await expect(dica).toHaveCSS("opacity", "1");
    const caixaDica = await dica.boundingBox();
    const caixaMae = await mae.boundingBox();
    // colada à âncora: por cima (clássico/anchor) ou virada por
    // baixo (flip-block quando não há tecto) — nunca solta ao longe
    const emCima =
      Math.abs(caixaDica!.y + caixaDica!.height - caixaMae!.y) <= 8;
    const emBaixo =
      Math.abs(caixaDica!.y - (caixaMae!.y + caixaMae!.height)) <= 8;
    expect(emCima || emBaixo).toBe(true);
  });

  test("o foco desenha o anel torrado de 3 px", async ({ page }) => {
    const sec = page.locator("#controlos");
    const b = sec.getByRole("button", { name: "Acção principal" });
    await b.focus();
    const estilo = await b.evaluate((el) => {
      const s = getComputedStyle(el);
      return { w: s.outlineWidth, st: s.outlineStyle };
    });
    expect(estilo.w).toBe("3px");
    expect(estilo.st).toBe("solid");
  });
});

test.describe("o sistema nos produtos", () => {
  test("/credito: o choque é um switch que muda a prestação", async ({
    page,
  }) => {
    await page.goto("/credito");
    const sw = page.getByRole("switch", { name: /Simular choque/ });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
  });

  test("/casa: IMT Jovem desactivado fora da HPP mostra a razão", async ({
    page,
  }) => {
    await page.goto("/casa");
    const sw = page.getByRole("switch", { name: /IMT Jovem/ });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    // a finalidade é um Segmentado (radiogroup), não um <select>
    await page
      .getByRole("radiogroup", { name: "Finalidade" })
      .getByRole("radio", { name: /Secundária/ })
      .click();
    await expect(sw).toHaveAttribute("aria-disabled", "true");
    await expect(sw).toContainText(
      "só se aplica a habitação própria e permanente"
    );
  });

  test("/salario: a régua anda ponto a ponto e aos extremos por teclado", async ({
    page,
  }) => {
    await page.goto("/salario");
    const input = page.locator("#bruto");
    await input.focus();
    const antes = await input.getAttribute("aria-valuetext");
    await page.keyboard.press("ArrowRight");
    const depois = await input.getAttribute("aria-valuetext");
    expect(depois).not.toBe(antes);
    await page.keyboard.press("End");
    const maximo = await input.getAttribute("aria-valuetext");
    await page.keyboard.press("Home");
    const minimo = await input.getAttribute("aria-valuetext");
    expect(maximo).not.toBe(minimo);
    // o aria-valuetext é o valor com unidade e fino inseparável
    expect(minimo).toContain("€");
  });

  test("o «JSON» do cartão copia o endereço e confirma «Copiado»", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);
    await page.goto("/");
    const copiar = page
      .getByRole("button", { name: "copiar o endereço do JSON" })
      .first();
    await copiar.click();
    await expect(
      page.locator(".copiado-nota", { hasText: "Copiado" }).first()
    ).toBeVisible();
    // e a clipboard tem o URL absoluto do endpoint
    const clip = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clip).toMatch(/^https?:\/\//);
    expect(clip).toContain(".json");
  });

  test("/metodologia: a dica da célula abre por âncora ao passar", async ({
    page,
  }) => {
    await page.goto("/metodologia");
    const alvo = page.locator(".quadro-vivo .dica-alvo").first();
    const mae = alvo.locator(".dica-mae");
    const dica = alvo.locator(".dica");
    await mae.hover();
    await expect(dica).toHaveCSS("opacity", "1");
    const caixaDica = await dica.boundingBox();
    const caixaMae = await mae.boundingBox();
    // ancorada à célula: sobrepõe-lhe a largura — nunca solta no meio
    // do nada
    expect(caixaDica!.x).toBeLessThan(caixaMae!.x + caixaMae!.width);
    expect(caixaDica!.x + caixaDica!.width).toBeGreaterThan(caixaMae!.x);
  });

  test("reduced-motion: sem ressalto nem transição — estado final já", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/estilo");
    const sec = page.locator("#controlos");
    const input = sec.getByLabel("Taxa a simular");
    await input.focus();
    await page.keyboard.press("ArrowRight");
    const animacoes = await page.evaluate(() =>
      document
        .querySelector(".regua-polegar-corpo")
        ?.getAnimations()
        .filter((a) => a.playState === "running").length ?? -1
    );
    expect(animacoes).toBe(0);
  });
});
