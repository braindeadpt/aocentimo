/**
 * `graficoLinhas` — o desenhador de gráficos de linhas das cenas V5
 * (P2c do PACK V5 PRODUÇÃO). Porta de `graficoLinhas()` e `rebase()` do
 * protótipo (`design/prototipos/mapa/cena-base.js`), em TypeScript puro:
 * sem DOM, sem JSON — só recebe pontos e devolve SVG.
 *
 * A P2a tem os seus gráficos especializados (`graficoBanco`,
 * `graficoIndice`); este é o genérico que as cenas P2c partilham. Não
 * refactoriza os da P2a — fica a proposta no PR.
 *
 * Diferenças deliberadas ao protótipo (todas no sentido da regra nº1):
 *
 *   - uma FALHA na série QUEBRA a linha (pen up) em vez de a ligar por
 *     cima do vazio — o protótipo nunca teve falhas, mas os dados reais
 *     podem ter;
 *   - uma série vazia não desenha nada e o equivalente textual diz «—»;
 *   - se TODAS as séries falharem, não sai um gráfico de zeros: `svg`
 *     volta vazio e só o equivalente textual fica;
 *   - cada figura devolve também `texto`, um `<dl>` escondido
 *     visualmente (`.b-sr`) com os mesmos números — o «equivalente
 *     textual por figura» das regras da casa.
 */

export interface PontoLinha {
  /** O período oficial («2026-07», «2026-Q1») — a ordenação é por ele. */
  t: string;
  v: number;
}

export interface SerieLinhas {
  pts: PontoLinha[];
  cor: string;
  larg?: number;
  traco?: string;
  /** A legenda à mão (Caveat) por cima do gráfico. */
  rotulo?: string;
  /** Cor da legenda, se diferente da linha. */
  corTexto?: string;
}

export interface MarcaLinha {
  /** Índice da série em `series`. */
  s: number;
  /** Índice do ponto; negativo conta do fim (−1 = último). */
  k: number;
  texto: string;
  cor: string;
  dx?: number;
  dy?: number;
  ancora?: "start" | "middle" | "end";
  corTexto?: string;
}

export interface OpcoesLinhas {
  series: SerieLinhas[];
  /** O eixo y: limites, passo da grelha, formatador e o risco realçado. */
  y: {
    min: number;
    max: number;
    passo: number;
    fmt: (v: number) => string;
    realce?: number;
  };
  /** A mancha entre duas séries [índice a, índice b]. */
  faixa?: [number, number];
  faixaCor?: string;
  /** Anos no eixo de n em n (por defeito 1). */
  anoPasso?: number;
  marcas?: MarcaLinha[];
  /** O aria-label do svg — frase completa com os valores falados. */
  aria: string;
  alto?: number;
  /** O topo da área útil (default 22). */
  topo?: string | number;
}

const G = { x0: 56, x1: 500, y0: 250 };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Reindexa uma série para 100 no ponto `t0` (o `rebase` do protótipo). */
export function rebase(pts: PontoLinha[], t0: string): PontoLinha[] {
  const b = pts.find((p) => p.t === t0);
  if (!b || b.v === 0) return [];
  return pts.map((p) => ({ t: p.t, v: (p.v / b.v) * 100 }));
}

/**
 * Desenha o gráfico e devolve `{ svg, texto }`: o `<svg>` para injetar e
 * o equivalente textual (`<dl class="b-sr">`) com os mesmos números.
 */
