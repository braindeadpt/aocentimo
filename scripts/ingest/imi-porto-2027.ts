import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { fetchTexto } from "./_http";

/**
 * Vigilância do IMI Familiar do Porto para 2027 — o gatilho que manda criar
 * data/fiscal/imi-2027.json (ver docs/VIGILANCIA-IMI-PORTO-2027.md).
 *
 * O que se espera apanhar: entre novembro e dezembro de 2026, a proposta do
 * Executivo e a deliberação da Assembleia Municipal do Porto de fixação das
 * taxas do IMI para 2027 — que, se a AM seguir a recomendação
 * NUD/289978/2026/CMP (2026-04-27, lida por OCR na 2.ª auditoria), adota os
 * escalões máximos do IMI Familiar, 30/70/140 €. O art. 112.º n.º 14 do CIMI
 * manda comunicar as deliberações à AT até 31 de dezembro para vigorarem no
 * ano seguinte — daí a janela da vigilância.
 *
 * Sinal: as páginas de deliberações do cm-porto.pt (WordPress, HTML
 * server-side — verificado com curl a 2026-10-01). O título das minutas é
 * genérico («Minuta da Ata, N.ª Reunião…») — a fixação das taxas está DENTRO
 * do PDF, não no título. Por isso o detetor é um despertador, como o NIM da
 * CC2: dispara quando surge documento NOVO em qualquer das páginas e a
 * checklist manda abrir o PDF e procurar o ponto das taxas. Nunca infere o
 * conteúdo do PDF; nunca escreve no pack sem a deliberação aberta e citada.
 *
 * Estrutura capturada a 2026-10-01 em /deliberacoes-minutas: um bloco JSON
 * codificado (optionsJson) com contents[] por ano; cada content tem body com
 * «<li><a href="/files/uploads/cms/...pdf">Minuta da Ata, 23.ª Reunião, …
 * realizada no dia 14 de setembro de 2026.</a></li>». O parser extrai âncoras
 * tanto dos blocos JSON decodificados como do HTML simples, e falha alto se a
 * página mudar de estrutura (regra: falhar alto, nunca inventar).
 */

export interface Fonte {
  rotulo: string;
  url: string;
}

/** Páginas de deliberações da CM Porto, todas com HTTP 200 + HTML server-side a 2026-10-01. */
export const FONTES: Fonte[] = [
  {
    rotulo: "Minutas (atas) da Assembleia Municipal",
    url: "https://www.cm-porto.pt/deliberacoes-minutas",
  },
  {
    rotulo: "Propostas",
    url: "https://www.cm-porto.pt/deliberacoes-propostas",
  },
  {
    rotulo: "Recomendações",
    url: "https://www.cm-porto.pt/deliberacoes-recomendacoes",
  },
];

export const CHECKLIST_URL = "docs/VIGILANCIA-IMI-PORTO-2027.md";

export interface Documento {
  titulo: string;
  /** URL absoluto do PDF/documento no cm-porto.pt. */
  url: string;
  /** Data da sessão lida no título («realizada no dia 14 de setembro de 2026»), ou null. */
  data: string | null;
}

export interface EstadoVigilia {
  consultadoEm: string;
  /** Rótulos + URLs consultados nesta corrida. */
  fontes: { rotulo: string; url: string }[];
  /** Todos os documentos já vistos (união de corridas) — base de deduplicação. */
  vistos: Documento[];
  /** Documentos novos nesta corrida (não estavam em `vistos`). */
  novos: Documento[];
  /** Novos cujo título menciona IMI/imposto municipal/taxas — triagem primeiro. */
  destacados: Documento[];
  nota?: string;
  /** O que fazer quando `novos.length > 0` (para quem ler o JSON frio). */
  accao: string;
}

const MESSES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/** Estado anterior, se existir; senão null. */
export function lerEstadoAnterior(ficheiro: string): EstadoVigilia | null {
  try {
    return JSON.parse(readFileSync(ficheiro, "utf8")) as EstadoVigilia;
  } catch {
    return null;
  }
}

