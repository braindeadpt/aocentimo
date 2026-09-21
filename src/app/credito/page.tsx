import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { SimuladorPrestacao } from "./SimuladorPrestacao";
import { loadFonte, loadFreshness } from "@/lib/data";
import { m } from "@/lib/messages";
import { JsonLd, webApplication } from "@/lib/jsonld";
import eventos from "@data/fiscal/eventos.json";
import painel from "@data/derived/painel.json";

const Linha = dynamic(() =>
  import("@/components/instrumentos/Linha").then((mo) => mo.Linha)
);
const Mostrador = dynamic(() =>
  import("@/components/instrumentos/Mostrador").then((mo) => mo.Mostrador)
);

export const metadata: Metadata = {
  title: "Crédito — Euribor, spread e prestação",
  description:
    "O que é a Euribor, como o spread forma a TAN, e simulador de prestação de crédito habitação com custo total do empréstimo.",
  alternates: { canonical: "/credito", types: ALT_FEED },
};

export default function CreditoPage() {
  const eur = loadFonte("bpstat", "euribor-3m-mensal");
  const ultimo = eur?.series.at(-1) ?? null;
  /* as quatro Euribor — a família inteira, não só o prazo do exemplo */
  const prazos = (["1m", "3m", "6m", "12m"] as const)
    .map((p) => ({ prazo: p, serie: loadFonte("bpstat", `euribor-${p}-mensal`) }))
    .filter((p) => p.serie !== null);
  const eur12 = loadFonte("bpstat", "euribor-12m-mensal");
  const ultimo12 = eur12?.series.at(-1) ?? null;
  const ref12 = (
    painel.series.find((s) => s.id === "euribor-12m-mensal") as
      | { referencia?: { valor: number; rotulo: string } }
      | undefined
  )?.referencia;
  const fresh = loadFreshness();
  const estado =
    fresh?.series.find((s) => s.id === "euribor-3m-mensal")?.estado ?? "sem-sla";

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Simulador de prestação de crédito habitação",
          "/credito",
          "Simulador de prestação de crédito habitação em Portugal: Euribor, spread, TAN e custo total do empréstimo."
        )}
      />
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        O que a tua prestação esconde
      </h1>
      <p className="lede mt-5">
        A Euribor é a taxa a que os bancos europeus se emprestam dinheiro entre
        si — e é o chão sobre o qual o teu banco constrói a tua prestação. A
        fórmula é simples: <strong>TAN = Euribor + spread</strong>. A Euribor
        não se negoceia; o spread, sim. E dentro de cada prestação esconde-se
        uma divisão — no início pagas sobretudo juro, no fim sobretudo capital.
      </p>

      <Figure
        title="Simulador de prestação"
        source={
          <Source
            nome="Cálculo próprio — sistema de amortização francês · Euribor 3M, BPstat"
            serieAte={ultimo?.t}
          />
        }
      >
        {/* D-02 — o mostrador da Euribor 12M ao lado do simulador:
            escala fixa 0–6 %, mediana 10 anos como referência */}
        <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
          <SimuladorPrestacao euriborAtual={ultimo?.v ?? null} euriborAte={ultimo?.t ?? null} />
          <aside className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="kicker-xs">{m.credito.euriborAgora}</p>
            {ultimo12 ? (
              <Mostrador
                valor={ultimo12.v}
                unidade="%"
                min={0}
                max={6}
                mediana={
                  ref12
                    ? { valor: ref12.valor, rotulo: ref12.rotulo }
                    : undefined
                }
                rotulo={m.credito.euriborAgora}
                t={ultimo12.t}
                compacto
              />
            ) : (
              <p className="footnote mt-2">Série indisponível.</p>
            )}
            <p className="footnote mt-1">{m.credito.euriborNota}</p>
            <Source
              nome="Banco de Portugal — BPstat"
              url={eur12?.meta.url}
              serieAte={ultimo12?.t}
            />
          </aside>
        </div>
      </Figure>

      <Figure
        title="As quatro Euribor desde 1994"
        source={
          <Source
            nome="Banco de Portugal — BPstat · Euribor 3M, média mensal"
            serieAte={ultimo?.t}
          />
        }
      >
        {prazos.length > 0 ? (
          <Linha
            chart={m.chart}
            series={prazos.map(({ prazo, serie }) => ({
              id: `euribor-${prazo}`,
              rotulo: `Euribor ${prazo.toUpperCase()}`,
              pontos: serie!.series,
              cor: prazo === "3m" ? "var(--ink)" : "var(--ink2)",
            }))}
            unidade="%"
            eventos={eventos.eventos.filter((e) => e.alvo === "euribor")}
            estado={estado}
            equivalente="tabela"
            titulo="As quatro Euribor desde 1994"
          />
        ) : (
          <p className="footnote">
            Série da Euribor indisponível — a recolha do BPstat falhou; sem
            dados oficiais não há gráfico.
          </p>
        )}
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">Os cinco termos que interessam</h2>
        <dl className="space-y-3">
          <div>
            <dt className="font-medium text-ink">Euribor</dt>
            <dd>
              Taxa interbancária europeia, calculada diariamente. O teu contrato
              usa um prazo (3, 6 ou 12 meses) — a cada revisão, a prestação
              reflete a média da Euribor desse prazo.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Spread</dt>
            <dd>
              A margem do banco, fixada no contrato. É a única parte
              negociável da TAN — e onde comparar propostas compensa.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">TAN</dt>
            <dd>Euribor + spread. A taxa que efetivamente gera os teus juros.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">TAEG</dt>
            <dd>
              TAN + seguros + comissões + custos de manutenção. É o custo real
              anual do crédito — compara sempre TAEG entre bancos.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">MTIC</dt>
            <dd>
              Montante total imputado ao consumidor: tudo o que pagas até ao
              fim. É o número que revela quanto a casa realmente custa.
            </dd>
          </div>
        </dl>
        <p>
          A Euribor média mensal chega aqui da API do Banco de Portugal
          (BPstat) — vem preenchida neste simulador e no de{" "}
          <a href="/casa" className="underline decoration-line2 underline-offset-2">comprar casa</a>.
          Acima, muda-a à vontade para sentir a
          sensibilidade da tua prestação.
        </p>
      </section>
    </div>
  );
}
