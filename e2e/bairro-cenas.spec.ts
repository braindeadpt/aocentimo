import { test, expect, type Page } from "@playwright/test";

/**
 * As cenas P2a (PACK V5 PRODUÇÃO §P2a) — Fábrica, Finanças, Banco e
 * Mercearia. O que o pack exige de cada uma:
 *
 *   · abre ao entrar no edifício (clique E Enter por teclado);
 *   · percorre os passos só com teclado;
 *   · fecha com Escape e devolve o foco ao edifício;
 *   · o URL leva a âncora (#edificio) e o Voltar do browser fecha;
 *   · reduced-motion vê o ESTADO FINAL (a Fábrica sem GSAP mostra os
 *     totais logo a seguir ao passo 1);
 *   · nenhum erro de consola; nenhum chunk de cena no load inicial.
 */

const CENAS = ["fabrica", "financas", "banco", "mercearia"] as const;

/** O título da cena está no .b-quem (o foco entra aí). */
const QUEM: Record<string, RegExp> = {
  fabrica: /a fábrica/i,
  financas: /finanças/i,
  banco: /banco/i,
  mercearia: /mercearia/i,
};

test.describe("as cenas P2a — abrir, percorrer, fechar", () => {
  for (const id of CENAS) {
    test(`a cena do «${id}» abre por teclado, percorre e fecha com Escape devolvendo o foco`, async ({
      page,
    }) => {
      await page.goto("/");
      // zero chunks de cena no arranque: abrem só ao entrar
      const pedidosCena: string[] = [];
      page.on("request", (r) => {
        if (/cena|Cena/.test(r.url())) pedidosCena.push(r.url());
      });

      // esperar pelo mapa VIVO: o efeito que liga os ouvintes poe
      // data-vivo="1" no .b-mundo — sem isto, o Enter podia cair antes
      // da hidratação (foi o que partiu o CI)
      await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();

      // entrar por TECLADO: tab até ao edifício e Enter
      const ed = page.locator(`.b-mundo .ed[data-id="${id}"]`);
      await ed.focus();
      await page.keyboard.press("Enter");

      const cena = page.locator(".b-cena, .b-painel").first();
      await expect(cena).toBeVisible();
      await expect(page.locator(".b-quem").first()).toContainText(QUEM[id]);

      // o foco entrou no título da cena (className pode ser objeto nos SVG)
      await expect(async () => {
        const classe = await page.evaluate(() =>
          typeof document.activeElement?.className === "string"
            ? document.activeElement.className
            : document.activeElement?.getAttribute("class") ?? ""
        );
        expect(classe).toMatch(/b-quem/);
      }).toPass();

      // a âncora do URL conta onde se está
      expect(new URL(page.url()).hash).toBe(`#${id}`);

      // Escape fecha e o foco volta ao edifício
      await page.keyboard.press("Escape");
      await expect(cena).not.toBeVisible();
      await expect(ed).toBeFocused();

      // nenhum chunk de cena descarregado antes de entrar
      expect(pedidosCena, "chunks de cena no load inicial").toHaveLength(0);
    });
  }

  test("abrir o link /#banco abre a cena; o Voltar do browser fecha-a", async ({ page }) => {
    await page.goto("/#banco");
    const cena = page.locator(".b-cena, .b-painel").first();
    await expect(cena).toBeVisible();
    await expect(page.locator(".b-quem").first()).toContainText(/banco/i);

    await page.goBack();
    await expect(cena).not.toBeVisible();
  });

  test("a cena das Finanças percorre os passos só com teclado até ao gráfico", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
    const ed = page.locator('.b-mundo .ed[data-id="financas"]');
    await ed.focus();
    await page.keyboard.press("Enter");

    const cena = page.locator(".b-cena");
    await expect(cena).toBeVisible();

    // passo 1 → 2: tirar a senha (o botão tem o foco deão do título)
    await page.getByRole("button", { name: /tirar senha/i }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".b-fala")).toContainText(/senha A 023/i);

    // passo 2: o palpite — escolher «mais dinheiro» por teclado
    await page.getByRole("button", { name: /mais dinheiro/i }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".b-fala")).toContainText(/fica com mais/i);

    // passo 3 → 4: as gavetas enchem e o gráfico aparece
    await page.getByRole("button", { name: /aprender a ler o gráfico/i }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".grafico-irs")).toBeVisible();
    // a cómoda mostra o degrau: a gaveta ativa saiu
    await expect(page.locator(".gaveta.ativa")).toHaveCount(1);
    // o equivalente textual do gráfico: o aria-label com os dois números
    const aria = await page.locator(".grafico-irs").getAttribute("aria-label");
    expect(aria).toMatch(/degrau|taxa/i);
  });

  test("a cena do Banco refaz a prestação ao mexer no tempo (motor real, não fórmula da cena)", async ({ page }) => {
    await page.goto("/#banco");
    await expect(page.locator(".b-cena")).toBeVisible();
    // do passo 1 até à calculadora: senha, palpite, resposta, gráfico
    await page.getByRole("button", { name: /chamar a senha/i }).click();
    await page.getByRole("button", { name: /mostrar a resposta/i }).click();
    await page.getByRole("button", { name: /aprender a ler o gráfico/i }).click();

    const prest = () => page.locator(".b-calc-linha").nth(2).locator("b");
    const antes = await prest().innerText();

    // arrasta o tempo para o fim da série (a Euribor de hoje)
    const slider = page.locator("#banTempo");
    await slider.focus();
    await slider.fill(String((await slider.getAttribute("max"))!));
    const depois = await prest().innerText();
    expect(depois).not.toBe(antes);

    // o quadro de letras mostra a Euribor de hoje
    await expect(page.locator("#banPrest")).not.toHaveText(antes);
  });

  test("a mercearia mostra o talão do IVA com as taxas de data/", async ({ page }) => {
    await page.goto("/#mercearia");
    const cena = page.locator(".b-cena");
    await expect(cena).toBeVisible();

    await page.getByRole("button", { name: /mostrar a resposta/i }).click();
    await expect(page.locator(".b-subidas")).toBeVisible();

    await page.getByRole("button", { name: /aprender a ler o gráfico/i }).click();
    await expect(page.locator(".grafico-irs").first()).toBeVisible();

    await page.getByRole("button", { name: /ver o iva no talão/i }).click();
    const talao = page.locator(".b-talao");
    await expect(talao).toBeVisible();
    // as três taxas do Código do IVA (continente, 2026), vindas de data/
    await expect(talao).toContainText("6");
    await expect(talao).toContainText("13");
    await expect(talao).toContainText("23");
  });

  test("a fábrica mostra o estado final sem animação (reduced-motion) e o contador bate certo", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#fabrica");
    const painel = page.locator(".b-painel");
    await expect(painel).toBeVisible();

    // sem GSAP: ao entrar, a cena salta logo para o fim — os totais são
    // os da linha de referência (1 500 €), em CÊNTIMOS exatos de data/
    await expect(painel.locator(".contador")).toContainText(/1\s?166,83/);
    await expect(painel.locator(".b-fala")).toContainText(/chegam a casa/i);

    // e nenhuma moeda ficou esquecida no mapa
    const moedas = await page.locator(".moeda-salario").count();
    expect(moedas).toBe(0);
  });

  test("as quatro cenas não escrevem um único erro na consola", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") erros.push(m.text());
    });
    for (const id of CENAS) {
      await page.goto(`/#${id}`);
      await expect(page.locator(".b-cena, .b-painel").first()).toBeVisible();
      // um passo para dentro, para os efeitos correrem
      const btn = page.locator(".b-corpo button, .b-acoes button").first();
      if (await btn.isVisible()) await btn.click();
    }
    expect(erros, erros.join("\n")).toEqual([]);
  });
});

