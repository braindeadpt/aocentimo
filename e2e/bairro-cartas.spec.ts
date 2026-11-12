import { test, expect, type Page } from "@playwright/test";
import cenarios from "../data/derived/cenarios-salario.json";
import { fmtEUR0 } from "../src/lib/format";

/**
 * As sete cartas — «Escolhe a tua personagem» (P1-4 / T05).
 *
 *   · sete botões com nome acessível, numa grelha com ≥4 colunas a
 *     1440 px e 2 a 375 px, sem sobreposição nem transbordo;
 *   · clicar leva ao palco, abre o painel «Nome · papel» com a fala
 *     «Olá! Sou …» (nunca «Em breve») e DOIS destinos accionáveis
 *     (botão primário que abre a cena por âncora + ligação para a rota
 *     de aprofundamento), mais botão «×» ≥ 44×44 px; Escape e «×»
 *     fecham e devolvem o foco à carta;
 *   · clicar no CTA de cena fecha o painel da personagem, sincroniza a
 *     âncora URL (#fabrica, #financas, …), marca o edifício .b-ativo e
 *     abre a cena correspondente com foco no título;
 *   · a câmara pousa cada personagem dentro da janela e fora do painel
 *     a 1440×900 e a 390×844;
 *   · reduced-motion não descarrega o GSAP ao clicar;
 *   · o número da Inês vem de cenarios-salario.json formatado, nunca
 *     escrito à mão.
 */

const CARTAS_ESPERADAS = [
  {
    k: "ines",
    nome: "Inês",
    quem: "Inês · Operária da fábrica",
    cenaId: "fabrica",
    cenaRotulo: "Entrar na Fábrica",
    rotaHref: "/salario",
    rotaRotulo: "Simular o recibo →",
  },
  {
    k: "diana",
    nome: "Diana",
    quem: "Diana · Professora",
    cenaId: "financas",
    cenaRotulo: "Ver os escalões do IRS",
    rotaHref: "/irs",
    rotaRotulo: "Simular o IRS →",
  },
  {
    k: "pedro",
    nome: "Pedro",
    quem: "Pedro · Freelancer",
    cenaId: "segsocial",
    cenaRotulo: "Entrar na Seg. Social",
    rotaHref: "/trabalho",
    rotaRotulo: "Simular recibos verdes →",
  },
  {
    k: "manuel",
    nome: "Sr. Manuel",
    quem: "Sr. Manuel · Dono da mercearia",
    cenaId: "mercearia",
    cenaRotulo: "Entrar na Mercearia",
    rotaHref: "/impostos",
    rotaRotulo: "Ver o IVA no talão →",
  },
  {
    k: "arminda",
    nome: "Dona Arminda",
    quem: "Dona Arminda · Reformada",
    cenaId: "correios",
    cenaRotulo: "Entrar nos Correios",
    rotaHref: "/poupanca",
    rotaRotulo: "Simular a poupança →",
  },
  {
    k: "goncalo",
    nome: "Gonçalo",
    quem: "Gonçalo · Estudante, 16 anos",
    cenaId: "escola",
    cenaRotulo: "Entrar na Escola",
    rotaHref: "/irs",
    rotaRotulo: "Ver o IRS Jovem →",
  },
  {
    k: "rui",
    nome: "Rui e Marta",
    quem: "Rui e Marta · Casal com crédito",
    cenaId: "banco",
    cenaRotulo: "Entrar no Banco",
    rotaHref: "/credito",
    rotaRotulo: "Simular a prestação →",
  },
] as const;

const NOMES = CARTAS_ESPERADAS.map((c) => [c.k, c.nome] as const);

const carta = (page: Page, k: string) =>
  page.locator(`.b-cartas .b-carta[data-k="${k}"]`);

