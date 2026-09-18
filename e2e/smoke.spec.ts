import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "fs";

// o domínio declarado em public/CNAME é a fonte de verdade do deploy —
// se divergir do canonical gerado, o SEO aponta para um domínio que
// não serve o site (defeito real que já aconteceu)
const HOST = readFileSync("public/CNAME", "utf8").trim().toLowerCase();

/**
 * Lista de rotas derivada, nunca escrita à mão: o sitemap é gerado do
 * conteúdo (expande rotas dinâmicas como /aprender/[slug]) e os .html
 * exportados cobrem as páginas fora do sitemap (ex.: /estilo). Qualquer
 * rota nova nasce coberta por todos os testes abaixo.
 */
function rotasDoSite(): string[] {
  const deSitemap = [
    ...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map((m) => new URL(m[1]).pathname);
  const deHtml = readdirSync("out", { recursive: true })
    .filter((f): f is string => typeof f === "string" && f.endsWith(".html"))
    .map((f) => f.replace(/\\/g, "/").replace(/\.html$/, ""))
    .filter((f) => !f.startsWith("_") && f !== "404")
    .map((p) => (p === "index" ? "/" : `/${p}`));
  return [...new Set([...deSitemap, ...deHtml])].sort();
}

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

test("o talão do salário carimba o domínio canónico", async ({ page }) => {
  await page.goto("/salario");
  await page.getByLabel("Salário bruto mensal").fill("1500");
  const texto = (await page.locator("body").innerText()).toLowerCase();
  expect(texto).toContain(HOST);
});

test("a lista de rotas deriva do conteúdo", () => {
  const rotas = rotasDoSite();
  expect(rotas).toContain("/estilo");
  expect(rotas).toContain("/");
  expect(
    rotas.some((r) => r.startsWith("/aprender/") && r !== "/aprender"),
    "o sitemap expande /aprender/[slug]"
  ).toBe(true);
});

test("todas as rotas respondem", async ({ page }) => {
  for (const path of rotasDoSite()) {
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
  for (const path of [...rotasDoSite(), "/rota-que-nao-existe"]) {
    await page.goto(path);
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(excesso, `${path} tem overflow horizontal`).toBeLessThanOrEqual(1);
  }
});

test("nenhuma página mostra undefined, NaN ou Invalid Date", async ({ page }) => {
  const proibidas = ["undefined", "NaN", "Invalid Date"];
  for (const path of rotasDoSite()) {
    await page.goto(path);
    const texto = await page.locator("body").innerText();
    for (const s of proibidas) {
      expect(texto, `${path} mostra "${s}" no texto visível`).not.toContain(s);
    }
  }
});

test("canonical de cada página bate certo com o CNAME", async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of rotasDoSite()) {
    // o canonical está no HTML inicial — domcontentloaded chega e torna
    // o ciclo de ~38 rotas rápido o suficiente para o timeout
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const canon = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canon?.toLowerCase(), `${path}`).toBe(
      `https://${HOST}${path === "/" ? "" : path}`
    );
  }
});

test("o /estilo cumpre contraste AA nos dois temas", async ({ page }) => {
  // reduced-motion desliga a transição de cor do body — sem ela a medição
  // apanhava valores intermédios da animação de troca de tema
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/estilo");
  for (const tema of ["light", "dark"]) {
    await page.evaluate(
      (t) => (document.documentElement.dataset.theme = t),
      tema
    );
    const falhas = await page.evaluate(() => {
      const srgb = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      const lum = (rgb: number[]) =>
        0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2]);
      const parse = (s: string) =>
        (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const fundoDe = (el: Element): number[] => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
          if (m && (m.length < 4 || Number(m[3]) === 1))
            return m.slice(0, 3).map(Number);
        }
        return [255, 255, 255];
      };
      const falhas: string[] = [];
      for (const el of document.body.querySelectorAll("*")) {
        const temTexto = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim()
        );
        if (!temTexto) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const frente = parse(
          el.namespaceURI?.includes("svg") ? cs.fill : cs.color
        );
        const fundo = fundoDe(el);
        const L1 = lum(frente);
        const L2 = lum(fundo);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const px = parseFloat(cs.fontSize);
        const grande = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
        const min = grande ? 3 : 4.5;
        if (ratio < min) {
          falhas.push(
            `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 50)}" → ${ratio.toFixed(2)}:1 < ${min}:1`
          );
        }
      }
      return falhas;
    });
    expect(falhas, `tema ${tema}`).toEqual([]);
  }
});

