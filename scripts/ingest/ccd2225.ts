import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { ErroVigilancia, lerComRetentativas } from "./_http";

/**
 * Vigilância da transposição da Diretiva (UE) 2023/2225 (crédito ao consumo,
 * «CC2») em Portugal — o gatilho que manda rever data/fiscal/cartoes.json e o
 * motor do cartão a 20 de novembro de 2026 (ver docs/VIGILANCIA-CCD2225-2026.md).
 *
 * Sinal primário: a **consulta SPARQL ao Cellar** (publications.europa.eu), o
 * repositório do Serviço das Publicações onde vivem as medidas nacionais de
 * transposição (works `cdm:measure_national_implementing`, os mesmos que
 * alimentam a tabela «National transposition» do EUR-Lex). Ao contrário da
 * página NIM do EUR-Lex — que está atrás de um **AWS WAF** e responde 202/503
 * às consultas sem browser (issue #75) — esta via responde 200 a um cliente
 * simples. Medições de 2026-10-06: consulta de Portugal em ~0,75 s, sem
 * desafio; a página NIM, à mesma hora, ora respondia 200 ora 202/503.
 *
 * A consulta filtra por país (PRT) e pelo work da diretiva, que se resolve a
 * partir do CELEX (o `resource/celex/<celex>` redireciona para o `cellar/<uuid>`
 * — não se fixa o UUID no código, para sobreviver a uma recriação do work).
 *
 * Semântica do alarme (igual à de antes): 0 medidas = não transposto; ≥1 = há
 * diploma, com data e ligação, e abre-se a checklist. Nunca se lê «0 medidas»
 * de uma resposta que não veio: uma resposta SPARQL sem `results.bindings` é
 * falha honesta, mas uma resposta **válida com zero resultados é resposta**.
 *
 * Sinal secundário (dica no JSON, sem rede): a data de consulta do DR do
 * DL 133/2009 em cartoes.json → fonteUrl. Nenhum sinal decide sozinho.
 */

/** Identificador CELEX da diretiva vigiada. */
export const CELEX = "32023L2225";
/** Endpoint SPARQL do Cellar (Serviço das Publicações da UE). */
export const SPARQL_URL = "https://publications.europa.eu/webapi/rdf/sparql";
/** Recurso do ato no Cellar — redireciona (303) para o URI do work. */
export const RECURSO_CELEX_URL = `https://publications.europa.eu/resource/celex/${CELEX}`;
/** Página NIM do EUR-Lex — só para conferência humana (está atrás do WAF). */
export const NIM_HUMANO_URL = `https://eur-lex.europa.eu/legal-content/PT/NIM/?uri=CELEX:${CELEX}`;
/** País vigiado. */
export const PAIS = "PRT";
/** URI do país no vocabulário do Cellar. */
export const PAIS_URI = `http://publications.europa.eu/resource/authority/country/${PAIS}`;

/** Formato pedido ao endpoint — sem isto o Virtuoso devolve a página HTML do editor. */
const FORMATO_SPARQL = "application/sparql-results+json";

export interface EstadoVigilia {
  /** ISO do momento da consulta. */
  consultadoEm: string;
  /** URL da fonte primária consultada (endpoint SPARQL). */
  fonteUrl: string;
  /** Nota sobre a proveniência do estado, quando relevante. */
  nota?: string;
  transposto: boolean;
  /** Número de medidas de transposição de Portugal no Cellar. */
  medidas: number;
  /** Datas publicadas para as medidas de Portugal (notificação / jornal oficial), ISO. */
  prazos: string[];
  /** Medidas listadas (rótulo + ligação), quando existam. */
  ligacoes: { titulo: string; url: string }[];
  /** URL do ELI do DL 133/2009 no DR — a conferir à mão quando o alarme disparar. */
  drAconferir: string;
  /** O que fazer quando transposto === true (para quem ler o JSON frio). */
  accao: string;
}

/** Linha de resultados SPARQL: variável → termo. */
type Linha = Record<string, { type: string; value: string } | undefined>;

/** Estado anterior, se existir; senão null. */
export function lerEstadoAnterior(ficheiro: string): EstadoVigilia | null {
  try {
    return JSON.parse(readFileSync(ficheiro, "utf8")) as EstadoVigilia;
  } catch {
    return null;
  }
}

/**
 * A consulta: medidas nacionais de transposição da diretiva, restritas a
 * Portugal. `implements_resource_legal` liga a medida ao work da diretiva no
 * Cellar; `implemented_by_country` diz o país. O `GRAPH ?g` é obrigatório —
 * no Cellar cada work vive no seu próprio grafo (o grafo por omissão não tem
 * estes triplos; medido a 2026-10-06).
 */
