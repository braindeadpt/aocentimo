import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Delta } from "@/components/Delta";
import { Linha } from "@/components/instrumentos/Linha";
import { Source } from "@/components/Source";
import { JsonLd, dataset } from "@/lib/jsonld";
import { PoderDeCompra } from "./PoderDeCompra";
import { SalarioReal } from "./SalarioReal";
import { loadSerie, variacao, loadFontes, loadFreshness, type Serie } from "@/lib/data";
import { fmtNum } from "@/lib/format";
import eventos from "@data/fiscal/eventos.json";

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
  const cp01 = loadSerie("CP01");
  const nrg = loadSerie("NRG");
  const fonte = loadFontes().find((f) => f.id === "hicp-pt-cp00");
  const fresh = loadFreshness();
  const ihpcAtrasada = ["hicp-pt-cp00", "hicp-pt-cp01", "hicp-pt-nrg"].some(
    (id) => fresh?.series.find((s) => s.id === id)?.estado === "atrasada"
  );

  const linhas = CATEGORIAS.map(([cod, nome]) => ({
    cod,
    nome,
    serie: loadSerie(cod),
  }));

  const temDados = cp00 !== null;
  const base = anoBase(cp00);
  const baseLabel = base ?? cp00?.meta.unidade ?? null;
  const desde = cp00?.series[0]?.t.slice(0, 4) ?? "1996";

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
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Quanto subiu o que compras
      </h1>
      <p className="lede mt-5">
        O índice de preços no consumidor é a medida oficial da inflação. Não é
        o preço de um produto numa loja — é a média ponderada de um cabaz
        representativo. Mostramos o IHPC (Eurostat, comparável com a Zona
        Euro), por categoria, desde {desde}.
      </p>

      <Figure
        title={`Índice de preços, Portugal${baseLabel ? ` (${baseLabel}${base ? " = 100" : ""})` : ""}`}
        source={
          fonte ? (
            <Source
              nome="Eurostat, IHPC mensal"
              url={fonte.url}
              serieAte={fonte.serieAte}
              recolhidoEm={fonte.recolhidoEm}
            />
          ) : (
            "Eurostat, IHPC mensal"
          )
        }
      >
        {temDados ? (
          <Linha
            series={[
              { id: "cp00", rotulo: "Índice geral", pontos: cp00!.series },
              { id: "cp01", rotulo: "Alimentação", pontos: (cp01 ?? cp00!).series },
              { id: "nrg", rotulo: "Energia", pontos: (nrg ?? cp00!).series },
            ]}
            unidade=""
            eventos={eventos.eventos.filter((e) => e.alvo === "ihpc")}
            estado={ihpcAtrasada ? "atrasada" : "em-dia"}
            equivalente="tabela"
            titulo="Índice de preços, Portugal"
          />
        ) : (
          <div className="border border-line bg-panel px-5 py-10 text-center text-ink2">
            <p className="num-read">—</p>
            <p className="footnote mt-2">
              Dados ainda não carregados. Corre <code className="num">npm run ingest</code>{" "}
              para puxar as séries do Eurostat.
            </p>
          </div>
        )}
      </Figure>

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
          <table className="w-full text-sm">
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
                    <span className="num text-xs text-muted ml-2">{cod}</span>
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
            ? `Índice ${base}=100: um valor de 130 significa +30 % face a ${base}.`
            : `Índice ${cp00?.meta.unidade ?? "—"}: um valor de 130 significa +30 % face ao ano-base.`}
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
        <h2 className="font-display text-2xl text-ink">Ler com honestidade</h2>
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
