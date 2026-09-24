import { test, expect } from "@playwright/test";

// S2-01 — o herói da home: «a moeda de 100 cêntimos».
// src/app/_home/HeroMoeda.tsx + HeroMoedaCliente.tsx
//
// PRÉ-CONDIÇÃO DE INTEGRAÇÃO: estes testes assumem que a page.tsx
// (orquestrador) monta <HeroMoeda /> como primeiro ecrã da home e que
// hero-moeda.css está importado pelo wrapper (co-localizado em
// _home/). Até lá falham por ausência de .hm-hero — é propositado.
//
// Contratos cobertos:
//  a) sem JS — o SSR entrega a moeda em SVG + um <details> com a
//     resposta completa (os quatro valores e a frase)
//  b) reduced-motion — revelar salta a coreografia: montes e veredicto
//     quase imediatos
//  c) teclado — palpite por setas + «Revelar» por Tab/Enter
//  d) o veredicto só aparece depois de os montes assentarem —
//     o sinal honesto é `.cc-rot.on` (rótulos acesos); o `data-pronto`
//     do palco é a entrega SSR→canvas, não os montes
//  e) bruto → salário mínimo: o monte do IRS fica a «0 c — não te toca»
//  f) «Mostrar sem adivinhar» revela sem veredicto de palpite

const HERO = ".hm-hero";

test("sem JS: moeda SVG parada + <details> com a resposta completa", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");

  // a pergunta é o h1, com o custo canónico — LCP no HTML
  const h1 = page.locator(`${HERO} h1`);
  await expect(h1).toContainText("A tua empresa gasta");
  await expect(h1).toContainText("quantos cêntimos te chegam");

  // a moeda de 1 € desenhada — svg de SSR do CampoCentimos
  const svg = page.locator(`${HERO} svg.cc-svg`);
  await expect(svg).toBeAttached();
  await expect(svg.locator("circle").first()).toBeAttached();

  // a resposta completa está no HTML via <details> — os quatro valores
  // e a frase, sem depender de JS
  const resp = page.locator(`${HERO} .hm-resposta`);
  await expect(resp).toBeAttached();
  await expect(resp).toContainText("TSU da empresa");
  await expect(resp).toContainText("IRS retido");
  await expect(resp).toContainText("Segurança Social");
  await expect(resp).toContainText("chegam à tua conta");
  await expect(resp).toContainText(/\d+,\d{2}/);

  // o equivalente textual do campo também está servido
  await expect(
    page.locator(`${HERO} [data-cc-equivalente]`)
  ).toContainText("De cada euro");

  await ctx.close();
});

test("reduced-motion: revelar salta para os montes quase de imediato", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = page.locator(HERO);

  await page.getByRole("button", { name: /mostrar sem adivinhar/i }).click();

  // sem coreografia: os quatro rótulos e o veredicto aparecem já —
  // a sequência completa demora ~3,5 s; aqui 3 s chegam de sobra
  await expect(hero.locator(".cc-rot.on")).toHaveCount(4, {
    timeout: 3_000,
  });
  await expect(hero.locator(".cc-legenda")).toContainText("chegam-te", {
    timeout: 3_000,
  });
  // e nenhuma animação/transição corre dentro do herói
  const aMexer = await page.evaluate(() => {
    const v: string[] = [];
    document.querySelectorAll(".hm-hero *").forEach((el) => {
      const cs = getComputedStyle(el);
      if (
        cs.animationName !== "none" ||
        cs.transitionDuration.split(",").some((d) => parseFloat(d) > 0)
      )
        v.push(el.tagName + "." + String(el.getAttribute("class")));
    });
    return v.slice(0, 5);
  });
  expect(aMexer).toEqual([]);
});

