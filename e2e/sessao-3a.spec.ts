import { test, expect } from "@playwright/test";

/**
 * Sessão 3A — «O que ganhas»: /salario, /irs, /trabalho no template
 * de três níveis (Pagina).
 *
 * Por página, o contrato do bloco 3A-04:
 *  · os três níveis existem — a pergunta (h1 único), «2 · Explora» e
 *    «3 · Confirma» como landmarks etiquetados;
 *  · um número herói no HTML do servidor — a resposta lê-se sem JS
 *    (corre num projecto com javaScriptEnabled: false);
 *  · zero pageerror;
 *  · a pergunta seguinte liga e aterra na rota certa.
 *
 * Não mede animação nem canvas — isso é da coreografia e dos
 * componentes; aqui conta-se a estrutura e a resposta.
 */

// os valores formatados levam o fino inseparável (U+202F) entre número
// e unidade — nos regexes o espaço é sempre \s, nunca o ASCII
const PAGINAS = [
  {
    rota: "/salario",
    pergunta: /quanto vais receber mesmo/i,
    heroNoHtml: /\d[\d\s]*,\d{2}\s*€/, // o líquido canónico, formatado
    seguinte: { href: "/irs", rotulo: /recebes ou pagas/i },
  },
  {
    rota: "/irs",
    pergunta: /subir de escalão faz-te perder dinheiro/i,
    heroNoHtml: /\d[\d\s]*\s*€/, // a coleta do cenário canónico
    seguinte: { href: "/trabalho", rotulo: /ficares sem trabalho/i },
  },
  {
    rota: "/trabalho",
    pergunta: /se ficares sem trabalho/i,
    heroNoHtml: /\d[\d\s]*,\d{2}\s*€\s*\/\s*mês/, // a mensalidade canónica
    seguinte: { href: "/impostos", rotulo: /volta ao estado/i },
  },
];

test.describe("3A — os três níveis e a resposta", () => {
  for (const p of PAGINAS) {
    test(`${p.rota} — três níveis, herói visível, zero pageerror`, async ({
      page,
    }) => {
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(String(e)));
      await page.goto(p.rota);

      // nível 1 — a pergunta é o h1 único e nomeia a secção
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText(p.pergunta);

      // níveis 2 e 3 — landmarks com h2 próprio
      await expect(
        page.getByRole("heading", { name: "Explora", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Confirma", exact: true })
      ).toBeVisible();
      await expect(page.locator(".pg-nivel")).toHaveCount(3);

      // UM instrumento e UMA frase no nível 1
      await expect(page.locator(".pg-instrumento > *")).toHaveCount(1);
      await expect(page.locator(".pg-frase").first()).toBeVisible();

      // o número herói está no ecrã
      await expect(page.locator(".num-hero").first()).toBeVisible();

      // nível 3 fechado por omissão, e abre ao clicar no rótulo
      const detalhe = page.locator("details.pg-detalhe").first();
      await expect(detalhe).not.toHaveAttribute("open", "");
      await detalhe.locator("summary").click();
      await expect(detalhe).toHaveAttribute("open", "");

      // a pergunta seguinte liga e aterra
      const seg = page.locator(".pg-seguinte a");
      await expect(seg).toHaveAttribute("href", p.seguinte.href);
      await expect(seg).toContainText(p.seguinte.rotulo);
      await seg.click();
      await page.waitForURL(`**${p.seguinte.href}`);
      expect(page.url()).toContain(p.seguinte.href);

      expect(erros, "pageerrors em " + p.rota).toEqual([]);
    });
  }
});

test("4B-02 — /irs nível 1 fala em bruto; «rendimento coletável» vive no nível 2", async ({
  page,
}) => {
  await page.goto("/irs");
  const niveis = page.locator(".pg-nivel");
  const nivel1 = niveis.first();

  // a régua mede o número da pessoa, não o do fisco
  await expect(nivel1.getByLabel("Salário bruto anual")).toBeAttached();
  await expect(nivel1).toContainText(/brutos por ano/i);
  // nenhum «coletável» no nível 1 — nem como substantivo solto
  await expect(nivel1).not.toContainText(/coletáv/i);

  // o termo fica no nível 2, com o exemplo numérico do canónico
  const nivel2 = niveis.nth(1);
  await expect(nivel2).toContainText(/rendimento coletável/i);
  await expect(nivel2).toContainText(/\d{2}\s?\d{3}\s*€/);
});

test.describe("3A — a resposta sem JS", () => {
  test.use({ javaScriptEnabled: false });

  for (const p of PAGINAS) {
    test(`${p.rota} — o número herói está no HTML do servidor`, async ({
      page,
    }) => {
      await page.goto(p.rota);
      // sem JS não há tween nem régua: o valor final do cenário
      // canónico tem de estar pintado no HTML
      const hero = page.locator(".num-hero").first();
      await expect(hero).toBeAttached();
      await expect(hero).toContainText(p.heroNoHtml);
      // e a frase da resposta também é SSR
      await expect(page.locator(".pg-frase").first()).not.toBeEmpty();
    });
  }
});
