/**
 * Painel — a primeira dobra da home (C-01): leituras oficiais do
 * data/derived/painel.json em grelha de instrumentos. Hierarquia, não
 * cards iguais: dois mostradores grandes, combustíveis empilhados,
 * seis leituras médias.
 *
 * Contrato: SSR com os valores finais (nada anima ao carregar — M-09),
 * um só equivalente textual (<table> sr-only com todas as leituras) —
 * os instrumentos ficam aria-hidden e os links/focáveis fora do nó
 * escondido. Períodos sempre em PT (fmtPeriodo), valores com símbolo
 * de unidade. Falha de fonte mostra-se — nunca um número inventado.
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
function Meta({ s, className = "" }: { s: Entrada; className?: string }) {
  return (
    <p className={`footnote mt-2 flex items-center gap-1.5 ${className}`}>
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
      {pp !== 0 && (
        <Glifo tipo={up ? "sobe" : "desce"} className="h-3 w-3" />
      )}
      {pp === 0 ? "=" : up ? "+" : "−"}
      {fmtNum(Math.abs(pp))} p.p. {m.painel.vs} {fmtPeriodo(periodo)}
    </p>
  );
}

/** rótulo-link — fora do nó aria-hidden para ficar focável;
 *  `futuro` marca rotas temáticas planeadas (ainda sem ficheiro) */
function RotuloLink({
  s,
  href,
  futuro = false,
  texto,
}: {
  s: Entrada;
  href: string;
  futuro?: boolean;
  texto?: string;
}) {
  return (
    <Link
      href={href}
      {...(futuro ? { "data-futuro": "" } : {})}
      className="kicker-xs underline decoration-line2 underline-offset-2 hover:text-accent"
      title={descricaoDe(s.id)}
    >
      {texto ?? s.rotulo}
    </Link>
  );
}

function Combustivel({
  s,
  spark30,
}: {
  s: Entrada;
  spark30: { t: string; v: number }[];
}) {
  return (
    <div className="p-3 md:px-4">
      <div className="flex items-baseline justify-between gap-2">
        <Link
          href="/precos"
          className="kicker-xs underline decoration-line2 underline-offset-2 hover:text-accent"
          title={descricaoDe(s.id)}
        >
          {s.rotulo}
        </Link>
        <span className="num text-xl tabular-nums" aria-hidden="true">
          <Odometer valor={s.valor} casas={3} sufixo=" €/L" dur={600} />
        </span>
      </div>
      <div aria-hidden="true">
        <Variacao s={s} />
        <Spark pts={spark30} estado={s.estado as EstadoSerie} className="mt-1" />
      </div>
      <Meta s={s} />
    </div>
  );
}

function Grande({
  s,
  min,
  max,
  href,
}: {
  s: Entrada;
  min: number;
  max: number;
  href: string;
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
    rotulo: s.rotulo,
    t: s.t,
    mudo: true,
  };
  return (
    <div className="bg-panel p-3 md:px-4 md:py-4">
      {/* mobile: mostrador compacto ~44 % à esquerda, valor+referência
          + leitura à direita; ≥md: mostrador grande por cima.
          Dois svgs mudos — o equivalente é a tabela única. */}
      <div className="flex items-center gap-3 md:block">
        <div aria-hidden="true" className="w-[44%] shrink-0 md:w-auto">
          <div className="hidden md:block">
            <Mostrador {...props} />
          </div>
          <div className="md:hidden">
            <Mostrador {...props} compacto />
          </div>
        </div>
        <div className="min-w-0 md:mt-2">
          <p className="footnote">
            <Link
              href={href}
              className="underline decoration-line2 underline-offset-2 hover:text-accent"
            >
              {s.rotulo}
            </Link>
            {/* a descrição esconde-se abaixo de 640 px — o link fica */}
            <span className="hidden sm:inline"> — {descricaoDe(s.id)}</span>
          </p>
          {/* valor e referência em texto só no mobile — no desktop já
              estão dentro do mostrador */}
          <div aria-hidden="true" className="md:hidden">
            <p className="num mt-1 text-2xl tabular-nums">
              {fmtNum(s.valor)} %
            </p>
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
    </div>
  );
}

function Medio({
  s,
  href,
  varPP,
}: {
  s: Entrada;
  href: string;
  /** variação em p.p. da taxa homóloga (habitação) — substitui a
   *  diferença de índice, que não se lê */
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
    <div className="flex flex-col bg-panel p-3 md:px-4">
      <RotuloLink
        s={s}
        href={href}
        futuro
        texto={rotuloCurto(s.id, s.rotulo)}
      />
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
    </div>
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
  const hpiPP = variacaoHomologaPP(loadFonte("eurostat", "hpi-pt")?.series ?? []);

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

      {/* grelha 12 / 6 / 1 colunas */}
      <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-6 lg:grid-cols-12">
        {/* linha 1 — os dois mostradores grandes */}
        {inflacao && (
          <div className="md:col-span-3 lg:col-span-4">
            <Grande s={inflacao} min={0} max={10} href="/inflacao" />
          </div>
        )}
        {euribor && (
          <div className="md:col-span-3 lg:col-span-4">
            <Grande s={euribor} min={0} max={6} href="/credito" />
          </div>
        )}

        {/* coluna dos combustíveis — empilhados */}
        <div className="grid grid-rows-2 gap-px bg-line md:col-span-6 lg:col-span-4">
          {gasoleo && (
            <div className="bg-panel">
              <Combustivel
                s={gasoleo}
                spark30={pmdGasoleo?.series.slice(-30) ?? gasoleo.spark}
              />
            </div>
          )}
          {gasolina && (
            <div className="bg-panel">
              <Combustivel
                s={gasolina}
                spark30={pmdGasolina?.series.slice(-30) ?? gasolina.spark}
              />
            </div>
          )}
        </div>

        {/* linha 2 — seis instrumentos médios */}
        {medios.map(({ id, href }) => {
          const s = porId(id);
          return s ? (
            <div key={id} className="bg-panel md:col-span-2 lg:col-span-2">
              <Medio
                s={s}
                href={href}
                varPP={id === "hpi-pt" ? (hpiPP ?? undefined) : undefined}
              />
            </div>
          ) : null;
        })}
      </div>

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