/**
 * O DESENHO das cenas — o defeito que os testes de texto não viam:
 * `arteHtml` tem de entrar dentro de um `<svg viewBox="0 0 640 470">`;
 * sem ele, o parser de HTML aninha os <rect> como elementos desconhecidos
 * e nada se desenha (o lado esquerdo ficava bege, vazio).
 */
test.describe("as cenas P2a — o desenho existe de facto", () => {
  const COM_ARTE = ["financas", "banco", "mercearia"] as const;
  const ECRAS = [
    { w: 1440, h: 900 },
    { w: 390, h: 844 },
  ] as const;

  /** O interior: um svg na coluna da arte, com caixa real e desenho dentro. */
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

  for (const id of COM_ARTE) {
    for (const { w, h } of ECRAS) {
      test(`«${id}» a ${w}×${h}: o interior está dentro de um svg com desenho`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await page.goto(`/#${id}`);
        await expect(page.locator(".b-cena")).toBeVisible();
        await esperaDesenho(page);
      });
    }
  }

  test("no Banco o gráfico fica na coluna de texto, o interior fica no desenho e o cursor segue o tempo", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/#banco");
    await expect(page.locator(".b-cena")).toBeVisible();
    await page.getByRole("button", { name: /chamar a senha/i }).click();
    await page.getByRole("button", { name: /mostrar a resposta/i }).click();
    await page.getByRole("button", { name: /aprender a ler o gráfico/i }).click();

    // o gráfico é da conversa (como no protótipo), não do desenho
    await expect(page.locator(".b-cena-texto .grafico-irs")).toBeVisible();
    await expect(page.locator(".b-cena-arte .grafico-irs")).toHaveCount(0);
    await esperaDesenho(page);

    // arrastar o tempo muda a prestação E o cursor do gráfico
    const prest = () => page.locator(".b-calc-linha").nth(2).locator("b").innerText();
    const cursor = () => page.locator(".b-cena-texto #banPa").getAttribute("cx");
    const antes = { prest: await prest(), cx: await cursor() };
    await page.locator("#banTempo").fill("0");
    const depois = { prest: await prest(), cx: await cursor() };
    expect(depois.prest).not.toBe(antes.prest);
    expect(depois.cx).not.toBe(antes.cx);

    // mudar o exemplo redesenha o gráfico — o cursor continua a mexer
    await page.locator(".b-exemplo summary").click();
    await page.locator("#banSpread").fill("2");
    await page.locator("#banTempo").fill("10");
    const cx1 = await cursor();
    await page.locator("#banTempo").fill("40");
    const cx2 = await cursor();
    expect(cx2).not.toBe(cx1);
  });

  test("nas Finanças o gráfico fica na coluna de texto e o interior continua desenhado", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/#financas");
    await expect(page.locator(".b-cena")).toBeVisible();
    await page.getByRole("button", { name: /tirar senha/i }).click();
    await page.getByRole("button", { name: /mais dinheiro/i }).click();
    await page.getByRole("button", { name: /aprender a ler o gráfico/i }).click();

    await expect(page.locator(".b-cena-texto .grafico-irs")).toBeVisible();
    await expect(page.locator(".b-cena-arte .grafico-irs")).toHaveCount(0);
    await esperaDesenho(page);
  });
});

