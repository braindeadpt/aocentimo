import { chromium } from "playwright";
const b = await chromium.launch();
for (const vp of [{width:1440,height:900},{width:375,height:667}]) {
  const p = await b.newPage({viewport:vp});
  await p.goto("http://localhost:3100/", {waitUntil:"load"});
  await p.waitForTimeout(1200);
  await p.screenshot({path:`.screenshots/m10/home-${vp.width}.png`});
  await p.evaluate(() => document.getElementById("instrumento")?.scrollIntoView());
  await p.waitForTimeout(2500);
  await p.screenshot({path:`.screenshots/m10/instrumento-${vp.width}.png`, fullPage:false});
  await p.close();
}
await b.close();
