import { test, expect, type Page } from "@playwright/test";

/**
 * P3b — a pele V5 nas rotas (grupo 1: dinheiro).
 *
 * O que este spec prova, por rota:
 *
 *   1. a rota está marcada como migrada (`.rt5` no contentor) e a
 *      superfície veste o contrato — fundo `--chao`, texto `--tinta`;
 *   2. a ligação de volta ao edifício está no topo e aponta à âncora
 *      certa da home (o «Voltar ao bairro» do protótipo);
 *   3. a mobília usa a linguagem V5 — pílulas de traço grosso (3px)
 *      com sombra dura, cartões com traço e raio largo;
 *   4. em tema escuro a rota anoitece com a paleta V5 (o chão azul-
 *      noite, não o floor V4);
 *   5. a home não mudou: continua sem `.rt5` e sem ligações destas.
 */

const ROTAS: { rota: string; edificio: string; titulo: string }[] = [
  { rota: "/salario", edificio: "fabrica", titulo: "Fábrica" },
  { rota: "/irs", edificio: "financas", titulo: "Finanças" },
  { rota: "/impostos", edificio: "financas", titulo: "Finanças" },
  { rota: "/poupanca", edificio: "correios", titulo: "Correios" },
  { rota: "/credito", edificio: "banco", titulo: "Banco" },
  { rota: "/casa", edificio: "casa", titulo: "Casa da Inês" },
];

const PAPEL_CLARO = "rgb(255, 255, 255)";
const CHAO_CLARO = "rgb(246, 242, 234)";
const CHAO_NOITE = "rgb(20, 26, 51)";

async function fundoBody(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test.describe("a pele V5 nas rotas (P3b — grupo 1)", () => {
  for (const { rota, edificio, titulo } of ROTAS) {
    test(`${rota}: scope rt5, chão V5 e a ligação «Voltar ao bairro» → /#${edificio}`, async ({
      page,
    }) => {
      await page.goto(rota);
      await expect(page.locator(".rt5").first()).toBeAttached();

      // superfície: chão de papel, sem a grelha milimetrada da V4
      expect(await fundoBody(page)).toBe(CHAO_CLARO);

      // a ligação de volta ao edifício, no topo, aponta à âncora
      const lnk = page.locator(".lnk-edificio-a");
      await expect(lnk).toBeVisible();
      await expect(lnk).toHaveAttribute("href", `/#${edificio}`);
      await expect(lnk).toContainText(titulo);

      // a ligação veste a pílula do contrato: traço 3px + sombra dura
      const traco = await lnk.evaluate(
        (el) => getComputedStyle(el).borderTopWidth
      );
      expect(parseFloat(traco)).toBeGreaterThanOrEqual(2.5);
      const sombra = await lnk.evaluate(
        (el) => getComputedStyle(el).boxShadow
      );
      expect(sombra).not.toBe("none");

      // um cartão da página leva a mesma matéria (traço grosso + papel)
      const cartao = page.locator(".leitura").first();
      await expect(cartao).toBeAttached();
      const tracoCartao = await cartao.evaluate(
        (el) => getComputedStyle(el).borderTopWidth
      );
      expect(parseFloat(tracoCartao)).toBeGreaterThanOrEqual(2.5);
      expect(await cartao.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        PAPEL_CLARO
      );

      // o corpo da página fala Archivo (a pele), não a grotesca V4
      const fonte = await page.locator(".pg-frase").first().evaluate(
        (el) => getComputedStyle(el).fontFamily
      );
      expect(fonte.toLowerCase()).toContain("archivo");
    });

    test(`${rota}: em tema escuro o chão é a noite do bairro`, async ({
      page,
    }) => {
      // semeia a escolha antes do load — sem corrida com a hidratação
      await page.addInitScript(() =>
        localStorage.setItem("aocentimo-theme", "dark")
      );
      await page.goto(rota);
      await page.locator(".rt5").first().waitFor({ state: "attached" });
      expect(await fundoBody(page)).toBe(CHAO_NOITE);
    });
  }

  test("a home não leva a pele das rotas — sem .rt5 nem ligações", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
    expect(await page.locator(".rt5").count()).toBe(0);
    expect(await page.locator(".lnk-edificio").count()).toBe(0);
  });

  test("rotas por migrar (grupo 2/3) continuam sem a pele", async ({
    page,
  }) => {
    await page.goto("/dados");
    expect(await page.locator(".rt5").count()).toBe(0);
    await page.goto("/metodologia");
    expect(await page.locator(".lnk-edificio").count()).toBe(0);
  });
});
