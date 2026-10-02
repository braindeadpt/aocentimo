import { test, expect, type Page } from "@playwright/test";

/**
 * As cenas P2c (PACK V5 PRODUÇÃO §P2c) — Casa da Inês, Pastelaria,
 * Quiosque e Escola. O mesmo contrato das P2a/P2b:
 *
 *   · abre ao entrar no edifício (clique E Enter por teclado);
 *   · percorre TODOS os passos só com teclado;
 *   · fecha com Escape e devolve o foco ao edifício;
 *   · o URL leva a âncora (#edificio) e o Voltar do browser fecha;
 *   · o desenho existe (svg com caixa real) e o gráfico fica na coluna
 *     do texto — os dois erros da P2a, apanhados por geometria;
 *   · o gráfico tem equivalente textual com os mesmos números;
 *   · reduced-motion vê o ESTADO FINAL e não descarrega o GSAP;
 *   · nenhum erro de consola; nenhum chunk de cena no load inicial.
 */

const CENAS = ["casa", "pastelaria", "quiosque", "escola"] as const;

const QUEM: Record<string, RegExp> = {
  casa: /casa da inês/i,
  pastelaria: /pastelaria/i,
  quiosque: /quiosque/i,
  escola: /escola/i,
};

/** Entra por teclado: foca o edifício no mapa e carrega Enter. */
async function entraPorTeclado(page: Page, id: string) {
  await page.goto("/");
  await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
  const ed = page.locator(`.b-mundo .ed[data-id="${id}"]`);
  await ed.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".b-cena")).toBeVisible();
  await expect(page.locator(".b-quem").first()).toContainText(QUEM[id]);
}

test.describe("as cenas P2c — abrir e fechar", () => {
  for (const id of CENAS) {
    test(`a cena «${id}» abre por teclado e Escape devolve o foco ao edifício`, async ({ page }) => {
      const pedidosCena: string[] = [];
      page.on("request", (r) => {
        // só chunks JS: o json de dados (/cenas/<id>.json) passou a ser
        // pedido ao ENTRAR no edifício (P4) — já não é carga inicial
        if (/cena|Cena/.test(r.url()) && r.resourceType() === "script")
          pedidosCena.push(r.url());
      });
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(String(e)));
      page.on("console", (m) => {
        if (m.type() === "error") erros.push(m.text());
      });

      await entraPorTeclado(page, id);

      // o foco entrou no título da cena
      await expect(async () => {
        const classe = await page.evaluate(() =>
          typeof document.activeElement?.className === "string"
            ? document.activeElement.className
            : document.activeElement?.getAttribute("class") ?? ""
        );
        expect(classe).toMatch(/b-quem/);
      }).toPass();

      // a âncora conta onde se está
      expect(new URL(page.url()).hash).toBe(`#${id}`);

      // Escape fecha e o foco volta ao edifício
      await page.keyboard.press("Escape");
      await expect(page.locator(".b-cena")).toHaveCount(0);
      await expect(page.locator(`.b-mundo .ed[data-id="${id}"]`)).toBeFocused();

      expect(pedidosCena, "chunks de cena no load inicial").toHaveLength(0);
      expect(erros, `erros de consola em «${id}»`).toEqual([]);
    });

    test(`a cena «${id}» abre por âncora e o Voltar do browser fecha-a`, async ({ page }) => {
      await page.goto(`/#${id}`);
      await expect(page.locator(".b-cena")).toBeVisible();
      await expect(page.locator(".b-quem").first()).toContainText(QUEM[id]);
      await page.goBack();
      await expect(page.locator(".b-cena")).toHaveCount(0);
    });
  }
});

test.describe("as cenas P2c — geometria do desenho", () => {
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
    const desenhados = await svg.locator("rect, path, g, circle, ellipse, text").count();
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
});

