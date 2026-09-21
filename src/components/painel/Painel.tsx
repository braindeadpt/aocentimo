/**
 * Painel — a primeira dobra da home (C-01/C-02): leituras oficiais do
 * data/derived/painel.json em grelha de instrumentos expansíveis.
 * Hierarquia, não cards iguais: dois mostradores grandes, combustíveis
 * empilhados, seis leituras médias.
 *
 * Este ficheiro corre no servidor: monta os ItemPainel (incluindo o
 * histórico completo de cada série, lido de data/sources) e entrega
 * a grelha ao GrelhaPainel (cliente — Flip, expansão, hash). O SSR é
 * o painel colapsado com os valores finais; um só equivalente textual
 * (<table> sr-only) cobre as leituras colapsadas; os instrumentos
 * ficam aria-hidden e os links/focáveis fora do nó escondido.
 */
import Link from "next/link";
import { Glifo } from "@/components/Glifo";
import { Mostrador } from "@/components/instrumentos/Mostrador";
import { Odometer } from "@/components/Odometer";
import { Source } from "@/components/Source";
import { Spark, type EstadoSerie } from "@/components/Spark";
import { fmtDataHora, fmtNum, fmtPeriodo } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { loadFonte } from "@/lib/data";
import {
  CelulaGrelha,
  GrelhaPainel,
  InstrumentoPainel,
  type ItemPainel,
} from "@/components/painel/GrelhaPainel";
import eventos from "@data/fiscal/eventos.json";
import painel from "@data/derived/painel.json";

type Entrada = (typeof painel.series)[number];

const porId = (id: string): Entrada | null =>
  painel.series.find((s) => s.id === id) ?? null;

/** símbolo da unidade para o valor grande — meta.unidade do painel é
 *  descritiva ("Índice 2015=100", "% homóloga", "saldo"); o valor
 *  principal mostra sempre o símbolo, a palavra fica no rótulo */
const UNI_CURTA: Record<string, string> = {
  "%": "%",
  "% homóloga": "%",
  "p.p.": "p.p.",
  "€/L": "€/L",
  "€/kWh": "€/kWh",
  saldo: "pts",
};

const unidadeCurta = (u: string) => UNI_CURTA[u] ?? u;

/** sufixo da variação: taxas movem-se em p.p., saldos/índices em pontos */
const sufixoVar = (u: string) =>
  u === "%" || u === "% homóloga"
    ? " p.p."
    : u === "saldo" || u.startsWith("Índice")
      ? " pontos"
      : ` ${unidadeCurta(u)}`;

const ESTADO_TXT: Record<string, string> = {
  "em-dia": m.painel.estadoEmDia,
  atrasada: m.painel.estadoAtrasada,
  "sem-sla": m.painel.estadoSemSla,
};

const descricaoDe = (id: string) =>
  (m.series as Record<string, { descricao?: string }>)[id]?.descricao;

const rotuloCurto = (id: string, fallback: string) =>
  (m.painel.rotulos as Record<string, string>)[id] ?? fallback;

/** linha «leitura {período} · estado» — fora do aria-hidden */
function Meta({ s }: { s: Entrada }) {
  return (
    <p className="footnote mt-2 flex items-center gap-1.5">
      <span className={`serie-estado ${s.estado}`} aria-hidden />
      {m.painel.leitura} {fmtPeriodo(s.rotuloAte)} ·{" "}
      {ESTADO_TXT[s.estado] ?? s.estado}
    </p>
  );
}

/** variação com Glifo — decorativa, o equivalente cobre-a */
function Variacao({ s }: { s: Entrada }) {
  const abs = s.variacao.abs;
  if (abs === 0 || !Number.isFinite(abs))
    return (
      <p className="num text-xs text-muted">
        = {m.painel.vs} {fmtPeriodo(s.variacao.periodo)}
      </p>
    );
  const up = abs > 0;
  return (
    <p className="num flex items-center gap-1 text-xs text-ink2">
      <Glifo tipo={up ? "sobe" : "desce"} className="h-3 w-3" />
      {up ? "+" : "−"}
      {fmtNum(Math.abs(abs))}
      {sufixoVar(s.unidade)} {m.painel.vs} {fmtPeriodo(s.variacao.periodo)}
    </p>
  );
}

/** variação em p.p. de uma taxa já homóloga (habitação): diferença da
 *  taxa face ao período anterior, não diferença do índice */
