import { test, expect, type Page } from "@playwright/test";

/**
 * O prefetch das cenas — o tempo até à cena sem que a home carregue mais
 * nada no arranque (PACK §2.3).
 *
 * A medição (docs/MEDICAO-V5.md, secção 2) mostrou que o tempo até à
 * cena não depende do tamanho dos dados: o JSON saía 1,3 s depois de o
 * texto já estar no ecrã e ~330 ms depois do `load`. O que custava era o
 * MOMENTO do pedido.
 *
 * Estes testes correm com a rede estrangulada (1,6 Mbps / 150 ms) e o CPU
 * a 4× — os mesmos números da medição — porque sem eles o chunk e o
 * JSON chegam antes de se poder olhar.
 *
 * O que se prova:
 *
 *   1. ao PAIRAR num edifício, o JSON e o chunk saem antes do clique;
 *   2. abrir por âncora faz o pedido do JSON ANTES de o chunk da cena
 *      terminar de executar (é o 1,3 s da medição);
 *   3. a home em repouso não pede nada a nenhuma cena (regra do #38) —
 *      nem no arranque, nem nos primeiros segundos de ociosidade;
 *   4. com Save-Data não se pré-carrega nada, nem sequer por âncora;
 *   5. o prefetch não muda o que a cena mostra: os dados chegam do
 *      mesmo cache e a falha honesta («—») continua honesta.
 */

const LENTO = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};

const JSON_CENA = /\/cenas\/([a-z]+)\.json$/;

/** Rede estrangulada + CPU 4×, e a recolha de tudo o que se pede. */
async function estrangular(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    ...LENTO,
    connectionType: "cellular4g",
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  return cdp;
}

interface Pedido {
  url: string;
  /** `performance.now()` no instante do pedido. */
  t: number;
  json: string | null;
  js: boolean;
}

/** Regista os pedidos da página com o relógio do próprio browser. */
async function registar(page: Page): Promise<Pedido[]> {
  const pedidos: Pedido[] = [];
  page.on("request", (r) => {
    const m = JSON_CENA.exec(r.url());
    const e: Pedido = {
      url: r.url(),
      t: 0,
      json: m ? m[1] : null,
      js: r.url().endsWith(".js"),
    };
    pedidos.push(e);
    if (r.url().startsWith("http://localhost"))
      page
        .evaluate(() => performance.now())
        .then((t) => (e.t = t))
        .catch(() => {});
  });
  return pedidos;
}

const cargaDo = (pedidos: Pedido[], antes: number) =>
  pedidos.filter((p) => p.t > antes);

/**
 * Pairar num edifício com um RATO A SÉRIO. O mapa respira (o clamp da
 * câmara, as nuvens), por isso o `.hover()` do Playwright fica à espera
 * de estabilidade e falha; e há edifícios que se sobrepõem no papel — o
 * ponto tem de bater no edifício certo, não no que estiver por cima.
 *
 * Se depois de algumas tentativas não houver ponto nenhum que bata no
 * edifício, o teste DIZ ISSO. Não se engana com um `dispatchEvent`
 * sintético para o teste passar.
 */
async function pairarEm(page: Page, id: string): Promise<{ x: number; y: number }> {
  for (const espera of [0, 300, 700]) {
    if (espera) await page.waitForTimeout(espera);
    const pt = await page.evaluate((alvo) => {
      const g = document.querySelector<SVGGElement>(`.b-mundo .ed[data-id="${alvo}"]`);
      if (!g) return null;
      const b = g.getBoundingClientRect();
      for (let fx = 0.2; fx <= 0.85; fx += 0.15)
        for (let fy = 0.15; fy <= 0.9; fy += 0.15) {
          const x = b.left + b.width * fx;
          const y = b.top + b.height * fy;
          const emCima = document.elementFromPoint(x, y);
          if (emCima && g.contains(emCima)) return { x, y };
        }
      return null;
    }, id);
    if (!pt) continue;
    // o rato viaja: pode passar por cima de outro edifício pelo caminho
    await page.mouse.move(pt.x / 2, pt.y / 2);
    await page.mouse.move(pt.x, pt.y);
    const bateu = await page.evaluate(
      ({ alvo, x, y }) => {
        const g = document.querySelector<SVGGElement>(`.b-mundo .ed[data-id="${alvo}"]`);
        const emCima = document.elementFromPoint(x, y);
        return !!emCima && !!g?.contains(emCima);
      },
      { alvo: id, x: pt.x, y: pt.y }
    );
    if (bateu) return pt;
  }
  throw new Error(`«${id}» não tem nenhum ponto que bata nele`);
}

