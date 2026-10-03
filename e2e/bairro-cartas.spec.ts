import { test, expect, type Page } from "@playwright/test";
import cenarios from "../data/derived/cenarios-salario.json";
import { fmtEUR0 } from "../src/lib/format";

/**
 * As sete cartas — «Escolhe a tua personagem» (P1-4 do PACK V5
 * PRODUÇÃO; o `CARTAS` do mapa.tpl.html).
 *
 *   · sete botões com nome acessível, numa grelha com ≥4 colunas a
 *     1440 px e 2 a 375 px, sem sobreposição nem transbordo;
 *   · clicar leva ao palco, abre o painel «Nome · papel» com a fala
 *     «Olá! Sou …» e o «Em breve» marcado; Escape fecha e devolve o
 *     foco à carta;
 *   · se a personagem existir no mapa (`.b-mundo [data-pessoa]` — a
 *     sessão «gente» pode ainda não ter fundido), a câmara mexe; se
 *     não existir, o clique não falha na mesma;
 *   · reduced-motion não descarrega o GSAP ao clicar;
 *   · o número da Inês vem de cenarios-salario.json formatado, nunca
 *     escrito à mão.
 */

const NOMES = [
  ["ines", "Inês"],
  ["diana", "Diana"],
  ["pedro", "Pedro"],
  ["manuel", "Sr. Manuel"],
  ["arminda", "Dona Arminda"],
  ["goncalo", "Gonçalo"],
  ["rui", "Rui e Marta"],
] as const;

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

  test("clicar abre o painel «Olá!» com o título certo; Escape fecha e devolve o foco à carta", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const ines = carta(page, "ines");
    await ines.click();

    const painel = page.locator(".b-painel");
    await expect(painel).toBeVisible();
    await expect(painel.locator(".b-quem")).toHaveText(
      "Inês · Operária da fábrica"
    );
    const fala = painel.locator(".b-fala");
    await expect(fala).toContainText("Olá! Sou a Inês.");
    await expect(fala).toContainText(
      "vais poder seguir o meu dinheiro pelo bairro"
    );
    // o «Em breve» vem marcado (realce azul do protótipo)
    await expect(fala.locator(".b-a")).toHaveText("Em breve");

    // Escape fecha e o foco volta à carta que abriu o painel
    await page.keyboard.press("Escape");
    await expect(painel).toBeHidden();
    await expect(ines).toBeFocused();
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
          await carta(page, k).click();
          await expect(page.locator(".b-painel")).toBeVisible();
          // o deslize acaba quando a câmara assenta — espera-se pelo
          // ESTADO (a transform deixar de mexer), não por 4,5 s de
          // relógio: sob carga os 4,5 s acabavam antes do fim
          await expect
            .poll(
              async () => {
                const a = await page
                  .locator(".b-mundo")
                  .evaluate((el) => (el as HTMLElement).style.transform);
                await page.waitForTimeout(200);
                const b = await page
                  .locator(".b-mundo")
                  .evaluate((el) => (el as HTMLElement).style.transform);
                return a === b;
              },
              {
                timeout: 30_000,
                message: `a câmara não assentou em ${k} a ${vw}×${vh}`,
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
