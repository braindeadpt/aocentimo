import { readFileSync } from "fs";
import path from "path";
import isv from "@data/fiscal/isv-2026.json";
import iuc from "@data/fiscal/iuc-2026.json";

/**
 * Item A da 2.ª auditoria: varrimento número a número das tabelas do ISV
 * (arts. 7.º, 10.º, 11.º, 53.º e 54.º do CISV) e do IUC (arts. 9.º e 10.º do
 * CIUC) contra o texto do Diário da República consolidado.
 *
 * As fixtures em scripts/varrimento/fixtures/ são o texto literal extraído do
 * DR com browser (2026-09-30/10-01) e da AT (coeficientes, que não renderizam
 * no DR). O comparador achata cada texto numa sequência de números (linhas de
 * tabela, tab-split) e procura cada linha do JSON como sequência CONTÍGUA,
 * avançando um ponteiro (as tabelas vêm por ordem, sem reuso).
 *
 * Convenções do DR descobertas no próprio varrimento (ver relatório):
 *   - os limites são PARTILHADOS: a linha «Mais de 1 250...» escreve o teto da
 *     linha anterior (1250), não o «1251» que o JSON guarda para o motor;
 *   - o ISV escreve os escalões intermédios como «De 100 a 115» (o JSON `de`);
 *     o IUC escreve-os como «Mais de 120 até 180» (o teto anterior);
 *   - a tabela A do IUC escreve gasolina e «outros produtos» INTERCALADOS na
 *     mesma linha, com a coluna da eletricidade («Até 100») nas duas primeiras;
 *   - linhas «Alterado pelo/a …» são lixo numérico e são removidas.
 *
 * Correr: npx tsx scripts/varrimento-tabelas.ts → exit 1 se houver diferenças.
 */

const DIR = path.join(__dirname, "varrimento", "fixtures");
const ler = (f: string) => readFileSync(path.join(DIR, f), "utf8");

const EPS = 0.005;

export interface Diferenca {
  tabela: string;
  linha: number;
  esperado: number[];
  /** Janela do DR (próximos números) para diagnóstico. */
  janela: number[];
}

export interface ResultadoGrupo {
  tabela: string;
  total: number;
  ok: number;
  dif: Diferenca[];
}

export type Seq = (number | null)[];

/** «1 234,56» / «1.234,56» / «0,001» → número; senão null. */
export function numeroDe(token: string): number | null {
  const fundido = token.replace(/(\d)[\s\u00A0\u202F](\d{3})\b/g, "$1$2");
  const s = fundido.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}

/** Números de uma linha de tabela (split por tab/newline antes de tokenizar). */
export function numerosDeLinha(linha: string): number[] {
  const nums: number[] = [];
  for (const tk of linha.split(/[\t\n]+/)) {
    const re = /\d{1,3}(?:[.\s\u00A0\u202F]\d{3})+(?:,\d+)?|\d+,\d{1,3}|\d+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(tk)) !== null) {
      const n = numeroDe(m[0]);
      if (n !== null) nums.push(n);
    }
  }
  return nums;
}

/** Sequência FLAT de números do texto, sem as linhas «Alterado pelo/Ver alterações»
 *  e sem os ordinais que o DR intercala (n.º 2, artigo 9.º, CO(índice 2)). */
export function numerosDeTexto(texto: string): number[] {
  return texto
    .replace(/\(índice \d+\)/g, " ")
    .replace(/\bn\.\s*º\s*\d+/g, " ")
    .replace(/\b\d{1,3}\.\s*º/g, " ")
    .split("\n")
    .filter((l) => !/^Alterado pelo/.test(l.trim()))
    .filter((l) => !/^Ver alterações/.test(l.trim()))
    .filter((l) => /\d/.test(l))
    .flatMap(numerosDeLinha);
}

interface Grupo {
  tabela: string;
  /** Sequências esperadas, pela ordem do DR; null = número que não consta. */
  linhas: Seq[];
  texto: string;
}

function verificar(g: Grupo): ResultadoGrupo {
  const nums = numerosDeTexto(g.texto);
  const dif: Diferenca[] = [];
  let ok = 0;
  let desde = 0;

  g.linhas.forEach((seq0, idx) => {
    const seq = seq0.filter((v): v is number => v !== null);
    let achou = -1;
    outer: for (let i = desde; i + seq.length <= nums.length; i++) {
      for (let k = 0; k < seq.length; k++) {
        if (Math.abs(nums[i + k] - seq[k]) > EPS) continue outer;
      }
      achou = i;
      break;
    }
    if (achou >= 0) {
      desde = achou + seq.length;
      ok++;
    } else {
      dif.push({
        tabela: g.tabela,
        linha: idx + 1,
        esperado: seq,
        janela: nums.slice(desde, desde + 12),
      });
    }
  });

  return { tabela: g.tabela, total: g.linhas.length, ok, dif };
}

