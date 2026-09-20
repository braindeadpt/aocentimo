/**
 * Painel — a primeira dobra da home (C-01): leituras oficiais do
 * data/derived/painel.json em grelha de instrumentos. Hierarquia, não
 * cards iguais: dois mostradores grandes, combustíveis empilhados,
 * seis leituras médias.
 *
 * Contrato: SSR com os valores finais (nada anima ao carregar — M-09),
 * um só equivalente textual (<table> sr-only com todas as leituras) —
 * os instrumentos ficam aria-hidden e os links/focáveis fora do nó
 * escondido. Falha de fonte mostra-se — nunca um número inventado.
 */
import Link from "next/link";
import { Glifo } from "@/components/Glifo";
import { Mostrador } from "@/components/instrumentos/Mostrador";
import { Odometer } from "@/components/Odometer";
import { Source } from "@/components/Source";
import { Spark, type EstadoSerie } from "@/components/Spark";
import { fmtDataHora, fmtNum } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { loadFonte } from "@/lib/data";
import painel from "@data/derived/painel.json";

type Entrada = (typeof painel.series)[number];

const porId = (id: string): Entrada | null =>
  painel.series.find((s) => s.id === id) ?? null;

/** unidade curta para o valor grande — meta.unidade do painel é
 *  descritiva ("Índice 2015=100", "% homóloga", "saldo") */
const UNI_CURTA: Record<string, string> = {
  "%": "%",
  "p.p.": "p.p.",
  "€/L": "€/L",
  "€/kWh": "€/kWh",
  saldo: "",
};

const unidadeCurta = (u: string) => UNI_CURTA[u] ?? "";

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

/** linha «leitura {período} · estado» — fora do aria-hidden */
function Meta({ s }: { s: Entrada }) {
  return (
    <p className="footnote mt-2 flex items-center gap-1.5">
      <span className={`serie-estado ${s.estado}`} aria-hidden />
      {m.painel.leitura} {s.rotuloAte} · {ESTADO_TXT[s.estado] ?? s.estado}
    </p>
  );
}

/** variação com Glifo — fora? não: é decorativa, o equivalente cobre-a */
function Variacao({ s }: { s: Entrada }) {
  const abs = s.variacao.abs;
  if (abs === 0 || !Number.isFinite(abs))
    return <p className="num text-xs text-muted">= {m.painel.vs} {s.variacao.periodo}</p>;
  const up = abs > 0;
  return (
    <p className="num flex items-center gap-1 text-xs text-ink2">
      <Glifo tipo={up ? "sobe" : "desce"} className="h-3 w-3" />
      {up ? "+" : "−"}
      {fmtNum(Math.abs(abs))}
      {sufixoVar(s.unidade)} {m.painel.vs} {s.variacao.periodo}
    </p>
  );
}

/** rótulo-link — fora do nó aria-hidden para ficar focável */
function RotuloLink({ s, href }: { s: Entrada; href: string }) {
  const futuro = !["/inflacao", "/precos", "/credito", "/dados"].includes(href);
  const desc = descricaoDe(s.id);
  return (
    <Link
      href={href}
      {...(futuro ? { "data-futuro": "" } : {})}
      className="kicker-xs underline decoration-line2 underline-offset-2 hover:text-accent"
      title={desc}
    >
      {s.rotulo}
    </Link>
  );
}

function Combustivel({ s, spark30 }: { s: Entrada; spark30: { t: string; v: number }[] }) {
  return (
    <div className="px-4 py-3">
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
    <div className="bg-panel px-4 py-4">
      {/* compacto no telemóvel, grande a partir de md — dois svgs mudos,
          o equivalente é a tabela única */}
      <div aria-hidden="true">
        <div className="hidden md:block">
          <Mostrador {...props} />
        </div>
        <div className="mx-auto max-w-44 md:hidden">
          <Mostrador {...props} compacto />
        </div>
      </div>
      <p className="footnote mt-2 text-center">
        <Link
          href={href}
          className="underline decoration-line2 underline-offset-2 hover:text-accent"
        >
          {s.rotulo}
        </Link>{" "}
        — {descricaoDe(s.id)}
      </p>
      <Meta s={s} />
      <Source nome={s.fonte} url={s.url} />
    </div>
  );
}

function Medio({ s, href }: { s: Entrada; href: string }) {
  /* habitação: o valor principal é a variação homóloga %, o índice
     fica em muted — os outros mostram o valor da série */
  const eHpi = s.id === "hpi-pt";
  const valorTxt = eHpi
    ? `${s.variacao.pct !== null && s.variacao.pct >= 0 ? "+" : "−"}${fmtNum(Math.abs((s.variacao.pct ?? 0) * 100))} %`
    : `${fmtNum(s.valor)}${unidadeCurta(s.unidade) ? ` ${unidadeCurta(s.unidade)}` : ""}`;
  return (
    <div className="flex flex-col bg-panel px-4 py-3">
      <RotuloLink s={s} href={href} />
      <div aria-hidden="true" className="mt-1">
        <p className="num text-2xl tabular-nums">{valorTxt}</p>
        {eHpi && (
          <p className="num text-[11px] text-muted">
            {m.painel.indiceEm} {fmtNum(s.valor)} · {s.rotuloAte}
          </p>
        )}
        <Variacao s={s} />
        <Spark pts={s.spark} estado={s.estado as EstadoSerie} className="mt-2" />
      </div>
      <Meta s={s} />
      <Source nome={s.fonte} url={s.url} />
    </div>
  );
}

export function Painel() {
  const inflacao = porId("inflacao-homologa");
  const euribor = porId("euribor-12m-mensal");
  const gasoleo = porId("pmd-gasoleo-diario");
  const gasolina = porId("pmd-gasolina95-diario");

  /* spark de 30 dias — o painel só guarda 24; lê-se a fonte diária */
  const pmdGasoleo = loadFonte("dgeg", "pmd-gasoleo-diario");
  const pmdGasolina = loadFonte("dgeg", "pmd-gasolina95-diario");

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
                  {sufixoVar(s.unidade)} {m.painel.vs} {s.variacao.periodo}
                </td>
                <td>{s.rotuloAte}</td>
                <td>{s.fonte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* cabeçalho — kicker + recolha absoluta (site estático: nunca «há X») */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-4 py-3 md:px-5">
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
              <Combustivel s={gasoleo} spark30={pmdGasoleo?.series.slice(-30) ?? gasoleo.spark} />
            </div>
          )}
          {gasolina && (
            <div className="bg-panel">
              <Combustivel s={gasolina} spark30={pmdGasolina?.series.slice(-30) ?? gasolina.spark} />
            </div>
          )}
        </div>

        {/* linha 2 — seis instrumentos médios */}
        {medios.map(({ id, href }) => {
          const s = porId(id);
          return s ? (
            <div key={id} className="bg-panel md:col-span-2 lg:col-span-2">
              <Medio s={s} href={href} />
            </div>
          ) : null;
        })}
      </div>

      {/* rodapé — contagem honesta + porta para a metodologia */}
      <p className="border-t border-line px-4 py-2.5 text-xs text-muted md:px-5">
        {t(m.painel.rodape, { n: painel.series.length, emDia })}{" "}
        ·{" "}
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