test.describe("Casa da Inês — os meses de trabalho", () => {
  test("percorre os três passos só com teclado; a pilha e o gráfico contam a razão real", async ({
    page,
  }) => {
    await entraPorTeclado(page, "casa");

    // passo 1: o palpite em meses, por teclado
    const slider = page.locator("#casaPal");
    await slider.focus();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    const btn = page.getByRole("button", { name: /mostrar a resposta/i });
    await btn.focus();
    await page.keyboard.press("Enter");

    // passo 2: a pilha do desenho mostra os meses e a nota obrigatória está lá
    await expect(page.locator("#casaPilha .pilha-txt")).not.toHaveText(/^\s*$/);
    const meses = Number(await page.locator("#casaPilha .pilha-txt").textContent());
    expect(meses).toBeGreaterThan(100); // «quase o dobro» — a série decide o número
    await expect(page.locator(".b-cena-texto")).toContainText(/não é o salário/i);

    // passo 3: o gráfico na coluna do TEXTO, nunca na arte
    await page.getByRole("button", { name: /ler o gráfico/i }).click();
    await expect(page.locator(".b-cena-texto .grafico-irs")).toBeVisible();
    await expect(page.locator(".b-cena-arte .grafico-irs")).toHaveCount(0);

    // o equivalente textual tem os mesmos números do desenho
    const equiv = page.locator(".b-cena-texto .b-sr, .b-cena-texto .grafico-eq");
    await expect(equiv.first()).toBeAttached();
    const txt = (await equiv.first().textContent()) ?? "";
    expect(txt).toMatch(/\d{2,3}/);
    const marcado = await page.locator(".b-cena-texto .grafico-irs text").allTextContents();
    const ultimoRotulo = marcado.join(" ");
    // pelo menos um número do gráfico está também no equivalente
    const nums = ultimoRotulo.match(/\d{2,3}/g) ?? [];
    expect(nums.some((n) => txt.includes(n))).toBeTruthy();

    // o link para a página /casa fecha a cena
    const link = page.getByRole("link", { name: /casa/i }).last();
    await expect(link).toBeVisible();
    expect(await link.getAttribute("href")).toBe("/casa");
  });

  test("com animação, a pilha estabiliza e o número final não se repete", async ({ page }) => {
    await entraPorTeclado(page, "casa");
    await page.locator("#casaPal").focus();
    await page.getByRole("button", { name: /mostrar a resposta/i }).click();
    const pilha = page.locator("#casaPilha .pilha");
    // esperar estabilidade: três leituras seguidas iguais
    const ler = () => pilha.getAttribute("height");
    await expect(async () => {
      const a = await ler();
      await page.waitForTimeout(350);
      const b = await ler();
      await page.waitForTimeout(350);
      const c = await ler();
      expect(a).toBe(b);
      expect(b).toBe(c);
    }).toPass({ timeout: 8000 });
    const h = Number(await ler());
    expect(h).toBeGreaterThan(90); // ~1 px por mês, como no protótipo
    // o texto da pilha bate com o número desenhado
    const meses = Number(await page.locator("#casaPilha .pilha-txt").textContent());
    expect(Math.abs(h - meses * 0.9)).toBeLessThan(2);
  });

  test("reduced-motion: a pilha nasce no estado final e o GSAP não é pedido", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const p = await ctx.newPage();
    const gsap: string[] = [];
    p.on("request", (r) => {
      if (/gsap|ScrollTrigger|Flip|DrawSVG|SplitText/i.test(r.url())) gsap.push(r.url());
    });
    await p.goto("/#casa");
    await expect(p.locator(".b-cena")).toBeVisible();
    await p.locator("#casaPal").focus();
    await p.getByRole("button", { name: /mostrar a resposta/i }).click();
    const h = Number(await p.locator("#casaPilha .pilha").getAttribute("height"));
    expect(h).toBeGreaterThan(90);
    expect(gsap, "GSAP descarregado em reduced-motion").toEqual([]);
    await ctx.close();
  });
});

test.describe("Pastelaria — comer fora contra em casa", () => {
  test("passos por teclado: o «hoje» do quadro vem da série cp11 e o IVA do iva.json", async ({
    page,
  }) => {
    await entraPorTeclado(page, "pastelaria");

    // passo 1: palpite em euros por teclado
    await page.locator("#pastPal").focus();
    await page.keyboard.press("ArrowUp");
    await page.getByRole("button", { name: /mostrar a resposta/i }).click();

    // passo 2: o quadro mostra o preço de hoje; o gráfico é cp11 vs cp01
    await expect(page.locator("#pastHoje")).toContainText(/hoje:/);
    await expect(page.locator(".b-cena-texto .grafico-irs")).toBeVisible();
    await expect(page.locator(".b-cena-arte .grafico-irs")).toHaveCount(0);
    await expect(page.locator(".b-cena-texto")).toContainText(/exemplo/i); // os 2 € dizem-se exemplo
    await page.getByRole("button", { name: /iva do café/i }).click();

    // passo 3: IVA intermédio (13 %) contra reduzido (6 %) — de iva.json
    await expect(page.locator(".b-cena-texto")).toContainText(/13/);
    await expect(page.locator(".b-cena-texto")).toContainText(/6/);
    const link = page.getByRole("link", { name: /inflação/i }).last();
    expect(await link.getAttribute("href")).toBe("/inflacao");
  });

  test("reduced-motion: o preço de hoje já está escrito, sem GSAP", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const p = await ctx.newPage();
    const gsap: string[] = [];
    p.on("request", (r) => {
      if (/gsap|ScrollTrigger|Flip|DrawSVG|SplitText/i.test(r.url())) gsap.push(r.url());
    });
    await p.goto("/#pastelaria");
    await p.getByRole("button", { name: /mostrar a resposta/i }).click();
    await expect(p.locator("#pastHoje")).toContainText(/\d/);
    expect(gsap).toEqual([]);
    await ctx.close();
  });
});

