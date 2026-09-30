/**
 * `dadosBairro()` — a porta de montagem de design/prototipos/mapa/montar.cjs
 * (P0-3 do PACK V5 PRODUÇÃO). Corre no SERVIDOR, no build.
 *
 * REGRA Nº1, e é a regra deste ficheiro: nenhum número sai daqui sem vir de
 * `data/` e com a fonte e a data à vista. Se uma série faltar, o valor é a
 * FALHA DECLARADA (`FALHOU`, o «—» do formatador) — nunca um zero, nunca um
 * número de outro dia, nunca um número inventado. O mapa mostra «—» e a
 * pessoa percebe que não há dado; um «0» seria mentira.
 *
 * Os textos que saem daqui já vêm FORMATADOS por `src/lib/format.ts` — o
 * protótipo formatava-os com uma função `eur()` escrita à mão dentro da
 * página, e a casa proíbe isso. `MarcadoresBairro` é só texto: a planta
 * escreve-o sem tocar.
 *
 * ÂMBITO DESTA SESSÃO (porquê, e o que fica de fora): o protótipo montava
 * aqui também os blocos de cada cena (as 8 rúbricas ECOICOP, a decomp do
 * combustível, o gráfico da Euribor…). Escrever isso agora seria adivinhar o
 * que as cenas vão pedir. Ficam os valores dos marcadores, a linha do salário
 * — que a Fábrica e as moedas já precisam — e as fontes. Os blocos das cenas
 * entram em P2, com a cena à vista, em `dadosCena()`.
 */
import { loadFonte, loadSerie, type Serie } from "@/lib/data";
import { fmtEUR, fmtNum, fmtPct } from "@/lib/format";
import caBase from "@data/derived/ca-base.json";
import cenarios from "@data/derived/cenarios-salario.json";
import ss from "@data/fiscal/ss.json";
import { montarMapa, type MapaBairro, type MarcadoresBairro } from "./planta";

/** O texto que o formatador escreve quando o número não existe. */
export const FALHOU = "—";

interface PontoSerie {
  t: string;
  v: number;
}

/** O último ponto de uma série, ou `null` se a série não existir. */
function ultimo(serie: Serie | null): PontoSerie | null {
  if (!serie || serie.series.length === 0) return null;
  return serie.series[serie.series.length - 1];
}

/** O ponto de uma série num período exacto, ou `null`. */
function em(serie: Serie | null, t: string): PontoSerie | null {
  if (!serie) return null;
  return serie.series.find((p) => p.t === t) ?? null;
}

/**
 * Variação homóloga em fração, ou `null` se não dá para a calcular.
 * `meses` = 12 para homóloga, 1 para o mês anterior.
 */
function variacao(serie: Serie | null, meses = 12): number | null {
  if (!serie || serie.series.length <= meses) return null;
  const agora = serie.series[serie.series.length - 1].v;
  const antes = serie.series[serie.series.length - 1 - meses].v;
  if (!Number.isFinite(agora) || !Number.isFinite(antes) || antes === 0) return null;
  return (agora - antes) / antes;
}

/**
 * Variação desde um período fixo (o cabaz parte de agosto de 2020), em
 * percentagem inteira. `null` se o período de partida não existir na série —
 * inventar a base seria pior do que não mostrar nada.
 */
function variacaoDesde(serie: Serie | null, desde: string): number | null {
  if (!serie) return null;
  const base = em(serie, desde);
  const topo = ultimo(serie);
  if (!base || !topo || base.v === 0) return null;
  return (topo.v / base.v - 1) * 100;
}

/**
 * Uma taxa que vem em percentagem (2,9537 = 2,9537 %) reexpressada em
 * fração, que é o que `fmtPct` espera. Sem isto, `fmtPct` multiplicava por
 * cem e escrevia 295,37 %.
 */
const comoFracao = (pct: number | null): number | null => (pct === null ? null : pct / 100);

