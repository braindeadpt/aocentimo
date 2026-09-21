// atribui bytes gerados a módulos-fonte via sourcemaps Turbopack —
// «top N módulos» por chunk ou soma dos chunks partilhados.
// uso: node scripts/_bundle-top.mjs <chunk.js> [chunk2.js ...]
//      node scripts/_bundle-top.mjs --shared   (chunks carregados por /metodologia)
import { readFileSync, readdirSync } from "node:fs";
import { decode } from "@jridgewell/sourcemap-codec";

const dir = "out/_next/static/chunks";

function analisa(ficheiro, acc) {
  const js = readFileSync(`${dir}/${ficheiro}`, "utf8");
  const ref = /sourceMappingURL=([^\s*]+)/.exec(js)?.[1];
  if (!ref) throw new Error("sem sourceMappingURL");
  const map = JSON.parse(readFileSync(`${dir}/${ref}`, "utf8"));
  const linhas = js.split("\n");
  const mapeadas = decode(map.mappings);
  for (let l = 0; l < mapeadas.length; l++) {
    const segs = mapeadas[l];
    const tamLinha = (linhas[l] ?? "").length + 1;
    for (let i = 0; i < segs.length; i++) {
      const [genCol, srcIdx] = segs[i];
      const fim = i + 1 < segs.length ? segs[i + 1][0] : tamLinha;
      if (srcIdx == null) continue;
      const nome = (map.sources[srcIdx] ?? "?")
        .replace(/^\[project\]\//, "")
        .replace(/^.*node_modules\//, "nm/");
      acc.set(nome, (acc.get(nome) ?? 0) + Math.max(0, fim - genCol));
    }
  }
}

const alvo = process.argv.slice(2);
const ficheiros = alvo.length
  ? alvo
  : readdirSync(dir).filter((f) => f.endsWith(".js"));

const acc = new Map();
for (const f of ficheiros) {
  try {
    analisa(f, acc);
  } catch {
    console.error(`sem map: ${f}`);
  }
}
const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
let total = 0;
for (const [, v] of acc) total += v;
console.log(`total atribuído: ${(total / 1024).toFixed(0)} KB`);
for (const [n, v] of top)
  console.log(`${(v / 1024).toFixed(1).padStart(8)} KB  ${n}`);
