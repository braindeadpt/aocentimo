import path from "path";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";

/**
 * API pública estática: copia as séries e metadados para
 * public/api/*.json — servidos como ficheiros estáticos no build,
 * compatíveis com output: 'export' e qualquer hosting grátis.
 */
export function runApi(rootDir: string) {
  const outDir = path.join(rootDir, "public", "api");
  mkdirSync(outDir, { recursive: true });

  const dataDir = path.join(rootDir, "data");
  const endpoints: { path: string; descricao: string }[] = [];

  const copiar = (src: string, nome: string, descricao: string) => {
    if (!existsSync(src)) return;
    writeFileSync(path.join(outDir, nome), readFileSync(src));
    endpoints.push({ path: `/api/${nome}`, descricao });
  };

  // Séries brutas
  for (const dir of ["bpstat", "dgeg", "eurostat"]) {
    const dirPath = path.join(dataDir, "sources", dir);
    if (!existsSync(dirPath)) continue;
    for (const f of readdirSync(dirPath).filter((x) => x.endsWith(".json"))) {
      copiar(path.join(dirPath, f), f, `Série ${f.replace(".json", "")} (${dir})`);
    }
  }
  // Derivados e metadados
  copiar(path.join(dataDir, "derived", "hicp-resumo.json"), "ihpc-resumo.json", "IHPC resumido por categoria");
  copiar(path.join(dataDir, "derived", "ca-base.json"), "ca-base.json", "Taxa base CA Série F — indicativa e oficial");
  copiar(path.join(dataDir, "derived", "casa-em-salarios.json"), "casa-em-salarios.json", "Razão HPI ÷ custo do trabalho, 2015=100");
  copiar(path.join(dataDir, "derived", "desemprego-gap.json"), "desemprego-gap.json", "Desemprego PT menos UE27, em pontos percentuais");
  copiar(path.join(dataDir, "derived", "painel.json"), "painel.json", "Painel da home — leituras com variação, spark e frescura");
  copiar(path.join(dataDir, "meta", "freshness.json"), "freshness.json", "Estado de frescura de todas as fontes");
  copiar(path.join(dataDir, "meta", "sources.json"), "sources.json", "Registo de fontes e datas das séries");

  // Índice
  const indice = {
    nome: "AO CÊNTIMO — dados abertos",
    descricao:
      "Séries estáticas geradas a partir de fontes oficiais (Eurostat, BPstat, DGEG, IGCP, AT). Atualizadas a cada build.",
    geradoEm: new Date().toISOString(),
    endpoints,
  };
  writeFileSync(path.join(outDir, "index.json"), JSON.stringify(indice, null, 2));
  console.log(`✓ API estática: ${endpoints.length + 1} ficheiros em public/api/`);
  return endpoints;
}