/**
 * Uma percentagem com o sinal à frente, com `casas` decimais.
 *
 * O `+` só entra quando o valor é positivo — é a convenção da casa para
 * as variações (▲/▼ e o sinal), e é o que o protótipo fazia.
 */
function sinalPct(pct: number | null, casas = 0): string {
  if (pct === null || !Number.isFinite(pct)) return FALHOU;
  const texto = fmtPct(pct / 100, casas);
  return pct > 0 ? `+${texto}` : texto;
}

/** Uma linha dos cenários, tal como está no JSON. */
interface LinhaJson {
  bruto: number;
  custo: number;
  tsu: number;
  ss: number;
  irs: number;
  liquido: number;
  pontos: { tsu: number; irs: number; ss: number; fica: number };
}

/** A linha do salário de referência — a que a Fábrica e as moedas usam. */
export interface LinhaSalario extends LinhaJson {
  /** O ano das regras que produziram a linha — vem de `meta`. */
  ano: number;
  /** Quem esta linha descreve — vem de `meta`. */
  perfil: string;
}

/**
 * As moedas que correm pelas ruas, proporcionais ao que sai do bruto.
 * Somam sempre `total`, com o maior resto primeiro — é a regra de Hamilton,
 * a mesma que o site usa nos gráficos. `null` se a linha não existir.
 */
export function moedasDaLinha(l: LinhaSalario | null, total = 20): Record<string, number> | null {
  if (!l) return null;
  const partes: Record<string, number> = { tsu: l.tsu + l.ss, irs: l.irs, fica: l.liquido };
  const soma = partes.tsu + partes.irs + partes.fica;
  if (!Number.isFinite(soma) || soma <= 0) return null;

  const bruto = Object.fromEntries(Object.entries(partes).map(([k, v]) => [k, (v / soma) * total]));
  const moedas: Record<string, number> = Object.fromEntries(Object.entries(bruto).map(([k, v]) => [k, Math.floor(v)]));
  let falta = total - Object.values(moedas).reduce((a, b) => a + b, 0);
  // o maior resto primeiro — quem mais devia na fração fica com o cêntimo
  for (const [k] of Object.entries(bruto).sort((a, b) => (b[1] % 1) - (a[1] % 1))) {
    if (falta-- > 0) moedas[k]++;
  }
  return { ...moedas, total };
}

/** A linha de referência dos cenários, ou `null`. */
export function linhaSalario(): LinhaSalario | null {
  const { meta, linhas } = cenarios as { meta: { brutoRef: number; ano: number; perfil: string }; linhas: LinhaJson[] };
  const l = linhas.find((x) => x.bruto === meta.brutoRef);
  if (!l) return null;
  return { ...l, ano: meta.ano, perfil: meta.perfil };
}

