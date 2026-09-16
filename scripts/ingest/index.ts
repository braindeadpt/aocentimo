import path from "path";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { runEurostat } from "./eurostat";
import { runBpstat } from "./bpstat";
import { runDgeg } from "./dgeg";

const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "data");

interface FonteMeta {
  id: string;
  fonte: string;
  url: string;
  recolhidoEm: string;
  serieAte: string;
  frequencia: string;
}

async function main() {
  const daily = process.argv.includes("--daily");
  const monthly = process.argv.includes("--monthly") || !daily;

  const fontes: FonteMeta[] = [];
  const metaPath = path.join(DATA, "meta", "sources.json");
  if (existsSync(metaPath)) {
    try {
      fontes.push(...(JSON.parse(readFileSync(metaPath, "utf8")) as FonteMeta[]));
    } catch {
      /* reconstruir */
    }
  }

  if (monthly) {
    const docs = await runEurostat(path.join(DATA, "sources", "eurostat"));
    for (const d of docs) {
      fontes.push({
        id: d.meta.id,
        fonte: d.meta.fonte,
        url: d.meta.url,
        recolhidoEm: d.meta.recolhidoEm,
        serieAte: d.meta.serieAte,
        frequencia: "mensal",
      });
    }
  }

  if (daily) {
    // Euribor média mensal (atualiza ~1.º dia útil do mês) + PMD diário DGEG
    const euribor = await runBpstat(path.join(DATA, "sources", "bpstat"));
    for (const d of euribor) {
      fontes.push({
        id: d.meta.id,
        fonte: d.meta.fonte,
        url: d.meta.url,
        recolhidoEm: d.meta.recolhidoEm,
        serieAte: d.meta.serieAte,
        frequencia: "mensal",
      });
    }
    const pmd = await runDgeg(path.join(DATA, "sources", "dgeg"));
    for (const d of pmd) {
      fontes.push({
        id: d.meta.id,
        fonte: d.meta.fonte,
        url: d.meta.url,
        recolhidoEm: d.meta.recolhidoEm,
        serieAte: d.meta.serieAte,
        frequencia: "diaria",
      });
    }
  }

  // Dedup por id mantendo a última recolha
  const mapa = new Map(fontes.map((f) => [f.id, f]));
  mkdirSync(path.join(DATA, "meta"), { recursive: true });
  writeFileSync(metaPath, JSON.stringify([...mapa.values()], null, 2));
  console.log(`\nsources.json atualizado (${mapa.size} fontes)`);
}

main().catch((e) => {
  console.error("Ingest falhou:", e);
  process.exit(1);
});
