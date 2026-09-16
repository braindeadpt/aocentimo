import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { Delta } from "@/components/Delta";
import { LineChart } from "@/components/LineChart";
import { DecomposicaoFuel } from "../impostos/DecomposicaoFuel";
import { loadFonte, type Serie } from "@/lib/data";
import { fmtData, fmtNum } from "@/lib/format";

export const metadata: Metadata = {
  title: "Preços — combustíveis dia a dia",
  description:
    "Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG.",
};

const COMBUSTIVEIS: [string, string][] = [
  ["pmd-gasoleo-diario", "Gasóleo simples"],
  ["pmd-gasolina95-diario", "Gasolina 95"],
  ["pmd-gpl-diario", "GPL auto"],
];

function varDias(s: Serie, dias: number): number | null {
  const alvo = s.series[s.series.length - 1];
  const alvoMs = Date.parse(alvo.t);
  // último ponto com pelo menos `dias` dias de distância
  const anterior = [...s.series].reverse().find(
    (p) => alvoMs - Date.parse(p.t) >= dias * 86_400_000
  );
  if (!anterior || anterior.v === 0) return null;
  return alvo.v / anterior.v - 1;
}

export default function PrecosPage() {
  const series = COMBUSTIVEIS.map(([id, nome]) => ({
    id,
    nome,
    serie: loadFonte("dgeg", id),
  }));
  const temDados = series.every((s) => s.serie !== null);
  const ultimo = series[0].serie?.meta.serieAte;
  // janela do gráfico: últimos 12 meses
  const corte = ultimo
    ? new Date(Date.parse(ultimo) - 366 * 86_400_000).toISOString().slice(0, 10)
    : null;

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Módulo 06</p>
      <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Combustíveis, dia a dia
      </h1>
      <p className="lede mt-5">
        A gasolina e o gasóleo são os únicos bens essenciais em Portugal com
        preços oficiais publicados quase diariamente — pela DGEG. É aqui que a
        variação diária e semanal faz sentido; para os outros bens, a inflação
        oficial é mensal (vê <a href="/inflacao" className="underline decoration-line2 underline-offset-2">Inflação</a>).
      </p>

      <Figure
        n={1}
        title="Preço médio nacional, por litro"
        source={ultimo ? `DGEG, preços médios diários · até ${fmtData(ultimo)}` : "DGEG, precoscombustiveis.dgeg.gov.pt"}
      >
        {temDados ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line mb-6">
              {series.map(({ id, nome, serie }) => {
                const p = serie!.series[serie!.series.length - 1];
                return (
                  <div key={id} className="bg-surface px-4 py-4">
                    <p className="kicker">{nome}</p>
                    <p className="num text-3xl mt-1">{fmtNum(p.v)} €</p>
                    <p className="text-xs text-muted mt-1 flex gap-3">
                      <span>sem <Delta value={varDias(serie!, 7)} casas={1} /></span>
                      <span>ano <Delta value={varDias(serie!, 365)} casas={1} /></span>
                    </p>
                  </div>
                );
              })}
            </div>
            <LineChart
              series={series.map(({ nome, serie }) => ({
                name: nome,
                data: serie!.series
                  .filter((p) => !corte || p.t >= corte!)
                  .map((p) => [p.t, p.v] as [string, number]),
              }))}
              unidade="€"
            />
          </>
        ) : (
          <div className="border border-line bg-surface px-5 py-10 text-center">
            <p className="num text-2xl text-muted">—</p>
            <p className="footnote mt-3 max-w-md mx-auto">
              Dados DGEG indisponíveis — corre{" "}
              <code className="num">npm run ingest:daily</code>. Nenhum número
              inventado: a honestidade é a regra nº 1 deste site.
            </p>
          </div>
        )}
      </Figure>

      <Figure n={2} title="Enquanto isso: quanto do litro é imposto?" source="Portaria ISP vigente + CIVA">
        <DecomposicaoFuel />
      </Figure>

      <section className="max-w-2xl py-8 text-ink2 text-[0.95rem] leading-relaxed space-y-4">
        <h2 className="font-display text-2xl text-ink">Porque não há preços de supermercado aqui</h2>
        <p>
          Não existe uma API oficial com o preço do leite ou do pão em cada
          loja, ao longo do tempo. O Estado publica índices (o que está na
          página de Inflação), não tickets de caixa. Preços por produto exigem
          crowdsourcing ou recolha própria — está no plano, com fonte e
          metodologia explícitas, nunca disfarçado de dado oficial.
        </p>
      </section>
    </div>
  );
}
