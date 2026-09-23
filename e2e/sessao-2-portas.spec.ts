import { test, expect, type Page } from "@playwright/test";

// S2-03 — «Escolhe a tua pergunta» (sessao-2): a entrada da home para
// o resto do site, em quatro cartões-porta com mini-prévia viva.
// Contratos cobertos aqui:
//  a) os quatro cartões são ligações inteiras para /salario /impostos
//     /credito /dados (as rotas dos grupos da navegação);
//  b) ao passar o rato o cartão inverte para papel — o computed
//     background muda para o talão (rgb(247,241,225)) e o raio vai a 0;
//  c) a prévia ganha vida: há animações CSS a correr dentro do cartão;
//  d) teclado: Tab até ao cartão dispara a mesma inversão
//     (:focus-visible/:focus-within — nada de JS);
//  e) reduced-motion: a inversão é instantânea (transition-duration 0)
//     e nada anima;
//  f) as mini-prévias têm dados reais — o recibo fecha a conta do
//     cenário canónico (bruto − SS − IRS = líquido), o talão separa o
//     IVA e a grelha de orbes mostra as seis séries do painel;
//  g) sem JS está tudo no HTML.
//
// Nota: a folha de estilo é src/app/_home/portas.css, importada pelo
// EscolhePergunta (co-localizada) — este spec só passa depois de a
// secção estar montada na home (page.tsx).

const PORTA_PAPEL = "rgb(247, 241, 225)"; // --talao-paper

const sec = (page: Page) =>
  page.getByRole("region", { name: "Escolhe a tua pergunta" });

/** passa-se directa a page.evaluate — autocontida (só globais do browser) */
const estilo = (el: HTMLElement) => {
  const c = getComputedStyle(el);
  return { bg: c.backgroundColor, raio: c.borderRadius, dur: c.transitionDuration };
};

