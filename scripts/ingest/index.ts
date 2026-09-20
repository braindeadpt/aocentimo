import path from "path";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { runEurostat } from "./eurostat";
import { runBpstat } from "./bpstat";
import { runDgeg } from "./dgeg";
import type { ResultadoFonte } from "./_http";
import type { SerieGuardada } from "./eurostat";

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

/**
 * Orquestrador — cada fonte é isolada: uma falha não derruba as outras.
 * Grava data/meta/ingest-log.json com o resultado por fonte e sai com
 * código 1 apenas se TODAS as fontes do modo falharem.
 *
 * Teste: `AOC_FALHAR=<fonte>` (eurostat|bpstat|dgeg) força a falha dessa
 * fonte sem a chamar — serve para verificar o isolamento em aceitação.
 */
async function main() {
  const daily = process.argv.includes("--daily");
  const monthly = process.argv.includes("--monthly") || !daily;

  const fontes: FonteMeta[] = [];
  const metaDir = path.join(DATA, "meta");
  const metaPath = path.join(metaDir, "sources.json");
  if (existsSync(metaPath)) {
    try {
      fontes.push(...(JSON.parse(readFileSync(metaPath, "utf8")) as FonteMeta[]));
    } catch {
      /* reconstruir */
    }
  }

  const log: Record<string, { ok: boolean; erro?: string; series: number }> = {};
  const correr = async (
    nome: string,
    fn: () => Promise<ResultadoFonte<SerieGuardada>>
  ): Promise<SerieGuardada[]> => {
    let r: ResultadoFonte<SerieGuardada>;
    if (process.env.AOC_FALHAR === nome) {
      r = { ok: false, erro: "falha forçada (AOC_FALHAR)" };
    } else {
      r = await fn();
    }
    if (r.ok) {
      log[nome] = { ok: true, series: r.docs.length };
      return r.docs;
    }
    console.error(`✗ ${nome}: ${r.erro}`);
    log[nome] = { ok: false, erro: r.erro, series: 0 };
    return [];
  };

  if (monthly) {
    const docs = await correr("eurostat", () =>
      runEurostat(path.join(DATA, "sources", "eurostat"))
    );
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
    const euribor = await correr("bpstat", () =>
      runBpstat(path.join(DATA, "sources", "bpstat"))
    );
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
    const pmd = await correr("dgeg", () =>
      runDgeg(path.join(DATA, "sources", "dgeg"))
    );
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

  // Dedup por id mantendo a última recolha; ids de fontes que falharam
  // conservam a entrada anterior — nunca se apaga uma série boa.
  const mapa = new Map(fontes.map((f) => [f.id, f]));
  mkdirSync(metaDir, { recursive: true });
  writeFileSync(metaPath, JSON.stringify([...mapa.values()], null, 2));

  writeFileSync(
    path.join(metaDir, "ingest-log.json"),
    JSON.stringify({ correuEm: new Date().toISOString(), fontes: log }, null, 2)
  );

  const total = Object.keys(log).length;
  const falhas = Object.values(log).filter((f) => !f.ok).length;
  console.log(
    `\nsources.json atualizado (${mapa.size} fontes) · ${total - falhas}/${total} fontes ok`
  );
  if (total > 0 && falhas === total) {
    console.error("FALHA: todas as fontes falharam");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Ingest falhou:", e);
  process.exit(1);
});
