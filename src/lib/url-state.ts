/**
 * Partilha de Simulações por URL (Zero Cookies) — T12 / Pilar 1
 *
 * Governa-se por docs/DECISOES.md:74 («Nenhum banner; a partilha de
 * simulações faz-se por URL (?bruto=…) em vez de servidor»).
 *
 * Princípios de segurança e performance:
 * 1. Compatibilidade com output: "export" estático — NUNCA usa
 *    `useSearchParams()` do `next/navigation` sem Suspense! O HTML do
 *    servidor renderiza o cenário canónico inicial; no cliente, um
 *    efeito no mount lê `window.location.search`.
 * 2. Segurança OWASP: validação estrita de tipos, limites e enums.
 *    Valores arbitrários, inválidos ou maliciosos (NaN, Infinity,
 *    negativos extremos, tags <script>) são descartados ou limitados
 *    ao intervalo legal válido.
 * 3. Zero `history.replaceState` no arrasto de réguas — preserva 60 fps
 *    e gera URLs partilháveis limpos dinamicamente para o <BotaoCopiar>.
 * 4. URLs limpos: parâmetros iguais ao valor por omissão são omitidos.
 */

import { useEffect, useRef } from "react";

/**
 * Lê um inteiro com validação e limites opcionais.
 * Descarta silenciosamente NaN, strings não numéricas, decimais ou valores fora do domínio.
 */
export function lerInt(
  val: string | null | undefined,
  min?: number,
  max?: number,
  omissao?: number
): number | undefined {
  if (val === null || val === undefined) return omissao;
  const limpo = val.trim();
  if (!/^-?\d+$/.test(limpo)) return omissao;
  const n = parseInt(limpo, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return omissao;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/**
 * Lê um número decimal com validação e limites opcionais.
 * Aceita vírgula ou ponto decimal.
 */
export function lerFloat(
  val: string | null | undefined,
  min?: number,
  max?: number,
  omissao?: number
): number | undefined {
  if (val === null || val === undefined) return omissao;
  const limpo = val.trim().replace(",", ".");
  if (!/^-?\d*(?:\.\d+)?$/.test(limpo) || limpo === "" || limpo === "-") {
    return omissao;
  }
  const n = parseFloat(limpo);
  if (!Number.isFinite(n) || Number.isNaN(n)) return omissao;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/**
 * Lê um booleano de forma estrita: "1", "true", "sim" → true; "0", "false", "nao" → false.
 */
export function lerBool(
  val: string | null | undefined,
  omissao = false
): boolean {
  if (val === null || val === undefined) return omissao;
  const v = val.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "sim") return true;
  if (v === "0" || v === "false" || v === "nao") return false;
  return omissao;
}

/**
 * Lê um valor pertencente a uma lista fechada de opções permitidas (enum).
 */
export function lerEnum<T extends string>(
  val: string | null | undefined,
  permitidos: readonly T[],
  omissao?: T
): T | undefined {
  if (val === null || val === undefined) return omissao;
  const limpo = val.trim();
  return (permitidos as readonly string[]).includes(limpo)
    ? (limpo as T)
    : omissao;
}

/**
 * Faz snap de um valor numérico ao ponto mais próximo de uma grelha permitida.
 */
export function snapValor(val: number, pontos: readonly number[]): number {
  if (!pontos.length) return val;
  let maisProximo = pontos[0];
  let distMin = Math.abs(val - maisProximo);
  for (let i = 1; i < pontos.length; i++) {
    const d = Math.abs(val - pontos[i]);
    if (d < distMin) {
      distMin = d;
      maisProximo = pontos[i];
    }
  }
  return maisProximo;
}

/**
 * Obtém URLSearchParams com segurança quer no servidor quer no browser.
 */
export function obterSearchParams(search?: string): URLSearchParams {
  if (search !== undefined) {
    const s = search.startsWith("?") ? search.slice(1) : search;
    return new URLSearchParams(s);
  }
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
}

/**
 * Serializa parâmetros omitindo os que coincidem com os valores por omissão.
 */
export function serializarParams(
  params: Record<string, unknown>,
  defaults?: Record<string, unknown>
): string {
  const sp = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null) continue;
    if (defaults && Object.prototype.hasOwnProperty.call(defaults, chave)) {
      if (valor === defaults[chave]) continue;
    }
    if (typeof valor === "boolean") {
      const defBool = defaults ? Boolean(defaults[chave]) : false;
      if (valor !== defBool) {
        sp.set(chave, valor ? "1" : "0");
      }
      continue;
    }
    const s = String(valor).trim();
    if (s === "") continue;
    sp.set(chave, s);
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/**
 * Constrói um URL completo (ou relativo) com rota, parâmetros limpos e âncora preservada.
 */
export function construirUrl(
  rota: string,
  params: Record<string, unknown>,
  defaults?: Record<string, unknown>
): string {
  const [baseSemHash, hash] = rota.split("#");
  const [pathname] = baseSemHash.split("?");
  const qs = serializarParams(params, defaults);
  const hashSufixo = hash ? `#${hash}` : "";
  return `${pathname}${qs}${hashSufixo}`;
}

/**
 * Hook client-only que executa um callback de leitura de search params uma única vez no mount.
 * Totalmente compatível com SSR estático (output: "export").
 */
export function useLeituraUrl(onLeitura: (sp: URLSearchParams) => void): void {
  const executado = useRef(false);
  useEffect(() => {
    if (executado.current || typeof window === "undefined") return;
    executado.current = true;
    const sp = new URLSearchParams(window.location.search);
    onLeitura(sp);
  }, [onLeitura]);
}