/** Os valores dos marcadores, já formatados. */
export function marcadores(): MarcadoresBairro & { gasoleoUn: string; gasolinaUn: string } {
  const l = linhaSalario();

  const gasoleo = ultimo(loadFonte("dgeg", "pmd-gasoleo-diario"));
  const gasolina = ultimo(loadFonte("dgeg", "pmd-gasolina95-diario"));
  const euribor = ultimo(loadFonte("bpstat", "euribor-12m-mensal"));
  const ca = (caBase as { meta?: { oficialPct?: number } }).meta;
  const desemprego = ultimo(loadFonte("eurostat", "une-pt-total"));
  const cp00 = loadSerie("cp00");
  const cp01 = loadSerie("cp01");
  const cp11 = loadSerie("cp11");

  const t0 = "2020-08";
  const cabaz = variacaoDesde(cp01, t0);
  const cafes = variacaoDesde(cp11, t0);
  const inflacao = variacao(cp00, 12);

  return {
    salario: l ? fmtEUR(l.bruto) : FALHOU,
    // a TSU da entidade vem de data/fiscal/ss.json. No protótipo era uma
    // constante escrita à mão em mapa.tpl.html ("23,75 %") — uma taxa
    // digitada à mão, que é exactamente o que a Regra nº1 proíbe. Se a
    // taxa mudar na lei, o mapa mudava sozinho; escrito à mão, mentia.
    tsu: fmtPct(ss.entidadePatronal.taxa, 2),
    irs: l ? fmtEUR(l.irs) : FALHOU,
    liquido: l ? fmtEUR(l.liquido) : FALHOU,
    cabaz: sinalPct(cabaz),
    cafes: sinalPct(cafes),
    // a Euribor e o certificado de aforro publicam-se em percentagem
    euribor: fmtPct(comoFracao(euribor?.v ?? null) ?? 0, 2),
    ca: fmtPct(comoFracao(ca?.oficialPct ?? null) ?? 0, 2),
    gasoleo: gasoleo ? fmtNum(gasoleo.v, 3) : FALHOU,
    gasolina: gasolina ? fmtNum(gasolina.v, 3) : FALHOU,
    // uma casa decimal, como no protótipo e como no ticker do site:
    // arredondar a «+4 %» era um número que não é o número da fonte
    inflacao: sinalPct(inflacao === null ? null : inflacao * 100, 1),
    desemprego: fmtPct(comoFracao(desemprego?.v ?? null) ?? 0, 1),
    gasoleoUn: gasoleo ? `${fmtNum(gasoleo.v, 3)} €/L` : FALHOU,
    gasolinaUn: gasolina ? `${fmtNum(gasolina.v, 3)} €/L` : FALHOU,
  };
}

/** De onde veio cada número, para a linha das fontes por baixo do mapa. */
export function fontes(): string[] {
  const l = linhaSalario();
  const notas: string[] = [];

  const gasoleo = ultimo(loadFonte("dgeg", "pmd-gasoleo-diario"));
  if (gasoleo) notas.push(`combustíveis — DGEG, ${gasoleo.t}`);

  const euribor = ultimo(loadFonte("bpstat", "euribor-12m-mensal"));
  if (euribor) notas.push(`Euribor 12M — BPstat, ${euribor.t}`);

  const ca = (caBase as { meta?: { oficialPct?: number } }).meta;
  if (ca?.oficialPct !== undefined) notas.push(`Certificados de Aforro — IGCP, taxa base ${String(ca.oficialPct).replace(".", ",")} %`);

  const cp00 = ultimo(loadSerie("cp00"));
  if (cp00) notas.push(`inflação — Eurostat IHPC, ${cp00.t}`);

  const desemprego = ultimo(loadFonte("eurostat", "une-pt-total"));
  if (desemprego) notas.push(`desemprego — Eurostat, ${desemprego.t}`);

  if (l) notas.push(`salário — motores AO CÊNTIMO, ${l.bruto} € brutos, regras ${l.ano}`);

  return notas;
}

export interface DadosBairro {
  /** Os valores dos marcadores, já formatados. */
  marcadores: ReturnType<typeof marcadores>;
  /** A linha do salário de referência, ou `null` se os cenários faltarem. */
  salario: LinhaSalario | null;
  /** As moedas da corrida do salário, ou `null`. */
  moedas: Record<string, number> | null;
  /** O mapa montado, com as camadas e os pinos já preenchidos. */
  mapa: MapaBairro;
  /** De onde veio cada número. */
  fontes: string[];
}

/**
 * Tudo o que a home precisa, montado no servidor. É esta a função que
 * `page.tsx` chama em P1: o SVG sai daqui em texto e entra no HTML.
 */
export function dadosBairro(): DadosBairro {
  const m = marcadores();
  const l = linhaSalario();
  return {
    marcadores: m,
    salario: l,
    moedas: moedasDaLinha(l),
    mapa: montarMapa(m),
    fontes: fontes(),
  };
}
