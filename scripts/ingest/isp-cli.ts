import path from "path";
import { runIsp } from "./isp";

/**
 * Entrada CLI da vigilância do ISP (portarias dos combustíveis rodoviários).
 * Códigos de saída:
 *   0 — consulta ok, sem portarias novas e vigência recente;
 *   2 — ALARME: portaria(s) nova(s) no DR e/ou vigência com mais de 8 dias;
 *   1 — falha honesta (rede/feed indisponível com vigência recente) — repetir mais tarde.
 */

const ROOT = path.resolve(__dirname, "..", "..");

async function main() {
  // A comparação com o isp.json vive no runIsp — aqui só se lê o veredicto.
  const estado = await runIsp(path.join(ROOT, "data"));
  console.log(
    JSON.stringify(
      {
        novas: estado.novas.map((n) => `${n.numero} (${n.data})`),
        ultimaPortariaFeed: estado.ultimaPortariaFeed?.numero ?? null,
        ispJson: estado.ispJson,
        idadeDias: estado.idadeDias,
        motivo: estado.motivo,
        falhaFeed: estado.falhaFeed,
        alarme: estado.alarme,
        consultadoEm: estado.consultadoEm,
      },
      null,
      2
    )
  );
  process.exit(estado.alarme ? 2 : 0);
}

main().catch((e: unknown) => {
  console.error("Vigilância ISP falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
