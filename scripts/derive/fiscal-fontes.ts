import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import path from "path";

/**
 * Regista os ficheiros fiscais curados (data/fiscal/*.json) em
 * data/meta/sources.json para entrarem no watchdog de frescura e em
 * /metodologia. São dados manuais ("vigência declarada"): o recolhidoEm é a
 * própria vigência e o SLA reflete a cadência esperada de revisão —
 * ca.json mensal (IGCP), isp.json trimestral (portarias), restantes anual.
 */

interface FonteMeta {
  id: string;
  fonte: string;
  url: string;
  recolhidoEm: string;
  serieAte: string;
  frequencia: string;
}

interface FiscalDoc {
  vigencia: string;
  fonteUrl?: string;
}

const FREQUENCIA_POR_FICHEIRO: Record<string, string> = {
  "ca": "mensal",
  "isp": "trimestral",
};

const NOME_POR_FICHEIRO: Record<string, string> = {
  "ca": "IGCP — curado",
  "isp": "AT/DR — curado",
  "imt-2026": "AT — Ofício 40129/2026 — curado",
  "desemprego": "Seg. Social/DL 220/2006 — curado",
  "subsidio-alimentacao": "Portaria 51-B/2026/1 — curado",
  "irs-jovem": "Art. 12.º-B CIRS — curado",
};

function serieAte(vigencia: string, frequencia: string): string {
  const [y, m] = vigencia.split("-").map(Number);
  switch (frequencia) {
    case "anual":
      return `${y}`;
    case "trimestral":
      return `${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, "0")}`;
    default:
      return vigencia.slice(0, 7);
  }
}

export function runFiscalFontes(dataDir: string): FonteMeta[] {
  const fiscalDir = path.join(dataDir, "fiscal");
  const metaPath = path.join(dataDir, "meta", "sources.json");
  if (!existsSync(fiscalDir)) return [];

  const fontes: FonteMeta[] = existsSync(metaPath)
    ? (JSON.parse(readFileSync(metaPath, "utf8")) as FonteMeta[])
    : [];

  for (const file of readdirSync(fiscalDir).filter((f) => f.endsWith(".json"))) {
    const base = file.replace(".json", "");
    const doc = JSON.parse(readFileSync(path.join(fiscalDir, file), "utf8")) as FiscalDoc;
    if (!doc.vigencia) continue;

    const frequencia = FREQUENCIA_POR_FICHEIRO[base] ?? "anual";
    fontes.push({
      id: `fiscal-${base}`,
      fonte: NOME_POR_FICHEIRO[base] ?? "OE/DR — curado",
      url: doc.fonteUrl ?? "https://diariodarepublica.pt",
      recolhidoEm: `${doc.vigencia.slice(0, 10)}T00:00:00Z`,
      serieAte: serieAte(doc.vigencia, frequencia),
      frequencia,
    });
  }

  const mapa = new Map(fontes.map((f) => [f.id, f]));
  mkdirSync(path.dirname(metaPath), { recursive: true });
  writeFileSync(metaPath, JSON.stringify([...mapa.values()], null, 2));
  return [...mapa.values()].filter((f) => f.id.startsWith("fiscal-"));
}
