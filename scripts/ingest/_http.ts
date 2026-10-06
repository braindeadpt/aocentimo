/**
 * fetch resiliente partilhado pelas fontes — regra nº1 aplicada à rede:
 * timeout, retry com backoff e erro explícito. Nunca devolve dado parcial
 * fingindo sucesso: ou o JSON veio inteiro ou a tentativa falha.
 */

/** Resultado de uma fonte: tudo o que conseguiu, ou o erro — nunca lança. */
export type ResultadoFonte<T = unknown> =
  | { ok: true; docs: T[] }
  | { ok: false; erro: string };

export interface OpcoesHttp {
  /** timeout por tentativa (ms) — 20 s por omissão */
  timeoutMs?: number;
  /** tentativas totais — 3 por omissão */
  tentativas?: number;
  /** base do backoff exponencial (ms) — 1 s · 2^n por omissão */
  backoffMs?: number;
}

export interface OpcoesVigilancia {
  /** Leituras no total (a 1.ª incluída) — 4 por omissão. */
  leituras?: number;
  /** Intervalo fixo entre leituras (ms) — 20 s por omissão. */
  esperaMs?: number;
  /** timeout por leitura (ms) — 30 s por omissão. */
  timeoutMs?: number;
  /** Leitura injetável (testes); por omissão, fetchTexto com uma tentativa. */
  ler?: (url: string) => Promise<string>;
  /** Rótulo do monitor nos avisos — por omissão, o anfitrião do URL. */
  rotulo?: string;
}

/** Leitura de uma página de vigilância esgotada, com o motivo da última falha. */
export class ErroVigilancia extends Error {
  constructor(
    message: string,
    /** Motivo da última leitura falhada (HTTP 503, timeout, corpo recusado…). */
    readonly motivo: string,
    /** Leituras feitas. */
    readonly leituras: number
  ) {
    super(message);
    this.name = "ErroVigilancia";
  }
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * O EUR-Lex vive atrás de um AWS WAF: às consultas sem JavaScript nem cookies
 * de browser, o WAF pode responder «202 Accepted» com este cabeçalho (corpo
 * vazio ou página de desafio JS) em vez da página pedida — medido a 2026-10-06
 * e intermitente (o mesmo cliente recebe a página noutras horas). É um
 * bloqueio, não uma resposta: rejeitá-lo evita ler «0 medidas» de um corpo que
 * nunca veio.
 */
const CABECALHO_WAF = "x-amzn-waf-action";
/** Marcas do desafio JS do WAF quando o corpo chega (documentadas no HTML). */
const MARCAS_WAF = ["awswaf.com", "challenge-container", "AwsWafIntegration"];

/** Mensagem do desafio do WAF; null se a resposta não vier do WAF. */
function desafioWaf(res: Response, corpo?: string): string | null {
  const accao = res.headers.get(CABECALHO_WAF);
  if (accao) return `desafio WAF (AWS): ${accao} — o monitor não executa JavaScript`;
  if (corpo && MARCAS_WAF.some((m) => corpo.includes(m))) {
    return "desafio WAF (AWS): página de desafio JavaScript — o monitor não a executa";
  }
  return null;
}

function descreverErro(e: unknown): string {
  if (e instanceof Error) {
    // AbortSignal.timeout produz TimeoutError; AbortError vem de cancelamento
    if (e.name === "TimeoutError") return "timeout";
    return e.message;
  }
  return String(e);
}

export async function fetchJson<T = unknown>(
  url: string,
  opts: OpcoesHttp = {}
): Promise<T> {
  const corpo = await fetchTexto(url, opts);
  return JSON.parse(corpo) as T;
}

/** Igual ao fetchJson, mas devolve o corpo em texto — HTML do EUR-Lex, DR, etc. */
export async function fetchTexto(
  url: string,
  opts: OpcoesHttp = {}
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const tentativas = opts.tentativas ?? 3;
  const backoffMs = opts.backoffMs ?? 1_000;
  let ultimo: unknown = new Error("sem tentativas");

  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      // O WAF pode responder 200/202 (e até 403): o cabeçalho manda sobre o status.
      const waf = desafioWaf(res);
      if (waf) throw new Error(waf);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const corpo = await res.text();
      const wafNoCorpo = desafioWaf(res, corpo);
      if (wafNoCorpo) throw new Error(wafNoCorpo);
      return corpo;
    } catch (e) {
      ultimo = e;
      const espera = backoffMs * 2 ** i;
      if (i < tentativas - 1) {
        console.warn(
          `  ✗ tentativa ${i + 1}/${tentativas} ${descreverErro(e)} — nova tentativa em ${espera} ms`
        );
        await dormir(espera);
      } else {
        console.warn(`  ✗ tentativa ${i + 1}/${tentativas} ${descreverErro(e)} — esgotado`);
      }
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error(String(ultimo));
}

/**
 * Lê uma página de monitor de vigilância com a política comum aos três
 * monitores do projeto (CC2, IMI Porto 2027, ISP): até `leituras` leituras
 * espaçadas de `esperaMs`, cobrindo **os dois tipos de falha** — erro de
 * rede/HTTP (timeout, 5xx, desafio do WAF) e corpo que `validar` recusa.
 * `validar` devolve `null` quando o corpo serve, ou o motivo da recusa.
 *
 * A regra que isto codifica: uma resposta que não se consegue ler NUNCA é
 * devolvida como se fosse resposta. Antes, cada monitor tinha o seu laço e
 * só um deles cobria erros HTTP — daí a falha da vigilância CC2 de
 * 2026-10-05 (issue #75). Se esgotar, lança `ErroVigilancia` com o motivo
 * da última leitura, para o monitor o poder citar no seu próprio erro.
 */
export async function lerComRetentativas(
  url: string,
  validar: (corpo: string) => string | null,
  opts: OpcoesVigilancia = {}
): Promise<string> {
  const leituras = opts.leituras ?? 4;
  const esperaMs = opts.esperaMs ?? 20_000;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const ler = opts.ler ?? ((u: string) => fetchTexto(u, { timeoutMs, tentativas: 1 }));
  let rotulo = opts.rotulo;
  if (!rotulo) {
    try {
      rotulo = new URL(url).host;
    } catch {
      rotulo = url;
    }
  }
  let motivo = "sem leituras";

  for (let i = 1; i <= leituras; i++) {
    try {
      const corpo = await ler(url);
      const recusa = validar(corpo);
      if (recusa === null) return corpo;
      motivo = recusa;
    } catch (e) {
      motivo = descreverErro(e);
    }
    const fim = i === leituras;
    console.warn(
      `  ✗ ${rotulo}: ${motivo} — leitura ${i}/${leituras}` +
        (fim ? ", esgotado" : `, nova leitura em ${esperaMs / 1000} s`)
    );
    if (!fim) await dormir(esperaMs);
  }

  throw new ErroVigilancia(
    `${rotulo}: ${leituras} leituras falhadas (${motivo})`,
    motivo,
    leituras
  );
}
