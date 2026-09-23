/**
 * repartir — o coração do campo de cêntimos (V4, S1-04).
 *
 * Divide `total` pontos pelas partes pelo MAIOR RESTO (método de
 * Hamilton): cada parte recebe floor da sua quota exacta e os pontos
 * que sobram vão para os maiores restos. Invariante: quando a soma dos
 * valores é positiva, os pontos somam SEMPRE `total` — nem um a mais,
 * nem um a menos, mesmo quando os valores somam 99,99 ou 100,01.
 *
 * O texto diz o valor real (63,18 c), o desenho conta pontos (63) — a
 * função devolve os dois por parte. Uma parte a 0 (ou pequena demais
 * para um ponto) recebe 0 pontos: é informação («não te toca»), não
 * erro — o rótulo mostra-se na mesma.
 *
 * Valores negativos ou não finitos contam como 0 — uma parte nunca tira
 * pontos a outra. Se TODAS as partes valem 0 não há dono para os
 * pontos: ficam em `livres` (o euro tem 100 cêntimos na mesma — o
 * campo desenha-os neutros) e Σpontos + livres = total.
 *
 * Convenção de ordem: as partes chegam na ordem dos montes
 * (esquerda→direita); a que fica contigo é a última. Em empates de
 * resto ganha a parte que vem primeiro — determinista.
 */
export interface ParteEntrada {
  /** valor real da parte em cêntimos — pode ter decimais (63,18) */
  valor: number;
}

export interface ParteRepartida {
  /** o valor real passado — é este que o texto escreve */
  valor: number;
  /** pontos inteiros atribuídos — é isto que o desenho conta */
  pontos: number;
}

export interface Reparticao {
  partes: ParteRepartida[];
  /** pontos sem dono — só > 0 quando nenhuma parte tem valor */
  livres: number;
  total: number;
}

export function repartir(
  partes: readonly ParteEntrada[],
  total = 100
): Reparticao {
  const t = Math.max(0, Math.round(total));
  const limpos = partes.map((p) =>
    Number.isFinite(p.valor) && p.valor > 0 ? p.valor : 0
  );
  const soma = limpos.reduce((a, b) => a + b, 0);
  const pontos = new Array<number>(partes.length).fill(0);

  if (t === 0 || partes.length === 0 || soma <= 0) {
    return {
      partes: partes.map((p, i) => ({ valor: p.valor, pontos: pontos[i] })),
      livres: t,
      total: t,
    };
  }

  // quota exacta de cada parte sobre `total` — normalizada à soma,
  // logo os valores não têm de somar exactamente `total`
  const quotas = limpos.map((v) => (v / soma) * t);
  quotas.forEach((q, i) => (pontos[i] = Math.floor(q)));

  let falta = t - pontos.reduce((a, b) => a + b, 0);
  // maior resto primeiro; empate → ordem de entrada (determinista)
  const ordem = quotas
    .map((q, i) => ({ resto: q - Math.floor(q), i }))
    .sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (let k = 0; falta > 0; k = (k + 1) % ordem.length) {
    pontos[ordem[k].i] += 1;
    falta -= 1;
  }

  return {
    partes: partes.map((p, i) => ({ valor: p.valor, pontos: pontos[i] })),
    livres: 0,
    total: t,
  };
}
