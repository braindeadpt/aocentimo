import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ALT_FEED } from "@/lib/meta";
import { Source } from "@/components/Source";
import { JsonLd, dataset } from "@/lib/jsonld";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Painel } from "@/components/Painel";
import { LineChart } from "@/components/LineChart";
import { Delta } from "@/components/Delta";
import { Instrumento } from "@/components/Instrumento";
import { AnelPontos, type PontoAnel } from "@/components/AnelPontos";
import { OrbeEstado } from "@/components/OrbeEstado";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import {
  loadFonte,
  loadDerivado,
  loadFreshness,
  loadSerie,
  variacao,
  type Serie,
} from "@/lib/data";
import { comUnidade, fmtData, fmtNum, fmtPct, fmtPeriodo } from "@/lib/format";
import { estadoDe } from "@/lib/leitura";
import { cartoesDados, opcoesJanela, ROTULO_JANELA } from "@/lib/paineis";
import { m } from "@/lib/messages";
import usura from "@data/fiscal/usura-2026.json";
import calendario from "@data/fiscal/calendario-2026.json";
import eventos from "@data/fiscal/eventos.json";

export const metadata: Metadata = {
  title: "Dados — painéis vivos de fontes oficiais",
  description:
    "Euribor, TAEG do crédito ao consumo vs teto legal de usura, taxa base dos Certificados de Aforro e o calendário fiscal — direto das fontes oficiais.",
  alternates: { canonical: "/dados", types: ALT_FEED },
};

interface CaBase {
  meta: { oficialPct: number; vigenciaOficial: string; serieAte: string; url?: string };
  series: { t: string; v: number }[];
}

const ultimo = (s: Serie | null) => (s ? s.series[s.series.length - 1] : null);

/** trimestre da usura ("2026-T3") → «3.º trim. 2026» — os dados fiscais
 *  usam -T e o fmtPeriodo da casa fala -Q; a ponte fica aqui, uma vez */
const fmtTrim = (t: string) => fmtPeriodo(t.replace("-T", "-Q"));

/** Categorias de usura → série BPstat de TAEG média praticada. */
const LINHAS_TAEG: { rotulo: string; capKey: string; serie: string }[] = [
  { rotulo: "Crédito pessoal — educação, saúde, energia", capKey: "pessoal-educacao-saude-energia", serie: "taeg-pessoal-educacao-saude-energia-mensal" },
  { rotulo: "Crédito pessoal — outros fins", capKey: "pessoal-outros", serie: "taeg-pessoal-outros-mensal" },
  { rotulo: "Automóvel — locação financeira / ALD", capKey: "automovel-ald-novo", serie: "taeg-automovel-ald-mensal" },
  { rotulo: "Automóvel — novo", capKey: "automovel-novo", serie: "taeg-automovel-novo-mensal" },
  { rotulo: "Automóvel — usado", capKey: "automovel-usado", serie: "taeg-automovel-usado-mensal" },
  { rotulo: "Cartões, linhas e descobertos", capKey: "renovavel", serie: "taeg-renovavel-mensal" },
];

const MESES_ANEL = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const MESES_ANEL_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** Célula do quadro de nível 1 — delega no <Instrumento> do sistema:
 *  valor, meta e o orbe de frescura sempre à vista. */
function Celula(props: {
  rotulo: string;
  valor: ReactNode;
  meta: ReactNode;
  estado?: "em-dia" | "atrasada" | "sem-sla";
  spark?: { t: string; v: number }[];
  /** índice de escalonamento da célula no quadro (× --stagger) */
  atraso?: number;
}) {
  return <Instrumento {...props} className="bg-panel px-4 py-4" />;
}

