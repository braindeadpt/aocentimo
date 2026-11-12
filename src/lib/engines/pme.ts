import irc2026 from "@data/fiscal/irc-2026.json";
import irs2026 from "@data/fiscal/irs-2026.json";
import iva from "@data/fiscal/iva.json";
import ss from "@data/fiscal/ss.json";
import {
  simularPmePuro,
  type InputPme,
  type RegiaoPme,
  type RegrasIrcPuro,
  type RegrasPmePuro,
  type ResultadoPme,
} from "./pme-puro";

export type { InputPme, RegiaoPme, RegrasIrcPuro, RegrasPmePuro, ResultadoPme };

/**
 * Motor fiscal de Pequena Empresa (PME) — IRC 2026 (Lei n.º 64/2025: 15 % nos
 * primeiros 50 000 € de matéria coletável e 19 % no excedente no Continente;
 * 10,5 % e 13,3 % nas Regiões Autónomas), derrama municipal (até 1,5 %, Lei
 * 73/2013 art. 18.º), IVA liquidado − IVA dedutível, TSU/SS/IRS sobre a
 * remuneração do sócio-gerente e tributação de dividendos (28 % taxa
 * liberatória vs. englobamento em 50 % pelo art. 40.º-A do CIRS).
 */

export const REGRAS_PME_2026: RegrasPmePuro = {
  irc: irc2026 as unknown as RegrasIrcPuro,
  tsuTrabalhador: ss.trabalhador.taxa,
  tsuEntidade: ss.entidadePatronal.taxa,
  ivaNormalContinente:
    iva.taxas.find((t) => t.nome === "Normal")?.taxa ?? 0.23,
  irs: {
    deducaoEspecificaFixa: irs2026.deducaoEspecificaFixa,
    despesasGeraisPorTitular: irs2026.despesasGeraisPorTitular,
    minimoExistencia: irs2026.minimoExistencia,
    escaloes: irs2026.escaloes.map((e) => ({ ate: e.ate, taxa: e.taxa })),
  },
};

export function simularPme(input: InputPme): ResultadoPme {
  return simularPmePuro(input, REGRAS_PME_2026);
}
