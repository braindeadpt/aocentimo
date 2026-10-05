import { test, expect, type Page } from "@playwright/test";

/**
 * A acessibilidade do mapa — a SESSÃO que o axe apanhou na home a
 * 390×844 (5 violações: landmark-no-duplicate-main, landmark-unique,
 * landmark-main-is-top-level, aria-hidden-focus e nested-interactive).
 *
 * O mapa continua a ser o que é: onze edifícios que se focam pelo
 * teclado, se abrem com Enter e devolvem o foco com Escape. Estes testes
 * medem isso ao mesmo tempo que verificam que a correcção não levou
 * nenhum diâmetro à arvore de acessibilidade.
 *
 * Os testes correm nos DOIS tamanhos: 1440×900 e 390×844.
 */

/** Os onze edifícios do bairro, na ordem em que estão no DOM. */
const EDIFICIOS = [
  "fabrica",
  "segsocial",
  "financas",
  "banco",
  "correios",
  "bomba",
  "mercearia",
  "pastelaria",
  "casa",
  "quiosque",
  "escola",
] as const;

/** Os dois tamanhos em que a home é medida. */
const TAMANHOS = [
  { nome: "1440×900", width: 1440, height: 900 },
  { nome: "390×844", width: 390, height: 844 },
] as const;

/** O que conta como focável — o mesmo que o axe usa para aria-hidden-focus. */
const FOCAVEIS = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "details > summary:first-of-type",
  "[tabindex]",
  "[contenteditable]",
].join(", ");

/** Espera pelo mapa vivo: sem isto o Enter pode cair antes da hidratação. */
async function mapaVivo(page: Page) {
  await expect(page.locator('.b-mundo[data-vivo="1"]')).toBeAttached();
}

/** Percorre a página a Tab até recolher os edifícios por onde passa. */
async function tabAteAosEdificios(page: Page, quantos = 120): Promise<string[]> {
  const vistos: string[] = [];
  for (let i = 0; i < quantos; i++) {
    await page.keyboard.press("Tab");
    const id = await page.evaluate(() => {
      const a = document.activeElement as Element | null;
      return a?.closest(".ed")?.getAttribute("data-id") ?? null;
    });
    if (id && !vistos.includes(id)) vistos.push(id);
    if (vistos.length === EDIFICIOS.length) break;
  }
  return vistos;
}

for (const t of TAMANHOS) {
  test.describe(`a acessibilidade do mapa a ${t.nome}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: t.width, height: t.height });
    });

    test("a página tem UM SÓ <main> — o do layout, com o conteúdo dentro dele", async ({
      page,
    }) => {
      await page.goto("/");
      await mapaVivo(page);
      const mains = page.locator("main");
      await expect(mains).toHaveCount(1);
      // o único main é o do layout (#conteudo) e o elenco do bairro está
      // DENTRO dele — nada de um segundo landmark de conteúdo
      const info = await page.evaluate(() => {
        const m = document.querySelector("main");
        return {
          id: m?.id ?? null,
          temElenco: !!m?.querySelector(".b-elenco"),
          idElenco: m?.querySelector(".b-elenco")?.closest("[id]")?.id ?? null,
        };
      });
      expect(info.id).toBe("conteudo");
      expect(info.temElenco).toBe(true);
      // e o link de salto do layout ainda cai no main
      await expect(page.locator('a.skip-link[href="#conteudo"]')).toHaveCount(1);
    });

    test("nenhum elemento focável vive dentro de um aria-hidden", async ({ page }) => {
      await page.goto("/");
      await mapaVivo(page);
      const maus = await page.evaluate((sel) => {
        const nome = (el: Element) => {
          const g = el as SVGElement;
          const classe =
            typeof g.className === "string" ? g.className : (g.getAttribute("class") ?? "");
          return (
            el.tagName.toLowerCase() +
            (el.id ? `#${el.id}` : "") +
            (classe ? `.${classe.split(" ")[0]}` : "") +
            (g.getAttribute("data-id") ? `[data-id=${g.getAttribute("data-id")}]` : "")
          );
        };
        return [...document.querySelectorAll(sel)]
          .filter((el) => el.closest('[aria-hidden="true"]'))
          .map((el) => `${nome(el)} dentro de ${nome(el.closest('[aria-hidden="true"]')!)}`);
      }, FOCAVEIS);
      expect(maus, `focáveis dentro de aria-hidden: ${maus.join(" · ")}`).toEqual([]);
    });

    test("nenhum role=\"img\" tem descendentes interactivos", async ({ page }) => {
      await page.goto("/");
      await mapaVivo(page);
      const maus = await page.evaluate((sel) => {
        const maus: string[] = [];
        // a regra do axe (nested-interactive): um elemento com papel de
        // widget NUNCA pode conter descendentes focáveis — nem escondidos
        // por aria-hidden (esse é o outro bug, o aria-hidden-focus)
        document.querySelectorAll('[role="img"]').forEach((img) => {
          const dentro = [...img.querySelectorAll(sel)];
          if (dentro.length)
            maus.push(
              `${img.tagName.toLowerCase()}.${img.getAttribute("class") ?? "?"} com ${dentro.length} interactivo(s): ${[
                ...new Set(dentro.map((d) => d.tagName.toLowerCase())),
              ].join(", ")}`
            );
        });
        return maus;
      }, FOCAVEIS);
      expect(maus, `role=img com controlos dentro: ${maus.join(" · ")}`).toEqual([]);
    });

    test("os onze edifícios são focáveis por Tab, com nome acessível, na ordem do mapa", async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.goto("/");
      await mapaVivo(page);

      // nome acessível e tabindex de cada um
      const eds = await page.evaluate(() =>
        [...document.querySelectorAll(".b-mundo .ed")].map((el) => ({
          id: el.getAttribute("data-id"),
          rotulo: el.getAttribute("aria-label")?.trim() ?? "",
          tabindex: el.getAttribute("tabindex"),
        }))
      );
      expect(eds.map((e) => e.id)).toEqual([...EDIFICIOS]);
      for (const e of eds) {
        expect(e.rotulo, `${e.id} sem nome acessível`).not.toBe("");
        expect(e.tabindex, `${e.id} fora da ordem de tabulação`).toBe("0");
      }

      // e o Tab a sério chega a todos, sem saltar nenhum
      const vistos = await tabAteAosEdificios(page);
      expect(vistos).toEqual([...EDIFICIOS]);
    });

    for (const id of EDIFICIOS) {
      test(`o «${id}» abre a cena com Enter e o Escape devolve-lhe o foco`, async ({
        page,
      }) => {
        await page.goto("/");
        await mapaVivo(page);
        const ed = page.locator(`.b-mundo .ed[data-id="${id}"]`);
        await ed.focus();
        await expect(ed).toBeFocused();
        await page.keyboard.press("Enter");

        const cena = page.locator(".b-cena, .b-painel").first();
        await expect(cena).toBeVisible();
        expect(new URL(page.url()).hash).toBe(`#${id}`);

        await page.keyboard.press("Escape");
        await expect(cena).not.toBeVisible();
        await expect(ed).toBeFocused();
      });
    }
  });
}