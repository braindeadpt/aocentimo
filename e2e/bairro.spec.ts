import { test, expect } from "@playwright/test";

/**
 * A home do bairro (P1-5 do PACK V5 PRODUCAO, §P1 item 6).
 *
 * Substitui a cobertura que a home V4 tinha nos `sessao-2-*` (o herói, o
 * painel e as portas saíram da página quando ela passou a ser o mapa).
 * O que fica aqui é o que o protótipo promete e o pack exige:
 *
 *   · o mapa tem os onze edifícios, focáveis e com nome;
 *   · os marcadores mostram os valores reais de `data/`;
 *   · sem JavaScript vê-se o bairro e os números;
 *   · reduced-motion não descarrega o GSAP;
 *   · zero erros de consola;
 *   · sem transbordo a 375 px;
 *   · a câmara mexe ao arrastar.
 */

// os valores que os marcadores têm de mostrar — lidos de data/ pelo
// servidor. Se a lista mudar, o teste diz qual dos edifícios ficou atrás.
const ESPERADOS = [
  { nome: "salário", padrao: /1 500|1\u202f500/ },
  { nome: "TSU", padrao: /23,75/ },
  { nome: "IRS", padrao: /168/ },
  { nome: "Euribor", padrao: /2,95/ },
  { nome: "gasóleo", padrao: /2,181/ },
  { nome: "gasolina", padrao: /2,097/ },
  { nome: "inflação", padrao: /3,6/ },
  { nome: "desemprego", padrao: /5,7/ },
];

test.describe("o bairro — a geometria (veredicto do design, P1)", () => {
  /**
   * O hotfix da P1 nasceu de aqui só haver testes de TEXTO: as camadas
   * estavam `position: static` — oito SVGs de 3600×2500 empilhavam-se em
   * fluxo, a página media ~20 000 px e só a fila de trás se via. Os
   * marcadores estavam a y≈10 800 e o teste «passava», porque `innerText`
   * apanha tudo o que está no DOM, visível ou não.
   *
   * Estes três medem POSIÇÕES, e são os que teriam apanhado o defeito.
   */

  for (const largura of [1440, 375]) {
    test(`as oito camadas estão na mesma origem e o mapa cabe — a ${largura}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto("/");

      const ys = await page.evaluate(() => {
        const cs = [...document.querySelectorAll(".b-mundo .b-camada")];
        return {
          n: cs.length,
          ys: [...new Set(cs.map((c) => Math.round(c.getBoundingClientRect().top)))],
        };
      });
      // TODAS as camadas no mesmo y: se duas divergem, há camada em fluxo
      expect(ys.n, "faltam camadas").toBe(8);
      expect(
        ys.ys,
        `as camadas estão espalhadas (y = ${ys.ys.join(", ")}) — há SVG em position:static`
      ).toHaveLength(1);

      // e a página não pode medir ~20 000 px: é o sintoma do empilhamento
      const altura = await page.evaluate(
        () => document.documentElement.scrollHeight
      );
      expect(
        altura,
        "a página é uma torre: as camadas empilham-se em fluxo"
      ).toBeLessThan(4000);
    });

    test(`o marcador da Fábrica está dentro da janela do mapa — a ${largura}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto("/");

      const dentro = await page.evaluate(() => {
        const janela = document
          .querySelector(".b-janela")
          ?.getBoundingClientRect();
        const pin = document
          .querySelector('.b-mundo .pin[data-id="fabrica"]')
          ?.getBoundingClientRect();
        if (!janela || !pin) return { ok: false, motivo: "sem janela ou pin" };
        return {
          ok:
            pin.top >= janela.top - 2 &&
            pin.bottom <= janela.bottom + 2 &&
            pin.left >= janela.left - 2 &&
            pin.right <= janela.right + 2,
          pin: { t: Math.round(pin.top), b: Math.round(pin.bottom) },
          janela: {
            t: Math.round(janela.top),
            b: Math.round(janela.bottom),
          },
        };
      });
      expect(
        dentro.ok,
        `o marcador da Fábrica saiu da janela: pin ${JSON.stringify(dentro.pin)} vs janela ${JSON.stringify(dentro.janela)}`
      ).toBe(true);
    });
  }

  test("passar o rato num edifício levanta-o (o .ed do CSS aplica-se ao HTML)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    // o CSS levanta os FILHOS do .ed (`.ed > *`), não o grupo em si — o
    // que sobe é a silhueta, e o rótulo `data-id` fica onde estava
    const filho = page.locator(
      '.b-mundo .ed[data-id="fabrica"] > *'
    ).first();

    const transformDe = () =>
      filho.evaluate((el) => getComputedStyle(el).transform);
    const antes = await transformDe();

    // hover no centro da caixa real, não em coordenadas às cegas — a
    // caixa é do GRUPO (é ele que tem a área de rato, `pointer-events`)
    const r = await page
      .locator('.b-mundo .ed[data-id="fabrica"]')
      .boundingBox();
    if (!r) throw new Error("a Fábrica não tem caixa visível");
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.waitForTimeout(400); // a transição é de 0,25s

    const depois = await transformDe();
    expect(
      depois,
      "o hover não mexeu o edifício — o seletor .ed não está a aplicar"
    ).not.toBe(antes);
  });
});