export function construirQuery(workUri: string): string {
  return `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?medida ?titulo ?tipo ?ref ?celexNac ?notificacao ?jornal WHERE {
  GRAPH ?g {
    ?medida cdm:measure_national_implementing_implements_resource_legal <${workUri}> .
    ?medida cdm:measure_national_implementing_implemented_by_country <${PAIS_URI}> .
    OPTIONAL { ?medida cdm:work_title ?titulo }
    OPTIONAL { ?medida cdm:measure_national_implementing_type_act ?tipo }
    OPTIONAL { ?medida cdm:measure_national_implementing_reference_member-state ?ref }
    OPTIONAL { ?medida cdm:resource_legal_id_celex ?celexNac }
    OPTIONAL { ?medida cdm:measure_national_implementing_date_notification ?notificacao }
    OPTIONAL { ?medida cdm:measure_national_implementing_date_official_journal ?jornal }
  }
}`;
}

/** URL GET do endpoint para a consulta (o `format` evita a página HTML do editor). */
export function urlSparql(workUri: string): string {
  return `${SPARQL_URL}?query=${encodeURIComponent(construirQuery(workUri))}&format=${encodeURIComponent(FORMATO_SPARQL)}`;
}

/** Extrai o UUID do work do `Location` do recurso do CELEX; lança se não casar. */
export function extrairWorkUri(location: string): string {
  const m = location.match(/\/cellar\/([0-9a-fA-F-]{36})(?:\/|$)/);
  if (!m) {
    throw new Error(
      `Cellar: o recurso da ${CELEX} não redirecionou para um work (Location «${location}»)`
    );
  }
  return `http://publications.europa.eu/resource/cellar/${m[1]}`;
}

