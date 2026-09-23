import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Delta } from "@/components/Delta";
import { Leitura } from "@/components/Leitura";
import { Source } from "@/components/Source";
import { JsonLd, dataset } from "@/lib/jsonld";
import { PoderDeCompra } from "./PoderDeCompra";
import { SalarioReal } from "./SalarioReal";
import { loadSerie, variacao, loadFontes, loadFreshness, type Serie } from "@/lib/data";
import { comUnidade, fmtNum, fmtPeriodo } from "@/lib/format";
import {
  anotacaoDe,
  estadoDe,
  homologa,
  insightMediana,
  janela10,
  mediana,
  rotulosLeitura,
  type Cartao,
} from "@/lib/leitura";
import { m } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Inflação — quanto subiu o que compras",
  description:
    "IHPC em Portugal por categoria COICOP: alimentação, energia, habitação, transportes. Variação mensal e homóloga com dados Eurostat.",
  alternates: { canonical: "/inflacao", types: ALT_FEED },
};

const CATEGORIAS: [string, string][] = [
  ["CP00", "Índice geral"],
  ["CP01", "Alimentação e bebidas"],
  ["CP0111", "Pão e cereais"],
  ["CP0112", "Carne"],
  ["CP0113", "Peixe"],
  ["CP0114", "Leite, queijo e ovos"],
  ["CP0115", "Óleos e gorduras"],
  ["CP0116", "Fruta"],
  ["CP0117", "Legumes"],
  ["CP02", "Álcool e tabaco"],
  ["CP04", "Habitação, água e energia"],
  ["CP045", "Eletricidade e gás"],
  ["CP07", "Transportes"],
  ["CP0722", "Combustíveis"],
  ["CP11", "Restaurantes e hotéis"],
  ["NRG", "Energia (agregado)"],
];

function ultimoValor(s: Serie | null) {
  return s ? s.series[s.series.length - 1].v : null;
}

/** Ano-base do índice, derivado de meta.unidade ("Índice 2025=100" → "2025"). */
function anoBase(s: Serie | null): string | null {
  const m = s?.meta.unidade.match(/(\d{4})\s*=\s*100/);
  return m ? m[1] : null;
}

