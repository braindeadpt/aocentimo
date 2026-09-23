import path from "path";
import { writeFileSync } from "fs";
import { gerarCenarios } from "../../src/lib/cenarios";

/**
 * data/derived/cenarios-salario.json — a grelha canónica de salários
 * (V4, S1-09): SMN e depois múltiplos exactos de 50 € até 6 000 €,
 * cada ponto calculado pelo motor fiscal real. O cliente mostra estes
 * pontos, nunca interpola.
 */
export function runCenarios(dataDir: string) {
  const cenarios = gerarCenarios();
  const alvo = path.join(dataDir, "derived", "cenarios-salario.json");
  writeFileSync(alvo, JSON.stringify(cenarios, null, 2) + "\n");
  return cenarios;
}
