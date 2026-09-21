import { test, expect, type Page } from "@playwright/test";
import { readdirSync, readFileSync } from "fs";

/** mesma lista derivada do smoke — sitemap + .html exportados */
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

/** Tab real até ao elemento — há-de chegar lá em poucas dezenas de
 *  passos (skip-link → header → conteúdo); falha se não chegar. */
async function tabAte(page: Page, alvo: ReturnType<Page["locator"]>) {
  for (let i = 0; i < 80; i++) {
    if (await alvo.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Tab nunca chegou ao alvo");
}

test.describe("E-02 · interacções", () => {
  test("painel — expandir por teclado, Escape fecha e devolve o foco", async ({
    page,
  }) => {
    await page.goto("/");
    const botao = page.getByRole("button", { name: /Euribor 12M/ });
    await tabAte(page, botao);
    await page.keyboard.press("Enter");
    const exp = page.locator("#exp-euribor-12m-mensal");
    await expect(exp.locator("svg[data-viz]")).toBeVisible();
    // foco dentro do expandido — Escape tem de o devolver ao botão
    await exp.locator('button[aria-pressed="true"]').focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("#exp-euribor-12m-mensal")).toHaveCount(0);
    await expect(botao).toBeFocused();
  });

  test("#painel=euribor-12m-mensal abre expandido sem tween", async ({
    page,
  }) => {
    await page.goto("/#painel=euribor-12m-mensal");
    const exp = page.locator("#exp-euribor-12m-mensal");
    await expect(exp).toBeVisible();
    // nasce expandido: nenhuma célula pode estar a meio de um Flip —
    // o tween deixaria transform inline enquanto corre
    await page.waitForTimeout(150);
    const emTween = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-celula]")].filter(
          (el) => (el as HTMLElement).style.transform !== ""
        ).length
    );
    expect(emTween).toBe(0);
  });

  test("nav — dropdown abre por teclado, Escape fecha, um de cada vez", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const nav = page.locator('nav[aria-label="Principal"]').first();
    const grupos = nav.locator("details");

    // teclado: focar o primeiro <summary> e abrir com Enter
    const primeiro = grupos.nth(0).locator("summary");
    await primeiro.focus();
    await page.keyboard.press("Enter");
    await expect(grupos.nth(0)).toHaveJSProperty("open", true);

    // abrir outro grupo com rato fecha o primeiro — um de cada vez
    await grupos.nth(1).locator("summary").click();
    await expect(grupos.nth(1)).toHaveJSProperty("open", true);
    await expect(grupos.nth(0)).toHaveJSProperty("open", false);

    // Escape fecha o que está aberto
    await page.keyboard.press("Escape");
    await expect(grupos.nth(1)).toHaveJSProperty("open", false);
    expect(
      await nav.locator("details[open]").count()
    ).toBe(0);
  });

  test("catalogo — filtro «diária» deixa 3 e «máx» muda a janela", async ({
    page,
  }) => {
    await page.goto("/dados");
    const celulas = page.locator("[data-celula]");
    const visiveis = () =>
      celulas.evaluateAll((els) =>
        els.filter((el) => !el.classList.contains("hidden")).length
      );
    const total = await celulas.count();

    await page.getByRole("button", { name: "diária" }).click();
    await expect.poll(visiveis).toBe(3);
    await expect(page.getByText(/3 de \d+ séries/)).toBeVisible();

    // repõe o filtro e alterna a janela: os paths têm de mudar
    await page.getByRole("button", { name: "diária" }).click();
    await expect.poll(visiveis).toBe(total);
    const pathAntes = await page
      .locator("[data-celula]:not(.hidden) svg path[d]")
      .first()
      .getAttribute("d");
    await page.getByRole("button", { name: "máx" }).click();
    await expect
      .poll(async () =>
        page
          .locator("[data-celula]:not(.hidden) svg path[d]")
          .first()
          .getAttribute("d")
      )
      .not.toBe(pathAntes);
  });

  test("calendário — setas movem a célula focada e o aria-valuetext muda", async ({
    page,
  }) => {
    await page.goto("/precos");
    const grelha = page.locator('[role="grid"]').first();
    const celulas = grelha.locator('[role="gridcell"]');
    const ultima = celulas.last();
    await ultima.focus();
    const diaAntes = await ultima.getAttribute("data-dia");

    await page.keyboard.press("ArrowLeft");
    const activo = grelha.locator('[role="gridcell"]:focus');
    await expect(activo).not.toHaveAttribute("data-dia", diaAntes ?? "");

    await page.keyboard.press("ArrowUp");
    const depois = grelha.locator('[role="gridcell"]:focus');
    const diaDepois = await depois.getAttribute("data-dia");
    expect(diaDepois).not.toBe(diaAntes);
    expect(await depois.getAttribute("aria-valuetext")).toMatch(
      /€\/L|sem dados/
    );
    // o valuetext acompanha a célula — não pode ser igual em toda a grelha
    const distintos = new Set(
      await celulas.evaluateAll((els) =>
        els.slice(-10).map((el) => el.getAttribute("aria-valuetext"))
      )
    );
    expect(distintos.size).toBeGreaterThan(1);
  });

  test("reduced-motion — nenhuma rota descarrega o motor de animação", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    /* os chunks do gsap têm nomes hashed — identificam-se pelo conteúdo
       (a lib escreve window.gsap / _gsap internos). Scan do out/ dá o
       conjunto exacto que nunca pode ser pedido em reduced-motion. */
    const chunksGsap = new Set(
      readdirSync("out/_next/static/chunks")
        .filter((f) => f.endsWith(".js"))
        .filter((f) =>
          /window\.gsap|_gsap\b/.test(
            readFileSync(`out/_next/static/chunks/${f}`, "utf8")
          )
        )
    );
    expect(chunksGsap.size).toBeGreaterThan(0);

    /* sanity: com movimento normal a home pede-os ao aproximar da
       secção animada — prova que o conjunto identificado é o motor */
    const probe = await browser.newPage();
    const pedidosPosLoad: string[] = [];
    let loaded = false;
    probe.on("request", (r) => {
      if (loaded && r.url().endsWith(".js")) pedidosPosLoad.push(r.url());
    });
    probe.on("load", () => (loaded = true));
    await probe.goto("/", { waitUntil: "load" });
    await probe.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight * 0.5)
    );
    await probe.waitForTimeout(2000);
    const carregados = pedidosPosLoad.filter((u) =>
      chunksGsap.has(u.split("/").pop()!)
    );
    await probe.close();
    expect(carregados.length).toBeGreaterThan(0);

    // agora o contrato: reduced-motion, todas as rotas, scroll — 0 pedidos
    await page.emulateMedia({ reducedMotion: "reduce" });
    const vistos: string[] = [];
    page.on("request", (r) => {
      if (chunksGsap.has(r.url().split("/").pop()!)) vistos.push(r.url());
    });
    for (const rota of rotasDoSite()) {
      await page.goto(rota, { waitUntil: "domcontentloaded" });
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight)
      );
      await page.waitForTimeout(120);
    }
    expect(vistos).toEqual([]);
  });
});
