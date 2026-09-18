import { chromium } from "playwright";
const b = await chromium.launch();
for (const vp of [{width:1440,height:900},{width:375,height:667}]) {
  const p = await b.newPage({viewport:vp});
  await p.goto("http://localhost:3100/impostos", {waitUntil:"load"});
  // talão de compras — estado inicial + a separação a meio
  const talao = p.locator(".talao-wrap").first();
  await talao.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({path:`.screenshots/m12/talao-${vp.width}.png`});
  // muda um preço → a separação re-dispara
  await p.locator(".talao-field").nth(5).fill("5.99");
  await p.waitForTimeout(180);
  await p.screenshot({path:`.screenshots/m12/separacao-${vp.width}.png`});
  // cascata do combustível — apanha a animação a meio e no fim
  const fuel = p.locator(".fuel-casca, svg.h-56").first();
  await fuel.scrollIntoViewIfNeeded();
  await p.locator("#preco").fill("1.85");
  await p.waitForTimeout(350);
  await p.screenshot({path:`.screenshots/m12/cascata-meio-${vp.width}.png`});
  await p.waitForTimeout(1200);
  await p.screenshot({path:`.screenshots/m12/cascata-fim-${vp.width}.png`});
  await p.close();
}
await b.close();
