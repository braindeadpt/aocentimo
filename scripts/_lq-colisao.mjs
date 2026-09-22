// mede colisões reais entre rótulos <text> dos SVG .lq-graf a 375px
// (e outras larguras) — getBBox() no browser, não estimativa
import { chromium } from "@playwright/test";

const ROTAS = ["/", "/precos", "/inflacao", "/dados", "/casa", "/credito", "/trabalho", "/poupanca"];
const LARGURAS = [375, 768, 1440];

const browser = await chromium.launch();
let falhas = 0;
for (const w of LARGURAS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  for (const rota of ROTAS) {
    await page.goto(`http://localhost:3000${rota}`, { waitUntil: "load" });
    await page.waitForTimeout(700);
    const res = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll(".leitura .lq-graf svg").forEach((svg, si) => {
        const card = svg.closest(".leitura");
        const nome =
          card?.querySelector(".leitura-breadcrumb")?.textContent?.trim() ??
          `svg#${si}`;
        const boxSvg = svg.getBoundingClientRect();
        const escala = boxSvg.width / (svg.viewBox.baseVal.width || boxSvg.width);
        const textos = [...svg.querySelectorAll("text")].map((t) => {
          const b = t.getBBox();
          return {
            cls: t.getAttribute("class") ?? "",
            txt: t.textContent ?? "",
            l: b.x * escala,
            r: (b.x + b.width) * escala,
            t: b.y * escala,
            b: (b.y + b.height) * escala,
          };
        }).filter((t) => t.txt.trim() !== "" && !t.cls.includes("lq-ref-rotulo-x"));
        for (let i = 0; i < textos.length; i++) {
          for (let j = i + 1; j < textos.length; j++) {
            const a = textos[i], c = textos[j];
            const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l);
            const oy = Math.min(a.b, c.b) - Math.max(a.t, c.t);
            if (ox > 1 && oy > 1) {
              out.push(
                `${nome}: «${a.txt}»[${a.cls}] ∩ «${c.txt}»[${c.cls}] (${ox.toFixed(0)}×${oy.toFixed(0)}px)`
              );
            }
          }
        }
      });
      return out;
    });
    for (const l of res) {
      falhas++;
      console.log(`${rota} @${w}: ${l}`);
    }
  }
  await page.close();
}
console.log(falhas ? `\n${falhas} colisões` : "\nsem colisões");
await browser.close();
