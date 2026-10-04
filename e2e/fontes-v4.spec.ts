import { test, expect, type Page } from "@playwright/test";

/**
 * P3c — as três fontes V4 deixaram de existir (PACK V5 PRODUÇÃO §P3.4).
 *
 * Source Serif, Space Grotesk e Space Mono saíram do `layout.tsx`. Este
 * spec existe porque «não estar no código» não é prova: a fonte pode
 * continuar a ser PEDIDA se alguma coisa a voltar a pedir. A prova são
 * duas, independentes:
 *
 *   1. a REDE — nenhum ficheiro .woff2 é descarregado cuja @font-face
 *      pertença a uma das três. Mede-se pelo CSS que o browser recebeu,
 *      não pelo nome do ficheiro (o hash não diz nada);
 *   2. o DOCUMENTO — `document.fonts` não tem nenhuma_face dessas três,
 *      nem carregada nem registada.
 *
 * E o contrato que fica: o que o site PEDE tem de ser só o Archivo e o
 * Caveat. Se amanhã alguém reintroduzir uma fonte V4, isto chumba.
 */

const V4 = /Source\s*Serif|Space\s*Grotesk|Space\s*Mono/i;
/** As duas que o contrato V5 consome (PACK §3). */
const V5 = /^(Archivo|Caveat)/;

/** As folhas de estilo que o browser recebeu nesta navegação. */
async function cssRecebido(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const folhas = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    );
    const textos = await Promise.all(
      folhas.map(async (l) => {
        try {
          const r = await fetch(l.href);
          return r.ok ? await r.text() : "";
        } catch {
          return "";
        }
      }),
    );
    return textos;
  });
}

/** Os ficheiros de fonte que o browser descarregou. */
function pedidosDeFonte(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (r) => {
    if (/\.woff2?($|\?)/i.test(r.url())) urls.push(r.url());
  });
  return urls;
}

test("nenhuma fonte V4 é pedida em /estilo", async ({ page }) => {
  const fontes = pedidosDeFonte(page);
  await page.goto("/estilo", { waitUntil: "networkidle" });

  const css = await cssRecebido(page);
  expect(css.length, "a página não recebeu nenhuma folha de estilo").toBeGreaterThan(0);

  // 1 · o CSS servido não menciona nenhuma das três
  for (const folha of css) {
    const achada = folha.match(V4);
    expect(
      achada,
      `o CSS servido ainda declara uma fonte V4: «${achada?.[0]}»`,
    ).toBeNull();
  }

  // 2 · nenhuma face V4 no documento
  const familias = await page.evaluate(() =>
    Array.from(document.fonts).map((f) => f.family),
  );
  expect(
    familias.filter((f) => V4.test(f)),
    "document.fonts tem uma face V4",
  ).toEqual([]);

  // 3 · e o que foi pedido é só o contrato V5
  expect(fontes.length, "a página não pediu fonte nenhuma").toBeGreaterThan(0);
  const familiasPedidas = await page.evaluate(async () => {
    const nomes = new Set<string>();
    for (const f of Array.from(document.fonts)) nomes.add(f.family);
    return [...nomes];
  });
  for (const f of familiasPedidas) {
    expect(f, `família fora do contrato V5: «${f}»`).toMatch(V5);
  }
});

test("nenhuma fonte V4 é pedida nas rotas todas", async ({ page }) => {
  const fontes = pedidosDeFonte(page);
  // uma amostra que cobre o chrome, uma rota migrada, a meta e a home
  for (const rota of ["/", "/salario", "/dados", "/metodologia", "/sobre"]) {
    await page.goto(rota, { waitUntil: "networkidle" });
    const css = await cssRecebido(page);
    for (const folha of css) {
      expect(
        folha.match(V4),
        `${rota} serve um CSS com fonte V4`,
      ).toBeNull();
    }
  }
  // o mesmo browser, as cinco rotas: nenhuma fonte V4 descarregou
  expect(fontes.join("\n")).not.toMatch(V4);
});