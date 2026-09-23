import { test, expect } from "@playwright/test";

// 1B-06 — <Painel>: três tamanhos (S ⅓ · M ⅔ · L linha) numa grelha
// de seis colunas com duas regras duras:
//
//  · NENHUM órfão — cada linha fecha exactamente: o último cartão da
//    linha encosta à borda direita da grelha. Mede-se em px com
//    getBoundingClientRect (não em classes): um S sozinho na última
//    linha ocuparia ⅓ da largura e o teste falha — o rearranjo de
//    tamanhos era possível, logo o órfão é um defeito.
//  · Codificações alternadas — dois cartões seguidos nunca repetem
//    data-cod (linha · pontos · tracos · anel · isometrico).
//
// Abaixo de lg (768/375) TODOS os cartões são linha inteira — um
// cartão que enche a linha não é órfão; o critério é sempre o mesmo:
// a linha fecha a grelha.
//
// Medido nos dois sítios onde o <Painel> vive: home («Hoje em
// Portugal», 6 cartões) e /dados («O país, em leituras», 7).

const ROTAS = ["/", "/dados"];
const LARGURAS = [1440, 1024, 768, 375];

interface Linha {
  top: number;
  n: number;
  fim: number; // borda direita do último cartão da linha
}

test.describe("Painel — composição sem órfãos", () => {
  for (const rota of ROTAS) {
    for (const largura of LARGURAS) {
      test(`${rota} @ ${largura}px — cada linha fecha a grelha`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.goto(rota);

        const grelha = page.locator("[data-painel] .pnl-grid").first();
        await expect(grelha).toBeVisible();
        const celulas = grelha.locator(".pnl-cell");
        const nCelulas = await celulas.count();
        expect(nCelulas).toBeGreaterThan(3);

        const medida = await celulas.evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top, right: r.right };
          })
        );
        const g = await grelha.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right };
        });

        // agrupa por linha (mesmo top, com tolerância de sub-pixel)
        const linhas: Linha[] = [];
        for (const c of medida) {
          const linha = linhas.find((l) => Math.abs(l.top - c.top) < 2);
          if (linha) {
            linha.n++;
            linha.fim = Math.max(linha.fim, c.right);
          } else {
            linhas.push({ top: c.top, n: 1, fim: c.right });
          }
        }
        expect(linhas.length).toBeGreaterThanOrEqual(1);

        // cada linha — incluída a última — fecha a grelha: o fim da
        // linha encosta à borda direita (folga de 2 px de sub-pixel)
        for (const [i, linha] of linhas.entries()) {
          expect(
            Math.abs(linha.fim - g.right),
            `linha ${i} com ${linha.n} cartão(ões) não fecha a grelha ` +
              `(fim ${linha.fim.toFixed(1)} vs ${g.right.toFixed(1)})` +
              (i === linhas.length - 1 && linha.n === 1
                ? " — órfão na última linha"
                : "")
          ).toBeLessThan(2);
        }
      });
    }

    test(`${rota} — codificações nunca repetidas em cartões seguidos`, async ({
      page,
    }) => {
      await page.goto(rota);
      const cods = await page
        .locator("[data-painel] .pnl-cell")
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-cod")));
      expect(cods.length).toBeGreaterThan(3);
      for (let i = 1; i < cods.length; i++) {
        expect(
          cods[i] !== cods[i - 1],
          `codificação «${cods[i]}» repetida nos cartões ${i - 1} e ${i}`
        ).toBe(true);
      }
    });

    test(`${rota} — frescura à vista: orbe e «leitura …» em todos os cartões`, async ({
      page,
    }) => {
      await page.goto(rota);
      const celulas = page.locator("[data-painel] .pnl-cell");
      const n = await celulas.count();
      for (let i = 0; i < n; i++) {
        const cel = celulas.nth(i);
        // o orbe de estado está sempre (Cartao e EstadoVazio); a data
        // em texto — «leitura {período}» nos cartões de dados,
        // «último dado conhecido» no vazio
        await expect(cel.locator("svg.orbe-estado").first()).toBeAttached();
        const eVazio = (await cel.locator(".estado-vazio").count()) > 0;
        if (eVazio) {
          await expect(cel).toContainText("último dado conhecido");
        } else {
          await expect(cel).toContainText("leitura ");
        }
      }
    });
  }
});
