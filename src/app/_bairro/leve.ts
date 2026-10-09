/**
 * O MODO LEVE do bairro (relato do dono, 2026-10-09: em Android fracos
 * as animações falham e o mapa fica lento e «bugado»).
 *
 * Em modo leve o mapa fica como em `prefers-reduced-motion`: o desenho
 * todo, as janelas acesas, a noite, os marcadores e as cenas — sem a gente,
 * os barcos, as nuvens e o fumo a mexer. Um telemóvel que não consegue
 * desenhar o bairro a 20 fotogramas por segundo fica melhor com o bairro
 * parado do que com ele aos solavancos e o arrasto a engasgar.
 *
 * Entra de duas maneiras:
 *   1. logo à partida, se o aparelho se anuncia fraco (`aparelhoFraco`);
 *   2. a meio, se os primeiros segundos de animação correm lentos
 *      (`medirFotogramas`) — apanha o aparelho que não se anuncia.
 *
 * `?leve=1` força-o (e `?leve=0` desliga-o) para testar; a escolha fica
 * guardada neste browser.
 */

const CHAVE = "aocentimo:bairro-leve";

/** O que o browser diz de si. Parâmetros para os testes não dependerem do aparelho. */
export type Aparelho = {
  /** núcleos lógicos (`navigator.hardwareConcurrency`) */
  nucleos?: number;
  /** GB de memória (`navigator.deviceMemory`, só Chromium; arredondado pelo browser) */
  memoria?: number;
  /** `navigator.connection.saveData` */
  poupanca?: boolean;
};

/**
 * Aparelho fraco: pouca memória (≤ 2 GB), ou poucos núcleos com memória
 * modesta (≤ 4 núcleos e ≤ 4 GB), ou o utilizador pediu para poupar dados.
 * Um iPhone não anuncia memória, por isso só os núcleos não chegam para o
 * pôr em modo leve — é a medição dos fotogramas que decide.
 */
export function aparelhoFraco(a: Aparelho): boolean {
  if (a.poupanca) return true;
  if (a.memoria !== undefined && a.memoria <= 2) return true;
  if (a.memoria !== undefined && a.memoria <= 4 && a.nucleos !== undefined && a.nucleos <= 4) return true;
  return false;
}

/** A mediana dos intervalos entre fotogramas, em ms. */
export function mediana(xs: readonly number[]): number {
  if (!xs.length) return 0;
  const o = [...xs].sort((a, b) => a - b);
  const m = o.length >> 1;
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

/** Lento = a mediana passa os 50 ms (menos de 20 fotogramas por segundo). */
export const LIMITE_MS = 50;

/** O que o aparelho anuncia, lido do `navigator`. */
function lerAparelho(): Aparelho {
  const n = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return {
    nucleos: n.hardwareConcurrency || undefined,
    memoria: n.deviceMemory,
    poupanca: n.connection?.saveData,
  };
}

/** A escolha forçada (`?leve=1|0`, guardada), ou `null` se não houver. */
function escolhaForcada(): boolean | null {
  try {
    const q = new URLSearchParams(location.search).get("leve");
    if (q === "1" || q === "0") localStorage.setItem(CHAVE, q);
    const v = q ?? localStorage.getItem(CHAVE);
    return v === "1" ? true : v === "0" ? false : null;
  } catch {
    return null;
  }
}

/** Arranca em modo leve? */
export function comecaLeve(): boolean {
  const f = escolhaForcada();
  return f ?? aparelhoFraco(lerAparelho());
}

/** Pode a medição a meio passar o mapa a leve? Não, se o modo foi forçado a 0. */
export function podeMedir(): boolean {
  return escolhaForcada() !== false;
}

/**
 * Mede ~60 fotogramas (depois de deixar a página assentar `espera` ms) e
 * chama `aoLento` se a mediana passar `LIMITE_MS`. Devolve o cancelamento.
 */
export function medirFotogramas(aoLento: () => void, espera = 1500, n = 60): () => void {
  let raf = 0;
  let anterior = 0;
  const intervalos: number[] = [];
  const passo = (t: number) => {
    if (anterior) intervalos.push(t - anterior);
    anterior = t;
    if (intervalos.length >= n) {
      if (mediana(intervalos) > LIMITE_MS) aoLento();
      return;
    }
    raf = requestAnimationFrame(passo);
  };
  const atraso = window.setTimeout(() => {
    raf = requestAnimationFrame(passo);
  }, espera);
  return () => {
    clearTimeout(atraso);
    cancelAnimationFrame(raf);
  };
}
