/**
 * painel — a composição de dashboards (1B-06): três tamanhos de
 * cartão (S, M, L) numa grelha de seis colunas, com duas regras
 * duras verificadas por teste:
 *
 *  - NENHUM cartão fica órfão numa linha: a grelha só aceita linhas
 *    completas — {L}, {M+S}, {S+M} ou {S+S+S} — e o packing escolhe
 *    os tamanhos dentro dos permitidos por cartão para que cada
 *    linha feche exactamente (o órfão da última linha é sempre
 *    evitável por rearranjo de tamanhos).
 *  - Dois cartões seguidos NUNCA usam a mesma codificação: a
 *    configuração declara a codificação de cada cartão e
 *    `validarVizinhanca` reprova repetições adjacentes.
 *
 * Módulo PURO — sem messages nem data: corre no servidor (builders
 * e testes) e no cliente (o <Painel> compõe no render; o resultado
 * é determinista — SSR e hidratação coincidem).
 */

/** as gramáticas visuais que o painel alterna — os nomes do
    catálogo V4 (PRODUTO §5); «pontos» cobre as famílias de pontos
    (haltere, campo de cêntimos) e «isometrico» também o vazio
    (a ilustração do EstadoVazio é isométrica de traço) */
export type CodificacaoPainel =
  | "linha"
  | "pontos"
  | "tracos"
  | "anel"
  | "isometrico";

export type TamanhoPainel = "S" | "M" | "L";

/** janela temporal do <Segmentado> partilhado — «Máx» é a janela
    completa (~10 anos, como a V3) */
export type JanelaId = "1a" | "5a" | "max";

export const JANELA_ORDEM: readonly JanelaId[] = ["1a", "5a", "max"];

/** anos de histórico por janela — «max» cobre a série inteira */
export const JANELA_ANOS: Record<JanelaId, number> = {
  "1a": 1,
  "5a": 5,
  max: 10,
};

/** colunas da grelha do painel — S=2 (⅓), M=4 (⅔), L=6 (linha) */
export const PAINEL_COLUNAS = 6;
export const PAINEL_SPAN: Record<TamanhoPainel, number> = {
  S: 2,
  M: 4,
  L: 6,
};

/** os padrões de linha válidos — cada linha fecha exactamente as 6
    colunas; é isto que torna o órfão impossível por construção */
const PADROES: readonly (readonly TamanhoPainel[])[] = [
  ["M", "S"],
  ["S", "M"],
  ["L"],
  ["S", "S", "S"],
];

export interface CartaoTamanho {
  /** tamanho preferido — defeito "M" (o cartão quer ser grande) */
  tamanho?: TamanhoPainel;
  /** tamanhos que o cartão aceita — defeito ["S","M"] */
  tamanhos?: readonly TamanhoPainel[];
}

const permitidos = (c: CartaoTamanho): readonly TamanhoPainel[] =>
  c.tamanhos ?? ["S", "M"];

function custo(c: CartaoTamanho, tam: TamanhoPainel): number {
  if (!permitidos(c).includes(tam)) return Infinity;
  // cartão sem preferência declarada prefere ser grande — os painéis
  // ficam generosos por omissão e os S existem por necessidade da
  // grelha, não por gosto do algoritmo
  return tam === (c.tamanho ?? "M") ? 0 : 1;
}

/**
 * comporPainel — atribui um tamanho a cada cartão (na ordem dada; a
 * ordem é editorial e não se mexe) de modo a que a grelha feche
 * linha a linha. Devolve os tamanhos por posição, ou `null` quando
 * nenhuma combinação permitida fecha — nunca devolve uma composição
 * com órfão.
 *
 * Pesquisa: programação dinâmica sobre o índice do primeiro cartão
 * da linha (≤ ~12 cartões — trivial). Minimiza o número de desvios
 * ao tamanho preferido; o desempate é determinista (primeiro
 * padrão da lista PADROES).
 */
export function comporPainel(cartoes: readonly CartaoTamanho[]): TamanhoPainel[] | null {
  const n = cartoes.length;
  const memo = new Map<number, { custo: number; tams: TamanhoPainel[] } | null>();

  const resolve = (i: number): { custo: number; tams: TamanhoPainel[] } | null => {
    if (i >= n) return { custo: 0, tams: [] };
    if (memo.has(i)) return memo.get(i)!;

    let melhor: { custo: number; tams: TamanhoPainel[] } | null = null;
    for (const padrao of PADROES) {
      if (i + padrao.length > n) continue;
      const c = padrao.reduce(
        (acc, tam, k) => acc + custo(cartoes[i + k], tam),
        0
      );
      if (!Number.isFinite(c)) continue;
      const resto = resolve(i + padrao.length);
      if (!resto) continue;
      const cand = {
        custo: c + resto.custo,
        tams: [...padrao, ...resto.tams],
      };
      if (!melhor || cand.custo < melhor.custo) melhor = cand;
    }
    memo.set(i, melhor);
    return melhor;
  };

  return resolve(0)?.tams ?? null;
}

/** agrupa os tamanhos em linhas — cada linha é um padrão válido que
    fecha as PAINEL_COLUNAS (garantia do comporPainel; aqui só se
    materializa) */
export function linhasPainel(tams: readonly TamanhoPainel[]): TamanhoPainel[][] {
  const linhas: TamanhoPainel[][] = [];
  let linha: TamanhoPainel[] = [];
  let usado = 0;
  for (const tam of tams) {
    const span = PAINEL_SPAN[tam];
    if (usado + span > PAINEL_COLUNAS) {
      linhas.push(linha);
      linha = [];
      usado = 0;
    }
    linha.push(tam);
    usado += span;
  }
  if (linha.length) linhas.push(linha);
  return linhas;
}

/** true quando a linha fecha exactamente a grelha — o critério que
    o e2e mede em px com getBoundingClientRect */
export function linhaFecha(linha: readonly TamanhoPainel[]): boolean {
  return linha.reduce((a, t) => a + PAINEL_SPAN[t], 0) === PAINEL_COLUNAS;
}

/**
 * validarVizinhanca — a segunda regra dura: dois cartões seguidos
 * nunca partilham a codificação (a linha cansa, a alternância
 * ensina). Devolve os pares em falta — lista vazia = composição
 * válida. Corre no teste unitário sobre a configuração real e, em
 * dev, dentro do <Painel>.
 */
export function validarVizinhanca(
  codificacoes: readonly CodificacaoPainel[]
): { a: number; b: number; codificacao: CodificacaoPainel }[] {
  const faltas: { a: number; b: number; codificacao: CodificacaoPainel }[] = [];
  for (let i = 1; i < codificacoes.length; i++) {
    if (codificacoes[i] === codificacoes[i - 1]) {
      faltas.push({ a: i - 1, b: i, codificacao: codificacoes[i] });
    }
  }
  return faltas;
}

/**
 * cortarJanela — a série vista pela janela do <Segmentado>: últimos
 * `JANELA_ANOS[janela]` anos pelo prefixo do período (a mesma regra
 * do `janela10` dos builders — «1a» cobre o ano corrente e o
 * anterior; «max» = a janela de ~10 anos servida).
 */
export function cortarJanela<T extends { t: string }>(
  serie: readonly T[],
  janela: JanelaId
): T[] {
  const ult = serie[serie.length - 1];
  if (!ult) return [];
  const corte = Number(ult.t.slice(0, 4)) - JANELA_ANOS[janela];
  return serie.filter((p) => Number(p.t.slice(0, 4)) >= corte);
}
