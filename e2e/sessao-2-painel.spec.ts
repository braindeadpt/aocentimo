import { test, expect } from "@playwright/test";

// S2-02 — «Hoje em Portugal»: cada cartão do painel da home usa a
// codificação certa para o seu dado (catálogo §5 do PRODUTO):
//
//   inflação   → linha anotada (o pico, a mediana)
//   desemprego → barra de traços «de cada 100 pessoas ativas»
//   euribor    → linha anotada com o evento BCE mais relevante
//   gasóleo    → valor do dia em odómetro + variação a 30 dias
//   pib        → linha anotada
//   habitação  → barra de traços (trimestres seguidos)
//
// (a) o data-cod de cada cartão, por posição editorial;
// (b) a grelha sem órfãos a 1440/1024/768/375 — a mesma medição em
//     px do painel.spec.ts (soma de larguras por linha);
// (c) o desemprego diz «de cada 100 pessoas ativas»;
// (d) o gasóleo mostra o valor do dia e a variação a 30 dias.
//
// Nota: se uma fonte falhar no build, o cartão desce para
// EstadoVazio (data-cod="isometrico") — a asserção (a) é estrita
// porque os dados são committed e a falha é um defeito a ver.

const LARGURAS = [1440, 1024, 768, 375];

/** texto distintivo de cada cartão → codificação pedida (a ordem do
    painel é editorial: inflação · desemprego · euribor · gasóleo ·
    pib · habitação) */
const ESPERADO: { trecho: string; cod: string; nome: string }[] = [
  { nome: "inflação", trecho: "PREÇOS / CABAZ", cod: "linha" },
  { nome: "desemprego", trecho: "PAÍS / TRABALHO", cod: "tracos" },
  { nome: "euribor", trecho: "EURIBOR 12M", cod: "linha" },
  { nome: "gasóleo", trecho: "COMBUSTÍVEIS", cod: "pontos" },
  { nome: "pib", trecho: "PAÍS / PIB", cod: "linha" },
  { nome: "habitação", trecho: "HABITAÇÃO", cod: "tracos" },
];

test.describe("S2-02 · Hoje em Portugal — a codificação certa por dado", () => {
  test("cada cartão usa a codificação pedida (data-cod)", async ({
    page,
  }) => {
    await page.goto("/");
    const grelha = page.locator("[data-painel] .pnl-grid").first();
    await expect(grelha).toBeVisible();
    const celulas = grelha.locator(".pnl-cell");
    await expect(celulas).toHaveCount(6);

    for (const { nome, trecho, cod } of ESPERADO) {
      const cel = celulas.filter({ hasText: trecho }).first();
      await expect(cel, `cartão ${nome} presente`).toBeAttached();
      await expect(cel, `data-cod de ${nome}`).toHaveAttribute(
        "data-cod",
        cod
      );
    }
  });

  test("codificações nunca repetidas em cartões seguidos", async ({
    page,
  }) => {
    await page.goto("/");
    const cods = await page
      .locator("[data-painel] .pnl-cell")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-cod")));
    expect(cods).toHaveLength(6);
    for (let i = 1; i < cods.length; i++) {
      expect(
        cods[i] !== cods[i - 1],
        `codificação «${cods[i]}» repetida nos cartões ${i - 1} e ${i}`
      ).toBe(true);
    }
  });

  for (const largura of LARGURAS) {
    test(`grelha sem órfãos a ${largura}px — cada linha fecha`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto("/");

      const grelha = page.locator("[data-painel] .pnl-grid").first();
      await expect(grelha).toBeVisible();
      const celulas = grelha.locator(".pnl-cell");
      expect(await celulas.count()).toBe(6);

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

      // agrupa por linha (mesmo top, tolerância de sub-pixel) — cada
      // linha, incluída a última, encosta à borda direita da grelha
      const linhas: { top: number; n: number; fim: number }[] = [];
      for (const c of medida) {
        const linha = linhas.find((l) => Math.abs(l.top - c.top) < 2);
        if (linha) {
          linha.n++;
          linha.fim = Math.max(linha.fim, c.right);
        } else {
          linhas.push({ top: c.top, n: 1, fim: c.right });
        }
      }
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

  test("desemprego — «de cada 100 pessoas ativas» em barra de traços", async ({
    page,
  }) => {
    await page.goto("/");
    const cel = page
      .locator("[data-painel] .pnl-cell", { hasText: "PAÍS / TRABALHO" })
      .first();
    await expect(cel).toContainText("de cada 100 pessoas ativas");
    await expect(cel).toContainText("1 traço = 1 pessoa");
    await expect(cel.locator(".bt-pista")).toBeAttached();
    // «N procuram trabalho» — a contagem no rodapé da barra
    await expect(cel).toContainText("procuram trabalho");
  });

  test("euribor — a linha anotada traz o evento BCE da janela", async ({
    page,
  }) => {
    await page.goto("/");
    const cel = page
      .locator("[data-painel] .pnl-cell", { hasText: "EURIBOR 12M" })
      .first();
    // janela «Máx» por omissão: o evento curado mais recente do
    // recorte é o pico do ciclo (data/fiscal/eventos.json)
    await expect(cel).toContainText("Pico do ciclo");
  });

  test("gasóleo — valor do dia em odómetro + variação a 30 dias", async ({
    page,
  }) => {
    await page.goto("/");
    const cel = page
      .locator("[data-painel] .pnl-cell", { hasText: "COMBUSTÍVEIS" })
      .first();
    // o valor do dia no número herói (Odometer) — €/L com 3 casas
    await expect(cel.locator(".leitura-valor")).toContainText("€/L");
    // o haltere «antes → agora» a 30 dias, com a variação escrita
    await expect(cel.locator(".hal")).toBeAttached();
    await expect(cel.locator(".hal-delta").first()).toContainText(
      "30 dias"
    );
  });
});
