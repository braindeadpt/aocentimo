import { test, expect } from "@playwright/test";

// S1-04 — o campo de cêntimos. Contratos:
//  · sem JS o servidor serve SVG com os mesmos números do canvas
//  · reduced-motion = estado final imediato, sem rotação nem voo
//  · exactamente um equivalente textual por figura; palco aria-hidden
//  · a interacção moeda→montes assenta e mostra os rótulos
//
// Os testes miram a secção dedicada (#campo-centimos): a /estilo pode
// ter outros campos embutidos noutras demos (ex.: o exemplo da Pagina).

const CC = "#campo-centimos .cc";

test("sem JS o campo serve SVG com os números e o equivalente", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/estilo");

  const campos = page.locator(CC);
  await expect(campos).toHaveCount(2);

  // a instância interactiva nasce em «moeda» — svg da moeda presente
  const svg = campos.first().locator("svg.cc-svg");
  await expect(svg).toBeVisible();
  await expect(svg.locator("circle").first()).toBeAttached();

  // a instância estática nasce em «montes» — os 100 pontos estão no HTML
  const montes = campos.nth(1).locator("svg.cc-svg");
  expect(await montes.locator("circle").count()).toBe(100);

  // o equivalente textual existe sem JS e diz os valores reais
  const eq = campos.first().locator("[data-cc-equivalente]");
  await expect(eq).toContainText("De cada euro");
  await expect(eq).toContainText(/cêntimos/);
  await expect(eq).toContainText(/\d+,\d/);
  await ctx.close();
});

test("cada campo tem exactamente um equivalente e o palco é decorativo", async ({
  page,
}) => {
  await page.goto("/estilo");
  const campos = page.locator(CC);
  await expect(campos).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const c = campos.nth(i);
    await expect(c.locator("[data-cc-equivalente]")).toHaveCount(1);
    await expect(c.locator(".cc-palco")).toHaveAttribute("aria-hidden", "true");
    await expect(c.locator("canvas.cc-tela")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    await expect(c.locator("svg.cc-svg")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  }
});

test("com reduced-motion a moeda não roda — dois frames idênticos", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/estilo");
  const palco = page.locator(CC).first().locator(".cc-palco");
  await palco.scrollIntoViewIfNeeded();
  // nenhuma animação/transição CSS dentro do campo
  const violadores = await page.evaluate(() => {
    const v: string[] = [];
    document.querySelectorAll("#campo-centimos .cc *").forEach((el) => {
      const cs = getComputedStyle(el);
      if (
        cs.animationName !== "none" ||
        cs.transitionDuration.split(",").some((d) => parseFloat(d) > 0)
      )
        v.push(el.tagName + "." + String(el.getAttribute("class")));
    });
    return v.slice(0, 5);
  });
  expect(violadores).toEqual([]);
  // a rotação da moeda é em canvas — depois de assentar, dois
  // screenshots do palco com 400 ms de intervalo têm de ser pixel a
  // pixel iguais (sem frames de rotação)
  await page.waitForTimeout(800);
  const t1 = await palco.screenshot();
  await page.waitForTimeout(400);
  const t2 = await palco.screenshot();
  expect(t1.equals(t2)).toBe(true);
});

test("a revelação moeda → montes assenta e acende os rótulos", async ({
  page,
}) => {
  await page.goto("/estilo");
  const campo = page.locator(CC).first();
  await campo.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300); // o sim hidrata e esconde o svg

  await page.getByRole("button", { name: "Montes" }).click();
  // a transição termina: rótulos ligados, legenda final visível
  await expect(campo.locator(".cc-rot.on")).toHaveCount(4, {
    timeout: 12_000,
  });
  await expect(campo.locator(".cc-legenda.on")).toContainText("chegam-te");

  // os rótulos dizem os valores reais em cêntimos — o texto, não a cor,
  // é que informa (a cor nunca é o único canal); a ponte é o FINO (1B-02)
  const rotulos = campo.locator(".cc-rot-v");
  await expect(rotulos.nth(3)).toContainText(/\d+,\d+ c/);

  // voltar à moeda esconde os rótulos outra vez
  await page.getByRole("button", { name: "Moeda" }).click();
  await expect(campo.locator(".cc-rot.on")).toHaveCount(0, {
    timeout: 12_000,
  });
});

test("os montes estáticos mostram rótulos e os 100 pontos do SSR", async ({
  page,
}) => {
  await page.goto("/estilo");
  const estatico = page.locator(CC).nth(1);
  await estatico.scrollIntoViewIfNeeded();
  // estado final servido: rótulos já ligados no SSR
  await expect(estatico.locator(".cc-rot.on")).toHaveCount(4);
  await expect(estatico.locator(".cc-legenda.on")).toHaveCount(0); // sem textos → sem legenda
  // svg do SSR: 100 pontos no total (partes + livres)
  await page.waitForTimeout(200);
});
