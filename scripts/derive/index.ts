import path from "path";
import { runHicp } from "./hicp";
import { runFreshness } from "./freshness";

const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "data");

/**
 * Pipeline de derivados — corre após cada ingest e em CI.
 * 1. Resume as séries brutas para data/derived/
 * 2. Watchdog de frescura → data/meta/freshness.json (falha ruidosamente)
 */
function main() {
  const resumo = runHicp(DATA);
  console.log(`✓ hicp-resumo.json: ${resumo.series.length} séries derivadas`);

  const frescura = runFreshness(path.join(DATA, "meta"));
  for (const s of frescura.series) {
    const marca = s.estado === "em-dia" ? "✓" : s.estado === "sem-sla" ? "·" : "✗";
    const extra =
      s.estado === "atrasada" ? ` — atrasada ${s.atrasoPeriodos} período(s), esperado ${s.esperadoAte}` : "";
    console.log(`${marca} ${s.id}: até ${s.serieAte}${extra}`);
  }
  if (frescura.estado === "atrasado") {
    console.error("\nFALHA: há séries atrasadas — ver data/meta/freshness.json");
    process.exit(1);
  }
}

main();
