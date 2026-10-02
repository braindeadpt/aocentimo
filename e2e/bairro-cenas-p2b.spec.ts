import { test, expect, type Page } from "@playwright/test";

/**
 * As cenas P2b (PACK V5 PRODUÇÃO §P2b) — Correios, Bomba e Segurança
 * Social. O mesmo contrato das P2a:
 *
 *   · abre ao entrar no edifício (âncora E teclado);
 *   · percorre TODOS os passos só com teclado;
 *   · fecha com Escape e devolve o foco ao edifício; o Voltar fecha;
 *   · o desenho existe de facto (svg com caixa e ≥10 elementos), a
 *     1440×900 e a 390×844;
 *   · o gráfico vai na coluna do texto (.b-corpo), nunca por cima da arte;
 *   · com animação os valores terminam e FICAM estáveis (o defeito da
 *     Fábrica: um callback tardio somava por cima do valor fixado);
 *   · reduced-motion = estado final imediato e o chunk do GSAP nem é
 *     pedido;
 *   · 0 erros de consola; nenhum chunk de cena no load inicial.
 */

const CENAS = ["correios", "bomba", "segsocial"] as const;

const QUEM: Record<string, RegExp> = {
  correios: /correios/i,
  bomba: /bomba/i,
  segsocial: /segurança social/i,
};

/** Percorre a cena inteira só com teclado, até às acções finais. */
async function percorre(page: Page, id: string) {
  const ed = page.locator(`.b-mundo .ed[data-id="${id}"]`);
  await ed.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".b-cena")).toBeVisible();

  const entra = async (nome: RegExp) => {
    const b = page.getByRole("button", { name: nome }).first();
    await b.focus();
    await page.keyboard.press("Enter");
  };

  if (id === "correios") {
    await entra(/chamar a senha/i); // 1 → 2
    await entra(/mostrar a resposta/i); // 2 → 3 (palpite respondido)
    await entra(/certificados/i); // 3 → 4
    await expect(page.locator(".b-corpo .b-calc")).toBeVisible();
    await entra(/aprender a ler o gráfico/i); // 4 → 5
    await expect(page.locator(".b-corpo .grafico-irs")).toBeVisible();
    await expect(page.locator('.b-cena a[href="/poupanca"]')).toBeVisible();
  } else if (id === "bomba") {
    await entra(/atestar e ver a resposta/i); // 1 → 2
    await entra(/aprender a ler o gráfico/i); // 2 → 3
    await expect(page.locator(".b-corpo .grafico-irs")).toBeVisible();
    await expect(page.locator('.b-cena a[href="/precos"]')).toBeVisible();
  } else {
    await entra(/chamar a senha/i); // 1 → 2
    await entra(/mostrar a resposta/i); // 2 → 3
    await entra(/recibos verdes/i); // 3 → 4
    await expect(page.locator(".b-barras-quem")).toBeVisible();
    await expect(page.locator('.b-cena a[href="/salario"]')).toBeVisible();
  }
}

test.describe("as cenas P2b — abrir, percorrer, fechar", () => {
  for (const id of CENAS) {
    test(`a cena «${id}» abre por teclado, percorre os passos e fecha com Escape devolvendo o foco`, async ({
      page,
    }) => {
      const pedidosCena: string[] = [];
      page.on("request", (r) => {
        if (/cena|Cena/.test(r.url())) pedidosCena.push(r.url());
      });

      await page.goto("/");
      await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
      // nenhum chunk de cena no arranque
      expect(pedidosCena, "chunks de cena no load inicial").toHaveLength(0);

      await percorre(page, id);

      // Escape fecha e o foco volta ao edifício
      const ed = page.locator(`.b-mundo .ed[data-id="${id}"]`);
      await page.keyboard.press("Escape");
      await expect(page.locator(".b-cena")).not.toBeVisible();
      await expect(ed).toBeFocused();
    });

    test(`«${id}» abre pelo link /#${id} e o Voltar do browser fecha-a`, async ({ page }) => {
      await page.goto(`/#${id}`);
      await expect(page.locator(".b-cena")).toBeVisible();
      await expect(page.locator(".b-quem").first()).toContainText(QUEM[id]);
      await page.goBack();
      await expect(page.locator(".b-cena")).not.toBeVisible();
    });
  }
});

/* ————— o desenho existe de facto (o defeito que os testes de texto não
   viam em P2a): svg à volta do interior, caixa real, elementos a sério ——— */
test.describe("as cenas P2b — geometria do desenho e do gráfico", () => {
  const ECRAS = [
    { w: 1440, h: 900 },
    { w: 390, h: 844 },
  ] as const;

  async function esperaDesenho(page: Page) {
    const svg = page.locator(".b-cena .b-cena-arte > svg").first();
    await expect(svg).toBeAttached();
    const caixa = await svg.boundingBox();
    expect(caixa, "a caixa do svg da arte").not.toBeNull();
    expect(caixa!.width).toBeGreaterThanOrEqual(250);
    expect(caixa!.height).toBeGreaterThanOrEqual(150);
    const desenhados = await svg.locator("rect, path, g, circle").count();
    expect(desenhados, "elementos desenhados dentro do svg da arte").toBeGreaterThanOrEqual(10);
  }

  for (const id of CENAS) {
    for (const { w, h } of ECRAS) {
      test(`«${id}» a ${w}×${h}: o interior está dentro de um svg com desenho`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await page.goto(`/#${id}`);
        await expect(page.locator(".b-cena")).toBeVisible();
        await esperaDesenho(page);
      });
    }
  }

  test("nos Correios e na Bomba o gráfico fica na coluna do texto, nunca sobre o desenho", async ({
    page,
  }) => {
    for (const [id, passos] of [
      ["correios", [/chamar a senha/i, /mostrar a resposta/i, /certificados/i, /aprender a ler o gráfico/i]],
      ["bomba", [/atestar e ver a resposta/i, /aprender a ler o gráfico/i]],
    ] as const) {
      await page.goto(`/#${id}`);
      await expect(page.locator(".b-cena")).toBeVisible();
      for (const nome of passos) await page.getByRole("button", { name: nome }).first().click();
      await expect(page.locator(".b-cena-texto .grafico-irs")).toBeVisible();
      await expect(page.locator(".b-cena-arte .grafico-irs")).toHaveCount(0);
      await esperaDesenho(page);
    }
  });
});

