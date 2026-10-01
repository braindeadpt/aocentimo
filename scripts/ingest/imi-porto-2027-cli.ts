import path from "path";
import { runImiPorto2027 } from "./imi-porto-2027";

/**
 * Entrada CLI da vigilância IMI Familiar do Porto 2027. Códigos de saída:
 *   0 — consulta ok, sem documentos novos nas deliberações da AM;
 *   2 — ALARME: documento(s) novo(s) — abrir docs/VIGILANCIA-IMI-PORTO-2027.md
 *       e procurar no PDF o ponto «fixação das taxas do IMI» / IMI Familiar;
 *   1 — falha honesta (rede/estrutura da página) — repetir mais tarde.
 */

const ROOT = path.resolve(__dirname, "..", "..");

async function main() {
  const estado = await runImiPorto2027(path.join(ROOT, "data"));
  console.log(
    JSON.stringify(
      {
        novos: estado.novos.length,
        destacados: estado.destacados.length,
        vistos: estado.vistos.length,
        consultadoEm: estado.consultadoEm,
      },
      null,
      2
    )
  );
  process.exit(estado.novos.length > 0 ? 2 : 0);
}

main().catch((e: unknown) => {
  console.error("Vigilância IMI Porto 2027 falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
