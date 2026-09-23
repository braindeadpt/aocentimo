import { test, expect } from "@playwright/test";
import { GLOSSARIO } from "../src/content/glossario";

/**
 * Sessão 3D — «O país + Aprender»: coerência da faixa.
 *
 *  · Toda a rota de conteúdo da sessão usa <Pagina>: três níveis
 *    (section.pg-nivel), detalhes de Confirma fechados por omissão e
 *    a pergunta seguinte — nenhuma página é um beco.
 *  · Todas as rotas /aprender/[slug] são cobertas — a lista deriva do
 *    conteúdo (GLOSSARIO), nunca escrita à mão.
 *  · Zero pageerror — cada visita regista erros de página e falha no fim.
 *  · /aprender: o glossário organiza-se pelas quatro perguntas e tem
 *    pesquisa por texto; os termos lincam para a página própria.
 *  · /metodologia: o quadro vivo mostra um orbe por série; /sobre mantém
 *    as promessas (repositório e contacto reais).
 */

const ROTAS_PAGINA = ["/dados", "/aprender"];
const ROTAS_TERMO = GLOSSARIO.map((t) => `/aprender/${t.slug}`);

async function visitaLimpa(
  page: import("@playwright/test").Page,
  rota: string
) {
  const erros: string[] = [];
  const onErr = (e: Error) => erros.push(e.message);
  page.on("pageerror", onErr);
  await page.goto(rota, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  page.off("pageerror", onErr);
  expect(erros, `${rota} disparou pageerror`).toEqual([]);
}

test.describe("3D — três níveis nas rotas de conteúdo", () => {
  for (const rota of [...ROTAS_PAGINA, ...ROTAS_TERMO]) {
    test(`${rota} tem os três níveis e a pergunta seguinte`, async ({
      page,
    }) => {
      await visitaLimpa(page, rota);
      // h1 único = a pergunta da página
      await expect(page.locator("h1")).toHaveCount(1);
      // os três níveis: resposta · explora · confirma
      await expect(page.locator("section.pg-nivel")).toHaveCount(3);
      // nível 3 fechado por omissão (details sem open)
      const abertos = await page
        .locator("details.pg-detalhe[open]")
        .count();
      expect(abertos, `${rota} tem detalhes abertos no SSR`).toBe(0);
      // nenhuma página é um beco — a pergunta seguinte liga a outra rota
      const seg = page.locator(".pg-seguinte-lnk");
      await expect(seg).toHaveCount(1);
      const href = await seg.getAttribute("href");
      expect(href, `${rota} pergunta seguinte sem href`).toMatch(/^\//);
    });
  }
});

test.describe("3D — /aprender", () => {
  test("organiza o glossário pelas quatro perguntas e pesquisa", async ({
    page,
  }) => {
    await visitaLimpa(page, "/aprender");
    // as quatro perguntas como âncoras do índice
    for (const g of ["ganhas", "pagas", "banco", "pais"]) {
      await expect(page.locator(`#ap-${g}`)).toHaveCount(1);
    }
    // cada termo do glossário tem ligação para a sua página
    for (const t of GLOSSARIO) {
      await expect(
        page.locator(`a[href="/aprender/${t.slug}"]`).first()
      ).toBeVisible();
    }
    // pesquisa por texto: «tsu» deixa um termo; texto absurdo esvazia
    const campo = page.locator("#pesquisa-glossario");
    await campo.fill("tsu");
    await expect(page.locator("a[href='/aprender/tsu']")).toBeVisible();
    await expect(
      page.locator("a[href='/aprender/taeg']")
    ).toHaveCount(0);
    await campo.fill("xyznada");
    await expect(
      page.locator("a[href^='/aprender/']")
    ).toHaveCount(0);
  });
});

test.describe("3D — /aprender/[slug]", () => {
  test("cada termo tem demo no nível 2 e ficha no nível 3", async ({
    page,
  }) => {
    // amostra de termos cujo texto menciona outros termos (menções
    // literais — há termos sem nenhuma, e isso é honesto, não defeito;
    // a amostra cobre os quatro grupos por dentro dos detalhes)
    for (const slug of ["deducao-coleta", "isp", "euribor", "taxa-real"]) {
      await visitaLimpa(page, `/aprender/${slug}`);
      // nível 2 — a micro-demonstração desenhada (figure role=img)
      await expect(page.locator("figure.mdemo")).toHaveCount(1);
      // nível 3 — a ficha (legislação/fonte ou conceito) em detalhe
      await expect(page.locator("details.pg-detalhe")).not.toHaveCount(0);
      // o glossário inline continua a funcionar — as ligações tracejadas
      // a outros termos existem dentro dos textos
      const termos = await page
        .locator("details.pg-detalhe a[href^='/aprender/']")
        .count();
      expect(termos, `${slug}: glossário inline vazio`).toBeGreaterThan(0);
    }
  });
});

test.describe("3D — /metodologia e /sobre", () => {
  test("/metodologia tem o quadro vivo com um orbe por série", async ({
    page,
  }) => {
    await visitaLimpa(page, "/metodologia");
    await expect(page.locator("h1")).toHaveCount(1);
    // o quadro vivo — células com orbe de estado, uma por série
    const celulas = await page.locator(".quadro-vivo .qcell").count();
    expect(celulas).toBeGreaterThan(0);
    const orbes = await page.locator(".quadro-vivo .qcell svg").count();
    expect(orbes).toBeGreaterThanOrEqual(celulas);
    // as limitações honestas ficam
    await expect(
      page.getByText("Limitações honestas")
    ).toBeVisible();
  });

  test("/sobre mantém as promessas — repositório e contacto reais", async ({
    page,
  }) => {
    await visitaLimpa(page, "/sobre");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.locator("a[href='https://github.com/braindeadpt/aocentimo']")
    ).toBeVisible();
    await expect(
      page.locator(
        "a[href='https://github.com/braindeadpt/aocentimo/issues']"
      )
    ).toBeVisible();
  });
});
