/**
 * Os dados da cena da Torre dos Clérigos — «O Norte na economia».
 *
 * Lê `data/regional/norte.json` (estatísticas anuais oficiais, entrada
 * por PR manual com a fonte de cada número) e entrega números CRUS e a
 * linha de fontes. A cena formata; ninguém calcula nada fora daqui. Um
 * número em falta chega como `null` e a cena mostra «—» (regra nº1).
 */
import norteJson from "@data/regional/norte.json";

export interface DadosClerigos {
  pib: { ano: number; milhoesEur: number; pesoPct: number } | null;
  exportacoes: { ano: number; milhoesEur: number; pesoPct: number } | null;
  industria: { ano: number; milhares: number; pesoPct: number } | null;
  texteisPct: number | null;
  porHabitante: { ano: number; norte: number; pais: number } | null;
  fonte: string;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function dadosClerigos(): DadosClerigos {
  const N = norteJson;
  const pibPeso = num(N.pib?.pesoPct);
  const pibM = num(N.pib?.norteMilhoesEur);
  const expN = num(N.exportacoes?.norteEur);
  const expPt = num(N.exportacoes?.portugalEur);
  const indM = num(N.industria?.empregadosMilhares);
  const indPeso = num(N.industria?.pesoEmpregoPct);
  const hN = num(N.pibPorHabitante?.norteEur);
  const hPt = num(N.pibPorHabitante?.portugalEur);
  return {
    pib: pibPeso !== null && pibM !== null ? { ano: N.pib.ano, milhoesEur: pibM, pesoPct: pibPeso } : null,
    // o peso das exportações sai dos dois totais do INE, não de um número copiado
    exportacoes:
      expN !== null && expPt !== null && expPt > 0
        ? { ano: N.exportacoes.ano, milhoesEur: Math.round(expN / 1e6), pesoPct: (expN / expPt) * 100 }
        : null,
    industria: indM !== null && indPeso !== null ? { ano: N.industria.ano, milhares: indM, pesoPct: indPeso } : null,
    texteisPct: num(N.texteis?.pesoEmpregoNacionalPct),
    porHabitante: hN !== null && hPt !== null ? { ano: N.pibPorHabitante.ano, norte: hN, pais: hPt } : null,
    fonte: `${N.pib.fonte} · ${N.exportacoes.fonte} · ${N.industria.fonte} · PIB por habitante: ${N.pibPorHabitante.fonte}`,
  };
}