/**
 * O «degrau» da Finanças bate com o desenho (P2a, revisão do dono):
 * ao entrar no passo do gráfico a cena recomeça nos 1 500 € — o texto e a
 * gaveta ativa dizem a mesma taxa — e mexer o slider muda os dois.
 */
test.describe("as cenas P2a — o degrau bate certo com a gaveta", () => {
  // na fala diz-se «escalão dos X %», no corpo «degrau dos X %»
  const degrauDo = async (loc: () => Promise<string>) =>
    (await loc()).match(/(?:degrau|escalão) dos (\d+,\d+)\s*%/i)?.[1] ?? null;
  // a gaveta é SVG: <g> não tem innerText — lê-se o textContent
  const taxaDaGaveta = async (page: Page) =>
    (await page
      .locator(".b-cena-arte .gaveta.ativa")
      .evaluate((el) => el.textContent ?? "")).match(/(\d+,\d+)\s*%/)?.[1] ?? null;

  test("a fala e o texto dizem o degrau da gaveta acesa; o slider muda os três", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/#financas");
    await expect(page.locator(".b-cena")).toBeVisible();
    await page.getByRole("button", { name: /tirar senha/i }).click();
    await page.getByRole("button", { name: /mais dinheiro/i }).click();
    await page.getByRole("button", { name: /aprender a ler o gráfico/i }).click();
    await expect(page.locator(".b-cena-texto .grafico-irs")).toBeVisible();

    const fala = () => page.locator(".b-fala").innerText();
    const corpo = () => page.locator(".b-cena-texto .b-corpo").innerText();
    const gaveta = () => taxaDaGaveta(page);

    // entrada: o protótipo recomeça em 1 500 € — texto, gaveta e ponto batem
    const naGaveta = await gaveta();
    expect(naGaveta, "há uma gaveta acesa no desenho").not.toBeNull();
    expect(await degrauDo(fala), "a fala diz o degrau que o desenho mostra").toBe(naGaveta);
    expect(await degrauDo(corpo), "o texto do gráfico diz o mesmo").toBe(naGaveta);

    // o slider muda a gaveta acesa E o degrau dos dois textos
    await page.locator("#finSal").fill("4000");
    const novo = await gaveta();
    expect(novo).not.toBe(naGaveta);
    await expect.poll(() => degrauDo(fala)).toBe(novo);
    await expect.poll(() => degrauDo(corpo)).toBe(novo);
  });
});

