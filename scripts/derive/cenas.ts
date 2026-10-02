import path from "path";
import { mkdirSync, writeFileSync } from "fs";
import { dadosCenas } from "../../src/app/_bairro/cenas/dados";

/**
 * public/cenas/<id>.json — os dados de cada cena do bairro, servidos
 * como ficheiros estáticos (P4 — a dieta do payload da home).
 *
 * Antes, `dadosCenas()` viajava inteira na prop do `<Bairro>` e o Next
 * embarcava-a no flight da home: ~19 KB raw de séries e tabelas para
 * quem nunca abre uma cena. Agora a home não traz nada — cada cena faz
 * `fetch("/cenas/<id>.json")` ao abrir (ver `CenaViva` no Bairro.tsx).
 *
 * É a MESMA `dadosCenas()` do servidor — nenhuma lógica copiada: este
 * script só muda ONDE o resultado mora. Corre no `npm run derive`,
 * por isso a ingest diária actualiza os ficheiros como actualiza a
 * `public/api/`, e os JSON vão commitados no mesmo gesto.
 *
 * Uma asneira consciente do formato: JSON não tem NaN. `dadosFinancas`
 * usa NaN para marcar um buraco a meio da tabela de escalões — se isso
 * alguma vez acontecer, PREFERIMOS falhar o derive aqui a escrever um
 * `null` que a aritmética da cena leria como 0 (regra nº1).
 */
export function runCenasJson(ROOT: string): string[] {
  const dir = path.join(ROOT, "public", "cenas");
  mkdirSync(dir, { recursive: true });
  const cenas = dadosCenas();
  const ids: string[] = [];
  for (const [id, dados] of Object.entries(cenas)) {
    const txt = JSON.stringify(dados, (_chave, v) => {
      if (typeof v === "number" && !Number.isFinite(v)) {
        throw new Error(
          `cenas/${id}: valor não finito — o JSON não tem NaN; a fonte tem um buraco e a cena deve mostrar «—»`
        );
      }
      return v;
    });
    writeFileSync(path.join(dir, `${id}.json`), txt);
    ids.push(id);
  }
  return ids;
}