export default function InflacaoPage() {
  const cp00 = loadSerie("CP00");
  const fonte = loadFontes().find((f) => f.id === "hicp-pt-cp00");
  const fresh = loadFreshness();
  const rotulos = rotulosLeitura();

  const linhas = CATEGORIAS.map(([cod, nome]) => ({
    cod,
    nome,
    serie: loadSerie(cod),
  }));

  const temDados = cp00 !== null;
  const base = anoBase(cp00);
  const desde = cp00?.series[0]?.t.slice(0, 4) ?? "1996";

  // ————— a leitura-herói: taxa homóloga do índice geral, 10 anos,
  // com a mediana da própria série como referência constante —————
  const homCp00 = cp00 ? janela10(homologa(cp00.series, 12)) : [];
  const medCp00 = mediana(homCp00.map((p) => p.v));
  const ultCp00 = homCp00[homCp00.length - 1];
  const hero: Cartao | null =
    cp00 && ultCp00
      ? {
          breadcrumb: m.painel.cartoes.inflacao.breadcrumb,
          titulo: m.painel.cartoes.inflacao.titulo,
          insight: insightMediana(
            ultCp00.v,
            medCp00 !== null ? { valor: medCp00 } : null,
            "%"
          ),
          valor: ultCp00.v,
          unidade: "%",
          formato: "pct",
          serie: homCp00,
          referencia:
            medCp00 !== null
              ? { valor: medCp00, rotulo: m.leitura.mediana10 }
              : undefined,
          anotacao: anotacaoDe(homCp00, "max", (v) => `${comUnidade(fmtNum(v, 1), "%")}`),
          leitura: fmtPeriodo(cp00.meta.serieAte),
          estado: estadoDe(fresh, "hicp-pt-cp00"),
          fonteNome: cp00.meta.fonte,
          fonteUrl: cp00.meta.url,
          href: "/inflacao",
          hrefJson: "/api/hicp-pt-cp00.json",
          amplo: true,
        }
      : null;

  // ————— as divisões mais faladas, homólogas, na mesma régua —————
  const divisoes: [string, { breadcrumb: string; titulo: string }][] = [
    ["CP01", m.leitura.cabaz.alimentacao],
    ["CP045", m.leitura.cabaz.energiaCasa],
    ["CP11", m.leitura.cabaz.restaurantes],
  ];
  const cartoesDiv: Cartao[] = divisoes.flatMap(([cod, rot]) => {
    const s = loadSerie(cod);
    const hom = s ? janela10(homologa(s.series, 12)) : [];
    const ult = hom[hom.length - 1];
    if (!s || !ult) return [];
    const med = mediana(hom.map((p) => p.v));
    return [
      {
        breadcrumb: rot.breadcrumb,
        titulo: rot.titulo,
        insight: insightMediana(
          ult.v,
          med !== null ? { valor: med } : null,
          "%"
        ),
        valor: ult.v,
        unidade: "%",
        formato: "pct1" as const,
        serie: hom,
        referencia:
          med !== null
            ? { valor: med, rotulo: m.leitura.mediana10 }
            : undefined,
        anotacao: anotacaoDe(hom, "max", (v) => `${comUnidade(fmtNum(v, 1), "%")}`),
        leitura: fmtPeriodo(s.meta.serieAte),
        estado: estadoDe(fresh, `hicp-pt-${cod.toLowerCase()}`),
        fonteNome: s.meta.fonte,
        fonteUrl: s.meta.url,
        href: "/inflacao",
        hrefJson: `/api/hicp-pt-${cod.toLowerCase()}.json`,
      },
    ];
  });

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      {cp00 && (
        <JsonLd
          data={dataset({
            nome: "IHPC — Portugal, por categoria COICOP 2018",
            descricao:
              "Índice harmonizado de preços no consumidor para Portugal, por categoria COICOP 2018 — série mensal Eurostat (prc_hicp_minr).",
            fontes: [{ nome: "Eurostat", url: fonte?.url }],
            atualizadoEm: cp00.meta.serieAte,
            licenca:
              "https://ec.europa.eu/eurostat/about/policies/copyright",
            cobertura: `${cp00.series[0]?.t}/${cp00.meta.serieAte}`,
          })}
        />
      )}
      <p className="kicker">Preços no consumidor</p>
      <h1 className="titulo-pagina">
        Quanto subiu o que compras
      </h1>
      <p className="lede mt-5">
        O índice de preços no consumidor é a medida oficial da inflação. Não é
        o preço de um produto numa loja — é a média ponderada de um cabaz
        representativo. Mostramos o IHPC (Eurostat, comparável com a Zona
        Euro), por categoria, desde {desde}.
      </p>

      {/* a taxa homóloga como instrumento — herói amplo + divisões;
          a base do índice e a tabela por categoria ficam mais abaixo */}
      {hero ? (
        <div className="stack-fig">
          <Leitura {...hero} rotulos={rotulos} />
          {cartoesDiv.length > 0 && (
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {cartoesDiv.map((cartao) => (
                <Leitura
                  key={cartao.titulo}
                  {...cartao}
                  rotulos={rotulos}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Figure title="Índice de preços, Portugal" source="Eurostat, IHPC mensal">
          <div className="border border-line bg-panel px-5 py-10 text-center text-ink2">
            <p className="num-read">—</p>
            <p className="footnote mt-2">
              Dados ainda não carregados. Corre <code className="num">npm run ingest</code>{" "}
              para puxar as séries do Eurostat.
            </p>
          </div>
        </Figure>
      )}

      <Figure
        title="Variação por categoria"
        source={
          <Source
            nome="Eurostat, IHPC mensal"
            url={fonte?.url}
            serieAte={cp00?.meta.serieAte}
            recolhidoEm={fonte?.recolhidoEm}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-corpo-sm">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4 font-medium">Categoria</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">Índice</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">Mês anterior</th>
                <th scope="col" className="py-2 font-medium text-right">Homóloga (12 m)</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ cod, nome, serie }) => (
                <tr key={cod} className="border-b border-line">
                  <td className="py-2 pr-4 text-ink2">
                    {nome}
                    <span className="num text-rotulo text-muted ml-2">{cod}</span>
                  </td>
                  <td className="py-2 pr-4 text-right num">
                    {serie ? fmtNum(ultimoValor(serie)!, 2) : "—"}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <Delta value={serie ? variacao(serie, 1) : null} casas={1} />
                  </td>
                  <td className="py-2 text-right">
                    <Delta value={serie ? variacao(serie, 12) : null} casas={1} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote mt-3">
          ▲ a subir é mau para a carteira em preços; ▼ é bom.{" "}
          {base
            ? `Índice ${base}=100: um valor de 130 significa +30 % face a ${base}.`
            : `Índice ${cp00?.meta.unidade ?? "—"}: um valor de 130 significa +30 % face ao ano-base.`}
        </p>
      </Figure>

      <Figure
        title="A máquina do tempo do euro"
        source={
          <Source
            nome="IHPC total, Eurostat"
            url={fonte?.url}
            serieAte={cp00?.meta.serieAte}
          />
        }
      >
        {temDados ? (
          <PoderDeCompra serie={cp00!.series} />
        ) : (
          <p className="footnote">Indisponível sem dados.</p>
        )}
      </Figure>

      <Figure
        title="O teu salário em termos reais"
        source={
          <Source
            nome="IHPC total, Eurostat"
            url={fonte?.url}
            serieAte={cp00?.meta.serieAte}
          />
        }
      >
        {temDados ? (
          <SalarioReal serie={cp00!.series} />
        ) : (
          <p className="footnote">Indisponível sem dados.</p>
        )}
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-display-sm text-ink">Ler com honestidade</h2>
        <p>
          O IHPC mede um cabaz <em>médio</em>. O teu cabaz pessoal pode ter
          subido mais ou menos — depende do que compras. E índice não é preço:
          diz <em>quanto variou</em>, não quanto custa. Para preços em euros ao
          litro, vê <a href="/precos" className="underline decoration-line2 underline-offset-2">combustíveis</a> —
          a única família com dados diários oficiais em Portugal.
        </p>
      </section>
    </div>
  );
}