/** «…realizada no dia 14 de setembro de 2026» → «2026-09-14»; senão null. */
export function dataDeTitulo(titulo: string): string | null {
  const meses = MESSES.join("|");
  const re = new RegExp(`(\\d{1,2})\\s+(?:de\\s+)?(${meses})\\s+(?:de\\s+)?(\\d{4})`, "i");
  const m = re.exec(titulo);
  if (!m) return null;
  const mes = MESSES.indexOf(m[2].toLowerCase() as (typeof MESSES)[number]) + 1;
  if (mes === 0) return null;
  const dia = m[1].padStart(2, "0");
  return `${m[3]}-${String(mes).padStart(2, "0")}-${dia}`;
}

/**
 * Extrai as string literals codificadas (só %XX, compridas) embutidas na
 * página e devolve-as decodificadas. É a forma como o WordPress da CM Porto
 * transporta as listas de documentos (optionsJson).
 */
export function decodificarBlocos(html: string): string[] {
  const blocos: string[] = [];
  // String literal longa, sem aspas nem newline cru, com codificação %XX
  // abundante e %22 (aspas codificadas) — a assinatura do optionsJson
  // (a codificação é parcial: `%7B%22id%22…` tem `id` cru entre pares %XX).
  const re = /"([^"\n]{200,})"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const s = m[1];
    const pares = s.match(/%[0-9A-Fa-f]{2}/g)?.length ?? 0;
    if (pares < 30 || !s.includes("%22")) continue;
    try {
      blocos.push(decodeURIComponent(s.replace(/\+/g, " ")));
    } catch {
      // string que não decodifica — lixo de outro widget; ignora
    }
  }
  return blocos;
}

const RE_ANCORA =
  /<a\s[^>]*href="((?:https?:\/\/(?:www\.)?cm-porto\.pt)?\/files\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g;

