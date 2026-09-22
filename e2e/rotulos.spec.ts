import { test, expect } from "@playwright/test";
import { rotasDoSite } from "./rotas";

/**
 * S1-02 defeito 5 — nunca dois rótulos de texto sobrepostos dentro dos
 * gráficos .leitura. Mede caixas reais (getBBox, já à escala do ecrã)
 * a 375 px — a largura onde a geometria do svg é mais apertada — e a
 * 1440 px. Os <text> escondidos por container query têm caixa nula e
 * não entram na comparação.
 */
const LARGURAS = [375, 1440];

for (const largura of LARGURAS) {
  test.describe(`rótulos sem colisão @${largura}`, () => {
    test.use({ viewport: { width: largura, height: 800 } });

    for (const rota of rotasDoSite()) {
      test(rota, async ({ page }) => {
        await page.goto(rota, { waitUntil: "load" });
        const colisoes = await page.evaluate(() => {
          const out: string[] = [];
          document
            .querySelectorAll(".leitura .lq-graf svg")
            .forEach((svg, si) => {
              const nome =
                svg
                  .closest(".leitura")
                  ?.querySelector(".leitura-breadcrumb")
                  ?.textContent?.trim() ?? `svg#${si}`;
              const textos = [...svg.querySelectorAll("text")]
                .map((t) => {
                  let b: DOMRect;
                  try {
                    b = t.getBBox();
                  } catch {
                    return null; // display:none (container query)
                  }
                  if (b.width === 0) return null;
                  return {
                    txt: t.textContent ?? "",
                    l: b.x,
                    r: b.x + b.width,
                    t: b.y,
                    b: b.y + b.height,
                  };
                })
                .filter((t): t is NonNullable<typeof t> => t !== null);
              for (let i = 0; i < textos.length; i++) {
                for (let j = i + 1; j < textos.length; j++) {
                  const a = textos[i];
                  const c = textos[j];
                  const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l);
                  const oy = Math.min(a.b, c.b) - Math.max(a.t, c.t);
                  if (ox > 1 && oy > 1) {
                    out.push(`${nome}: «${a.txt}» ∩ «${c.txt}»`);
                  }
                }
              }
            });
          return out;
        });
        expect(colisoes).toEqual([]);
      });
    }
  });
}
