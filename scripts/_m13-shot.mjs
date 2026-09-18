import { chromium } from "playwright";
const b = await chromium.launch();
for (const vp of [{width:1440,height:900},{width:375,height:667}]) {
  const p = await b.newPage({viewport:vp});
  await p.goto("http://localhost:3100/casa", {waitUntil:"load"});
  const esc = p.locator(".talao-wrap").first();
  await esc.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({path:`.screenshots/m13/escritura-${vp.width}.png`});
  // muda o preço → a acreção re-imprime
  await p.locator("#preco").fill("260000");
  await p.waitForTimeout(260);
  await p.screenshot({path:`.screenshots/m13/acrecao-${vp.width}.png`});
  // juro vs capital — a faixa revelada no tempo
  await p.evaluate(() => document.querySelector(".tempo-revela")?.closest("svg")?.scrollIntoView({block:"center"}));
  await p.waitForTimeout(1500);
  await p.screenshot({path:`.screenshots/m13/tempo-${vp.width}.png`});
  // scrub por ano
  await p.locator('input[aria-label="Percorrer os anos do crédito"]').fill("9");
  await p.waitForTimeout(300);
  await p.screenshot({path:`.screenshots/m13/scrub-${vp.width}.png`});
  await p.close();
}
await b.close();
