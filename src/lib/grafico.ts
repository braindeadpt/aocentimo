/**
 * Interpolação de séries — M-06(e): quando os dados mudam (período,
 * categoria), os pontos viajam até ao novo lugar em vez de cortar.
 * Puro e testável: o componente corre o rAF e pede cada frame aqui.
 */

export interface PontoTV {
  t: number;
  v: number;
}

export interface Dominio {
  t0: number;
  t1: number;
  lo: number;
  hi: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Domínio interpolado — o eixo viaja junto com as linhas para a
 * morph não descolar da grelha a meio do caminho.
 */
export function interpDom(a: Dominio, b: Dominio, k: number): Dominio {
  return {
    t0: lerp(a.t0, b.t0, k),
    t1: lerp(a.t1, b.t1, k),
    lo: lerp(a.lo, b.lo, k),
    hi: lerp(a.hi, b.hi, k),
  };
}

/**
 * Pontos interpolados por índice. Quando os comprimentos diferem, o
 * lado mais curto estica-se do último ponto — a cauda nova nasce de
 * onde a cauda velha estava (não aparece do nada).
 */
export function interpPts(
  de: PontoTV[],
  para: PontoTV[],
  k: number
): PontoTV[] {
  return para.map((p, i) => {
    const o = de[Math.min(i, de.length - 1)];
    if (!o) return p;
    return { t: lerp(o.t, p.t, k), v: lerp(o.v, p.v, k) };
  });
}

/**
 * Identidade barata de uma série renderizada — se a chave não muda,
 * não há morph (evita animar quando o pai reconstrói arrays iguais).
 */
export function chaveSeries(
  dados: { name: string; pts: PontoTV[] }[]
): string {
  return dados
    .map(
      (d) =>
        `${d.name}:${d.pts.length}:${d.pts[0]?.t}:${d.pts[0]?.v}:` +
        `${d.pts[d.pts.length - 1]?.t}:${d.pts[d.pts.length - 1]?.v}`
    )
    .join("|");
}