function VariacaoPP({ pp, periodo }: { pp: number; periodo: string }) {
  const up = pp > 0;
  return (
    <p className="num flex items-center gap-1 text-xs text-ink2">
      {pp !== 0 && <Glifo tipo={up ? "sobe" : "desce"} className="h-3 w-3" />}
      {pp === 0 ? "=" : up ? "+" : "−"}
      {fmtNum(Math.abs(pp))} p.p. {m.painel.vs} {fmtPeriodo(periodo)}
    </p>
  );
}

/* ———— histórico completo para a expansão ———— */

type DirFonte = "eurostat" | "bpstat" | "dgeg";

/** id do painel → ficheiro de fonte; `homologa` = n.º de períodos da
 *  variação homóloga quando o instrumento mostra a taxa, não o índice */
const FONTE_SERIE: Record<
  string,
  { dir: DirFonte; nome: string; homologa?: number }
> = {
  "inflacao-homologa": { dir: "eurostat", nome: "hicp-pt-cp00", homologa: 12 },
  "euribor-12m-mensal": { dir: "bpstat", nome: "euribor-12m-mensal" },
  "pmd-gasoleo-diario": { dir: "dgeg", nome: "pmd-gasoleo-diario" },
  "pmd-gasolina95-diario": { dir: "dgeg", nome: "pmd-gasolina95-diario" },
  "une-pt-total": { dir: "eurostat", nome: "une-pt-total" },
  "hpi-pt": { dir: "eurostat", nome: "hpi-pt", homologa: 4 },
  "pib-pt-homologo": { dir: "eurostat", nome: "pib-pt-homologo" },
  "lci-pt-homologo": { dir: "eurostat", nome: "lci-pt-homologo" },
  "confianca-pt": { dir: "eurostat", nome: "confianca-pt" },
  "elec-pt-domestico": { dir: "eurostat", nome: "elec-pt-domestico" },
};

const UNI_LINHA: Record<string, string> = {
  "pmd-gasoleo-diario": "€/L",
  "pmd-gasolina95-diario": "€/L",
  "elec-pt-domestico": "€/kWh",
  "confianca-pt": "",
};

function serieDe(id: string): { t: string; v: number }[] {
  const f = FONTE_SERIE[id];
  if (!f) return [];
  const pts = loadFonte(f.dir, f.nome)?.series ?? [];
  if (!f.homologa) return pts;
  const k = f.homologa;
  return pts.slice(k).map((p, i) => ({
    t: p.t,
    v: Math.round((p.v / pts[i].v - 1) * 10000) / 100,
  }));
}

function itemDe(
  s: Entrada,
  o: { href: string; eventos?: ItemPainel["eventos"] }
): ItemPainel {
  const unidadeLinha = UNI_LINHA[s.id] ?? "%";
  return {
    id: s.id,
    rotulo: rotuloCurto(s.id, s.rotulo),
    rotuloCompleto: s.rotulo,
    descricao: descricaoDe(s.id),
    href: o.href,
    estado: s.estado,
    fonte: s.fonte,
    url: s.url,
    rotuloAte: s.rotuloAte,
    unidadeLinha,
    serie: serieDe(s.id),
    eventos: o.eventos,
    refLinha: s.referencia
      ? {
          valor: s.referencia.valor,
          rotulo: `${s.referencia.rotulo} · ${fmtNum(s.referencia.valor)} ${unidadeLinha}`.trim(),
        }
      : undefined,
  };
}

/* ———— visuais colapsados (renderizados no servidor) ———— */

function VisualGrande({
  s,
  min,
  max,
}: {
  s: Entrada;
  min: number;
  max: number;
}) {
  const mediana = s.referencia
    ? { valor: s.referencia.valor, rotulo: s.referencia.rotulo }
    : undefined;
  const props = {
    valor: s.valor,
    unidade: "%",
    min,
    max,
    mediana,
    rotulo: "",
    t: s.t,
    mudo: true,
  };
  return (
    <>
      {/* mobile: mostrador compacto ~44 % à esquerda, valor+referência
          + leitura à direita; ≥md: mostrador grande por cima.
          Dois svgs mudos — o equivalente é a tabela única. */}
      <div className="mt-1 flex items-center gap-3 md:block">
        <div aria-hidden="true" className="w-[44%] shrink-0 md:w-auto">
          <div className="hidden md:block">
            <Mostrador {...props} />
          </div>
          <div className="md:hidden">
            <Mostrador {...props} compacto />
          </div>
        </div>
        <div className="min-w-0 md:mt-1">
          {/* valor e referência em texto só no mobile — no desktop já
              estão dentro do mostrador */}
          <div aria-hidden="true" className="md:hidden">
            <p className="num text-2xl tabular-nums">{fmtNum(s.valor)} %</p>
            {s.referencia && (
              <p className="num text-[11px] text-muted">
                {s.referencia.rotulo} {fmtNum(s.referencia.valor)} %
              </p>
            )}
          </div>
          <Meta s={s} />
          <Source nome={s.fonte} url={s.url} />
        </div>
      </div>
      {/* a descrição esconde-se abaixo de 640 px */}
      <p className="footnote mt-2 hidden sm:block">{descricaoDe(s.id)}</p>
    </>
  );
}