test.describe("«Escolhe a tua pergunta» @1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("os quatro cartões linkam para as rotas dos grupos", async ({
    page,
  }) => {
    await page.goto("/");
    const s = sec(page);
    const rotas: Record<string, string> = {
      "O que ganhas": "/salario",
      "O que pagas": "/impostos",
      "O banco": "/credito",
      "O país": "/dados",
    };
    for (const [nome, href] of Object.entries(rotas)) {
      const lnk = s.getByRole("link", { name: nome });
      await expect(lnk).toBeVisible();
      await expect(lnk).toHaveAttribute("href", href);
    }
    // quatro portas, quatro prévias distintas — não são cartões iguais
    await expect(s.locator(".pq-porta")).toHaveCount(4);
    await expect(s.locator(".pq-recibo")).toHaveCount(1);
    await expect(s.locator(".pq-iva")).toHaveCount(1);
    await expect(s.locator(".pq-banco")).toHaveCount(1);
    await expect(s.locator(".pq-orbes")).toHaveCount(1);
  });

  test("ao passar o rato o cartão inverte para papel e a prévia anima", async ({
    page,
  }) => {
    await page.goto("/");
    const porta = sec(page).getByRole("link", { name: "O que ganhas" });
    await porta.scrollIntoViewIfNeeded();

    const antes = await porta.evaluate(estilo);
    expect(antes.bg).not.toBe(PORTA_PAPEL);

    await porta.hover();
    // a transição é --dur-curta (320 ms) — mede-se depois dela
    await page.waitForTimeout(450);
    const depois = await porta.evaluate(estilo);
    expect(depois.bg).toBe(PORTA_PAPEL);
    expect(depois.raio).toBe("0px"); // papel é cortado, não arredondado

    // a mini-prévia imprime: há animação viva dentro do cartão
    const recibo = porta.locator(".pq-recibo");
    const animados = await recibo.evaluate(
      (el) => el.getAnimations({ subtree: true }).length
    );
    expect(animados).toBeGreaterThan(0);
  });

  test("o foco de teclado dispara a mesma inversão", async ({ page }) => {
    // Tab por todos os pontos focáveis até à porta — dezenas de
    // press+evaluate; sob 2 workers não cabe no tecto de 30 s
    test.setTimeout(90_000);
    await page.goto("/");
    const s = sec(page);
    const porta = s.getByRole("link", { name: "O banco" });
    await porta.scrollIntoViewIfNeeded();

    // Tab real até à porta — o percurso do teclado conta
    let chegou = false;
    for (let i = 0; i < 80 && !chegou; i++) {
      await page.keyboard.press("Tab");
      chegou = await page.evaluate(
        () =>
          document.activeElement instanceof HTMLAnchorElement &&
          document.activeElement.classList.contains("pq-porta")
      );
    }
    expect(chegou).toBe(true);

    await page.waitForTimeout(450);
    const focado = await page.evaluate(() => {
      const c = getComputedStyle(document.activeElement as HTMLElement);
      return {
        bg: c.backgroundColor,
        raio: c.borderRadius,
        dur: c.transitionDuration,
      };
    });
    expect(focado.bg).toBe(PORTA_PAPEL);
    expect(focado.raio).toBe("0px");
  });

  test("reduced-motion: a inversão é instantânea e nada anima", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const porta = sec(page).getByRole("link", { name: "O que pagas" });
    await porta.scrollIntoViewIfNeeded();

    await porta.hover();
    // sem esperar: o bloco global corta transições — a inversão é já
    const depois = await porta.evaluate(estilo);
    expect(depois.dur).toBe("0s");
    expect(depois.bg).toBe(PORTA_PAPEL);

    // e nenhuma animação a correr dentro da prévia
    const aCorrer = await porta.evaluate(
      (el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === "running").length
    );
    expect(aCorrer).toBe(0);
  });

  test("o recibo em miniatura fecha a conta do cenário canónico", async ({
    page,
  }) => {
    await page.goto("/");
    const recibo = sec(page).locator(".pq-recibo");
    await expect(recibo).toContainText("SALÁRIO BRUTO");
    await expect(recibo).toContainText("Líquido no fim do mês");

    // bruto − Seg. Social − IRS = líquido, com os números reais do build
    // (o parse é inline: evaluate não leva closures para o browser)
    const valores = await recibo.evaluate((el) =>
      [...el.querySelectorAll("dd")].map((dd) =>
        Number(
          (dd.textContent ?? "").replace(/[^\d,]/g, "").replace(",", ".")
        )
      )
    );
    expect(valores).toHaveLength(4);
    const [bruto, ss, irs, liquido] = valores;
    expect(bruto).toBeGreaterThan(0);
    expect(Math.abs(bruto - ss - irs - liquido)).toBeLessThan(0.01);
  });

  test("o talão separa o IVA e a grelha de orbes mostra as séries", async ({
    page,
  }) => {
    await page.goto("/");
    const s = sec(page);

    // o IVA real (23 % de data/fiscal/iva.json) e o cupão-resumo
    // (\s* cobre o FINO U+202F que fmtPct põe antes do «%»)
    const iva = s.locator(".pq-iva");
    await expect(iva).toContainText(/IVA 23\s?%/);
    await expect(iva).toContainText("Deste total é IVA");
    const fatias = await iva.locator(".pq-iva-fatia").count();
    expect(fatias).toBe(3);

    // o banco: a divisória juro/capital existe com os dois extremos
    const banco = s.locator(".pq-banco");
    await expect(banco).toContainText("mês 1");
    const juro = banco.locator(".pq-banco-juro");
    await expect(juro).toBeVisible();
    const w = await juro.evaluate(
      (el) => (el as HTMLElement).style.width
    );
    expect(parseFloat(w)).toBeGreaterThan(50); // 1.ª prestação: quase tudo juro
    expect(parseFloat(w)).toBeLessThan(80);

    // o país: seis orbes, cada um com o estado também em texto
    const orbes = s.locator(".pq-orbes .orbe-estado");
    await expect(orbes).toHaveCount(6);
    await expect(s.locator(".pq-orbes")).toContainText("em dia");
  });
});

test.describe("«Escolhe a tua pergunta» — sem JS", () => {
  test("ligações e prévias estão no HTML", async ({ browser }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto("/");
    const s = sec(page);
    for (const href of ["/salario", "/impostos", "/credito", "/dados"]) {
      await expect(s.locator(`a[href^="${href}"]`)).toHaveCount(1);
    }
    // o recibo nasce impresso — o estado final está no HTML
    const recibo = s.locator(".pq-recibo");
    await expect(recibo).toContainText("SALÁRIO BRUTO");
    await expect(recibo).toContainText("Líquido no fim do mês");
    await expect(s.locator(".pq-orbes .orbe-estado")).toHaveCount(6);
    await ctx.close();
  });
});
