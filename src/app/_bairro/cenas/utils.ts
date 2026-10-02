/**
 * Utilitários das cenas que correm NO CLIENTE.
 *
 * `pontosDaSerie` é o par da `SerieCena` compacta do servidor (`dados.ts`):
 * o servidor só manda `{ inicio, v }` e aqui reconstruem-se os `t` — a
 * mesma razão pela que a câmara recebe `coordenadas`/`pontos` em tabelas
 * paralelas. As séries verbosas no flight eram o peso do mapa a voltar
 * pela janela do lado.
 */
import type { Ponto, SerieCena } from "./dados";

const MES = 12; // as séries das cenas são todas mensais

/**
 * Reconstrói `[{ t, v }]` de uma série compacta: `v[k]` é o mês
 * `inicio + k`. O número de meses por ano é fixo; o `t` sai `AAAA-MM`.
 */
export function pontosDaSerie(s: SerieCena): Ponto[] {
  const [ano, mes] = s.inicio.split("-").map(Number);
  const out: Ponto[] = [];
  let a = ano;
  let m = mes;
  for (const v of s.v) {
    out.push({ t: `${a}-${String(m).padStart(2, "0")}`, v });
    m += 1;
    if (m > MES) {
      m = 1;
      a += 1;
    }
  }
  return out;
}

/** O índice do ponto `t` numa série reconstruída, ou −1. */
export function indiceDe(pontos: readonly Ponto[], t: string): number {
  return pontos.findIndex((p) => p.t === t);
}

/** Um ponto de uma série diária (o `t` é `AAAA-MM-DD`). */
export interface PontoDia {
  t: string;
  v: number;
}

const DIA_MS = 86_400_000;

/**
 * O par da `SerieDias` compacta de `dados-p2b.ts`: `v[k]` é o dia
 * `inicio + 7k` — menos o último índice, que é sempre o dia `fim`
 * (a série diária não acaba necessariamente numa sexta da amostra).
 */
export function pontosDeDias(s: { inicio: string; fim: string; v: number[] }): PontoDia[] {
  const t0 = Date.parse(`${s.inicio}T00:00:00Z`);
  return s.v.map((v, k) => ({
    t:
      k === s.v.length - 1 && s.fim
        ? s.fim
        : new Date(t0 + k * 7 * DIA_MS).toISOString().slice(0, 10),
    v,
  }));
}
