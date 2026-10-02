import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { fetchTexto } from "./_http";

/**
 * Vigilância das portarias do ISP dos combustíveis rodoviários.
 *
 * O ISP é revisto por portaria, por vezes semanalmente (437-B/2026/1 de 25
 * set em vigor desde 28 set; antes 432-A de 18 set, 372-A de 21 ago…), e os
 * valores vivem à mão em data/fiscal/isp.json, que a cena da Bomba mostra.
 * Sem aviso, ficam velhos em dias — este detector é o despertador.
 *
 * Fonte primária: o Diário da República NÃO é legível por máquina — todas
 * as páginas devolvem o mesmo shell JS de 2346 bytes (OutSystems), sem RSS
 * nem API pública (confirmado por sondagem a 2026-10-02: /dr/pesquisa,
 * /dr/rss, dre.pt/rss, data.dre.pt/sparql). Por isso o sinal legível é o
 * feed RSS do Google Notícias restrito ao DR (`ISP site:diariodarepublica.pt`,
 * hl=pt-PT, gl=PT): devolve as páginas do DR com título «Portaria n.º
 * …/2026/1, de …» e a data de publicação como pubDate. Um único fetch por
 * corrida; nunca se resolve link nenhum (o Google responde 429 a bots) —
 * o alarme aponta o número e o humano confirma no DR.
 *
 * O alarme é despertador, nunca dado: só diz que há portaria nova e manda
 * abrir a checklist. Nenhum número do feed entra em isp.json sozinho.
 */

export const ISP_RSS_URL =
  "https://news.google.com/rss/search?q=ISP+site%3Adiariodarepublica.pt&hl=pt-PT&gl=PT&ceid=PT%3Apt";

export interface PortariaIsp {
  /** «437-B/2026/1» — número, letra, ano e série. */
  numero: string;
  /** Data da portaria em ISO (do título; recurso: pubDate). */
  data: string;
  titulo: string;
  /** Link do item (redirect do Google Notícias → página do DR). */
  link: string;
}

export interface EstadoVigiliaIsp {
  /** ISO do momento da consulta. */
  consultadoEm: string;
  /** URL consultado (o feed RSS). */
  fonteUrl: string;
  /** Nota sobre a proveniência do estado, quando relevante. */
  nota?: string;
  /** A portaria mais recente vista no feed, seja qual for. */
  ultimaPortariaFeed: PortariaIsp | null;
  /** A portaria mais recente já reportada em alarme (informativo). */
  ultimaReportada: string | null;
  /** O que o isp.json cita neste momento (a verdade humana). */
  ispJson: { vigencia: string; portaria: string | null };
  /** Itens do DR sem número extraível — a conferir à mão, sem alarme. */
  aConferir: { titulo: string; data: string }[];
  /** O que fazer quando há novas (para quem ler o JSON frio). */
  accao: string;
  /** Portarias do feed mais recentes que a citada no isp.json. */
  novas: PortariaIsp[];
}

/** Estado anterior, se existir; senão null. */
export function lerEstadoAnterior(ficheiro: string): EstadoVigiliaIsp | null {
  try {
    return JSON.parse(readFileSync(ficheiro, "utf8")) as EstadoVigiliaIsp;
  } catch {
    return null;
  }
}

const MESES: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  março: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

function duas(s: string): string {
  return s.padStart(2, "0");
}

/**
 * Compara números de portaria «NNN-L/AAAA(/S)». Devolve <0 se a < b.
 * As portarias numeram-se por ano: o ano manda, depois o número, depois a
 * letra do desdobramento do dia (437-A < 437-B) e por fim a série (/1).
 */
export function compararPortarias(a: string, b: string): number {
  const partes = (p: string) => {
    const m = p.match(/^(\d{1,4})(?:-([A-Z]))?\/(\d{4})(?:\/(\d+))?$/);
    if (!m) throw new Error(`Portaria com formato inesperado: ${p}`);
    return { num: parseInt(m[1], 10), letra: m[2] ?? "", ano: parseInt(m[3], 10), serie: m[4] ?? "" };
  };
  const x = partes(a);
  const y = partes(b);
  if (x.ano !== y.ano) return x.ano - y.ano;
  if (x.num !== y.num) return x.num - y.num;
  if (x.letra !== y.letra) return x.letra < y.letra ? -1 : 1;
  if (x.serie !== y.serie) return x.serie < y.serie ? -1 : 1;
  return 0;
}

/**
 * O feed repete o mesmo número (detalhe + «Análise Jurídica» com datas
 * diferentes) — deduplica por número, ficando a data mais antiga, que é
 * a da publicação, tudo ordenado da mais antiga para a mais recente.
 */
export function unicasOrdenadas(portarias: PortariaIsp[]): PortariaIsp[] {
  const porNumero = new Map<string, PortariaIsp>();
  for (const p of portarias) {
    const atual = porNumero.get(p.numero);
    if (!atual || p.data < atual.data) porNumero.set(p.numero, p);
  }
  return [...porNumero.values()].sort((a, b) => compararPortarias(a.numero, b.numero));
}

/**
 * As portarias do feed mais recentes que a base (a citada no isp.json).
 * Base null (isp.json sem portaria) = nada é novo sem referência humana.
 */
