import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
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
};

interface CaBase {
  meta: { oficialPct: number; vigenciaOficial: string; serieAte: string };
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

  const [qAtual, qProx] = usura.trimestres;
  const hoje = new Date().toISOString().slice(0, 10);
  const vigente = hoje <= qAtual.ate ? qAtual : qProx;
  const proximo = hoje <= qAtual.ate ? qProx : null;

  const prazos = [...calendario.prazos].sort((a, b) => a.mes.localeCompare(b.mes));

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Painéis</p>
      <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Os números, direto da fonte
      </h1>
      <p className="lede mt-5">
        Tudo o que muda por decreto ou por mercado, num só sítio: taxas de juro,
        tetos legais e prazos fiscais — com a data e a fonte à vista. Os mesmos
        ficheiros estão abertos em <code className="num">/api/</code>.
      </p>

      <Figure
        n={1}
        title="Euribor — médias mensais (as das prestações)"
        source={
          temEuribor
            ? `Banco de Portugal, BPstat · até ${fmtData(euribor["3M"]!.meta.serieAte)}`
            : "Banco de Portugal, BPstat"
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
                  <div key={k} className="bg-surface px-4 py-3">
                    <p className="kicker">{k}</p>
                    <p className="num text-2xl mt-1">{p ? `${fmtNum(p.v)} %` : "—"}</p>
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
          <p className="footnote border border-line bg-surface px-5 py-10 text-center">
            — indisponível: corre <code className="num">npm run ingest:daily</code>
          </p>
        )}
      </Figure>

      <Figure
        n={2}
        title="Crédito ao consumo — o que o mercado cobra vs o teto legal"
        source={`BPstat (médias praticadas) + ${usura.fonte}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th className="py-2 pr-4 font-medium">Tipo de crédito</th>
                <th className="py-2 pr-4 font-medium text-right">Mercado (média)</th>
                <th className="py-2 pr-4 font-medium text-right">Teto {vigente.trimestre}</th>
                {proximo && <th className="py-2 font-medium text-right">Teto {proximo.trimestre}</th>}
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
                      {p ? `${fmtNum(p.v)} %` : "—"}
                      {p && <span className="block text-xs text-muted">{fmtData(p.t)}</span>}
                    </td>
                    <td className="py-2 pr-4 text-right num font-medium">{fmtNum(cap)} %</td>
                    {proximo && (
                      <td className="py-2 text-right num text-ink2">{capProx !== null ? `${fmtNum(capProx)} %` : "—"}</td>
                    )}
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
          {fmtNum(vigente.tanMaximaUltrapassagem)} %.
        </p>
      </Figure>

      <Figure
        n={3}
        title="Taxa base dos Certificados de Aforro — Série F"
        source={caBase ? `IGCP (oficial ${caBase.meta.vigenciaOficial}) + BPstat Euribor 3M` : "IGCP"}
      >
        {caBase ? (
          <div className="grid md:grid-cols-2 gap-px bg-line border border-line">
            <div className="bg-surface px-5 py-5">
              <p className="kicker">Oficial IGCP — {caBase.meta.vigenciaOficial}</p>
              <p className="num text-3xl mt-1">{fmtPct(caBase.meta.oficialPct / 100, 3)}</p>
              <p className="footnote mt-2">
                Média da Euribor 3M nos 10 dias úteis anteriores, limitada a 2,50 %.
              </p>
            </div>
            <div className="bg-surface px-5 py-5">
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
          <p className="footnote border border-line bg-surface px-5 py-10 text-center">
            — indisponível: corre <code className="num">npm run derive</code>
          </p>
        )}
      </Figure>

      <Figure n={4} title="Calendário fiscal 2026" source={calendario.fonte}>
        <ol className="border border-line divide-y divide-line">
          {prazos.map((p) => {
            const passou = p.mes < hoje.slice(0, 7);
            return (
              <li key={p.id} className={`flex gap-4 px-5 py-4 ${passou ? "opacity-50" : "bg-surface"}`}>
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

      <Figure n={5} title="Comissões bancárias — o que ainda não conseguimos" source="Banco de Portugal, Portal do Cliente Bancário">
        <div className="border border-line bg-surface px-5 py-6 text-sm text-ink2 space-y-3">
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

      <section className="max-w-2xl py-8 text-ink2 text-[0.95rem] leading-relaxed space-y-4">
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