/* ————— os valores, com e sem animação ——— */
test.describe("as cenas P2b — os números certos", () => {
  test("na Segurança Social os valores do recibo são os da Fábrica (165,00 + 356,25 = 521,25 €)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#segsocial");
    await expect(page.locator(".b-cena")).toBeVisible();
    await page.getByRole("button", { name: /chamar a senha/i }).click();
    await page.getByRole("button", { name: /mostrar a resposta/i }).click();

    const recibo = page.locator(".b-cena .b-talao");
    await expect(recibo).toBeVisible();
    await expect(recibo).toContainText(/165,00/);
    await expect(recibo).toContainText(/356,25/);
    await expect(recibo).toContainText(/521,25/);
    // e o mealheiro mostra o mesmo total — sem animação é o estado final
    await expect(page.locator("#ssMealTxt")).toHaveText(/521,25/);
  });

  test("na Bomba as camadas do litro enchem e o mostrador para no total exacto", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/#bomba");
    await expect(page.locator(".b-cena")).toBeVisible();
    await page.getByRole("button", { name: /atestar e ver a resposta/i }).click();

    // o mostrador corre 0 → 50 L → total e PARA (3 leituras espaçadas)
    const litros = page.locator("#bmbLit");
    const eur = page.locator("#bmbEur");
    await expect(litros).toHaveText(/50,00/, { timeout: 15_000 });
    const leituras: string[] = [];
    for (const espera of [1_000, 2_000, 2_000]) {
      await page.waitForTimeout(espera);
      leituras.push((await eur.textContent()) + "|" + (await litros.textContent()));
    }
    expect(new Set(leituras).size, "o mostrador não pode mexer depois de parar").toBe(1);

    // as quatro camadas + o IVA sobre imposto têm altura real > 0
    for (const cam of ["cam-produto", "cam-isp", "cam-carbono", "cam-iva", "cam-ivaimp"]) {
      const h = await page.locator(`#${cam}`).getAttribute("height");
      expect(+h!, `${cam} com altura > 0`).toBeGreaterThan(0);
    }

    // trocar para gasóleo refaz as camadas e o mostrador
    await page.getByRole("button", { name: /^gasóleo$/i }).click();
    await expect(page.locator("#bmbTipo")).toHaveText(/gasóleo/i);
  });

  test("nos Correios as pilhas de notas crescem e fixam — incluindo a linha do poder de compra", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto("/#correios");
    await expect(page.locator(".b-cena")).toBeVisible();
    await page.getByRole("button", { name: /chamar a senha/i }).click();
    await page.getByRole("button", { name: /mostrar a resposta/i }).click();
    await page.getByRole("button", { name: /certificados/i }).click();

    // a pilha dos certificados aparece e cresce; as alturas FIXAM.
    // Espera-se estabilidade (duas amostras iguais a 800 ms de
    // distância), não um relógio fixo: o chunk do GSAP pode chegar
    // tarde e o tween arrancar depois — mas NADA pode mexer depois
    // de parar (o defeito da Fábrica).
    const alturas = async () =>
      (await page.locator("#pilhaCA .p-notas").getAttribute("height")) +
      "|" +
      (await page.locator("#pilhaCol .p-notas").getAttribute("height"));
    await expect(page.locator("#pilhaCA")).toBeVisible();
    let prev = "";
    const estavel = await expect
      .poll(
        async () => {
          const a = await alturas();
          const ok = a === prev && !/^(0|0\.\d+)\|/.test(a) && !a.endsWith("|0");
          prev = a;
          return ok ? a : "";
        },
        { timeout: 25_000, intervals: [800] }
      )
      .not.toBe("");
    await estavel;
    const fixo = prev;
    await page.waitForTimeout(2_000);
    expect(await alturas(), "as pilhas não mexem depois de fixar").toBe(fixo);
  });
});

/* ————— reduced-motion: estado final imediato, sem o chunk do GSAP ——— */
test.describe("as cenas P2b — reduced-motion", () => {
  for (const id of CENAS) {
    test(`«${id}» mostra o estado final sem animação e não pede o GSAP`, async ({ page }) => {
      const pedidosGsap: string[] = [];
      const erros: string[] = [];
      page.on("request", (r) => {
        if (/gsap|ScrollTrigger|Flip|DrawSVG|SplitText/i.test(r.url())) pedidosGsap.push(r.url());
      });
      page.on("console", (m) => {
        if (m.type() === "error") erros.push(m.text());
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/#${id}`);
      await expect(page.locator(".b-cena")).toBeVisible();

      // percorre a cena toda com cliques — cada passo mostra o estado final
      await percorre(page, id);

      expect(pedidosGsap, `o GSAP foi pedido com reduce: ${pedidosGsap.join(", ")}`).toEqual([]);
      expect(erros, erros.join("\n")).toEqual([]);
    });
  }
});