test.describe("o bairro — o que o mapa mostra", () => {
  test("tem os onze edifícios, cada um focável e com nome", async ({ page }) => {
    await page.goto("/");
    const eds = page.locator(".b-mundo .ed");
    await expect(eds).toHaveCount(11);

    // focáveis: o teclado tem de chegar a cada um
    for (let i = 0; i < 11; i++) {
      const ed = eds.nth(i);
      await expect(ed).toHaveAttribute("tabindex", "0");
      await expect(ed).toHaveAttribute("role", "button");
    }
    // e todos com nome acessível — um mapa sem nomes não é usável
    const nomes = await eds.evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") ?? "")
    );
    for (const [i, n] of nomes.entries())
      expect(n.trim(), `o edifício ${i} não tem nome`).not.toBe("");
  });

  test("os marcadores mostram os valores de data/", async ({ page }) => {
    await page.goto("/");
    const texto = await page.locator(".b-mundo").innerText();
    for (const { nome, padrao } of ESPERADOS)
      expect(texto, `falta o valor de ${nome} no mapa`).toMatch(padrao);
  });

  test("sem JavaScript o bairro e os números continuam no HTML", async ({
    browser,
  }) => {
    // um contexto sem scripts: é o que o pack exige («sem JS vê-se o
    // bairro inteiro e os números») e o que o SSR tem de garantir
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto("/");
    await expect(p.locator(".b-mundo .ed")).toHaveCount(11);
    const texto = await p.locator(".b-mundo").innerText();
    expect(texto).toMatch(/1 500|1\u202f500/);
    expect(texto).toMatch(/23,75/);
    await ctx.close();
  });

  test("não transborda na horizontal a 375 px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 760 });
    await page.goto("/");
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    // o mapa é maior do que o ecrã de propósito — é a câmara que o move.
    // O que não pode transbordar é a PÁGINA.
    expect(excesso, "a página transborda na horizontal").toBeLessThanOrEqual(1);
  });

  test("reduced-motion não descarrega o GSAP", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const p = await ctx.newPage();
    const pedidos: string[] = [];
    p.on("request", (r) => {
      const u = r.url();
      if (/gsap|ScrollTrigger|Flip|DrawSVG|SplitText/i.test(u)) pedidos.push(u);
    });
    await p.goto("/");
    await p.waitForTimeout(1500);
    expect(
      pedidos,
      `o GSAP foi descarregado apesar de reduce: ${pedidos.join(", ")}`
    ).toEqual([]);
    await ctx.close();
  });
});

test.describe("o bairro — a câmara", () => {
  test("mexe-se ao arrastar", async ({ page }) => {
    await page.goto("/");
    const mundo = page.locator(".b-mundo");
    const antes = await mundo.evaluate((el) => getComputedStyle(el).transform);

    const r = await page.locator(".b-janela").boundingBox();
    if (!r) throw new Error("a janela do mapa não tem caixa");
    // o gesto tem de passar dos 5 px, senão a câmara trata-o como clique
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++)
      await page.mouse.move(
        r.x + r.width / 2 - i * 12,
        r.y + r.height / 2 - i * 4
      );
    await page.mouse.up();

    const depois = await mundo.evaluate((el) => getComputedStyle(el).transform);
    expect(antes, "arrastar não mexeu o mapa").not.toBe(depois);
  });

  test("os três botões de zoom mexem na escala", async ({ page }) => {
    await page.goto("/");
    const mundo = page.locator(".b-mundo");
    const escala = async () => {
      const t = await mundo.evaluate((el) => getComputedStyle(el).transform);
      return Number(/matrix\(([\d.]+)/.exec(t)?.[1] ?? "0");
    };

    const inicial = await escala();
    await page.getByRole("button", { name: "Aproximar" }).click();
    const mais = await escala();
    expect(mais, "«Aproximar» não aproximou").toBeGreaterThan(inicial);

    await page.getByRole("button", { name: "Afastar" }).click();
    expect(await escala(), "«Afastar» não afastou").toBeLessThan(mais);

    await page.getByRole("button", { name: "Ver o bairro todo" }).click();
    expect(await escala(), "«Ver o bairro todo» não repõe a vista").toBeLessThan(1);
  });

  test("a hora do dia muda o céu", async ({ page }) => {
    await page.goto("/");
    const palco = page.locator(".b-palco");
    for (const [rotulo, classe] of [
      ["Noite", /b-noite/],
      ["Fim de tarde", /b-fim-tarde/],
      ["Dia", /^(?!.*b-noite)(?!.*b-fim-tarde)/],
    ] as const) {
      await page.getByRole("button", { name: rotulo, exact: true }).click();
      if (classe.source.startsWith("^("))
        expect(await palco.getAttribute("class")).not.toMatch(/b-noite|b-fim-tarde/);
      else expect(await palco.getAttribute("class")).toMatch(classe);
    }
  });
});

test.describe("o bairro — o console", () => {
  test("não escreve um único erro", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") erros.push(m.text());
    });
    page.on("pageerror", (e) => erros.push(String(e)));
    await page.goto("/");
    // deixa a animação ambiente arrancar e o GSAP descarregar
    await page.waitForTimeout(2500);
    expect(erros, `erros na consola:\n${erros.join("\n")}`).toEqual([]);
  });
});