export function novasDesde(portarias: PortariaIsp[], base: string | null): PortariaIsp[] {
  if (base == null) return [];
  return unicasOrdenadas(portarias).filter((p) => compararPortarias(p.numero, base) > 0);
}

/** Tira «Portaria n.º 372-A/2026/1» do campo fonte do isp.json; null se não houver. */
export function extrairPortariaIspJson(texto: string): string | null {
  const m = texto.match(/Portaria n\.º\s*(\d{1,4}(?:-[A-Z])?\/\d{4}(?:\/\d+)?)/);
  return m ? m[1] : null;
}

function desentificar(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Faz o parse dos itens do feed e extrai as portarias do DR.
 * Lança se o feed vier vazio ou sem nenhum item do DR — o sinal não pode
 * ser lido às cegas (regra: falhar alto, nunca inventar).
 */
export function parseRssPortarias(xml: string): {
  portarias: PortariaIsp[];
  aConferir: { titulo: string; data: string }[];
} {
  const itens = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  if (itens.length === 0) throw new Error("ISP: feed sem itens — o Google mudou o formato ou bloqueou");
  const doDR = itens.filter(
    (it) =>
      /diariodarepublica\.pt/.test(it) || /Diário da República/.test(it)
  );
  if (doDR.length === 0) throw new Error("ISP: nenhum item do DR no feed — a pesquisa mudou");

  const portarias: PortariaIsp[] = [];
  const aConferir: { titulo: string; data: string }[] = [];
  for (const it of doDR) {
    const titulo = desentificar((it.match(/<title>([\s\S]*?)<\/title>/) ?? ["", ""])[1]);
    const link = desentificar((it.match(/<link>([\s\S]*?)<\/link>/) ?? ["", ""])[1]);
    const pub = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? ["", ""])[1].trim();
    const pubIso = pub ? new Date(pub).toISOString().slice(0, 10) : "";
    const mNum = titulo.match(/Portaria n\.º\s*(\d{1,4}(?:-[A-Z])?\/\d{4}(?:\/\d+)?)/);
    if (!mNum || !link) {
      if (titulo) aConferir.push({ titulo, data: pubIso });
      continue;
    }
    const numero = mNum[1];
    const ano = numero.match(/\/(\d{4})/)?.[1] ?? "";
    const mData = titulo.match(/de (\d{1,2}) de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i);
    const data =
      mData && ano ? `${ano}-${MESES[mData[2].toLowerCase()]}-${duas(mData[1])}` : pubIso;
    if (!data) continue;
    portarias.push({ numero, data, titulo, link });
  }
  return { portarias, aConferir };
}

/**
 * Corre a consulta, compara com o isp.json e grava o estado.
 * Há novas quando o feed traz portaria mais recente que a citada na fonte
 * do isp.json — a verdade humana manda, nunca o feed. O relatório de
 * «última reportada» é informativo: enquanto o isp.json não for atualizado,
 * cada corrida volta a alarmar (despertador até acordar).
 */
export async function runIsp(dataDir: string): Promise<EstadoVigiliaIsp> {
  const ficheiro = path.join(dataDir, "meta", "isp-vigilia.json");
  const anterior = lerEstadoAnterior(ficheiro);
  const ispTexto = readFileSync(path.join(dataDir, "fiscal", "isp.json"), "utf8");
  const isp = JSON.parse(ispTexto) as { vigencia: string; fonte: string };
  const portariaIspJson = extrairPortariaIspJson(isp.fonte);

  // Um único fetch por corrida (o Google responde 429 a bots insistentes) —
  // o retry com backoff vive no fetchTexto; se esgotar, falha honesta.
  const xml = await fetchTexto(ISP_RSS_URL, { timeoutMs: 30_000, tentativas: 3 });
  const { portarias, aConferir } = parseRssPortarias(xml);

  const unicas = unicasOrdenadas(portarias);
  const ultimaPortariaFeed = unicas.length > 0 ? unicas[unicas.length - 1] : null;
  const novas = novasDesde(portarias, portariaIspJson);
  const reportadas = novas.map((n) => n.numero);
  const ultimaReportada =
    reportadas.length > 0
      ? reportadas[reportadas.length - 1]
      : (anterior?.ultimaReportada ?? null);

  if (novas.length > 0) {
    console.error(
      `⚠ ISP: ${novas.length} portaria(s) nova(s) no DR desde ${portariaIspJson} — ${reportadas.join(", ")} — o isp.json (vigência ${isp.vigencia}) está velho`
    );
  } else {
    console.log(
      `ISP: nada de novo no DR desde ${portariaIspJson ?? "origem desconhecida"} — isp.json mantém-se`
    );
  }

  const estado: EstadoVigiliaIsp = {
    consultadoEm: new Date().toISOString(),
    fonteUrl: ISP_RSS_URL,
    nota: "Feed RSS do Google Notícias restrito ao DR; o DR não é legível por máquina (só shell JS).",
    ultimaPortariaFeed,
    ultimaReportada,
    ispJson: { vigencia: isp.vigencia, portaria: portariaIspJson },
    aConferir,
    accao:
      "Há novas: abrir a issue, confirmar cada portaria no DR, ler o art. 2.º e atualizar data/fiscal/isp.json (vigencia, fonte, fonteUrl, ispELitro, nota) com os testes. O alarme nunca é dado.",
    novas,
  };
  writeFileSync(ficheiro, JSON.stringify(estado, null, 2));
  return estado;
}
