import path from "path";
import { runIsp } from "./isp";

/**
 * Entrada CLI da vigilância do ISP (portarias dos combustíveis rodoviários).
 * Códigos de saída:
 *   0 — consulta ok, sem portarias novas desde a citada no isp.json;
 *   2 — ALARME: há portaria(s) nova(s) no DR — abrir a checklist;
 *   1 — falha honesta (rede/feed indisponível) — repetir mais tarde.
 */

const ROOT = path.resolve(__dirname, "..", "..");

async function main() {
  // A comparação com o isp.json vive no runIsp — aqui só se lê o veredicto.
  const estado = await runIsp(path.join(ROOT, "data"));
  const alarme = estado.novas.length > 0;
  console.log(
    JSON.stringify(
      {
        novas: estado.novas.map((n) => `${n.numero} (${n.data})`),
        ultimaPortariaFeed: estado.ultimaPortariaFeed?.numero ?? null,
        ispJson: estado.ispJson,
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
  console.error("Vigilância ISP falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