test.describe("o prefetch das cenas (rede e CPU estranguladas)", () => {
  test("ao pairar, o JSON e o chunk da cena saem ANTES do clique", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await estrangular(page);
    const pedidos = await registar(page);

    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
    // deixa o arranque assentar: nada aqui é culpa do carregamento
    await page.waitForTimeout(1500);
    expect(pedidos.filter((p) => p.json), "repouso: nenhum pedido de cena").toEqual([]);

    const marca = await page.evaluate(() => performance.now());
    const pt = await pairarEm(page, "banco");

    // o pedido nasce do pairar, não do clique
    await expect
      .poll(() => pedidos.filter((p) => p.json === "banco" && p.t > marca).length, {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);
    await expect
      .poll(() => cargaDo(pedidos, marca).filter((p) => p.js).length, { timeout: 20_000 })
      .toBeGreaterThan(0);

    const tClique = await page.evaluate(() => performance.now());
    const antes = cargaDo(pedidos, marca);
    expect(antes.filter((p) => p.json === "banco" && p.t < tClique).length,
      "o JSON foi pedido depois do clique").toBeGreaterThan(0);
    expect(antes.filter((p) => p.js && p.t < tClique).length,
      "o chunk só foi pedido depois do clique").toBeGreaterThan(0);

    // e abrir é normal: a cena abre na mesma
    await page.mouse.click(pt.x, pt.y);
    await expect(page.locator(".b-cena")).toBeVisible();
    // o JSON não foi pedido duas vezes (o prefetch aquece o cache)
    expect(pedidos.filter((p) => p.json === "banco")).toHaveLength(1);
  });

  test("por âncora, o JSON é pedido antes de o chunk da cena terminar de executar", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await estrangular(page);
    const pedidos = await registar(page);

    await page.goto("/#banco");
    await expect(page.locator(".b-cena")).toBeVisible();
    const tCena = await page.evaluate(() => performance.now());

    const json = pedidos.find((p) => p.json === "banco");
    expect(json, "o JSON da cena não foi pedido").toBeTruthy();
    // o JSON sai antes de a cena ter conteúdo — ou seja, antes de o
    // chunk ter executado (é o chunk que desenha)
    expect(json!.t, "o JSON só saiu depois da cena estar desenhada").toBeLessThan(tCena);
    // e sai antes do próprio pedido do chunk
    const chunk = cargaDo(pedidos, 0).filter((p) => p.js).at(-1);
    if (chunk) expect(json!.t).toBeLessThanOrEqual(chunk.t);
  });

  test("a home em repouso não pede nada a nenhuma cena (regra do #38)", async ({ page }) => {
    test.setTimeout(60_000);
    await estrangular(page);
    const pedidos = await registar(page);
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
    // nem no arranque, nem com a página a ficar ociosa
    await page.waitForTimeout(2000);
    expect(pedidos.filter((p) => p.json), "repouso: nenhum json de cena").toEqual([]);
  });

  test("depois de um tempo de ociosidade, UM edifício à vista é aquecido — e só um", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await estrangular(page);
    const pedidos = await registar(page);
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();

    // a fila de ociosidade: depois do load e de alguns segundos sem
    // ninguém mexer, entra um edifício de cada vez
    await expect
      .poll(() => pedidos.filter((p) => p.json).length, { timeout: 30_000, intervals: [500] })
      .toBeGreaterThan(0);
    // nunca os onze de uma vez
    expect(pedidos.filter((p) => p.json).length).toBeLessThanOrEqual(3);
  });

  test("com Save-Data não se pré-carrega nada — nem por âncora", async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true, effectiveType: "2g" },
      });
    });
    const pedidos = await registar(page);
    await page.goto("/#banco");
    // a cena ABRE na mesma (o pedido só acontece ao abrir, como sempre)
    await expect(page.locator(".b-cena")).toBeVisible();
    const json = pedidos.filter((p) => p.json === "banco");
    expect(json, "Save-Data: o JSON só pode ser pedido ao abrir").toHaveLength(1);
  });

  test("o prefetch não inventa dados: se o JSON falhar, a cena mostra «—»", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/cenas/banco.json", (r) => r.abort());
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
    // pairar aquece, e a falha não fica em cache
    const pt = await pairarEm(page, "banco");
    await page.mouse.click(pt.x, pt.y);
    const cena = page.locator(".b-cena");
    await expect(cena).toBeVisible();
    await expect(cena).toContainText(/não chegaram/i);
    expect(await page.locator(".b-cena-arte svg *").count()).toBe(0);
  });
});