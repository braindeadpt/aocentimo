import { test, expect } from "@playwright/test";

// 1B-01 — a folha de ícones em /estilo: o conjunto fechado completo,
// cada nome listado, e o contrato de acessibilidade (aria-hidden por
// omissão; ícones de acção dentro de controlos com nome acessível).

const CONJUNTO = [
  "salario", "irs", "trabalho", "impostos", "precos", "inflacao",
  "credito", "casa", "poupanca", "dados", "aprender",
  "ver", "json", "copiar-ligacao", "repor", "abrir", "menu",
  "pesquisa", "sol", "lua",
  "em-dia", "a-recolher", "atrasado", "aviso", "informacao",
] as const;

test("/estilo lista o conjunto fechado completo, cada nome com o seu desenho", async ({
  page,
}) => {
  await page.goto("/estilo");
  const celulas = page.locator("#icones [data-icone]");
  await expect(celulas).toHaveCount(CONJUNTO.length);
  const nomes = await celulas.evaluateAll((els) =>
    els.map((el) => el.getAttribute("data-icone"))
  );
  expect(nomes.sort()).toEqual([...CONJUNTO].sort());
  // cada célula mostra o svg e escreve o nome
  for (const n of CONJUNTO) {
    const celula = page.locator(`#icones [data-icone="${n}"]`);
    await expect(celula.locator("svg.icone")).toHaveCount(1);
    await expect(celula).toContainText(n);
  }
});

test("todos os ícones da folha são decorativos (aria-hidden)", async ({
  page,
}) => {
  await page.goto("/estilo");
  const icones = page.locator("#icones svg.icone");
  const n = await icones.count();
  expect(n).toBeGreaterThanOrEqual(25);
  for (let i = 0; i < n; i++) {
    await expect(icones.nth(i)).toHaveAttribute("aria-hidden", "true");
  }
});

test("ícones de acção vivem dentro de controlos com nome acessível", async ({
  page,
}) => {
  await page.goto("/estilo");
  // cada botão/ligação da demo tem aria-label — o svg lá dentro está
  // escondido; quem ouve o ecrã escuta o nome do controlo
  const controlos = page.locator(
    "#icones button:has(svg.icone), #icones a:has(svg.icone)"
  );
  const n = await controlos.count();
  expect(n).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < n; i++) {
    const c = controlos.nth(i);
    await expect(c).toHaveAttribute("aria-label", /.+/);
    await expect(c.locator("svg.icone")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  }
});

test("o IconeEmblema monta no cabeçalho do Cartao", async ({ page }) => {
  await page.goto("/estilo");
  // a demo da anatomia (secção do Cartao) usa a prop icone → emblema
  const emblema = page.locator(".leitura-head .icone-emblema");
  await expect(emblema.first()).toBeVisible();
  await expect(emblema.first().locator("svg.icone")).toHaveCount(1);
});

test("o traço desenha-se ao passar o controlo e pára (uma vez, micro)", async ({
  page,
}) => {
  await page.goto("/estilo");
  const botao = page.locator(
    '#icones button[aria-label="Repor valores"]'
  );
  const traco = botao.locator("svg.icone path").first();
  // em repouso: desenhado, sem animação
  expect(await traco.evaluate((el) => getComputedStyle(el).animationName))
    .toBe("none");
  // ao passar: a animação corre uma vez em --dur-micro
  await botao.hover();
  const correndo = await traco.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { nome: cs.animationName, dur: cs.animationDuration, iter: cs.animationIterationCount };
  });
  expect(correndo.nome).toBe("icone-desenha");
  expect(correndo.iter).toBe("1");
  expect(parseFloat(correndo.dur)).toBeLessThanOrEqual(0.2);
  // fim da animação: volta a ficar quieta e desenhada
  await expect
    .poll(async () =>
      traco.evaluate((el) => getComputedStyle(el).strokeDashoffset)
    )
    .toBe("0px");
});

test("em reduced-motion o traço nasce desenhado — nada anima", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/estilo");
  const botao = page.locator(
    '#icones button[aria-label="Repor valores"]'
  );
  await botao.hover();
  const traco = botao.locator("svg.icone path").first();
  expect(await traco.evaluate((el) => getComputedStyle(el).animationName))
    .toBe("none");
  expect(await traco.evaluate((el) => getComputedStyle(el).strokeDashoffset))
    .toBe("0px");
});