type LinhaAB = {
  de: number | null;
  ate: number | null;
  taxa: number;
  parcelaAbater: number;
};

/**
 * Tabelas com par (limites, taxa, parcela) no estilo do ISV: 1.ª linha
 * «Até X», intermédias «De X a Y», última «Mais de {teto anterior}».
 */
function seqsIsvA(ls: LinhaAB[]): Seq[] {
  return ls.map((l, i) => {
    const prev = ls[i - 1];
    if (i === 0) return [l.ate, l.taxa, l.parcelaAbater];
    if (l.ate !== null) return [l.de, l.ate, l.taxa, l.parcelaAbater];
    return [prev.ate, l.taxa, l.parcelaAbater];
  });
}

/** Estilo do IUC: intermédias e última como «Mais de {teto anterior}». */
function seqsIucB(ls: { de: number | null; ate: number | null; taxa: number }[]): Seq[] {
  return ls.map((l, i) => {
    const prev = ls[i - 1];
    if (i === 0) return [l.ate, l.taxa];
    if (l.ate !== null) return [prev.ate, l.ate, l.taxa];
    return [prev.ate, l.taxa];
  });
}

export function varrer(): ResultadoGrupo[] {
  const out: ResultadoGrupo[] = [];
  const art7 = ler("isv-art7-full.txt");
  const art5354 = ler("isv-art53-54.txt");
  const iucTodo = ler("iuc-art9-10.txt");
  const [iucArt9, iucArt10] = iucTodo.split("@@@ART10@@@");

  // ── ISV art. 7.º ──
  out.push(
    verificar({
      tabela: "ISV A · cilindrada",
      linhas: seqsIsvA(isv.tabelaA.cilindrada as LinhaAB[]),
      texto: art7,
    })
  );
  for (const norma of ["NEDC", "WLTP"] as const)
    for (const comb of ["gasolina", "gasoleo"] as const)
      out.push(
        verificar({
          tabela: `ISV A · ambiental ${comb} ${norma}`,
          linhas: seqsIsvA((isv.tabelaA.ambiental[comb][norma] ?? []) as LinhaAB[]),
          texto: art7,
        })
      );
  out.push(
    verificar({
      tabela: "ISV B · cilindrada",
      linhas: seqsIsvA(isv.tabelaB.cilindrada as LinhaAB[]),
      texto: art7,
    })
  );
  out.push(
    verificar({
      tabela: "ISV · agravamento + mínimo (art. 7.º n.os 3 e 4)",
      linhas: [
        [
          isv.agravamentoGasoleo.valor,
          isv.agravamentoGasoleo.valorVeiculosMercadorias,
          isv.agravamentoGasoleo.limiteParticulas,
        ],
        [isv.minimo],
      ],
      texto: art7,
    })
  );

  // ── ISV art. 10.º: tabela C (cinco escalões; última «Mais de 750») ──
  const c = isv.tabelaC.cilindrada as {
    de: number | null;
    ate: number | null;
    valorFixo: number;
  }[];
  out.push(
    verificar({
      tabela: "ISV C · motociclos",
      linhas: c.map((l, i) => {
        if (i === 0) return [l.ate, l.valorFixo];
        if (l.ate !== null) return [l.de, l.ate, l.valorFixo];
        return [c[i - 1].ate, l.valorFixo];
      }),
      texto: ler("isv-art10.txt"),
    })
  );

  // ── ISV art. 11.º: tabela D («Até 1 ano» … «Mais de 10 anos», números em linhas separadas) ──
  out.push(
    verificar({
      tabela: "ISV D · usados UE",
      linhas: isv.veiculosUsadosImportadosUE.tabelaD.map((l, i, ls) => {
        const prev = ls[i - 1];
        if (i === 0) return [l.ate, l.reducao];
        if (l.ate !== null) return [prev.ate, l.ate, l.reducao];
        return [prev.ate, l.reducao];
      }),
      texto: ler("isv-art11.txt"),
    })
  );

  // ── ISV arts. 53.º e 54.º (prosa: sequências contíguas) ──
  out.push(
    verificar({
      tabela: "ISV · isenção táxi (art. 53.º n.º 1)",
      // «até quatro anos de uso» é por extenso: o 4 verifica-se por literal
      linhas: [[isv.isencoes.taxi.co2MaxNedc, isv.isencoes.taxi.co2MaxWltp, isv.isencoes.taxi.reducao]],
      texto: art5354,
    })
  );
  if (!/quatro anos/i.test(art5354))
    out[out.length - 1].dif.push({
      tabela: "ISV · isenção táxi (art. 53.º n.º 1)",
      linha: 1,
      esperado: [isv.isencoes.taxi.ateAnosUso],
      janela: [],
    });
  out.push(
    verificar({
      tabela: "ISV · isenção deficiente (art. 54.º n.º 2)",
      linhas: [
        [
          isv.isencoes.deficiente.co2MaxNedc,
          isv.isencoes.deficiente.co2MaxWltp,
          isv.isencoes.deficiente.limiteIsencao,
        ],
      ],
      texto: art5354,
    })
  );

  // ── IUC art. 9.º: categoria A — gasolina/outros intercalados + elétrica ──
  const gA = iuc.categoriaA.gasolina;
  const oA = iuc.categoriaA.outrosProdutos;
  out.push(
    verificar({
      tabela: "IUC A · gasolina + outros produtos",
      linhas: gA.map((g, i) => {
        const o = oA[i];
        const gasLow = i === 0 ? null : gA[i - 1].ate;
        const outLow = o ? (i === 0 ? null : oA[i - 1].ate) : null;
        const eletrica = i <= 1 ? 100 : null;
        return [
          gasLow,
          g.ate,
          outLow,
          o?.ate ?? null,
          eletrica,
          g.posteriorA1995,
          g.de1990a1995,
          g.de1981a1989,
        ];
      }),
      texto: iucArt9,
    })
  );

  // ── IUC art. 10.º: categoria B ──
  out.push(
    verificar({
      tabela: "IUC B · cilindrada",
      linhas: seqsIucB(iuc.categoriaB.cilindrada),
      texto: iucArt10,
    })
  );
  out.push(
    verificar({
      tabela: "IUC B · CO2 (NEDC/WLTP lado a lado)",
      linhas: iuc.categoriaB.co2.map((l, i, ls) => {
        const prev = ls[i - 1];
        if (i === 0) return [l.ateNedc, l.ateWltp, l.taxa];
        if (l.ateNedc !== null) return [prev.ateNedc, l.ateNedc, prev.ateWltp, l.ateWltp, l.taxa];
        return [prev.ateNedc, prev.ateWltp, l.taxa];
      }),
      texto: iucArt10,
    })
  );
  out.push(
    verificar({
      tabela: "IUC B · adicional CO2 (art. 10.º n.º 2)",
      // esta tabela escreve «Mais de 180 até 250» na 1.ª linha: o limite
      // inferior aparece por inteiro, ao contrário das restantes
      linhas: iuc.categoriaB.adicionalCo2.escaloes.map((l, i, ls) => {
        const prev = ls[i - 1];
        if (i === 0) return [l.deNedc - 1, l.ateNedc, l.deWltp - 1, l.ateWltp, l.taxa];
        return [prev.ateNedc, prev.ateWltp, l.taxa];
      }),
      texto: iucArt10,
    })
  );

  // ── IUC coeficientes (AT — não renderizam no DR) ──
  out.push(
    verificar({
      tabela: "IUC B · coeficientes (AT)",
      linhas: iuc.categoriaB.coeficientes.tabela.map((l) => [l.de, l.coeficiente]),
      texto: ler("at-coeficientes.txt"),
    })
  );

  return out;
}

/** Relatório para stdout; exit 1 se houver diferenças. */
function main(): void {
  const resultados = varrer();
  let total = 0;
  let ok = 0;
  let difs = 0;
  for (const r of resultados) {
    total += r.total;
    ok += r.ok;
    difs += r.dif.length;
    console.log(`${r.dif.length === 0 ? "OK " : "DIF"} ${r.tabela}: ${r.ok}/${r.total}`);
    for (const d of r.dif)
      console.log(
        `     linha ${d.linha}: esperado [${d.esperado.join(", ")}] · DR à frente [${d.janela.slice(0, 10).join(", ")}]`
      );
  }
  console.log(`\nResumo: ${ok}/${total} linhas batem; ${difs} diferença(s)`);
  if (difs > 0) process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith("varrimento-tabelas.ts")) main();
