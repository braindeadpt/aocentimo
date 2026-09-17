// Auditoria visual — visita todas as rotas nos dois temas, regista erros
// de consola e grava screenshots em test-results/audit/.
// Uso: node scripts/audit-visual.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const ROTAS = [
  "/", "/salario", "/impostos", "/inflacao", "/credito", "/casa", "/irs",
  "/trabalho", "/poupanca", "/precos", "/dados", "/aprender",
  "/metodologia", "/sobre", "/estilo",
];

mkdirSync("test-results/audit", { recursive: true });
const relatorio = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const tema of ["light", "dark"]) {
  for (const rota of ROTAS) {
    const erros = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") erros.push(msg.text().slice(0, 200));
    });
    page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));

    await page.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    await page.evaluate(
      (t) => document.documentElement.setAttribute("data-theme", t),
      tema
    );
    await page.waitForTimeout(700); // animações de entrada assentam

    const nome = `${tema}${rota === "/" ? "-home" : rota.replaceAll("/", "-")}`;
    await page.screenshot({
      path: `test-results/audit/${nome}.png`,
      fullPage: false,
    });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    relatorio.push({ tema, rota, erros, overflow });
    console.log(
      `${erros.length ? "✗" : "✓"} ${tema.padEnd(5)} ${rota.padEnd(14)} erros=${erros.length} overflow=${overflow}px`
    );
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
  }
}

writeFileSync(
  "test-results/audit/relatorio.json",
  JSON.stringify(relatorio, null, 2)
);
await browser.close();
const totalErros = relatorio.reduce((a, r) => a + r.erros.length, 0);
const comOverflow = relatorio.filter((r) => r.overflow > 1);
console.log(`\n${relatorio.length} páginas · ${totalErros} erros de consola`);
if (comOverflow.length)
  console.log("overflow-x:", comOverflow.map((r) => `${r.tema}${r.rota}=${r.overflow}px`));
