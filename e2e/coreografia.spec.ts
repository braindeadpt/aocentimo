import { test, expect } from "@playwright/test";

// 1B-04 — coreografia. Dois contratos medidos em runtime:
//
//  A · a transição-assinatura: o link «a pergunta seguinte» do <Pagina>
//      morfa no h1 da página de destino. O nome pg-voo-<rota> só se
//      activa quando a navegação traz o tipo pg-voo — um next/link
//      normal para a MESMA rota não o pode disparar.
//  B · a pausa ambiente: o marquee do ticker, a rotação do orbe e o
//      canvas do CampoCentimos param fora do ecrã (IntersectionObserver)
//      e com o separador escondido (document.hidden + visibilitychange)
//      — nenhum fotograma fora da vista.

type Janela = Window & { __vt?: Set<string> };

/** instala um colector de pseudo-elementos de view-transition —
    amostra getAnimations a cada frame durante ~3,2 s */
const COLETOR_VT = `(() => {
  window.__vt = new Set();
  const fim = performance.now() + 3200;
  const loop = () => {
    for (const a of document.getAnimations({ subtree: true })) {
      const pe = a.effect && a.effect.pseudoElement;
      if (pe) window.__vt.add(pe);
    }
    if (performance.now() < fim) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})()`;

test("a pergunta seguinte morfa no h1 da página de destino", async ({
  page,
}) => {
  await page.goto("/estilo", { waitUntil: "networkidle" });
  const lnk = page.locator(".pg-seguinte-lnk").first();
  await lnk.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  await page.evaluate(COLETOR_VT);
  await lnk.click();
  await page.waitForURL("**/salario**");
  await page.waitForTimeout(1800);

  const vistos = await page.evaluate(
    () => [...((window as Janela).__vt ?? [])] as string[]
  );
  // a pergunta voou: o grupo partilhado existiu com velho e novo
  expect(vistos).toContain("::view-transition-group(pg-voo)");
  expect(vistos).toContain("::view-transition-old(pg-voo)");
  expect(vistos).toContain("::view-transition-new(pg-voo)");
  // e o h1 chegou com o texto da pergunta de destino
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /quanto vais receber/i
  );
});

test("outros links para a mesma rota não disparam o voo", async ({
  page,
}) => {
  await page.goto("/estilo", { waitUntil: "networkidle" });
  // a nav é um next/link normal para /salario — sem o tipo pg-voo
  await page.locator("nav button").first().hover();
  await page.waitForTimeout(350);
  await page.evaluate(COLETOR_VT);
  await page.locator('nav a[href="/salario"]').first().click();
  await page.waitForURL("**/salario**");
  await page.waitForTimeout(1600);

  const vistos = await page.evaluate(
    () => [...((window as Janela).__vt ?? [])] as string[]
  );
  expect(
    vistos.filter((p) => p.includes("pg-voo")),
    "navegação normal activou o nome do voo"
  ).toEqual([]);
});

test("o marquee do ticker pára fora do ecrã e retoma ao voltar", async ({
  page,
}) => {
  await page.goto("/dados", { waitUntil: "domcontentloaded" });
  const playState = () =>
    page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".ticker-track")!)
          .animationPlayState
    );

  await expect.poll(playState).toBe("running");

  // roda para o fim — a faixa sai do ecrã, o PausaAmbiente congela-a
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await expect.poll(playState, { timeout: 4000 }).toBe("paused");

  // volta — retoma
  await page.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "instant" })
  );
  await expect.poll(playState, { timeout: 4000 }).toBe("running");
});

test("o orbe «a-recolher» pára fora do ecrã e com o separador escondido", async ({
  page,
}) => {
  await page.goto("/estilo", { waitUntil: "domcontentloaded" });
  const orbe = page.locator("svg.orbe-a-recolher").first();
  await expect(orbe).toBeAttached();
  const playState = () =>
    page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("svg.orbe-a-recolher .orbe-roda")!
        ).animationPlayState
    );

  await orbe.scrollIntoViewIfNeeded();
  await expect.poll(playState, { timeout: 4000 }).toBe("running");

  // fora do ecrã → pausado pelo IntersectionObserver
  await page.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "instant" })
  );
  await expect.poll(playState, { timeout: 4000 }).toBe("paused");

  // de volta à vista mas com o separador «escondido» → continua parado
  await orbe.scrollIntoViewIfNeeded();
  await expect.poll(playState, { timeout: 4000 }).toBe("running");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(playState, { timeout: 4000 }).toBe("paused");

  // separador de volta → retoma
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => false,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(playState, { timeout: 4000 }).toBe("running");
});

test("o canvas do CampoCentimos pára fora do ecrã e com o separador escondido", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/estilo", { waitUntil: "domcontentloaded" });
  const canvas = page.locator("#campo-centimos canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);

  // amostra de pixels por getImageData — locator.screenshot() faria
  // scroll para o elemento e estragava o teste «fora do ecrã»
  const amostra = () =>
    page.evaluate(() => {
      const c = document.querySelector("#campo-centimos canvas");
      if (!c) return -1;
      const d = c
        .getContext("2d")!
        .getImageData(0, 0, c.width, c.height).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 4096) h = (h * 31 + d[i]) >>> 0;
      return h;
    });
  const mudou = async (espera = 450) => {
    const a = await amostra();
    await page.waitForTimeout(espera);
    return (await amostra()) !== a;
  };

  // em repouso a moeda oscila — a tela muda de conteúdo
  expect(await mudou(), "o campo não está a animar à vista").toBe(true);

  // fora do ecrã — o IntersectionObserver corta o rAF
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(300);
  expect(await mudou(), "o canvas continuou a pintar fora do ecrã").toBe(
    false
  );

  // de volta à vista — retoma
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await mudou(), "o canvas não retomou ao voltar à vista").toBe(true);

  // separador escondido — visibilitychange corta o rAF mesmo à vista
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(300);
  expect(
    await mudou(),
    "o canvas continuou a pintar com o separador escondido"
  ).toBe(false);

  // e o marquee ambiente também parou (PausaAmbiente, mesmo gatilho)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(200);
  const ticker = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector(".ticker-track")!)
        .animationPlayState
  );
  expect(ticker).toBe("paused");

  // restaura — tudo retoma
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => false,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            getComputedStyle(document.querySelector(".ticker-track")!)
              .animationPlayState
        ),
      { timeout: 4000 }
    )
    .toBe("running");
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await mudou(), "o canvas não retomou depois do separador").toBe(
    true
  );
});