/**
 * A Fábrica COM movimento (P2a, revisão do dono): a corrida das moedas
 * tem de chegar ao fim — o e2e antigo só cobria reduced-motion, que
 * escreve o estado final direto e por isso passava com a corrida morta.
 * E o painel não pode tapar a fábrica nem o percurso.
 */
test.describe("as cenas P2a — a fábrica corre de verdade", () => {
  const contadores = (page: Page) => ({
    ss: page.locator(".b-painel .contador span").nth(0),
    irs: page.locator(".b-painel .contador span").nth(1),
    casa: page.locator(".b-painel .contador span").nth(2),
  });

  const EXACTOS = {
    ss: /^Seg\. Social: 521,25[\s  ]?€$/,
    irs: /^IRS: 168,17[\s  ]?€$/,
    casa: /^Chega a casa: 1[\s ]?166,83[\s  ]?€$/,
  };

  test("com animação os contadores enchem e FIXAM os totais exactos — também na 2.ª corrida", async ({
    page,
  }) => {
    // duas corridas completas + 3 leituras espaçadas em cada uma — não
    // cabe no timeout de 30 s por omissão
    test.setTimeout(90_000);
    await page.goto("/#fabrica");
    const painel = page.locator(".b-painel");
    await expect(painel).toBeVisible();

    const fixaExactos = async () => {
      // a fala final (passo 99) é quando o «Ver outra vez» aparece
      await expect(
        page.getByRole("button", { name: /ver outra vez/i }),
      ).toBeVisible({ timeout: 15_000 });
      // o final fixa os totais exactos — as leituras espaçadas apanham o
      // somar() que corria POR CIMA do valor já fixado: a rota da casa é
      // a mais comprida e as moedas dela chegavam depois do fim, até ao
      // dobro do líquido (medido em build: 2 333,66 €)
      for (const espera of [2_000, 5_000, 5_000]) {
        await page.waitForTimeout(espera);
        const c = contadores(page);
        await expect(c.ss).toHaveText(EXACTOS.ss);
        await expect(c.irs).toHaveText(EXACTOS.irs);
        await expect(c.casa).toHaveText(EXACTOS.casa);
      }
    };

    await fixaExactos();

    // «Ver outra vez»: os contadores vão a zero e a 2.ª corrida fixa igual
    await page.getByRole("button", { name: /ver outra vez/i }).click();
    await expect(contadores(page).ss).toContainText("0,00");
    await fixaExactos();
    await expect(painel.locator(".b-fala")).toContainText(/chegam a casa/i);
  });

  for (const { w, h } of [
    { w: 1440, h: 900 },
    { w: 390, h: 844 },
  ] as const) {
    test(`o painel não tapa a fábrica nem o percurso — ${w}×${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/#fabrica");
      const painel = page.locator(".b-painel");
      await expect(painel).toBeVisible();

      const ed = page.locator('.b-mundo .ed[data-id="fabrica"]');
      // a câmara desliza até enquadrar o percurso ao lado do painel —
      // mede-se quando ela assenta (o GSAP chega por chunk dinâmico)
      await expect(async () => {
        const a = await ed.boundingBox();
        const b = await painel.boundingBox();
        expect(a, "a fábrica tem caixa").not.toBeNull();
        expect(b, "o painel tem caixa").not.toBeNull();
        const cruza =
          a!.x < b!.x + b!.width &&
          a!.x + a!.width > b!.x &&
          a!.y < b!.y + b!.height &&
          a!.y + a!.height > b!.y;
        expect(cruza, "a fábrica fica debaixo do painel").toBe(false);
      }).toPass({ timeout: 15_000, intervals: [500, 800, 1200] });
    });
  }
});