export function graficoLinhas(o: OpcoesLinhas): { svg: string; texto: string } {
  // o eixo x é o conjunto ORDENADO dos t de todas as séries — como no
  // protótipo, para que duas séries com datas diferentes alinhem
  const ts = [...new Set(o.series.flatMap((s) => s.pts.map((p) => p.t)))].sort();
  const n = ts.length;
  const ix = new Map(ts.map((t, k) => [t, k]));

  // equivalente textual: por série, primeiro → último (ou «—»)
  const texto =
    `<dl class="b-sr">` +
    o.series
      .map((se) => {
        const nome = esc(se.rotulo ?? "série");
        if (se.pts.length === 0) return `<dt>${nome}</dt><dd>—</dd>`;
        const a = se.pts[0];
        const b = se.pts[se.pts.length - 1];
        return `<dt>${nome}</dt><dd>${esc(o.y.fmt(a.v))} → ${esc(o.y.fmt(b.v))}</dd>`;
      })
      .join("") +
    `</dl>`;

  // todas vazias ou sem eixo: sem gráfico de zeros — só o equivalente
  if (n < 1 || o.series.every((s) => s.pts.length === 0)) return { svg: "", texto };

  const y1 = Number(o.topo ?? 22);
  const x = (t: string) => G.x0 + ((G.x1 - G.x0) * (ix.get(t) ?? 0)) / Math.max(n - 1, 1);
  const y = (v: number) => G.y0 - ((G.y0 - y1) * (v - o.y.min)) / (o.y.max - o.y.min);

  let s = "";
  // a grelha horizontal, com o risco do `realce` (o 100, o 0…) a cheio
  for (let v = o.y.min; v <= o.y.max + 1e-9; v += o.y.passo)
    s += `<path d="M${G.x0} ${y(v).toFixed(1)} H${G.x1}" stroke="currentColor" stroke-opacity="${o.y.realce === v ? 0.55 : 0.1}" ${o.y.realce === v ? 'stroke-dasharray="3 3"' : ""}/><text x="${G.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e" font-weight="${o.y.realce === v ? 800 : 400}">${esc(o.y.fmt(v))}</text>`;

  // os anos no eixo, de `anoPasso` em `anoPasso`
  let anoV = "";
  ts.forEach((t) => {
    const a = t.slice(0, 4);
    if (a !== anoV && (+a - (o.anoPasso ? 0 : 1)) % (o.anoPasso || 1) === 0)
      s += `<text x="${x(t).toFixed(1)}" y="${G.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${a}</text><path d="M${x(t).toFixed(1)} ${G.y0} v4" stroke="currentColor" stroke-opacity=".5"/>`;
    anoV = a;
  });

  // a mancha entre duas séries (a à frente, b de trás para a frente)
  if (o.faixa) {
    const [a, b] = o.faixa;
    const sa = o.series[a]?.pts ?? [];
    const sb = o.series[b]?.pts ?? [];
    if (sa.length && sb.length)
      s += `<path d="${sa.map((p, k) => `${k ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")} ${sb
        .slice()
        .reverse()
        .map((p) => `L${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`)
        .join(" ")} Z" fill="${o.faixaCor || "#ffc62b"}" fill-opacity=".35"/>`;
  }

  // as linhas: falhas no eixo quebram o traço (pen up), nunca ligam por cima
  for (const se of o.series) {
    if (se.pts.length === 0) continue; // série vazia: sem linha — o «—» vai no equivalente
    if (se.pts.length === 1) {
      s += `<circle cx="${x(se.pts[0].t).toFixed(1)}" cy="${y(se.pts[0].v).toFixed(1)}" r="4" fill="${se.cor}"/>`;
      continue;
    }
    let d = "";
    let anterior = -1;
    for (const p of se.pts) {
      const k = ix.get(p.t) ?? 0;
      d += `${anterior < 0 || k - anterior > 1 ? "M" : "L"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)} `;
      anterior = k;
    }
    s += `<path d="${d.trim()}" fill="none" stroke="${se.cor}" stroke-width="${se.larg || 2.8}" ${se.traco ? `stroke-dasharray="${se.traco}"` : ""} stroke-linejoin="round"/>`;
  }
  s += `<path d="M${G.x0} ${G.y0} H${G.x1}" stroke="#16130f" stroke-width="2"/>`;

  // as legendas à mão (Caveat) por cima do gráfico
  let lx = G.x0 + 6;
  for (const se of o.series) {
    if (!se.rotulo) continue;
    s += `<text x="${lx}" y="${y1 - 4}" font-family="Caveat" font-weight="700" font-size="18" fill="${se.corTexto || se.cor}">${esc(se.rotulo)}</text>`;
    lx += se.rotulo.length * 7.2 + 18;
  }

  for (const m of o.marcas ?? []) {
    const pts = o.series[m.s]?.pts ?? [];
    const p = pts[m.k < 0 ? pts.length + m.k : m.k];
    if (!p) continue;
    const px = x(p.t);
    const py = y(p.v);
    s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="${m.cor}" stroke="#16130f" stroke-width="2"/><text x="${(px + (m.dx ?? 8)).toFixed(1)}" y="${(py + (m.dy ?? 4)).toFixed(1)}" text-anchor="${m.ancora || "start"}" font-family="Caveat" font-weight="700" font-size="18" fill="${m.corTexto || "#16130f"}" stroke="#fff" stroke-width="4" paint-order="stroke">${esc(m.texto)}</text>`;
  }

  const svg = `<svg class="grafico-irs" viewBox="0 0 520 ${o.alto || 280}" role="img" aria-label="${esc(o.aria)}" font-family="Archivo">${s}</svg>`;
  return { svg, texto };
}
