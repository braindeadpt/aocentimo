import path from "path";
import { lerEstadoAnterior, runCcd2225 } from "./ccd2225";

/**
 * Entrada CLI da vigilância CC2 (Diretiva 2023/2225). Códigos de saída:
 *   0 — consulta ok, sem medidas de transposição (ou já conhecidas);
 *   2 — ALARME: medidas apareceram no EUR-Lex (0 → n) — abrir a checklist;
 *   1 — falha honesta (rede/EUR-Lex em fila) — repetir mais tarde.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const FICHEIRO = path.join(ROOT, "data", "meta", "ccd2225-vigilia.json");

async function main() {
  const anterior = lerEstadoAnterior(FICHEIRO);
  const estado = await runCcd2225(path.join(ROOT, "data"));
  const alarme = estado.medidas > 0 && (anterior?.medidas ?? 0) === 0;
  console.log(
    JSON.stringify(
      {
        medidas: estado.medidas,
        transposto: estado.transposto,
        alarme,
        consultadoEm: estado.consultadoEm,
      },
      null,
      2
    )
  );
  process.exit(alarme ? 2 : 0);
}

main().catch((e: unknown) => {
  console.error("Vigilância CC2 falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