export default function DadosPage() {
  const euribor = {
    "1M": loadFonte("bpstat", "euribor-1m-mensal"),
    "3M": loadFonte("bpstat", "euribor-3m-mensal"),
    "6M": loadFonte("bpstat", "euribor-6m-mensal"),
    "12M": loadFonte("bpstat", "euribor-12m-mensal"),
  };
  const temEuribor = euribor["3M"] !== null;
  const caBase = loadDerivado<CaBase>("ca-base");
  const taeg = loadFonte("bpstat", "taeg-pessoal-outros-mensal");
  const taegAte = taeg?.meta.serieAte;
  const ipc = loadSerie("CP00");
  const fresh = loadFreshness();

  // ————— o índice visual: as séries-chave do país que ainda não têm
  //   página temática — a composição <Painel> (1B-06): três tamanhos,
  //   codificações alternadas, mediana de 10 anos por omissão —————
  const leituras = cartoesDados();

  const [qAtual, qProx] = usura.trimestres;
  const hoje = new Date().toISOString().slice(0, 10);
  const vigente = hoje <= qAtual.ate ? qAtual : qProx;
  const proximoTeto = hoje <= qAtual.ate ? qProx : null;

  const prazos = [...calendario.prazos].sort((a, b) => a.mes.localeCompare(b.mes));
  const mesAtual = hoje.slice(0, 7);
  const proxPrazo = prazos.find((p) => p.mes >= mesAtual);

  // ————— nível 1: quatro números do país, cada um com o orbe —————
  const inflVar = ipc ? variacao(ipc, 12) : null;
  const eur12 = ultimo(euribor["12M"]);
  const fraseResposta =
    inflVar !== null && eur12
      ? `A inflação está em ${fmtPct(inflVar, 1)} e a Euribor de um ano em ${comUnidade(fmtNum(eur12.v, 2), "%")} — cada número com fonte e data.`
      : "Os números do país, direto das fontes oficiais — cada um com a sua data e o selo de frescura.";

  // ————— o ano fiscal em anel (catálogo: ciclos = pontos) —————
  const ano = calendario.ano;
  const mesesComPrazo = new Map<string, typeof prazos>();
  for (const p of prazos) {
    const l = mesesComPrazo.get(p.mes) ?? [];
    l.push(p);
    mesesComPrazo.set(p.mes, l);
  }
  const pontosAno: PontoAnel[] = Array.from({ length: 12 }, (_, i) => {
    const mm = `${ano}-${String(i + 1).padStart(2, "0")}`;
    const temPrazo = mesesComPrazo.has(mm);
    const passou = mm < mesAtual;
    return {
      id: mm,
      rotulo: MESES_ANEL[i],
      rotuloCurto: MESES_ANEL_CURTOS[i],
      // o prazo é o marco (torrado = limite); o mês passado sem obrigação
      // fica oco; o «agora» é o mês da próxima obrigação
      tom: temPrazo ? "marca" : passou ? "vago" : "neutro",
      atual: proxPrazo?.mes === mm,
    };
  });
  const mesesPrazoTxt = [...mesesComPrazo.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mm, l]) => `${MESES_ANEL[Number(mm.slice(5, 7)) - 1]} (${l.map((p) => p.titulo.split(" — ")[0]).join(", ")})`)
    .join("; ");

  // Dataset com proveniência real — data = fim de série mais recente
  const serieFim = [
    ...Object.values(euribor).map((s) => s?.meta.serieAte),
    taegAte,
    caBase?.meta.serieAte,
  ]
    .filter((d): d is string => !!d)
    .sort()
    .pop();

  // séries desta página — para a frescura por série do nível 3
  const seriesPagina: { id: string; nome: string }[] = [
    { id: "euribor-1m-mensal", nome: "Euribor 1M" },
    { id: "euribor-3m-mensal", nome: "Euribor 3M" },
    { id: "euribor-6m-mensal", nome: "Euribor 6M" },
    { id: "euribor-12m-mensal", nome: "Euribor 12M" },
    ...LINHAS_TAEG.map((l) => ({ id: l.serie, nome: l.rotulo })),
    { id: "hicp-pt-cp00", nome: "IHPC — índice de preços" },
    { id: "fiscal-ca", nome: "Certificados de Aforro — taxa base" },
  ];

  return (
    <>
      {serieFim && (
        <JsonLd
          data={dataset({
            nome: "Painéis de dados financeiros — Portugal",
            descricao:
              "Euribor (médias mensais), TAEG de novos créditos ao consumo vs teto legal de usura, e taxa base dos Certificados de Aforro — séries do Banco de Portugal (BPstat) e do IGCP.",
            fontes: [
              {
                nome: "Banco de Portugal — BPstat",
                url: "https://bpstat.bportugal.pt",
              },
              {
                nome: "IGCP — Agência de Gestão da Tesouraria e da Dívida Pública",
                url: caBase?.meta.url,
              },
            ],
            atualizadoEm: serieFim,
          })}
        />
      )}
      <Pagina
        pergunta="Como está Portugal hoje?"
        rota="/dados"
        kicker="O país · dados oficiais"
        resposta={{
          instrumento: (
            <div>
              <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
                <Celula
                  rotulo="Inflação homóloga"
                  atraso={0}
                  estado={estadoDe(fresh, "hicp-pt-cp00")}
                  spark={ipc?.series}
                  valor={ipc ? <Delta value={inflVar} /> : "—"}
                  meta={
                    ipc ? `IHPC · ${fmtData(ipc.meta.serieAte)}` : "série não recolhida"
                  }
                />
                <Celula
                  rotulo="Euribor 12M"
                  atraso={1}
                  estado={estadoDe(fresh, "euribor-12m-mensal")}
                  spark={euribor["12M"]?.series}
                  valor={
                    eur12 ? comUnidade(fmtNum(eur12.v, 2), "%") : "—"
                  }
                  meta={
                    eur12 ? (
                      <>
                        {fmtData(eur12.t)}
                        {" · "}
                        <Delta value={variacao(euribor["12M"]!, 1)} casas={2} /> no mês
                      </>
                    ) : (
                      "série não recolhida"
                    )
                  }
                />
                <Celula
                  rotulo="TAEG crédito pessoal"
                  atraso={2}
                  estado={estadoDe(fresh, "taeg-pessoal-outros-mensal")}
                  spark={taeg?.series}
                  valor={
                    ultimo(taeg)
                      ? comUnidade(fmtNum(ultimo(taeg)!.v, 1), "%")
                      : "—"
                  }
                  meta={
                    ultimo(taeg)
                      ? `teto ${fmtTrim(vigente.trimestre)} ${comUnidade(fmtNum(
                          (vigente.taegMaxima as Record<string, number>)["pessoal-outros"],
                          1
                        ), "%")} · ${fmtData(ultimo(taeg)!.t)}`
                      : "série não recolhida"
                  }
                />
                <Celula
                  rotulo="Certificados Aforro F"
                  atraso={3}
                  estado={estadoDe(fresh, "fiscal-ca")}
                  spark={caBase?.series}
                  valor={caBase ? fmtPct(caBase.meta.oficialPct / 100, 3) : "—"}
                  meta={
                    caBase
                      ? `oficial · ${caBase.meta.vigenciaOficial}`
                      : "série não recolhida"
                  }
                />
              </div>
              {fresh && (
                <p className="num mt-2 text-rotulo text-muted">
                  verificado {fmtData(fresh.verificadoEm.slice(0, 10))}
                </p>
              )}
            </div>
          ),
          frase: fraseResposta,
        }}
        explora={
          <>
            {/* o índice visual do observatório — as séries do país sem
                página própria, compostas pelo <Painel> (1B-06) */}
            {leituras.length > 0 && (
              <div>
                <p className="kicker mb-3">O país, em leituras</p>
                <Painel
                  cartoes={leituras}
                  rotuloJanela={ROTULO_JANELA()}
                  opcoesJanela={opcoesJanela()}
                />
              </div>
            )}

            {/* o calendário fiscal como anel de pontos: o ano é um ciclo,
                os meses com obrigação são marcos torrados e o «agora»
                assenta na próxima obrigação — dita também em texto */}
            <div className="mt-10">
              <p className="kicker mb-3">O ano fiscal, em círculo</p>
              <div className="grid gap-6 md:grid-cols-[minmax(0,340px)_1fr] md:items-center">
                <AnelPontos
                  pontos={pontosAno}
                  centro={{
                    valor: proxPrazo ? fmtPeriodo(proxPrazo.mes) : String(ano),
                    rotulo: proxPrazo ? "próximo prazo" : "ano fiscal",
                  }}
                  equivalente={`O ano fiscal de ${ano} em círculo: ${mesesPrazoTxt}.`}
                />
                <div>
                  {proxPrazo ? (
                    <>
                      <p className="leitura-insight">{proxPrazo.titulo}</p>
                      <p className="body-copy mt-2 text-ink2">
                        {proxPrazo.descricao}
                      </p>
                      <p className="footnote mt-3">
                        Os pontos torrados são meses com obrigação fiscal; o
                        anel de marca assenta na próxima. A lista completa
                        está no Confirma, em baixo.
                      </p>
                    </>
                  ) : (
                    <p className="body-copy text-ink2">
                      Os prazos de {ano} já passaram todos — a lista completa
                      fica no Confirma, em baixo.
                    </p>
                  )}
                </div>
              </div>
              <p className="footnote mt-4">{calendario.nota}</p>
              <Source nome={calendario.fonte} url={calendario.fonteUrl} vigencia={calendario.vigencia} />
            </div>

            {/* o painel honesto — o que ainda não conseguimos tem o
                mesmo peso das leituras que correram bem */}
            <div className="mt-10">
              <p className="kicker mb-3">O que ainda não conseguimos</p>
              <div className="border border-line bg-panel px-5 py-6 text-corpo-sm text-ink2 space-y-3">
                <p>
                  O Banco de Portugal publica diariamente o comparador de
                  comissões de ~200 instituições, mas só dentro da aplicação
                  web — não há um ficheiro ou API pública estável que possamos
                  recolher com confiança. Em vez de dados de segunda mão,
                  apontamos para a fonte:
                </p>
                <p>
                  <a
                    href="https://clientebancario.bportugal.pt/pt-pt/aplicacao/comparador-de-comissoes"
                    className="underline decoration-line2 underline-offset-2 font-medium text-ink"
                  >
                    Comparador de comissões oficial →
                  </a>
                </p>
                <p className="footnote">
                  Quando o BdP estabilizar um acesso público, este painel
                  passa a ter os números aqui. Até lá: nenhum número
                  inventado.
                </p>
              </div>
              <Source
                nome="Banco de Portugal, Portal do Cliente Bancário"
                url="https://clientebancario.bportugal.pt/pt-pt/aplicacao/comparador-de-comissoes"
              />
            </div>
          </>
        }
        confirma={
          <>
            <PaginaDetalhe rotulo="Euribor — as quatro médias mensais">
              {temEuribor ? (
                <>
                  <LineChart
                    series={(Object.keys(euribor) as (keyof typeof euribor)[]).map((k, i) => ({
                      name: `Euribor ${k}`,
                      // família ordinal: rampa seq — prazo mais curto, mais tinta
                      cor: `var(--seq-${i + 1})`,
                      data: euribor[k]!.series.map((p) => [p.t + "-01", p.v] as [string, number]),
                    }))}
                    unidade="%"
                    eventos={eventos.eventos.filter((e) => e.alvo === "euribor")}
                    estado={
                      (Object.keys(euribor) as (keyof typeof euribor)[]).some(
                        (k) => estadoDe(fresh, `euribor-${k.toLowerCase()}-mensal`) === "atrasada"
                      )
                        ? "atrasada"
                        : "em-dia"
                    }
                  />
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line">
                    {(Object.keys(euribor) as (keyof typeof euribor)[]).map((k) => {
                      const p = ultimo(euribor[k]);
                      const est = estadoDe(fresh, `euribor-${k.toLowerCase()}-mensal`);
                      return (
                        <Instrumento
                          key={k}
                          className="bg-panel px-4 py-3"
                          rotulo={k}
                          estado={est}
                          valor={p ? comUnidade(fmtNum(p.v, 2), "%") : "—"}
                          meta={
                            <>
                              <Delta
                                value={euribor[k] ? variacao(euribor[k]!, 1) : null}
                                casas={2}
                              />
                              <span className="ml-1">no mês</span>
                            </>
                          }
                        />
                      );
                    })}
                  </div>
                </>
              ) : (
                <EstadoVazio
                  compacto
                  titulo="as séries da Euribor"
                  falha={m.estados.serieFalhou}
                  fonte={{
                    nome: "Banco de Portugal — BPstat",
                    url: "https://bpstat.bportugal.pt",
                  }}
                />
              )}
              <Source
                nome="Banco de Portugal, BPstat"
                url={euribor["3M"]?.meta.url}
                serieAte={euribor["3M"]?.meta.serieAte}
                recolhidoEm={euribor["3M"]?.meta.recolhidoEm}
              />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo={`Crédito ao consumo — mercado vs teto ${fmtTrim(vigente.trimestre)}`}>
              {/* mobile: a tabela transforma-se — um cartão por tipo de
                  crédito com o essencial (mercado, teto, margem);
                  desktop: a tabela */}
              <div className="md:hidden divide-y divide-line border border-line">
                {LINHAS_TAEG.map((l) => {
                  const s = loadFonte("bpstat", l.serie);
                  const p = ultimo(s);
                  const cap = (vigente.taegMaxima as Record<string, number>)[l.capKey];
                  return (
                    <div key={l.capKey} className="bg-panel px-4 py-3">
                      <p className="text-corpo-sm font-medium">{l.rotulo}</p>
                      <div className="mt-1.5 flex items-baseline justify-between gap-4">
                        <span className="num text-corpo-sm">
                          {p ? comUnidade(fmtNum(p.v, 1), "%") : "—"}
                          {p && (
                            <span className="block text-rotulo text-muted">{fmtData(p.t)}</span>
                          )}
                        </span>
                        <span className="num text-rotulo text-muted">
                          teto {comUnidade(fmtNum(cap, 1), "%")}
                        </span>
                      </div>
                      {p && cap ? (
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className="relative inline-block h-2 flex-1 bg-line"
                            role="img"
                            aria-label={`Mercado a ${fmtPct(p.v / cap, 0)} do teto legal`}
                          >
                            <span
                              className="absolute inset-y-0 left-0 bg-accent"
                              style={{ width: `${Math.min(100, (p.v / cap) * 100)}%` }}
                            />
                            <span className="absolute inset-y-0 right-0 w-px bg-ink" />
                          </span>
                          <span className="num text-rotulo text-muted">
                            {fmtNum(cap - p.v, 1)} pp p/ teto
                          </span>
                        </div>
                      ) : (
                        <p className="num mt-2 text-rotulo text-muted">—</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-corpo-sm">
                  <thead>
                    <tr className="text-left border-b-2 border-ink">
                      <th scope="col" className="py-2 pr-4 font-medium">Tipo de crédito</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">Mercado (média)</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">Teto {fmtTrim(vigente.trimestre)}</th>
                      {proximoTeto && <th scope="col" className="py-2 pr-4 font-medium text-right">Teto {fmtTrim(proximoTeto.trimestre)}</th>}
                      <th scope="col" className="py-2 font-medium text-right">Margem p/ teto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LINHAS_TAEG.map((l) => {
                      const s = loadFonte("bpstat", l.serie);
                      const p = ultimo(s);
                      const cap = (vigente.taegMaxima as Record<string, number>)[l.capKey];
                      const capProx = proximoTeto
                        ? (proximoTeto.taegMaxima as Record<string, number>)[l.capKey]
                        : null;
                      return (
                        <tr key={l.capKey} className="border-b border-line">
                          <td className="py-2 pr-4 text-ink2">{l.rotulo}</td>
                          <td className="py-2 pr-4 text-right num">
                            {p ? comUnidade(fmtNum(p.v, 1), "%") : "—"}
                            {p && <span className="block text-rotulo text-muted">{fmtData(p.t)}</span>}
                          </td>
                          <td className="py-2 pr-4 text-right num font-medium">{comUnidade(fmtNum(cap, 1), "%")}</td>
                          {proximoTeto && (
                            <td className="py-2 pr-4 text-right num text-ink2">{capProx !== null ? comUnidade(fmtNum(capProx, 1), "%") : "—"}</td>
                          )}
                          <td className="py-2">
                            {p && cap ? (
                              <div className="flex items-center justify-end gap-2">
                                <span
                                  className="relative inline-block h-2 w-20 bg-line"
                                  role="img"
                                  aria-label={`Mercado a ${fmtPct(p.v / cap, 0)} do teto legal`}
                                >
                                  <span
                                    className="absolute inset-y-0 left-0 bg-accent"
                                    style={{ width: `${Math.min(100, (p.v / cap) * 100)}%` }}
                                  />
                                  <span className="absolute inset-y-0 right-0 w-px bg-ink" />
                                </span>
                                <span className="num w-14 text-right text-rotulo text-muted">
                                  {fmtNum(cap - p.v, 1)} pp
                                </span>
                              </div>
                            ) : (
                              <span className="num text-rotulo text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="footnote mt-3">
                O teto é a TAEG média do trimestre anterior + 1/4 — por isso os
                dois números andam juntos. «Mercado» é a média dos novos
                contratos, não a melhor oferta. Ultrapassagens de crédito:
                TAN máxima {comUnidade(fmtNum(vigente.tanMaximaUltrapassagem, 1), "%")}.
              </p>
              <Source
                nome={`BPstat (médias praticadas) + ${usura.fonte}`}
                url={usura.fonteUrl}
                vigencia={usura.vigencia}
                serieAte={taegAte}
              />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="Certificados de Aforro — a taxa base da série F">
              {caBase ? (
                <div className="grid md:grid-cols-2 gap-px bg-line border border-line">
                  <div className="bg-panel px-5 py-5">
                    <p className="kicker">Oficial IGCP — {caBase.meta.vigenciaOficial}</p>
                    <p className="num-read mt-1">{fmtPct(caBase.meta.oficialPct / 100, 3)}</p>
                    <p className="footnote mt-2">
                      Média da Euribor 3M nos 10 dias úteis anteriores, limitada a 2,50&#8239;% — a que conta para os juros.
                    </p>
                  </div>
                  <div className="bg-panel px-5 py-5">
                    <p className="kicker">Indicativa — média mensal {caBase.meta.serieAte}</p>
                    <p className="num-read mt-1">
                      {fmtPct(caBase.series[caBase.series.length - 1].v / 100, 3)}
                    </p>
                    <p className="footnote mt-2">
                      Aproximação com a média mensal — a oficial usa só os últimos 10 dias úteis.
                    </p>
                  </div>
                </div>
              ) : (
                <EstadoVazio
                  compacto
                  titulo="a taxa base dos Certificados de Aforro"
                  falha={m.estados.serieFalhou}
                  fonte={{ nome: "IGCP", url: "https://www.igcp.pt" }}
                />
              )}
              <Source
                nome="IGCP + BPstat Euribor 3M"
                url={caBase?.meta.url}
                serieAte={caBase?.meta.serieAte}
                nota={
                  caBase
                    ? `oficial IGCP — ${fmtData(caBase.meta.vigenciaOficial)}`
                    : undefined
                }
              />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo={`Todos os prazos fiscais de ${ano}`}>
              {/* a lista completa — o passado esvazia-se (oco), o próximo
                  prazo vem marcado */}
              <ol className="border border-line divide-y divide-line">
                {prazos.map((p, idx) => {
                  const passou = p.mes < mesAtual;
                  const proximo =
                    !passou && (idx === 0 || prazos[idx - 1].mes < mesAtual);
                  return (
                    <li
                      key={p.id}
                      className={`flex gap-4 px-5 py-4 ${
                        passou ? "opacity-50" : proximo ? "bg-raised" : "bg-panel"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`mt-1 h-2.5 w-2.5 shrink-0 ${
                          passou
                            ? "border border-line2"
                            : proximo
                              ? "bg-accent"
                              : "bg-ink"
                        }`}
                      />
                      <span className="num text-rotulo text-muted w-16 shrink-0 pt-0.5 uppercase">
                        {fmtData(p.mes)}
                      </span>
                      <div>
                        <p className="font-medium text-corpo-sm">
                          {p.titulo}
                          {proximo && (
                            <span className="kicker-xs ml-2 text-accent">próximo</span>
                          )}
                        </p>
                        <p className="text-corpo-sm text-ink2 mt-0.5">{p.descricao}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="footnote mt-3">{calendario.nota}</p>
              <Source nome={calendario.fonte} url={calendario.fonteUrl} vigencia={calendario.vigencia} />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="API aberta, fontes e frescura por série">
              <div className="body-copy space-y-4">
                <p>
                  Todas as séries estão disponíveis como ficheiros JSON
                  estáticos — sem chave, sem registo:{" "}
                  <a
                    href="/api/index.json"
                    className="num underline decoration-line2 underline-offset-2"
                  >
                    /api/index.json
                  </a>{" "}
                  lista os endpoints (Euribor, IHPC, preços DGEG, TAEG,
                  frescura das fontes). Subscreve{" "}
                  <a href="/feed.xml" className="underline decoration-line2 underline-offset-2">
                    o RSS
                  </a>{" "}
                  para saberes quando uma regra muda. A metodologia completa
                  está em{" "}
                  <a href="/metodologia" className="underline decoration-line2 underline-offset-2">
                    /metodologia
                  </a>
                  .
                </p>
              </div>
              {fresh && (
                <>
                  <p className="footnote mt-4 mb-2">
                    Frescura verificada {fmtData(fresh.verificadoEm.slice(0, 10))} —
                    o quadro completo vive em /metodologia.
                  </p>
                  <ul className="divide-y divide-line border-y border-line">
                    {seriesPagina.map((s) => {
                      const f = fresh.series.find((x) => x.id === s.id);
                      const est = estadoDe(fresh, s.id);
                      return (
                        <li key={s.id} className="flex items-baseline gap-3 py-2">
                          <OrbeEstado estado={est} tamanho={14} />
                          <span className="text-corpo-sm text-ink2">{s.nome}</span>
                          <span className="num ml-auto text-rotulo text-muted">
                            {f ? `série até ${fmtData(f.serieAte)}` : "sem verificação"}
                            {est === "atrasada" && (
                              <span className="text-warn"> · atrasada</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </PaginaDetalhe>
          </>
        }
        seguinte={{
          href: "/aprender",
          rotulo: "O que querem dizer estes termos?",
        }}
      />
    </>
  );
}
