import { test, expect } from "@playwright/test";

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
