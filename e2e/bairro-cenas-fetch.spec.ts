import { test, expect, type Page } from "@playwright/test";

/**
 * P4 — a dieta do payload: os dados de cada cena deixaram de viajar no
 * RSC da home. São ficheiros estáticos (`/cenas/<id>.json`, gerados no
 * derive pela MESMA `dadosCenas()` do servidor) que o browser só pede
 * ao entrar no edifício.
 *
 * O que este spec prova:
 *
 *   1. o load da home não pede nenhum json de cena;
 *   2. abrir cada cena (a 1440 e a 390) pede o SEU json e a cena
 *      desenha-se — o interior tem desenho real (svg ≥ 5 elementos);
 *   3. o pedido a falhar (route.abort) mostra a falha honesta — «—» e
 *      a mensagem — nunca zeros nem um desenho fingido.
 */

const CENAS = [
  "fabrica",
  "financas",
  "banco",
  "mercearia",
  "correios",
  "bomba",
  "segsocial",
  "casa",
  "pastelaria",
  "quiosque",
  "escola",
  "clerigos",
] as const;

const PEDIDO_CENA = /\/cenas\/[a-z]+\.json$/;

/**
 * A fila de ociosidade só é DEVIDA 4 s depois do `load` (a regra do #38:
 * «4 s depois do load, uma por passo»). Antes disso, um pedido de cena é
 * cedo demais — e é isso que «no load, nada» quer dizer.
 *
 * O julgamento é feito com o relógio da PÁGINA — o `startTime` do
 * Resource Timing (o número do próprio browser) contra o `loadEventEnd`
 * da navegação — e não com uma janela de relógio do teste. A janela era
 * uma corrida: sob carga a hidratação chega DEPOIS de a fila ter
 * entrado, e o teste acusava a fila (fábrica, banco e Segurança Social —
 * os três que ela aquece primeiro) de ter pedido dados «no load»
 * (defeito medido a 2026-10-12). A fila chega tarde, nunca cedo.
 */
const DEVIDO_MS = 4000;
const MARGEM_MS = 500;

async function cenasCedoDemais(page: Page): Promise<string[]> {
  const { pedidos, load } = await page.evaluate(() => ({
    pedidos: performance
      .getEntriesByType("resource")
      .filter((e) => /\/cenas\/[a-z]+\.json$/.test(e.name))
      .map((e) => ({ url: e.name, t: e.startTime })),
    load:
      (
        performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined
      )?.loadEventEnd ?? 0,
  }));
  const limite = Math.max(DEVIDO_MS, load + DEVIDO_MS) - MARGEM_MS;
  return pedidos.filter((p) => p.t < limite).map((p) => p.url);
}

test.describe("os dados das cenas carregam só ao entrar (P4)", () => {
  test("a home não pede nenhum json de cena no load", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
    // deixa a hidratação assentar — um pedido preguiçoso denunciava-se aqui
    await page.waitForTimeout(1200);
    expect(await cenasCedoDemais(page)).toEqual([]);
  });

  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    for (const id of CENAS) {
      test(`«${id}» a ${w}×${h}: abrir pede o json e a cena desenha-se`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: w, height: h });
        const pedido = page.waitForRequest(
          (r) => PEDIDO_CENA.test(r.url()) && r.url().endsWith(`/${id}.json`)
        );
        await page.goto(`/#${id}`);
        await pedido;

        // a Fábrica é o caso à parte: não usa a moldura .b-cena — o seu
        // «desenho» é a corrida das moedas no mapa; prova-se o painel
        if (id === "fabrica") {
          await expect(page.locator(".b-painel")).toBeVisible();
          await expect(page.locator(".b-painel .b-fala")).not.toBeEmpty();
          return;
        }
        const cena = page.locator(".b-cena");
        await expect(cena).toBeVisible();
        // desenho real, não a moldura vazia: o interior tem elementos
        const desenhos = page.locator(".b-cena-arte svg *");
        await expect(desenhos.first()).toBeAttached();
        expect(await desenhos.count()).toBeGreaterThanOrEqual(5);
      });
    }
  }

  test("o pedido a falhar mostra a falha honesta — «—», nunca zeros", async ({
    page,
  }) => {
    await page.route("**/cenas/banco.json", (r) => r.abort());
    await page.goto("/#banco");
    const cena = page.locator(".b-cena");
    await expect(cena).toBeVisible();
    await expect(cena).toContainText(/não chegaram/i);
    // nenhum desenho fingido, nenhum número inventado
    expect(await page.locator(".b-cena-arte svg *").count()).toBe(0);
    expect(await cena.innerText()).not.toMatch(/\d+,\d+ ?€|\d,\d{3} ?€\/L/);
    // o fechar continua a funcionar no estado de falha
    await page.keyboard.press("Escape");
    await expect(cena).not.toBeVisible();
  });
});
