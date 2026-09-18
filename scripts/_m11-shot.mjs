import { chromium } from "playwright";
const b = await chromium.launch();
for (const vp of [{width:1440,height:900},{width:375,height:667}]) {
  const p = await b.newPage({viewport:vp});
  await p.goto("http://localhost:3100/salario", {waitUntil:"load"});
  await p.waitForTimeout(900);
  await p.screenshot({path:`.screenshots/m11/topo-${vp.width}.png`});
  // muda o bruto → reimpressão a meio
  await p.fill("#bruto", "2200");
  await p.waitForTimeout(320);
  await p.screenshot({path:`.screenshots/m11/reimprime-${vp.width}.png`});
  await p.evaluate(() => document.querySelector(".fita-compacta")?.scrollIntoView({block:"center"}));
  await p.waitForTimeout(2400);
  await p.screenshot({path:`.screenshots/m11/fita-${vp.width}.png`});
  await p.close();
}
await b.close();
