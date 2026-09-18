import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { JsonLd, dataset } from "@/lib/jsonld";
import { LineChart } from "@/components/LineChart";
import { Delta } from "@/components/Delta";
import { loadFonte, loadDerivado, variacao, type Serie } from "@/lib/data";
import { fmtData, fmtNum, fmtPct } from "@/lib/format";
import usura from "@data/fiscal/usura-2026.json";
import calendario from "@data/fiscal/calendario-2026.json";

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

/** Categorias de usura → série BPstat de TAEG média praticada. */
const LINHAS_TAEG: { rotulo: string; capKey: string; serie: string }[] = [
  { rotulo: "Crédito pessoal — educação, saúde, energia", capKey: "pessoal-educacao-saude-energia", serie: "taeg-pessoal-educacao-saude-energia-mensal" },
  { rotulo: "Crédito pessoal — outros fins", capKey: "pessoal-outros", serie: "taeg-pessoal-outros-mensal" },
  { rotulo: "Automóvel — locação financeira / ALD", capKey: "automovel-ald-novo", serie: "taeg-automovel-ald-mensal" },
  { rotulo: "Automóvel — novo", capKey: "automovel-novo", serie: "taeg-automovel-novo-mensal" },
  { rotulo: "Automóvel — usado", capKey: "automovel-usado", serie: "taeg-automovel-usado-mensal" },
  { rotulo: "Cartões, linhas e descobertos", capKey: "renovavel", serie: "taeg-renovavel-mensal" },
];