test.describe("as sete cartas — escolhe a tua personagem (P1-4)", () => {
  test("há sete cartas, cada uma um botão focável com nome acessível", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".b-cartas .b-carta")).toHaveCount(7);
    for (const [k, nome] of NOMES) {
      const c = carta(page, k);
      await expect(c, `a carta ${k}`).toBeVisible();
      // nome acessível = «Nome, papel» (ex.: «Inês, operária da fábrica»)
      const acessivel = await c.getAttribute("aria-label");
      expect(acessivel).toMatch(new RegExp(`^${nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}, `));
      await c.focus();
      await expect(c).toBeFocused();
      // a figura é decorativa — nunca parte do nome
      await expect(c.locator("svg")).toHaveAttribute("aria-hidden", "true");
    }
    // Enter abre (button nativo): o painel aparece
    await carta(page, "ines").press("Enter");
    await expect(page.locator(".b-painel")).toBeVisible();
  });

  test("a grelha: ≥4 colunas a 1440, 2 a 375, sem sobreposição nem transbordo", async ({
    page,
  }) => {
    await page.goto("/");
    const medir = async () => {
      const grelha = page.locator(".b-cartas");
      const colunas = await grelha.evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length
      );
      const caixas = await page.locator(".b-carta").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { l: r.left, t: r.top, r: r.right, b: r.bottom };
        })
      );
      // nenhum par de cartas se sobrepõe
      for (let i = 0; i < caixas.length; i++)
        for (let j = i + 1; j < caixas.length; j++) {
          const a = caixas[i], b = caixas[j];
          const sobrepoe =
            a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
          expect(sobrepoe, `cartas ${i} e ${j} sobrepõem-se`).toBe(false);
        }
      return colunas;
    };

    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await medir()).toBeGreaterThanOrEqual(4);

    await page.setViewportSize({ width: 375, height: 760 });
    expect(await medir()).toBe(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      "a página transborda na horizontal a 375 px"
    ).toBe(true);
  });

  test("cada uma das 7 cartas mostra os dois CTAs vivos (sem «Em breve»), × ≥ 44×44 px, e Escape/× devolvem foco à carta", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();

    for (const esp of CARTAS_ESPERADAS) {
      const c = carta(page, esp.k);
      await c.click();

      const painel = page.locator('.b-painel[aria-labelledby="b-quem-personagem"]');
      await expect(painel).toBeVisible();
      await expect(painel.locator("#b-quem-personagem")).toHaveText(esp.quem);

      const fala = painel.locator(".b-fala");
      await expect(fala).toContainText("Olá! Sou ");
      await expect(fala).not.toContainText("Em breve");

      // Botão primário para abrir a cena do bairro
      const btnCena = painel.locator(".b-acoes button.b-btn");
      await expect(btnCena).toBeVisible();
      await expect(btnCena).toHaveText(esp.cenaRotulo);

      // Ligação secundária para o simulador de aprofundamento
      const lnkRota = painel.locator(`.b-acoes a.b-btn.b-claro[href="${esp.rotaHref}"]`);
      await expect(lnkRota).toBeVisible();
      await expect(lnkRota).toHaveText(esp.rotaRotulo);

      // Alvo de toque do botão Fechar (×) ≥ 44×44 px
      const btnFechar = painel.locator("button.b-fechar");
      const boxFechar = await btnFechar.boundingBox();
      expect(boxFechar).toBeTruthy();
      expect(boxFechar!.width).toBeGreaterThanOrEqual(44);
      expect(boxFechar!.height).toBeGreaterThanOrEqual(44);
    }

    // Fechar por × devolve foco à última carta aberta (rui)
    await page.locator('.b-painel[aria-labelledby="b-quem-personagem"] button.b-fechar').click();
    await expect(page.locator('#b-quem-personagem')).toHaveCount(0);
    await expect(carta(page, "rui")).toBeFocused();

    // E Escape também fecha e devolve o foco à carta que abriu o painel
    const ines = carta(page, "ines");
    await ines.click();
    await expect(page.locator('#b-quem-personagem')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('#b-quem-personagem')).toHaveCount(0);
    await expect(ines).toBeFocused();
  });

  test("clicar no CTA primário abre a cena correspondente (com âncora e foco no título) e fecha o painel da carta", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();

    // Caso 1: Diana → #financas (moldura .b-cena)
    await carta(page, "diana").click();
    const painelDiana = page.locator('.b-painel[aria-labelledby="b-quem-personagem"]');
    await expect(painelDiana).toBeVisible();
    await painelDiana.getByRole("button", { name: "Ver os escalões do IRS" }).click();

    await expect(painelDiana).toHaveCount(0);
    await expect(page.locator(".b-cena")).toBeVisible();
    expect(new URL(page.url()).hash).toBe("#financas");
    await expect(page.locator('.b-mundo .ed[data-id="financas"]')).toHaveClass(/b-ativo/);
    await expect(page.locator("#cena-quem")).toBeFocused();

    // Escape fecha a cena e devolve foco ao edifício
    await page.keyboard.press("Escape");
    await expect(page.locator(".b-cena")).toBeHidden();
    await expect(page.locator('.b-mundo .ed[data-id="financas"]')).toBeFocused();

    // Caso 2: Inês → #fabrica (cena sobre o mapa em #fab-quem)
    await carta(page, "ines").click();
    const painelInes = page.locator('.b-painel[aria-labelledby="b-quem-personagem"]');
    await expect(painelInes).toBeVisible();
    await painelInes.getByRole("button", { name: "Entrar na Fábrica" }).click();

    await expect(painelInes).toHaveCount(0);
    expect(new URL(page.url()).hash).toBe("#fabrica");
    await expect(page.locator('.b-mundo .ed[data-id="fabrica"]')).toHaveClass(/b-ativo/);
    await expect(page.locator("#fab-quem")).toBeVisible();
    await expect(page.locator("#fab-quem")).toBeFocused();
  });

  // O caso que o CI reprovou duas vezes: uma carta tocada ANTES de o React