function VisualCombustivel({
  s,
  spark30,
}: {
  s: Entrada;
  spark30: { t: string; v: number }[];
}) {
  return (
    <>
      <div aria-hidden="true" className="mt-1">
        <p className="num text-xl tabular-nums">
          <Odometer valor={s.valor} casas={3} sufixo=" €/L" dur={600} />
        </p>
        <Variacao s={s} />
        <Spark pts={spark30} estado={s.estado as EstadoSerie} className="mt-1" />
      </div>
      <Meta s={s} />
    </>
  );
}

function VisualMedio({
  s,
  varPP,
}: {
  s: Entrada;
  varPP?: { pp: number; periodo: string };
}) {
  const eHpi = s.id === "hpi-pt";
  const uni = unidadeCurta(s.unidade);
  /* habitação: o valor principal é a variação homóloga %, o índice
     fica em muted — os outros mostram o valor da série */
  const valorTxt = eHpi
    ? `${s.variacao.pct !== null && s.variacao.pct >= 0 ? "+" : "−"}${fmtNum(Math.abs((s.variacao.pct ?? 0) * 100))} %`
    : `${fmtNum(s.valor)}${uni ? ` ${uni}` : ""}`;
  return (
    <>
      <div aria-hidden="true" className="mt-1">
        <p className="num text-2xl tabular-nums">{valorTxt}</p>
        {eHpi && (
          <p className="num text-[11px] text-muted">
            {m.painel.indiceEm} {fmtNum(s.valor)} (2015=100)
          </p>
        )}
        {varPP ? (
          <VariacaoPP pp={varPP.pp} periodo={varPP.periodo} />
        ) : (
          <Variacao s={s} />
        )}
        <Spark pts={s.spark} estado={s.estado as EstadoSerie} className="mt-2" />
      </div>
      <Meta s={s} />
      <Source nome={s.fonte} url={s.url} />
    </>
  );
}

/** variação em p.p. da taxa homóloga do índice de preços da habitação —
 *  calculada no servidor a partir da fonte (trimestral → t−4) */
function variacaoHomologaPP(pts: { t: string; v: number }[]) {
  if (pts.length < 5) return null;
  const taxa = (i: number) => (pts[i].v / pts[i - 4].v - 1) * 100;
  return {
    pp: taxa(pts.length - 1) - taxa(pts.length - 2),
    periodo: pts[pts.length - 2].t,
  };
}

