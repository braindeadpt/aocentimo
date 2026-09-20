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

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const tentativas = opts.tentativas ?? 3;
  const backoffMs = opts.backoffMs ?? 1_000;
  let ultimo: unknown = new Error("sem tentativas");

  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
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