test("com reduced-motion nenhuma rota tem animação nem transição activa", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // contrato M-02: estado final imediato — animation-name:none e
  // transition-duration:0 em TODO o elemento, em todas as rotas
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of rotasDoSite()) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const violadores = await page.evaluate(() => {
      const vistos: string[] = [];
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const cs = getComputedStyle(el);
        const anima = cs.animationName !== "none";
        const transita = cs.transitionDuration
          .split(",")
          .some((d) => parseFloat(d) > 0);
        if (anima || transita) {
          vistos.push(
            `${el.tagName.toLowerCase()}.${String(el.getAttribute("class") ?? "").slice(0, 40)} ` +
              `animation=${cs.animationName} transition=${cs.transitionDuration}`
          );
        }
      }
      return vistos.slice(0, 8);
    });
    expect(violadores, `${path} anima com reduced-motion`).toEqual([]);
  }
});

test("com reduced-motion o número-herói mostra o valor final sem interpolação", async ({
  page,
}) => {
  // contrato M-03: mudar o input com reduce → o herói mostra já o valor
  // final — nunca um intermédio nem um zero
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/salario");
  // o número-herói de /salario é o líquido impresso no talão
  const hero = page.locator(".talao-cut dd").first();
  await page.locator("#bruto").fill("2000");
  // imediatamente depois do input: o texto é já o valor final — e fica
  // estável; com interpolação, uma segunda leitura passados 700ms
  // (> --dur-media) mostraria outro número
  const texto = await hero.innerText();
  expect(texto).toMatch(/\d/);
  expect(texto).not.toContain("0,00");
  await page.waitForTimeout(700);
  expect(await hero.innerText()).toBe(texto);
});

test("o primeiro Tab foca o skip-link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focado = page.locator(":focus");
  await expect(focado).toHaveClass(/skip-link/);
  await expect(focado).toHaveAttribute("href", "#conteudo");
});

test("a fita do salário interroga-se por teclado e tem equivalente textual", async ({
  page,
}) => {
  // M-05: reduced-motion → Escada não observa → destaque=null → leitura
  // determinística; a fita nasce já no estado final
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const zona = page.locator(".blueprint").first();

  // o desenho é decorativo; a viagem do euro existe em texto
  await expect(zona.locator("svg").first()).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  const tabela = zona.locator("table");
  await expect(tabela.locator("caption")).toContainText("A fita do salário");
  await expect(tabela).toContainText("Total para o Estado");

  // leitura por omissão: o resumo empresa → tu
  const readout = zona.locator(".chart-readout");
  const titulo = readout.locator(".chart-readout-t");
  const valor = readout.locator(".chart-readout-v");
  await expect(titulo).toContainText("A empresa paga");
  await expect(valor).toContainText("Tu");

  // a régua percorre as 7 paradas: End → Estado, Home → empresa,
  // setas andam parada a parada
  const scrub = zona.locator(".chart-scrub");
  await scrub.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(titulo).toContainText("Tu");
  await expect(valor).toContainText("do custo");
  await page.keyboard.press("ArrowLeft");
  await expect(titulo).toContainText("Seg. Social");
  await page.keyboard.press("Home");
  await expect(titulo).toContainText("A empresa paga");
  await expect(valor).toContainText("do custo");
  await page.keyboard.press("End");
  await expect(titulo).toContainText("Estado leva");
  await page.keyboard.press("Escape");
  await expect(valor).toContainText("Tu");

  // os links de capítulo do antigo Fluxo continuam cá
  await expect(zona.getByRole("link", { name: /o que o Estado leva/ })).toHaveAttribute(
    "href",
    "/impostos"
  );
  await expect(zona.getByRole("link", { name: /o teu recibo/ })).toHaveAttribute(
    "href",
    "/salario"
  );
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
