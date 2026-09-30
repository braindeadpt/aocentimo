import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { fetchTexto } from "./_http";

/**
 * Vigilância da transposição da Diretiva (UE) 2023/2225 (crédito ao consumo,
 * «CC2») em Portugal — o gatilho que manda rever data/fiscal/cartoes.json e o
 * motor do cartão a 20 de novembro de 2026 (ver docs/VIGILANCIA-CCD2225-2026.md).
 *
 * Sinal primário: a página «National transposition» do EUR-Lex
 * (CELEX:32023L2225), que vem inteira em HTML server-side (o fetch simples
 * chega; ao contrário do DR consolidado, que só abre com JavaScript). O bloco
 * de cada Estado-Membro tem ids estáveis: PRT_numOfNims (número de medidas) e
 * PRT_transposition (prazo). Portugal com 0 medidas = não transposto; ≥1 = há
 * diploma — e o NIM lista-o com data e ligação.
 *
 * Sinal secundário (dica no JSON, sem rede): a data de consulta do DR do
 * DL 133/2009 em cartoes.json → fonteUrl. Nenhum sinal decide sozinho.
 */

export const NIM_URL =
  "https://eur-lex.europa.eu/legal-content/PT/NIM/?uri=CELEX:32023L2225";

export interface EstadoVigilia {
  /** ISO do momento da consulta. */
  consultadoEm: string;
  /** URL consultado. */
  fonteUrl: string;
  /** Nota sobre a proveniência do estado, quando relevante. */
  nota?: string;
  transposto: boolean;
  /** Número de medidas de transposição no NIM do EUR-Lex. */
  medidas: number;
  /** Prazo(s) de transposição publicados no NIM, se houver. */
  prazos: string[];
  /** Medidas listadas no NIM (título + link), quando existam. */
  ligacoes: { titulo: string; url: string }[];
  /** URL do ELI do DL 133/2009 no DR — a conferir à mão quando o NIM disparar. */
  drAconferir: string;
  /** O que fazer quando transposto === true (para quem ler o JSON frio). */
  accao: string;
}

/** Estado anterior, se existir; senão null. */
export function lerEstadoAnterior(ficheiro: string): EstadoVigilia | null {
  try {
    return JSON.parse(readFileSync(ficheiro, "utf8")) as EstadoVigilia;
  } catch {
    return null;
  }
}

/**
 * Faz o parse do bloco de Portugal no HTML do NIM. Lança se o bloco não
 * estiver lá — a página mudou de estrutura e o sinal não pode ser lido
 * às cegas (regra: falhar alto, nunca inventar).
 */
export function parseNimPortugal(html: string): {
  medidas: number;
  prazos: string[];
  ligacoes: { titulo: string; url: string }[];
} {
  const i = html.indexOf('id="PRT_numOfNims"');
  if (i === -1) throw new Error("NIM: bloco de Portugal não encontrado — a página mudou");
  const fim = html.indexOf('id="ROU_', i);
  const bloco = html.slice(i, fim === -1 ? i + 20_000 : fim);

  const m = bloco.match(/id="PRT_numOfNims"[\s\S]*?<span class="VMIMore">(\d+)<\/span>/);
  const medidas = m ? parseInt(m[1], 10) : 0;

  const prazos = [...bloco.matchAll(/(\d{2}\/\d{2}\/\d{4})/g)].map((x) => x[1]);

  const ligacoes = [...bloco.matchAll(/href="(\/eli\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(
    (x) => ({
      url: "https://eur-lex.europa.eu" + x[1],
      titulo: x[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    })
  );

  return { medidas, prazos, ligacoes };
}

/**
 * Corre a consulta, compara com o estado anterior e grava o ficheiro.
 * Só sai com alarme (exit 1) quando o número de medidas SOBE de zero —
 * é esse o sinal que manda abrir a checklist.
 */
export async function runCcd2225(dataDir: string): Promise<EstadoVigilia> {
  const ficheiro = path.join(dataDir, "meta", "ccd2225-vigilia.json");
  const anterior = lerEstadoAnterior(ficheiro);

  // O EUR-Lex responde por vezes «202 Accepted» com corpo vazio (documento em
  // preparação / fila de cache) — aconteceu a 2026-09-30, inclusive no EN.
  // Isso é indisponibilidade, NÃO resposta: repete-se com intervalos e falha
  // honesto se persistir. Nunca se lê «0 medidas» de um corpo que não veio.
  let html = "";
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    html = await fetchTexto(NIM_URL, { timeoutMs: 30_000, tentativas: 1 });
    if (html.includes('id="PRT_numOfNims"')) break;
    console.warn(
      `  ✗ EUR-Lex em fila ou indisponível (tentativa ${tentativa}/4) — espera 20 s`
    );
    await new Promise((r) => setTimeout(r, 20_000));
  }
  if (!html.includes('id="PRT_numOfNims"')) {
    throw new Error(
      "EUR-Lex: página do NIM indisponível após 4 tentativas — repetir mais tarde; NÃO interpretar como ausência de transposição"
    );
  }
  const { medidas, prazos, ligacoes } = parseNimPortugal(html);

  const estado: EstadoVigilia = {
    consultadoEm: new Date().toISOString(),
    fonteUrl: NIM_URL,
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
      `⚠ CC2: o EUR-Lex lista ${medidas} medida(s) de transposição para Portugal (${prazos.join(", ") || "sem prazo publicado"}) — ABRIR docs/VIGILANCIA-CCD2225-2026.md`
    );
  } else if (medidas > 0) {
    console.error(`⚠ CC2: transposição já conhecida (${medidas} medidas) — checklist em docs/VIGILANCIA-CCD2225-2026.md`);
  } else {
    console.log("CC2: sem medidas de transposição de Portugal no EUR-Lex — cartoes.json mantém-se");
  }

  writeFileSync(ficheiro, JSON.stringify(estado, null, 2));
  return estado;
}