export function Painel() {
  const inflacao = porId("inflacao-homologa");
  const euribor = porId("euribor-12m-mensal");
  const gasoleo = porId("pmd-gasoleo-diario");
  const gasolina = porId("pmd-gasolina95-diario");

  /* spark de 30 dias — o painel só guarda 24; lê-se a fonte diária */
  const pmdGasoleo = loadFonte("dgeg", "pmd-gasoleo-diario");
  const pmdGasolina = loadFonte("dgeg", "pmd-gasolina95-diario");
  const hpiPP = variacaoHomologaPP(
    loadFonte("eurostat", "hpi-pt")?.series ?? []
  );

  const evsEuribor = eventos.eventos.filter((e) => e.alvo === "euribor");

  const medios: { id: string; href: string }[] = [
    { id: "une-pt-total", href: "/emprego" },
    { id: "hpi-pt", href: "/habitacao" },
    { id: "pib-pt-homologo", href: "/economia" },
    { id: "lci-pt-homologo", href: "/emprego" },
    { id: "confianca-pt", href: "/economia" },
    { id: "elec-pt-domestico", href: "/habitacao" },
  ];

  const emDia = painel.series.filter((s) => s.estado === "em-dia").length;

  return (
    <section
      aria-labelledby="painel-titulo"
      className="mt-4 border border-line bg-panel md:mt-6"
    >
      {/* equivalente único — todas as leituras numa tabela sr-only */}
      <div className="sr-only">
        <table>
          <caption>{m.painel.equivalenteTitulo}</caption>
          <thead>
            <tr>
              <th scope="col">Série</th>
              <th scope="col">Valor</th>
              <th scope="col">Variação</th>
              <th scope="col">Período</th>
              <th scope="col">Fonte</th>
            </tr>
          </thead>
          <tbody>
            {painel.series.map((s) => (
              <tr key={s.id}>
                <th scope="row">{s.rotulo}</th>
                <td>
                  {fmtNum(s.valor)} {s.unidade}
                </td>
                <td>
                  {s.variacao.abs >= 0 ? "+" : "−"}
                  {fmtNum(Math.abs(s.variacao.abs))}
                  {sufixoVar(s.unidade)} {m.painel.vs}{" "}
                  {fmtPeriodo(s.variacao.periodo)}
                </td>
                <td>{fmtPeriodo(s.rotuloAte)}</td>
                <td>{s.fonte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* cabeçalho — kicker + recolha absoluta (site estático: nunca «há X») */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-3 py-3 md:px-5">
        <h2 id="painel-titulo" className="kicker">
          {m.painel.kicker}
        </h2>
        <p className="num text-xs text-muted">
          {m.painel.recolhido}{" "}
          {painel.recolhidoEm ? fmtDataHora(painel.recolhidoEm) : "—"}
        </p>
      </div>

      <GrelhaPainel>
        {/* linha 1 — os dois mostradores grandes */}
        {inflacao && (
          <CelulaGrelha
            ids={["inflacao-homologa"]}
            base="md:col-span-3 lg:col-span-4"
          >
            <InstrumentoPainel
              item={itemDe(inflacao, { href: "/inflacao" })}
            >
              <VisualGrande s={inflacao} min={0} max={10} />
            </InstrumentoPainel>
          </CelulaGrelha>
        )}
        {euribor && (
          <CelulaGrelha
            ids={["euribor-12m-mensal"]}
            base="md:col-span-3 lg:col-span-4"
          >
            <InstrumentoPainel
              item={itemDe(euribor, {
                href: "/credito",
                eventos: evsEuribor,
              })}
            >
              <VisualGrande s={euribor} min={0} max={6} />
            </InstrumentoPainel>
          </CelulaGrelha>
        )}

        {/* coluna dos combustíveis — empilhados, cada um expansível */}
        <CelulaGrelha
          ids={["pmd-gasoleo-diario", "pmd-gasolina95-diario"]}
          base="grid auto-rows-fr gap-px bg-line md:col-span-6 lg:col-span-4"
        >
          {gasoleo && (
            <InstrumentoPainel
              item={itemDe(gasoleo, { href: "/precos" })}
            >
              <VisualCombustivel
                s={gasoleo}
                spark30={pmdGasoleo?.series.slice(-30) ?? gasoleo.spark}
              />
            </InstrumentoPainel>
          )}
          {gasolina && (
            <InstrumentoPainel
              item={itemDe(gasolina, { href: "/precos" })}
            >
              <VisualCombustivel
                s={gasolina}
                spark30={pmdGasolina?.series.slice(-30) ?? gasolina.spark}
              />
            </InstrumentoPainel>
          )}
        </CelulaGrelha>

        {/* linha 2 — seis instrumentos médios */}
        {medios.map(({ id, href }) => {
          const s = porId(id);
          return s ? (
            <CelulaGrelha
              key={id}
              ids={[id]}
              base="bg-panel md:col-span-2 lg:col-span-2"
            >
              <InstrumentoPainel item={itemDe(s, { href })}>
                <VisualMedio
                  s={s}
                  varPP={id === "hpi-pt" ? (hpiPP ?? undefined) : undefined}
                />
              </InstrumentoPainel>
            </CelulaGrelha>
          ) : null;
        })}
      </GrelhaPainel>

      {/* rodapé — contagem honesta + porta para a metodologia */}
      <p className="border-t border-line px-3 py-2.5 text-xs text-muted md:px-5">
        {t(m.painel.rodape, { n: painel.series.length, emDia })} ·{" "}
        <Link
          href="/metodologia"
          className="underline decoration-line2 underline-offset-2"
        >
          {m.painel.metodologia}
        </Link>
      </p>
    </section>
  );
}