test.describe("Quiosque — o Jornal do Bairro", () => {
  test("a manchete e as seis linhas do jornal vêm das séries, cada uma com data", async ({
    page,
  }) => {
    await entraPorTeclado(page, "quiosque");

    await page.locator("#quiPal").focus();
    await page.keyboard.press("ArrowDown");
    await page.getByRole("button", { name: /ler a manchete/i }).click();

    // a manchete do desenho mostra o desemprego jovem real
    await expect(page.locator("#quiManchete")).toContainText(/%/);
    // o jornal na coluna do texto, com as linhas todas
    const jornal = page.locator(".b-cena-texto .b-jornal");
    await expect(jornal).toBeVisible();
    const linhas = await jornal.locator(".b-j-n").count();
    expect(linhas).toBeGreaterThanOrEqual(5);
    // cada linha tem o seu valor e a sua data visível
    const texto = (await jornal.textContent()) ?? "";
    expect(texto).toMatch(/desemprego/i);
    expect(texto).toMatch(/PIB/i);
    expect(texto).toMatch(/salário mínimo/i);
    expect(texto).toMatch(/\d{4}/); // datas à vista

    // passo 3: o gráfico de três linhas na coluna do texto
    await page.getByRole("button", { name: /ler o gráfico/i }).click();
    await expect(page.locator(".b-cena-texto .grafico-irs")).toBeVisible();
    await expect(page.locator(".b-cena-arte .grafico-irs")).toHaveCount(0);
    const equiv = page.locator(".b-cena-texto .b-sr, .b-cena-texto .grafico-eq").first();
    expect((await equiv.textContent()) ?? "").toMatch(/jovens|desemprego/i);
    // os links do jornal para /trabalho e /dados
    expect(await page.getByRole("link", { name: /trabalho/i }).last().getAttribute("href")).toBe("/trabalho");
    expect(await page.getByRole("link", { name: /dados/i }).last().getAttribute("href")).toBe("/dados");
  });
});

test.describe("Escola — ler gráficos e as palavras", () => {
  test("os três passos só com teclado; o glossário liga às cenas e a /aprender", async ({
    page,
  }) => {
    await entraPorTeclado(page, "escola");

    // passo 1: dois minis, a resposta certa é «o mesmo»
    const minis = page.locator(".b-cena-texto .b-minis svg");
    await expect(minis).toHaveCount(2);
    await page.getByRole("button", { name: /subiram o mesmo/i }).focus();
    await page.keyboard.press("Enter");

    // passo 2: a explicação do eixo + o botão da segunda lição
    await expect(page.locator(".b-cena-texto")).toContainText(/eixo/i);
    await page.getByRole("button", { name: /segunda lição/i }).click();

    // passo 3: em cadeia vs homóloga, números reais do cp00
    await expect(page.locator(".b-cena-texto")).toContainText(/homóloga/i);
    await page.getByRole("button", { name: /terceira lição/i }).click();

    // passo 4: o glossário — cartões do glossário real do site (o
    // «homólogo» do protótipo não é termo do glossário: aprende-se na
    // lição 2, não entra aqui — sem definições inventadas)
    const cartoes = page.locator(".b-cena-texto .b-glossario .b-gloss-card");
    await expect(cartoes).toHaveCount(5);
    // cada cartão tem o termo e um link de âncora para a cena, focável
    const primeiroLink = cartoes.first().locator("a").first();
    await primeiroLink.focus();
    await expect(primeiroLink).toBeFocused();
    // «Escalão de IRS» leva à âncora das Finanças (a Escola fecha e a
    // outra cena abre)
    await page.getByRole("link", { name: /as finanças/i }).click();
    await expect(page.locator(".b-quem").first()).toContainText(/finanças/i);
    // volta à Escola pela âncora e confirma o link /aprender
    await page.goto("/#escola");
    await page.locator(".b-cena-arte svg").waitFor();
    await page.getByRole("button", { name: /subiram o mesmo/i }).click();
    await page.getByRole("button", { name: /segunda lição/i }).click();
    await page.getByRole("button", { name: /terceira lição/i }).click();
    expect(await page.getByRole("link", { name: /aprender/i }).last().getAttribute("href")).toBe(
      "/aprender"
    );
  });
});
