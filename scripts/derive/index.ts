import path from "path";
import { runHicp } from "./hicp";
import { runFreshness } from "./freshness";
import { runFiscalFontes } from "./fiscal-fontes";
import { runCaBase } from "./paineis";
import { runDerivados } from "./derivados";
import { runCenarios } from "./cenarios";
import { runPainel } from "./painel";
import { runApi } from "./api";

const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "data");

/**
 * Pipeline de derivados — corre após cada ingest e em CI.
 * 1. Resume as séries brutas para data/derived/
 * 2. Taxa base CA indicativa (Euribor 3M → cap 2,5 %)
 * 3. Watchdog de frescura → data/meta/freshness.json (falha ruidosamente)
 * 4. API estática public/api/*.json (o RSS vive na route app/feed.xml)
 */
function main() {
  const resumo = runHicp(DATA);
  console.log(`✓ hicp-resumo.json: ${resumo.series.length} séries derivadas`);

  const ca = runCaBase(DATA);
  if (ca) console.log(`✓ ca-base.json: indicativa até ${ca.meta.serieAte}`);

  runDerivados(DATA);

  const cen = runCenarios(DATA);
  console.log(
    `✓ cenarios-salario.json: ${cen.meta.n} pontos de ${cen.meta.inicio} € a ${cen.meta.fim} € (passo ${cen.meta.passo} €)`
  );

  const fiscais = runFiscalFontes(DATA);
  console.log(`✓ sources.json: ${fiscais.length} fontes fiscais registadas`);

  const frescura = runFreshness(path.join(DATA, "meta"));
  for (const s of frescura.series) {
    const marca = s.estado === "em-dia" ? "✓" : s.estado === "sem-sla" ? "·" : "✗";
    const extra =
      s.estado === "atrasada" ? ` — atrasada ${s.atrasoPeriodos} período(s), esperado ${s.esperadoAte}` : "";
    console.log(`${marca} ${s.id}: até ${s.serieAte}${extra}`);
  }

  runPainel(DATA, frescura, ROOT);

  runApi(ROOT);

  if (frescura.estado === "atrasado") {
    console.error("\nFALHA: há séries atrasadas — ver data/meta/freshness.json");
    process.exit(1);
  }
}

main();
