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

  // O clique pode chegar ANTES de o React hidratar — num telemóvel lento
  // é o gesto natural: a carta já está no ecrã, a pessoa toca. Antes desta
  // correcção o `onClick` ainda não existia e o pedido desaparecia.
  test("o clique numa carta antes de hidratar não se perde: o painel abre na mesma", async ({
    page,
  }) => {
    // este caso atrasa de propósito os chunks e depois espera pela
    // hidratação: precisa de mais do que os 30 s do ficheiro
    test.setTimeout(60_000);
    // atrasa os chunks: garante que o clique chega antes da hidratação
    await page.route("**/_next/static/chunks/*.js", async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "commit" });
    const ines = carta(page, "ines");
    await ines.waitFor({ state: "attached" });
    // o clique vai para o elemento que existe no HTML do servidor
    await ines.dispatchEvent("click");
    // e mesmo assim o bairro tem de abrir o painel
    await expect(page.locator(".b-painel")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".b-painel .b-quem")).toHaveText(
      "Inês · Operária da fábrica"
    );
  });

  test("clicar abre o painel «Olá!» com o título certo; Escape fecha e devolve o foco à carta", async ({
    page,
  }) => {
    // página inteira + abrir + fechar: orçamento maior para as mesmas
    // asserções, pelos mesmos 30 s que não chegam num runner carregado
    test.setTimeout(60_000);
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

  test("o clique leva ao palco e — havendo personagem no mapa — mexe a câmara", async ({
    page,
  }) => {
    // página inteira + voo da câmara: os 30 s do ficheiro não chegam num
    // runner carregado (é um destes casos que reprovou o CI). Mesmo
    // orçamento, mesmas comparações.
    test.setTimeout(60_000);
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
          // este caso carrega a página INTEIRA e depois espera por uma
          // animação: os 30 s do ficheiro não chegam num runner carregado
          // (foi assim que o CI reprovou). Não é afrouxo de asserção — é
          // orçamento para as mesmas comparações correrem.
          test.setTimeout(60_000);
          await page.setViewportSize({ width: vw, height: vh });
          await page.goto("/");
          await carta(page, k).click();
          await expect(page.locator(".b-painel")).toBeVisible();
          // espera pelo ESTADO, não por um prazo: a câmara só está pousada
          // quando a figura está dentro da janela E o `.b-mundo` já não se
          // mexe. O prazo de 4,5 s era um chute que não sabia se a animação
          // já tinha chegado ao fim. As três leituras são feitas DENTRO do
          // poll: o scroll ao palco é suave e o voo da câmara ainda pode
          // estar a decorrer, e apanhar a figura «dentro» a meio do voo não é
          // estar pousada.
          let transformAnterior: string | null = null;
          await expect
            .poll(
              async () => {
                const transform = await page
                  .locator(".b-mundo")
                  .evaluate((el) => (el as HTMLElement).style.transform);
                const j = await page.locator(".b-janela").boundingBox();
                const r = await page
                  .locator(`.b-mundo [data-pessoa="${figs[0]}"]`)
                  .boundingBox();
                const dentro =
                  !!r &&
                  !!j &&
                  r.x >= j.x - 2 &&
                  r.y >= j.y - 2 &&
                  r.x + r.width <= j.x + j.width + 2 &&
                  r.y + r.height <= j.y + j.height + 2;
                if (!dentro) {
                  transformAnterior = null;
                  return false;
                }
                const pousada = transformAnterior === transform;
                transformAnterior = transform;
                return pousada;
              },
              {
                timeout: 20_000,
                message: `a câmara pousa ${k} dentro da janela`,
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
      // espera pelo estado (a figura pousada e a câmara parada), não por
      // 1,2 s de relógio; as três leituras dentro do poll, pelo mesmo
      // motivo do caso acima
      let transformAnterior: string | null = null;
      await expect
        .poll(
          async () => {
            const transform = await p
              .locator(".b-mundo")
              .evaluate((el) => (el as HTMLElement).style.transform);
            const j = await p.locator(".b-janela").boundingBox();
            const rr = await p
              .locator('.b-mundo [data-pessoa="ines"]')
              .boundingBox();
            const dentro =
              !!rr &&
              !!j &&
              rr.x >= j.x - 2 &&
              rr.x + rr.width <= j.x + j.width + 2 &&
              rr.y >= j.y - 2 &&
              rr.y + rr.height <= j.y + j.height + 2;
            if (!dentro) {
              transformAnterior = null;
              return false;
            }
            const pousada = transformAnterior === transform;
            transformAnterior = transform;
            return pousada;
          },
          { timeout: 15_000, message: "a figura pousa sem GSAP" }
        )
        .toBe(true);
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
