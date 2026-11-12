import imi2026 from "@data/fiscal/imi-2026.json";
import {
  compararMunicipios as compararMunicipiosPuro,
  desdobraPrestacoes as desdobraPrestacoesPuro,
  imi as imiPuro,
  taxaDoMunicipio as taxaDoMunicipioPuro,
  type ComparacaoMunicipio,
  type EntradaImi,
  type MunicipioConhecido,
  type Prestacao,
  type RegrasImi,
  type ResultadoImi,
} from "./imi-puro";

export type {
  ComparacaoMunicipio,
  EntradaImi,
  MunicipioConhecido,
  Prestacao,
  RegrasImi,
  ResultadoImi,
};

/**
 * IMI — Imposto Municipal sobre Imóveis.
 *
 * Regras versionadas em data/fiscal/imi-AAAA.json (CIMI, Decreto-Lei
 * n.º 287/2003, de 12 de novembro, na redacção da AT).
 *
 * O cálculo é trivial — `IMI = VPT × taxa` — e é essa trivialidade que
 * esconde duas coisas que o motor tem de preservar:
 *
 * 1. **O VPT não é o preço.** É o valor fiscal do imóvel, determinado pela
 *    AT a partir de área, localização, idade e custo de construção. Se a app
 *    mostrar «gastaste X € a comprar casa», o IMI não é X × taxa. O VPT vem
 *    da nota de liquidação.
 * 2. **A taxa é municipal, não nacional.** Cada assembleia municipal fixa a
 *    sua, dentro de 0,3 % a 0,45 %, e pode criar áreas com taxas diferentes
 *    na mesma freguesia. Por isso a taxa entra como argumento e não há valor
 *    por omissão: se o município não estiver nas regras, o motor falha em vez
 *    de chutar a mínima.
 */

export const REGRAS_IMI: Record<number, RegrasImi> = {
  2026: imi2026 as RegrasImi,
};

/** A taxa do município, se estiver nas regras; se não estiver, falha. */
export function taxaDoMunicipio(
  municipio: MunicipioConhecido,
  ano = 2026
): number {
  const r = REGRAS_IMI[ano];
  if (!r) throw new Error(`imi: não há regras para ${ano}`);
  return taxaDoMunicipioPuro(municipio, r);
}

/**
 * IMI de um prédio urbano: VPT × taxa, menos a dedução familiar, mais a
 * majoração por degradação.
 *
 * A dedução por dependentes é o que o chamamos IMI familiar, e é uma redução
 * **em euros** (30/70/140), não uma percentagem. Depende de o município ter
 * deliberado: sem deliberação não há dedução, mesmo que a casa tenha três
 * dependentes. E só se aplica a habitação própria e permanente.
 */
export function imi(e: EntradaImi): ResultadoImi {
  const ano = e.ano ?? 2026;
  const r = REGRAS_IMI[ano];
  if (!r) throw new Error(`imi: não há regras para ${ano}`);
  return imiPuro(e, r);
}

/**
 * Desdobra o imposto em prestações, pelo art. 120.º n.º 1: uma até 100 €,
 * duas acima disso e até 500 €, três acima de 500 €. Meses de maio, novembro
 * e agosto.
 */
export function desdobraPrestacoes(
  montante: number,
  ano = 2026
): Prestacao[] {
  const r = REGRAS_IMI[ano];
  if (!r) throw new Error(`imi: não há regras para ${ano}`);
  return desdobraPrestacoesPuro(montante, r);
}

/**
 * Compara o mesmo imóvel em todos os municípios com taxa curada. Mostra
 * que a diferença entre dois counties da mesma lei pode ser de 50 % do
 * imposto — o que o intervalo «0,3 % a 0,45 %» não deixa logo à vista.
 */
export function compararMunicipios(
  vpt: number,
  opcoes: {
    imiFamiliar?: boolean;
    habitacaoPropriaPermanente?: boolean;
    dependentes?: number;
    ano?: number;
  } = {}
): ComparacaoMunicipio[] {
  const ano = opcoes.ano ?? 2026;
  const r = REGRAS_IMI[ano];
  if (!r) throw new Error(`imi: não há regras para ${ano}`);
  return compararMunicipiosPuro(vpt, r, opcoes);
}