test("teclado: palpite por setas e revelar com Enter", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(HERO);

  const slider = page.getByLabel("O teu palpite");
  await slider.focus();
  // o palpite parte de 50 — duas setas acima → 52
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(slider).toHaveValue("52");
  await expect(slider).toHaveAttribute("aria-valuetext", /52/);

  // Tab leva ao «Revelar»; Enter revela
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /revelar/i })).toBeFocused();
  await page.keyboard.press("Enter");

  // os montes assentam e o veredicto menciona o palpite dado
  await expect(hero.locator(".cc-rot.on")).toHaveCount(4, {
    timeout: 12_000,
  });
  await expect(hero.locator(".cc-legenda")).toContainText("Disseste 52", {
    timeout: 12_000,
  });
});

test("o veredicto só aparece depois de os montes assentarem", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(HERO);
  const legenda = hero.locator(".cc-legenda");

  // a entrega SSR→canvas acontece — acima da dobra é imediata (M-02):
  // data-pronto="imed" marca o primeiro frame da tela (não os montes:
  // é por isso que o veredicto não se lhe liga)
  await expect(hero.locator(".cc-palco")).toHaveAttribute("data-pronto", "imed");

  await page.getByRole("button", { name: /^revelar$/i }).click();

  // fase inicial da coreografia: a legenda mostra a pausa ou «saem» —
  // o veredicto do palpite ainda não existe
  await page.waitForTimeout(1200);
  await expect(legenda).not.toContainText("Disseste");

  // quando os montes assentam (rótulos acesos), o veredicto entra
  await expect(hero.locator(".cc-rot.on")).toHaveCount(4, {
    timeout: 12_000,
  });
  await expect(legenda).toContainText("Disseste");
  await expect(legenda).toContainText(/\d+,\d{2}/);

  // a régua ganha o marcador da realidade ao lado do palpite
  // (o marcador «mínimo» da régua do bruto também usa .regua-agora —
  // filtra-se pelo texto para não tropeçar no strict mode)
  await expect(
    hero.locator(".regua-agora", { hasText: "realidade" })
  ).toHaveCount(1);

  // e a região viva anuncia o resultado ao leitor de ecrã
  await expect(hero.locator('p[role="status"]')).toContainText("Disseste");
});

test("«Mostrar sem adivinhar» revela sem palpite — frase neutra", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(HERO);

  await page.getByRole("button", { name: /mostrar sem adivinhar/i }).click();

  await expect(hero.locator(".cc-rot.on")).toHaveCount(4, {
    timeout: 12_000,
  });
  const legenda = hero.locator(".cc-legenda");
  await expect(legenda).toContainText("chegam-te à conta");
  await expect(legenda).not.toContainText("Disseste");
});

test("bruto no salário mínimo: o monte do IRS diz «não te toca»", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(HERO);

  await page.getByRole("button", { name: /mostrar sem adivinhar/i }).click();
  await expect(hero.locator(".cc-rot.on")).toHaveCount(4, {
    timeout: 12_000,
  });

  // preset «salário mínimo» → bruto 920 € → IRS a zero pontos
  await page.getByRole("button", { name: /salário mínimo/i }).click();
  const irs = hero.locator(".cc-rot", { hasText: "IRS" });
  await expect(irs).toContainText("0");
  await expect(irs).toContainText("não te toca");
  // o rótulo do bruto na migalha acompanha
  await expect(hero.locator(".hm-migalha")).toContainText(/920/);
});

test("«Voltar à moeda» fecha a moeda e repõe o jogo", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(HERO);

  await page.getByRole("button", { name: /mostrar sem adivinhar/i }).click();
  await expect(hero.locator(".cc-rot.on")).toHaveCount(4, {
    timeout: 12_000,
  });

  await page.getByRole("button", { name: /voltar à moeda/i }).click();
  // os rótulos apagam-se e o jogo volta a oferecer «Revelar»
  await expect(hero.locator(".cc-rot.on")).toHaveCount(0, {
    timeout: 12_000,
  });
  await expect(
    page.getByRole("button", { name: /^revelar$/i })
  ).toBeVisible();
});