// hidratar. Os testes unitários da fila provam a lógica; este prova o
// caminho real — o clique, o pedido, o painel — que é o que se.partiu no
// telemóvel lento.
test("o clique numa carta antes de hidratar não se perde: o painel abre na mesma", async ({
  page,
}) => {
  // este caso atrasa de propósito os chunks e depois espera pela
  // hidratação: precisa de mais do que os 30 s do ficheiro
  test.setTimeout(60_000);
  // o atraso garante que o clique chega ANTES de haver React — sem isto
  // seria uma corrida e o teste valeria o que calhasse
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  const ines = carta(page, "ines");
  await ines.waitFor({ state: "attached" });
  // nenhum React: o clique vai para o elemento que existe no HTML do servidor
  await ines.dispatchEvent("click");
  await expect(page.locator(".b-painel")).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".b-painel .b-quem")).toHaveText(
    "Inês · Operária da fábrica"
  );
  await expect(
    page.locator(".b-painel .b-acoes button.b-btn")
  ).toHaveText("Entrar na Fábrica");
  await expect(
    page.locator('.b-painel .b-acoes a.b-btn.b-claro[href="/salario"]')
  ).toHaveText("Simular o recibo →");
});

test("o clique leva ao palco e — havendo personagem no mapa — mexe a câmara", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const transformAntes = await page
      .locator(".b-mundo")
      .evaluate((el) => (el as HTMLElement).style.transform);

    await carta(page, "goncalo").click();
    await expect(page.locator(".b-painel")).toBeVisible();
    // o palco é o destino do scroll — o mapa fica no topo do ecrã
    await expect(async () => {
      const topo = await page
        .locator(".b-palco")
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(topo).toBeLessThan(80);
    }).toPass();

    const temGente = await page
      .locator('.b-mundo [data-pessoa="goncalo"]')
      .count();
    if (temGente > 0) {
      // a gente do mapa está portada: a câmara TEM de se mexer
      await expect(async () => {
        const depois = await page
          .locator(".b-mundo")
          .evaluate((el) => (el as HTMLElement).style.transform);
        expect(depois).not.toBe(transformAntes);
      }).toPass({ timeout: 4000 });
    }
  });

  // a câmara TEM de pousar a personagem dentro da janela, na faixa que
  // o painel não tapa — mede-se o rect real da figura, não o transform
  test.describe("a câmara pousa a figura na janela (P1-4, defeito medido)", () => {
    for (const [k, , figs] of [
      ["ines", "Inês", ["ines"]],
      ["diana", "Diana", ["diana"]],
      ["pedro", "Pedro", ["pedro"]],
      ["manuel", "Sr. Manuel", ["manuel"]],
      ["arminda", "Dona Arminda", ["arminda"]],
      ["goncalo", "Gonçalo", ["goncalo"]],
      ["rui", "Rui e Marta", ["rui", "marta"]],
    ] as const) {
      for (const [vw, vh] of [
        [1440, 900],
        [390, 844],
      ] as const) {
        test(`${k} a ${vw}×${vh}: a figura fica dentro da janela e fora do painel`, async ({
          page,
        }) => {
          // a carga do CI é pesada (8 workers): o teclado de render e
          // a câmara precisam de orçamento próprio, ou o teste rebenta
          // por tempo — não por defeito
          test.setTimeout(75_000);
          await page.setViewportSize({ width: vw, height: vh });
          await page.goto("/");
          await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
          // A câmara anuncia-se na própria janela: `data-camara` diz
          // «a-mexer» ou «pousada» e `data-camara-n` conta as vistas
          // pedidas (a do arranque é a 1.ª). O n lido ANTES do clique é o
          // que impede de ler o «pousada» da vista do arranque — sem ele
          // a espera passava a correr e a medida caía no meio do voo.
          const janela = page.locator(".b-janela");
          const nAgora = async (): Promise<number> =>
            Number((await janela.getAttribute("data-camara-n")) ?? 0);
          await expect
            .poll(nAgora, { timeout: 15_000, message: "a vista do arranque nunca foi dada" })
            .toBeGreaterThan(0);
          const n0 = await nAgora();
          await carta(page, k).click();
          await expect(page.locator(".b-painel")).toBeVisible();
          // O deslize acaba quando a câmara POUSA — pelo ESTADO que ela
          // publica, e não por «a transform não mudou nos últimos
          // 200 ms»: sob carga o motor de render fica parado a meio do
          // tween, a espera dava-o por assentado e a figura era medida a
          // caminho (defeito medido a 2026-10-12, em Pedro a 1440×900 e
          // Arminda a 390×844)
          await expect
            .poll(
              async () =>
                (await janela.getAttribute("data-camara")) === "pousada" &&
                (await nAgora()) > n0,
              {
                timeout: 30_000,
                message: `a câmara não pousou em ${k} a ${vw}×${vh}`,
              }
            )
            .toBe(true);
          const j = await page.locator(".b-janela").boundingBox();
          const pn = await page.locator(".b-painel").boundingBox();
          expect(j).toBeTruthy();
          for (const f of figs) {
            const fig = page.locator(`.b-mundo [data-pessoa="${f}"]`);
            const r = await fig.boundingBox();
            expect(r, `a figura ${f} existe`).toBeTruthy();
            const tol = 2;
            expect(
              r!.x >= j!.x - tol &&
                r!.y >= j!.y - tol &&
                r!.x + r!.width <= j!.x + j!.width + tol &&
                r!.y + r!.height <= j!.y + j!.height + tol,
              `a figura ${f} fica dentro da .b-janela`
            ).toBe(true);
            // e NÃO tapada pelo painel (no telemóvel o painel está em cima)
            const tapada =
              pn &&
              r!.x < pn.x + pn.width - tol &&
              pn.x < r!.x + r!.width - tol &&
              r!.y < pn.y + pn.height - tol &&
              pn.y < r!.y + r!.height - tol;
            expect(tapada, `a figura ${f} não fica debaixo do painel`).toBe(
              false
            );
          }
        });
      }
    }

    test("reduced-motion: a figura pousa na janela sem GSAP", async ({
      browser,
    }) => {
      const ctx = await browser.newContext({
        reducedMotion: "reduce",
        viewport: { width: 1440, height: 900 },
      });
      const p = await ctx.newPage();
      const pedidos: string[] = [];
      p.on("request", (r) => {
        if (/gsap/i.test(r.url())) pedidos.push(r.url());
      });
      await p.goto("/");
      await carta(p, "ines").click();
      await expect(p.locator(".b-painel")).toBeVisible();
      await p.waitForTimeout(1200);
      const j = await p.locator(".b-janela").boundingBox();
      const r = await p
        .locator('.b-mundo [data-pessoa="ines"]')
        .boundingBox();
      expect(r).toBeTruthy();
      expect(
        r!.x >= j!.x - 2 &&
          r!.x + r!.width <= j!.x + j!.width + 2 &&
          r!.y >= j!.y - 2 &&
          r!.y + r!.height <= j!.y + j!.height + 2,
        "a Inês fica dentro da janela sem animação"
      ).toBe(true);
      expect(pedidos).toEqual([]);
      await ctx.close();
    });
  });

  test("reduced-motion: clicar não descarrega o GSAP", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const p = await ctx.newPage();
    const pedidos: string[] = [];
    p.on("request", (r) => {
      const u = r.url();
      if (/gsap|ScrollTrigger|Flip|DrawSVG|SplitText/i.test(u)) pedidos.push(u);
    });
    await p.goto("/");
    await carta(p, "ines").click();
    await expect(p.locator(".b-painel")).toBeVisible();
    await p.waitForTimeout(1500);
    expect(
      pedidos,
      `o GSAP foi descarregado apesar de reduce: ${pedidos.join(", ")}`
    ).toEqual([]);
    await ctx.close();
  });

  test("o número da carta da Inês vem de cenarios-salario.json formatado", async ({
    page,
  }) => {
    const linha = cenarios.linhas.find(
      (l) => l.bruto === cenarios.meta.brutoRef
    );
    expect(linha, "a linha de referência tem de existir").toBeTruthy();
    const frase = `Porque é que ${fmtEUR0(linha!.bruto)} brutos viram ${fmtEUR0(linha!.liquido)}.`;

    await page.goto("/");
    await expect(carta(page, "ines")).toContainText(frase);
    // e nunca o fallback de falta de dado
    await expect(carta(page, "ines")).not.toContainText("—");
  });
});
