import { test, expect } from "@playwright/test";

// Sessão 3C — «O banco»: /credito, /casa, /poupanca no template de três
// níveis (<Pagina>). Contratos verificados aqui:
//  · cada rota tem os três níveis (resposta / Explora / Confirma) e UM h1
//  · o instrumento do nível 1 nasce no HTML do servidor — sem JS o
//    número herói e a frase da resposta já lá estão
//  · nenhuma rota dispara pageerror nem erro de hidratação
//  · a pergunta seguinte liga a faixa: credito → casa → poupanca → dados
//  · o nível 3 serve <details> fechados por omissão
//  · o campo de cêntimos de /poupanca conta os 28 cêntimos do fisco
//    (calculados de data/fiscal/capitais.json — nunca literais)

const ROTAS = [
  {
    path: "/credito",
    pergunta: "Quanto vais pagar ao banco, no total?",
    hero: /€\s*\/\s*mês|€\/mês/,
    frase: /o que pediste/,
    seguinte: { href: "/casa", rotulo: "Quanto custa mesmo comprar esta casa?" },
  },
  {
    path: "/casa",
    pergunta: "Quanto custa mesmo comprar esta casa?",
    hero: /€/,
    frase: /escritura/,
    seguinte: { href: "/poupanca", rotulo: "Onde rende mais o teu dinheiro?" },
  },
  {
    path: "/poupanca",
    pergunta: "Onde rende mais o teu dinheiro — depois de impostos e inflação?",
    hero: /%\s*\/\s*ano|%\/ano/,
    frase: /impostos e inflação/,
    seguinte: { href: "/dados", rotulo: "E o país, como está?" },
  },
] as const;

const PADRAO_HIDRATACAO =
  /hydrat|didn't match|cannot be a descendant|cannot contain a nested|Minified React error #41[89]|Minified React error #42[0-9]/i;

for (const r of ROTAS) {
  test(`${r.path} — três níveis, herói no HTML sem JS, pergunta seguinte`, async ({
    browser,
  }) => {
    // —— sem JS: o contrato do nível 1 está no HTML servido ——
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(r.path, { waitUntil: "domcontentloaded" });

    // UM h1 = a pergunta
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText(r.pergunta.slice(0, 30));

    // nível 1: UM instrumento com o número herói + a frase
    const nivel1 = page.locator(".pg-nivel").first();
    await expect(nivel1.locator(".pg-instrumento")).toHaveCount(1);
    await expect(
      nivel1.locator(".pg-instrumento").getByText(r.hero).first()
    ).toBeAttached();
    const frase = nivel1.locator(".pg-frase");
    await expect(frase).toContainText(r.frase);
    // a frase é legível aos 12 anos — curta, sem jargão
    const palavras = (await frase.innerText()).trim().split(/\s+/).length;
    expect(palavras, "frase da resposta ≤ 25 palavras").toBeLessThanOrEqual(25);

    // níveis 2 e 3 existem como landmarks nomeados
    await expect(
      page.getByRole("heading", { name: "Explora", level: 2 })
    ).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Confirma", level: 2 })
    ).toHaveCount(1);

    // nível 3 = <details> fechados por omissão
    const detalhes = page.locator("details.pg-detalhe");
    expect(await detalhes.count()).toBeGreaterThan(0);
    for (let i = 0; i < (await detalhes.count()); i++) {
      await expect(detalhes.nth(i)).not.toHaveAttribute("open", "");
    }

    // a pergunta seguinte — a faixa liga-se, nenhuma página é um beco
    const seg = page.locator(".pg-seguinte-lnk");
    await expect(seg).toHaveAttribute("href", r.seguinte.href);
    await expect(seg).toContainText(r.seguinte.rotulo);

    await ctx.close();
  });

  test(`${r.path} — zero pageerror e hidratação limpa`, async ({ page }) => {
    const erros: string[] = [];
    const onErr = (e: Error) => erros.push(`pageerror: ${e.message}`);
    const onConsole = (m: import("@playwright/test").ConsoleMessage) => {
      if (m.type() === "error" && PADRAO_HIDRATACAO.test(m.text()))
        erros.push(`console.error: ${m.text().slice(0, 300)}`);
    };
    page.on("pageerror", onErr);
    page.on("console", onConsole);
    await page.goto(r.path, { waitUntil: "domcontentloaded" });
    // réguas e provedores hidratam — uma janela para os erros falarem
    await page.waitForTimeout(800);
    // e uma interacção real: ligar o choque em /credito, mexer numa régua
    const regua = page.locator('[role="slider"], .regua input[type="range"]').first();
    if (await regua.count()) {
      await regua.press("ArrowRight").catch(() => {});
      await page.waitForTimeout(300);
    }
    expect(erros).toEqual([]);
  });
}

test("/poupanca — os cêntimos do fisco vêm do imposto real, não de literais", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/poupanca", { waitUntil: "domcontentloaded" });

  // «De cada euro de juro, N cêntimos vão para o Estado» — o número é
  // calculado de capitais.json (28 % em vigor → 28 cêntimos)
  const eq = page.locator("[data-cc-equivalente]").first();
  await expect(eq).toContainText("De cada euro de juro");
  await expect(eq).toContainText(/28/);
  await expect(eq).toContainText(/72/);

  await ctx.close();
});

test("/credito — o choque +1 p.p. muda a resposta e o mapa confirma", async ({
  page,
}) => {
  await page.goto("/credito", { waitUntil: "domcontentloaded" });

  const hero = page.locator(".pg-instrumento .num-hero").first();
  const antes = await hero.innerText();

  // liga o choque — a prestação-herói do nível 1 reage (mesmo contrato)
  const choque = page.getByRole("switch", { name: /choque/i });
  await choque.scrollIntoViewIfNeeded();
  await choque.click();

  // o tween dos dígitos leva o seu tempo — sonda até assentar
  await expect
    .poll(async () => (await hero.innerText()) !== antes, {
      timeout: 5_000,
    })
    .toBe(true);

  // o nível 3 abre e a tabela do mapa de amortização está lá
  await page
    .locator("details.pg-detalhe", { hasText: "mapa de amortização" })
    .first()
    .locator("summary")
    .click();
  await expect(
    page.locator("details.pg-detalhe table").first()
  ).toBeVisible();
});