export default function DadosPage() {
  const euribor = {
    "1M": loadFonte("bpstat", "euribor-1m-mensal"),
    "3M": loadFonte("bpstat", "euribor-3m-mensal"),
    "6M": loadFonte("bpstat", "euribor-6m-mensal"),
    "12M": loadFonte("bpstat", "euribor-12m-mensal"),
  };
  const temEuribor = euribor["3M"] !== null;
  const caBase = loadDerivado<CaBase>("ca-base");
  const taegAte = loadFonte("bpstat", "taeg-pessoal-outros-mensal")?.meta.serieAte;

  const [qAtual, qProx] = usura.trimestres;
  const hoje = new Date().toISOString().slice(0, 10);
  const vigente = hoje <= qAtual.ate ? qAtual : qProx;
  const proximo = hoje <= qAtual.ate ? qProx : null;

  const prazos = [...calendario.prazos].sort((a, b) => a.mes.localeCompare(b.mes));

  // Dataset com proveniência real — data = fim de série mais recente
  const serieFim = [
    ...Object.values(euribor).map((s) => s?.meta.serieAte),
    taegAte,
    caBase?.meta.serieAte,
  ]
    .filter((d): d is string => !!d)
    .sort()
    .pop();

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
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
      <p className="kicker">Painéis</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Os números, direto da fonte
      </h1>
      <p className="lede mt-5">
        Tudo o que muda por decreto ou por mercado, num só sítio: taxas de juro,
        tetos legais e prazos fiscais — com a data e a fonte à vista. Os mesmos
        ficheiros estão abertos em{" "}
        <a
          href="/api/index.json"
          className="num underline decoration-line2 underline-offset-2"
        >
          /api/
        </a>
        .
      </p>

      <Figure
        n={1}
        title="Euribor — médias mensais (as das prestações)"
        source={
          <Source
            nome="Banco de Portugal, BPstat"
            url={euribor["3M"]?.meta.url}
            serieAte={euribor["3M"]?.meta.serieAte}
            recolhidoEm={euribor["3M"]?.meta.recolhidoEm}
          />
        }
      >
        {temEuribor ? (
          <>
            <LineChart
              series={(Object.keys(euribor) as (keyof typeof euribor)[]).map((k) => ({
                name: `Euribor ${k}`,
                data: euribor[k]!.series.map((p) => [p.t + "-01", p.v] as [string, number]),
              }))}
              unidade="%"
            />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line">
              {(Object.keys(euribor) as (keyof typeof euribor)[]).map((k) => {
                const p = ultimo(euribor[k]);
                return (
                  <div key={k} className="bg-panel px-4 py-3">
                    <p className="kicker">{k}</p>
                    <p className="num text-2xl mt-1">{p ? `${fmtNum(p.v, 2)} %` : "—"}</p>
                    <p className="text-xs text-muted mt-0.5">
                      <Delta value={euribor[k] ? variacao(euribor[k]!, 1) : null} casas={2} />
                      <span className="ml-1">no mês</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="footnote border border-line bg-panel px-5 py-10 text-center">
            — indisponível: corre <code className="num">npm run ingest:daily</code>
          </p>
        )}
      </Figure>

      <Figure
        n={2}
        title="Crédito ao consumo — o que o mercado cobra vs o teto legal"
        source={
          <Source
            nome={`BPstat (médias praticadas) + ${usura.fonte}`}
            vigencia={usura.vigencia}
            serieAte={taegAte}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4 font-medium">Tipo de crédito</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">Mercado (média)</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">Teto {vigente.trimestre}</th>
                {proximo && <th scope="col" className="py-2 pr-4 font-medium text-right">Teto {proximo.trimestre}</th>}
                <th scope="col" className="py-2 font-medium text-right">Margem p/ teto</th>
              </tr>
            </thead>
            <tbody>
              {LINHAS_TAEG.map((l) => {
                const s = loadFonte("bpstat", l.serie);
                const p = ultimo(s);
                const cap = (vigente.taegMaxima as Record<string, number>)[l.capKey];
                const capProx = proximo
                  ? (proximo.taegMaxima as Record<string, number>)[l.capKey]
                  : null;
                return (
                  <tr key={l.capKey} className="border-b border-line">
                    <td className="py-2 pr-4 text-ink2">{l.rotulo}</td>
                    <td className="py-2 pr-4 text-right num">
                      {p ? `${fmtNum(p.v, 1)} %` : "—"}
                      {p && <span className="block text-xs text-muted">{fmtData(p.t)}</span>}
                    </td>
                    <td className="py-2 pr-4 text-right num font-medium">{fmtNum(cap, 1)} %</td>
                    {proximo && (
                      <td className="py-2 pr-4 text-right num text-ink2">{capProx !== null ? `${fmtNum(capProx, 1)} %` : "—"}</td>
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
                          <span className="num w-14 text-right text-xs text-muted">
                            {fmtNum(cap - p.v, 1)} pp
                          </span>
                        </div>
                      ) : (
                        <span className="num text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="footnote mt-3">
          O teto é a TAEG média do trimestre anterior + 1/4 — por isso os dois
          números andam juntos. «Mercado» é a média dos novos contratos, não a
          melhor oferta. Ultrapassagens de crédito: TAN máxima{" "}
          {fmtNum(vigente.tanMaximaUltrapassagem, 1)} %.
        </p>
      </Figure>

      <Figure
        n={3}
        title="Taxa base dos Certificados de Aforro — Série F"
        source={
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
        }
      >
        {caBase ? (
          <div className="grid md:grid-cols-2 gap-px bg-line border border-line">
            <div className="bg-panel px-5 py-5">
              <p className="kicker">Oficial IGCP — {caBase.meta.vigenciaOficial}</p>
              <p className="num text-3xl mt-1">{fmtPct(caBase.meta.oficialPct / 100, 3)}</p>
              <p className="footnote mt-2">
                Média da Euribor 3M nos 10 dias úteis anteriores, limitada a 2,50 %.
              </p>
            </div>
            <div className="bg-panel px-5 py-5">
              <p className="kicker">Indicativa — média mensal {caBase.meta.serieAte}</p>
              <p className="num text-3xl mt-1">
                {fmtPct(caBase.series[caBase.series.length - 1].v / 100, 3)}
              </p>
              <p className="footnote mt-2">
                Aproximação com a média mensal — a oficial usa só os últimos 10 dias úteis.
              </p>
            </div>
          </div>
        ) : (
          <p className="footnote border border-line bg-panel px-5 py-10 text-center">
            — indisponível: corre <code className="num">npm run derive</code>
          </p>
        )}
      </Figure>

      <Figure
        n={4}
        title="Calendário fiscal 2026"
        source={<Source nome={calendario.fonte} vigencia={calendario.vigencia} />}
      >
        <ol className="border border-line divide-y divide-line">
          {prazos.map((p) => {
            const passou = p.mes < hoje.slice(0, 7);
            return (
              <li key={p.id} className={`flex gap-4 px-5 py-4 ${passou ? "opacity-50" : "bg-panel"}`}>
                <span className="num text-xs text-muted w-16 shrink-0 pt-1 uppercase">
                  {fmtData(p.mes)}
                </span>
                <div>
                  <p className="font-medium text-sm">{p.titulo}</p>
                  <p className="text-sm text-ink2 mt-0.5">{p.descricao}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="footnote mt-3">{calendario.nota}</p>
      </Figure>

      <Figure
        n={5}
        title="Comissões bancárias — o que ainda não conseguimos"
        source={
          <Source
            nome="Banco de Portugal, Portal do Cliente Bancário"
            url="https://clientebancario.bportugal.pt/pt-pt/aplicacao/comparador-de-comissoes"
          />
        }
      >
        <div className="border border-line bg-panel px-5 py-6 text-sm text-ink2 space-y-3">
          <p>
            O Banco de Portugal publica diariamente o comparador de comissões de
            ~200 instituições, mas só dentro da aplicação web — não há um
            ficheiro ou API pública estável que possamos recolher com
            confiança. Em vez de dados de segunda mão, apontamos para a fonte:
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
            Quando o BdP estabilizar um acesso público, este painel passa a ter
            os números aqui. Até lá: nenhum número inventado.
          </p>
        </div>
      </Figure>

      <section className="body-copy max-w-2xl py-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">API aberta</h2>
        <p>
          Todas as séries estão disponíveis como ficheiros JSON estáticos —
          sem chave, sem registo:{" "}
          <code className="num">/api/index.json</code> lista os endpoints
          (Euribor, IHPC, preços DGEG, TAEG, frescura das fontes). Subscreve{" "}
          <a href="/feed.xml" className="underline decoration-line2 underline-offset-2">
            o RSS
          </a>{" "}
          para saberes quando uma regra muda.
        </p>
      </section>
    </div>
  );
}
