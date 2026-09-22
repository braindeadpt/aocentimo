import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Leitura } from "@/components/Leitura";
import { DecomposicaoFuel } from "../impostos/DecomposicaoFuel";
import { Source } from "@/components/Source";
import { loadFonte, loadFreshness, type Serie } from "@/lib/data";
import { fmtData, fmtLitro, fmtNum, fmtPeriodo } from "@/lib/format";
import {
  anotacaoDe,
  estadoDe,
  rotulosLeitura,
  type Cartao,
} from "@/lib/leitura";
import { m, t } from "@/lib/messages";
import isp from "@data/fiscal/isp.json";
import iva from "@data/fiscal/iva.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Preços — combustíveis dia a dia",
  description:
    "Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG.",
  alternates: { canonical: "/precos", types: ALT_FEED },
};

const COMBUSTIVEIS: [
  string,
  { breadcrumb: string; titulo: string },
][] = [
  ["pmd-gasoleo-diario", m.leitura.combustiveis.gasoleo],
  ["pmd-gasolina95-diario", m.leitura.combustiveis.gasolina95],
  ["pmd-gpl-diario", m.leitura.combustiveis.gpl],
];

/** variação absoluta (€/L) entre o último ponto e o ponto com pelo
    menos `dias` dias de distância — em cêntimos multiplica-se por 100 */
function deltaDias(s: Serie, dias: number): number | null {
  const alvo = s.series[s.series.length - 1];
  const alvoMs = Date.parse(alvo.t);
  const anterior = [...s.series].reverse().find(
    (p) => alvoMs - Date.parse(p.t) >= dias * 86_400_000
  );
  return anterior ? alvo.v - anterior.v : null;
}

export default function PrecosPage() {
  const fresh = loadFreshness();
  const rotulos = rotulosLeitura();

  // cada combustível é uma leitura: ~6 meses de PMD diário, o insight
  // é a variação do último mês em cêntimos — a unidade que se sente
  const cartoes: Cartao[] = COMBUSTIVEIS.flatMap(([id, rot]) => {
    const s = loadFonte("dgeg", id);
    const serie = s ? s.series.slice(-180) : [];
    const ult = serie[serie.length - 1];
    if (!s || !ult) return [];
    const centimos = (deltaDias(s, 30) ?? 0) * 100;
    return [
      {
        breadcrumb: rot.breadcrumb,
        titulo: rot.titulo,
        insight:
          Math.abs(centimos) < 0.5
            ? m.painel.insightCombustivelZero
            : t(m.painel.insightCombustivel, {
                sinal: centimos >= 0 ? "+" : "−",
                v: fmtNum(Math.abs(centimos), 1),
              }),
        valor: ult.v,
        unidade: "€/L",
        formato: "litro" as const,
        serie,
        anotacao: anotacaoDe(serie, "max", fmtLitro),
        leitura: fmtPeriodo(s.meta.serieAte),
        estado: estadoDe(fresh, id),
        fonteNome: s.meta.fonte,
        fonteUrl: s.meta.url,
        href: "/precos",
        hrefJson: `/api/${id}.json`,
      },
    ];
  });

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Decomposição do preço dos combustíveis",
          "/precos",
          "Decomposição do preço dos combustíveis em Portugal: ISP, taxa de carbono, IVA e margens — dados DGEG."
        )}
      />
      <p className="kicker">Preços oficiais, quase diários</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Quanto custa o litro hoje?
      </h1>
      <p className="lede mt-5">
        A gasolina e o gasóleo são os únicos bens essenciais em Portugal com
        preços oficiais publicados quase diariamente — pela DGEG. É aqui que a
        variação diária e semanal faz sentido; para os outros bens, a inflação
        oficial é mensal (vê <a href="/inflacao" className="underline decoration-line2 underline-offset-2">Inflação</a>).
      </p>

      {/* um instrumento por combustível — o litro em €, meio ano de
          PMD e a variação do mês em cêntimos como insight */}
      {cartoes.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cartoes.map((cartao) => (
            <Leitura key={cartao.titulo} {...cartao} rotulos={rotulos} />
          ))}
        </div>
      ) : (
        <Figure
          title="Preço médio nacional, por litro"
          source="DGEG — preços médios diários"
        >
          <div className="border border-line bg-panel px-5 py-10 text-center">
            <p className="num-read text-muted">—</p>
            <p className="footnote mt-3 max-w-md mx-auto">
              Dados DGEG indisponíveis — corre{" "}
              <code className="num">npm run ingest:daily</code>. Nenhum número
              inventado: a honestidade é a regra nº 1 deste site.
            </p>
          </div>
        </Figure>
      )}

      <Figure
        title="Enquanto isso: quanto do litro é imposto?"
        source={
          <Source
            nome={isp.fonte}
            vigencia={isp.vigencia}
            nota={`IVA — ${iva.fonte} · vigente ${fmtData(iva.vigencia)}`}
          />
        }
      >
        <DecomposicaoFuel />
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
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