/** Motivo pelo qual um `Location` não serve; null quando aponta para um work. */
export function validarRedirect(location: string): string | null {
  try {
    extrairWorkUri(location);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/** `results.bindings` da resposta SPARQL, ou lança — o sinal não se lê às cegas. */
export function extrairBindings(resposta: unknown): Linha[] {
  const bindings = (resposta as { results?: { bindings?: unknown } })?.results?.bindings;
  if (!Array.isArray(bindings)) {
    throw new Error("resposta sem results.bindings — o endpoint não devolveu SPARQL JSON");
  }
  return bindings as Linha[];
}

/**
 * Motivo pelo qual um corpo não serve; null quando é uma resposta SPARQL
 * legível. Zero resultados **é** resposta (não transposto); o que falha é um
 * corpo que não é SPARQL JSON — uma página de bloqueio, por exemplo.
 */
export function validarSparql(texto: string): string | null {
  try {
    extrairBindings(JSON.parse(texto));
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/**
 * Rótulo da medida para quem lê o JSON frio. O `work_title` do Cellar é, nas
 * medidas recentes, o título da própria diretiva (medido a 2026-10-06 nas
 * medidas irlandesas) — inútil para triagem; por isso o rótulo é composto por
 * tipo de ato + referência nacional + CELEX nacional.
 */
function rotularMedida(r: {
  tipo?: string;
  ref?: string;
  celexNac?: string;
  titulo?: string;
}): string {
  const partes = [r.tipo ?? "Medida nacional"];
  if (r.ref) partes.push(r.ref);
  if (r.celexNac) partes.push(r.celexNac);
  if (partes.length === 1 && r.titulo) partes.push(r.titulo);
  return partes.join(" · ");
}

/**
 * Faz o parse da resposta SPARQL e devolve as medidas de Portugal: contagem de
 * measures distintas, datas publicadas e ligações. Deduplica por URI da medida
 * (uma medida com dois CELEX nacionais vem em duas linhas).
 */
export function parseSparqlPortugal(resposta: unknown): {
  medidas: number;
  prazos: string[];
  ligacoes: { titulo: string; url: string }[];
} {
  const linhas = extrairBindings(resposta);
  const porMedida = new Map<
    string,
    { tipo?: string; ref?: string; celexNac?: string; titulo?: string; datas: Set<string> }
  >();

  for (const linha of linhas) {
    const uri = linha.medida?.value;
    if (!uri) continue;
    const medida = porMedida.get(uri) ?? { datas: new Set<string>() };
    medida.tipo ??= linha.tipo?.value;
    medida.ref ??= linha.ref?.value;
    medida.celexNac ??= linha.celexNac?.value;
    medida.titulo ??= linha.titulo?.value;
    for (const d of [linha.notificacao?.value, linha.jornal?.value]) {
      if (d) medida.datas.add(d);
    }
    porMedida.set(uri, medida);
  }

  const prazos = [...new Set([...porMedida.values()].flatMap((m) => [...m.datas]))].sort();
  const ligacoes = [...porMedida.entries()].map(([uri, m]) => ({
    titulo: rotularMedida(m),
    // O CELEX nacional abre a medida no EUR-Lex (link para humanos; o WAF não
    // trava um browser). Sem CELEX, fica o URI do work no Cellar.
    url: m.celexNac
      ? `https://eur-lex.europa.eu/legal-content/PT/ALL/?uri=CELEX:${m.celexNac}`
      : uri,
  }));

  return { medidas: porMedida.size, prazos, ligacoes };
}

/** Motivo da última falha, venha ela do monitor ou do cliente HTTP. */
function motivoDe(e: unknown): string {
  if (e instanceof ErroVigilancia) return e.motivo;
  return e instanceof Error ? e.message : String(e);
}

/** Lê o cabeçalho `Location` do recurso do CELEX, sem seguir o redirecionamento. */
async function lerRedirectCellar(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
  return res.headers.get("location") ?? "";
}

/** Pontos de extensão para os testes: rede e espera injetáveis. */
export interface DepsCcd2225 {
  /** Devolve o `Location` do recurso do CELEX; por omissão, um HEAD/GET sem seguir. */
  lerRedirect?: (url: string) => Promise<string>;
  /** Devolve o corpo da resposta SPARQL; por omissão, um GET ao endpoint. */
  lerSparql?: (url: string) => Promise<string>;
  /** Intervalo entre leituras (ms) — 20 s por omissão. */
  esperaMs?: number;
}

/**
 * Corre a consulta, compara com o estado anterior e grava o ficheiro.
 * Só sai com alarme (exit 1) quando o número de medidas SOBE de zero —
 * é esse o sinal que manda abrir a checklist.
 */
export async function runCcd2225(
  dataDir: string,
  deps: DepsCcd2225 = {}
): Promise<EstadoVigilia> {
  const ficheiro = path.join(dataDir, "meta", "ccd2225-vigilia.json");
  const anterior = lerEstadoAnterior(ficheiro);
  const opcoes = { esperaMs: deps.esperaMs };

  // 1.º resolver o URI do work no Cellar a partir do CELEX (o redirect vive no
  // recurso). A leitura usa a política comum dos monitores (lerComRetentativas):
  // 4 leituras com 20 s de intervalo, cobrindo erros de rede/HTTP e respostas
  // que não apontem para um work.
  let workUri: string;
  try {
    workUri = extrairWorkUri(
      await lerComRetentativas(RECURSO_CELEX_URL, validarRedirect, {
        ler: deps.lerRedirect ?? lerRedirectCellar,
        rotulo: "Cellar (recurso do CELEX)",
        ...opcoes,
      })
    );
  } catch (e) {
    throw new Error(
      `Cellar: não consegui o URI do work da ${CELEX} (${motivoDe(e)}) — repetir mais tarde; NÃO interpretar como ausência de transposição`
    );
  }

  // 2.º a consulta. Zero resultados é resposta legítima (Portugal sem medidas);
  // o que nunca se aceita é um corpo que não seja SPARQL JSON (bloqueio do CDN,
  // erro do endpoint) — validarSparql recusa-o e o laço repete.
  let resposta: unknown;
  try {
    resposta = JSON.parse(
      await lerComRetentativas(urlSparql(workUri), validarSparql, {
        ler: deps.lerSparql,
        rotulo: "Cellar (SPARQL)",
        ...opcoes,
      })
    );
  } catch (e) {
    throw new Error(
      `Cellar: a consulta SPARQL da ${CELEX} falhou (${motivoDe(e)}) — repetir mais tarde; NÃO interpretar como ausência de transposição`
    );
  }

  const { medidas, prazos, ligacoes } = parseSparqlPortugal(resposta);

  const estado: EstadoVigilia = {
    consultadoEm: new Date().toISOString(),
    fonteUrl: SPARQL_URL,
    nota: `Cellar: work ${workUri} · filtro de país ${PAIS} · a mesma fonte que alimenta a página NIM do EUR-Lex (que está atrás de um AWS WAF).`,
    transposto: medidas > 0,
    medidas,
    prazos,
    ligacoes,
    drAconferir: "https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/2009-34518975",
    accao:
      "Transposto: abrir docs/VIGILANCIA-CCD2225-2026.md e fazer a checklist — rever data/fiscal/cartoes.json e o motor do cartão antes de 2026-11-20.",
  };

  const antes = anterior?.medidas ?? 0;
  if (medidas > 0 && antes === 0) {
    console.error(
      `⚠ CC2: o Cellar lista ${medidas} medida(s) de transposição de Portugal (${prazos.join(", ") || "sem data publicada"}) — ABRIR docs/VIGILANCIA-CCD2225-2026.md`
    );
  } else if (medidas > 0) {
    console.error(`⚠ CC2: transposição já conhecida (${medidas} medidas) — checklist em docs/VIGILANCIA-CCD2225-2026.md`);
  } else {
    console.log("CC2: o Cellar não lista medidas de transposição de Portugal — cartoes.json mantém-se");
  }

  writeFileSync(ficheiro, JSON.stringify(estado, null, 2));
  return estado;
}