function limpar(texto: string): string {
  return texto
    // os blocos JSON embutidos trazem escapes \uXXXX (\u00aa = ª, etc.)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Âncoras de documentos num pedaço de HTML ou de JSON decodificado. */
function ancorasDe(pedaco: string): Documento[] {
  // Nos blocos JSON decodificados, as âncoras vêm com escapes JSON
  // (href=\"\/files\/...\"; <\/a>) — desfaz-nos antes de casar.
  const normalizado = pedaco.replace(/\\(["\/])/g, "$1");
  const docs: Documento[] = [];
  let m: RegExpExecArray | null;
  RE_ANCORA.lastIndex = 0;
  while ((m = RE_ANCORA.exec(normalizado)) !== null) {
    const url = m[1].startsWith("http")
      ? m[1]
      : "https://www.cm-porto.pt" + m[1];
    const titulo = limpar(m[2]);
    if (!titulo) continue;
    docs.push({ titulo, url, data: dataDeTitulo(titulo) });
  }
  return docs;
}

/**
 * Extrai, deduplica e devolve os documentos listados na página: âncoras
 * /files/ do HTML simples e dos blocos JSON decodificados (fields `body`).
 */
export function documentosDeHtml(html: string): Documento[] {
  const porUrl = new Map<string, Documento>();
  const adicionar = (d: Documento) => {
    if (!porUrl.has(d.url)) porUrl.set(d.url, d);
  };
  for (const d of ancorasDe(html)) adicionar(d);
  for (const bloco of decodificarBlocos(html)) {
    for (const d of ancorasDe(bloco)) adicionar(d);
  }
  return [...porUrl.values()];
}

/** Novos = não estavam em `vistos`. Destacados = novos com IMI/taxas no título. */
export function avaliamNovos(
  vistosAntes: Documento[],
  atuais: Documento[]
): { novos: Documento[]; destacados: Documento[] } {
  const urlsVistos = new Set(vistosAntes.map((d) => d.url));
  const novos = atuais.filter((d) => !urlsVistos.has(d.url));
  const destacados = novos.filter((d) =>
    /imi|imposto municipal|taxa/i.test(d.titulo)
  );
  return { novos, destacados };
}

/** União de corridas: o que caiu da listagem não «desaparece» do estado. */
function unir(a: Documento[], b: Documento[]): Documento[] {
  const mapa = new Map<string, Documento>();
  for (const d of a) mapa.set(d.url, d);
  for (const d of b) mapa.set(d.url, d);
  return [...mapa.values()];
}

/**
 * Corre a consulta às fontes, compara com o estado anterior e grava o
 * ficheiro. Alarme (exit 2 no CLI) quando surge documento novo — é o
 * despertador que manda abrir a checklist e o PDF.
 */
export async function runImiPorto2027(dataDir: string): Promise<EstadoVigilia> {
  const ficheiro = path.join(dataDir, "meta", "imi-porto-2027-vigilia.json");
  const anterior = lerEstadoAnterior(ficheiro);

  let vistosNestaCorrida: Documento[] = [];
  const falhas: string[] = [];
  for (const fonte of FONTES) {
    try {
      const html = await fetchTexto(fonte.url, { timeoutMs: 30_000 });
      const docs = documentosDeHtml(html);
      if (docs.length === 0) {
        // A página respondeu mas já não tem a estrutura conhecida — o sinal
        // deixou de poder ser lido; nunca tratar como «nada de novo».
        throw new Error(
          "página sem documentos reconhecíveis — a estrutura mudou; confirmar à mão"
        );
      }
      console.log(`  ✓ ${fonte.rotulo}: ${docs.length} documento(s) listados`);
      vistosNestaCorrida = unir(vistosNestaCorrida, docs);
    } catch (e) {
      falhas.push(`${fonte.rotulo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (vistosNestaCorrida.length === 0) {
    throw new Error(
      `Nenhuma fonte respondeu com estrutura conhecida (${falhas.join(" · ")}) — ` +
        "repetir mais tarde; NÃO interpretar como ausência de deliberação"
    );
  }
  if (falhas.length > 0) {
    console.warn(`  ⚠ falhas parciais — ${falhas.join(" · ")}`);
  }

  const { novos, destacados } = avaliamNovos(anterior?.vistos ?? [], vistosNestaCorrida);

  const estado: EstadoVigilia = {
    consultadoEm: new Date().toISOString(),
    fontes: FONTES.map((f) => ({ rotulo: f.rotulo, url: f.url })),
    vistos: unir(anterior?.vistos ?? [], vistosNestaCorrida),
    novos,
    destacados,
    nota: falhas.length > 0 ? `falhas parciais: ${falhas.join(" · ")}` : undefined,
    accao:
      "Documento novo da Assembleia Municipal do Porto: abrir " +
      CHECKLIST_URL +
      ", abrir o PDF e procurar o ponto «fixação das taxas do IMI» (e o IMI " +
      "Familiar 30/70/140 €). Se a deliberação estiver lá: criar " +
      "data/fiscal/imi-2027.json conforme a checklist (prazo legal de " +
      "comunicação à AT: 31 de dezembro, art. 112.º n.º 14 do CIMI).",
  };

  if (novos.length > 0) {
    console.error(
      `⚠ IMI Porto 2027: ${novos.length} documento(s) novo(s) da AM do Porto — ABRIR ${CHECKLIST_URL}`
    );
    for (const d of destacados)
      console.error(`  ★ ${d.titulo} — ${d.url}`);
    for (const d of novos.filter((n) => !destacados.includes(n)))
      console.error(`  · ${d.titulo} — ${d.url}`);
  } else {
    console.log(
      "IMI Porto 2027: sem documentos novos nas deliberações da AM — imi-2027.json continua por criar"
    );
  }

  writeFileSync(ficheiro, JSON.stringify(estado, null, 2));
  return estado;
}
