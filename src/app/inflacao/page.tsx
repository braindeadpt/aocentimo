import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { Cartao } from "@/components/Cartao";
import { Delta } from "@/components/Delta";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Haltere } from "@/components/Haltere";
import { LineChart } from "@/components/LineChart";
import { Source } from "@/components/Source";
import { JsonLd, dataset } from "@/lib/jsonld";
import { PoderDeCompra } from "./PoderDeCompra";
import { SalarioReal } from "./SalarioReal";
import {
  loadSerie,
  variacao,
  loadFontes,
  loadFreshness,
  type Serie,
} from "@/lib/data";
import { comUnidade, fmtNum, fmtPeriodo } from "@/lib/format";
import {
  estadoDe,
  homologa,
  janela10,
  rotulosLeitura,
} from "@/lib/leitura";
import { m } from "@/lib/messages";
import eventos from "@data/fiscal/eventos.json";

export const metadata: Metadata = {
  title: "Inflação — quanto mais caro está o que compras",
  description:
    "IHPC em Portugal por categoria ECOICOP: alimentação, energia, habitação, transportes. Variação homóloga mensal com dados Eurostat.",
  alternates: { canonical: "/inflacao", types: ALT_FEED },
};

/** as 12 divisões ECOICOP 2018 que a ingestão traz (CP01–CP12) —
    rótulo completo + curto para o haltere em coluna estreita */
const DIVISOES: [string, string, string][] = [
  ["CP01", "Alimentação e bebidas", "Alimentação"],
  ["CP02", "Álcool e tabaco", "Álcool e tabaco"],
  ["CP03", "Vestuário e calçado", "Vestuário"],
  ["CP04", "Habitação, água e energia", "Habitação"],
  ["CP05", "Mobiliário e artigos para o lar", "Mobiliário"],
  ["CP06", "Saúde", "Saúde"],
  ["CP07", "Transportes", "Transportes"],
  ["CP08", "Informação e comunicação", "Comunicações"],
  ["CP09", "Recreação, desporto e cultura", "Lazer e cultura"],
  ["CP10", "Serviços de educação", "Educação"],
  ["CP11", "Restaurantes e hotéis", "Restaurantes"],
  ["CP12", "Seguros e serviços financeiros", "Seguros"],
];

/** categorias da tabela do nível 3 — as 12 divisões + as
    subcategorias mais faladas e os agregados */
const CATEGORIAS: [string, string][] = [
  ["CP00", "Índice geral"],
  ...DIVISOES.map(([cod, nome]) => [cod, nome] as [string, string]),
  ["CP0111", "Pão e cereais"],
  ["CP0112", "Carne"],
  ["CP0113", "Peixe"],
  ["CP0114", "Leite, queijo e ovos"],
  ["CP0115", "Óleos e gorduras"],
  ["CP0116", "Fruta"],
  ["CP0117", "Legumes"],
  ["CP045", "Eletricidade e gás"],
  ["CP0722", "Combustíveis"],
  ["NRG", "Energia (agregado)"],
];

function ultimoValor(s: Serie | null) {
  return s ? s.series[s.series.length - 1].v : null;
}

/** Ano-base do índice, derivado de meta.unidade ("Índice 2025=100" → "2025"). */
function anoBase(s: Serie | null): string | null {
  const b = s?.meta.unidade.match(/(\d{4})\s*=\s*100/);
  return b ? b[1] : null;
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
  const estadoCp00 = estadoDe(fresh, "hicp-pt-cp00");

  // ————— nível 1 — a taxa homóloga numa frase; a máquina do tempo
  // (o euro a encolher) é o instrumento, com régua de anos —————
  const homCp00 = cp00 ? homologa(cp00.series, 12) : [];
  const ultCp00 = homCp00[homCp00.length - 1];
  const frase =
    ultCp00 === undefined
      ? "A taxa de inflação não chegou da fonte — vê a falha abaixo."
      : `Em ${fmtPeriodo(ultCp00.t)}, os preços estavam ${comUnidade(
          fmtNum(Math.abs(ultCp00.v), 1),
          "%"
        )} ${ultCp00.v >= 0 ? "mais caros" : "mais baratos"} do que um ano antes.`;

  // ————— nível 2 — o haltere das 12 divisões ECOICOP (há um ano ● ○
  // agora, taxa homóloga), ordenado pela maior subida; e a linha
  // anotada índice geral vs alimentação vs energia —————
  const haltere = DIVISOES.map(([cod, rotulo, rotuloCurto]) => {
    const s = loadSerie(cod);
    if (!s) return null;
    const hom = homologa(s.series, 12);
    const agora = hom[hom.length - 1];
    const antes = hom[hom.length - 13]; // a mesma taxa há um ano
    if (!agora || !antes) return null;
    return { id: cod, rotulo, rotuloCurto, antes: antes.v, agora: agora.v };
  })
    .filter((x) => x !== null)
    .sort((a, b) => b.agora - a.agora);

  const linhaSeries = (
    [
      ["CP00", "Índice geral"],
      ["CP01", "Alimentação"],
      ["NRG", "Energia"],
    ] as const
  )
    .map(([cod, name]) => {
      const s = loadSerie(cod);
      if (!s) return null;
      return {
        name,
        data: janela10(homologa(s.series, 12)).map(
          (p) => [p.t, p.v] as [string, number]
        ),
      };
    })
    .filter((x) => x !== null);

  return (
    <>
      {cp00 && (
        <JsonLd
          data={dataset({
            nome: "IHPC — Portugal, por categoria ECOICOP 2018",
            descricao:
              "Índice harmonizado de preços no consumidor para Portugal, por categoria ECOICOP 2018 — série mensal Eurostat (prc_hicp_minr).",
            fontes: [{ nome: "Eurostat", url: fonte?.url }],
            atualizadoEm: cp00.meta.serieAte,
            licenca:
              "https://ec.europa.eu/eurostat/about/policies/copyright",
            cobertura: `${cp00.series[0]?.t}/${cp00.meta.serieAte}`,
          })}
        />
      )}
      <Pagina
        pergunta="Quanto mais caro está o que compras?"
        rota="/inflacao"
        kicker="Inflação — preços no consumidor"
        resposta={{
          instrumento: temDados ? (
            <PoderDeCompra
              serie={cp00!.series}
              estado={estadoCp00}
              estadoRotulo={rotulos.estados[estadoCp00]}
              rotuloFonte={m.common.fonte}
              fonteNome={cp00!.meta.fonte}
              fonteUrl={cp00!.meta.url}
              leituraAte={fmtPeriodo(cp00!.meta.serieAte)}
            />
          ) : (
            <EstadoVazio
              titulo="o índice de preços (IHPC, Portugal)"
              falha={m.estados.serieFalhou}
              fonte={{
                nome: "Eurostat",
                url: fonte?.url ?? "https://ec.europa.eu/eurostat",
              }}
            />
          ),
          frase,
        }}
        explora={
          <div className="stack-fig space-y-10">
            {/* a figura principal — as 12 divisões ECOICOP, taxa homóloga
                de há um ano ● ○ de agora, ordenadas pela maior subida */}
            {haltere.length > 0 ? (
              <Cartao
                amplo
                breadcrumb="INFLAÇÃO / AS 12 DIVISÕES ECOICOP · EUROSTAT"
                icone="inflacao"
                meta={["taxa homóloga, %"]}
                estado={estadoCp00}
                estadoRotulo={rotulos.estados[estadoCp00]}
                fonte={{
                  rotulo: m.common.fonte,
                  itens: [{ nome: "Eurostat — IHPC mensal", url: fonte?.url }],
                }}
              >
                <Haltere
                  categorias={haltere}
                  formato="pct1"
                  rotuloAntes={
                    ultCp00
                      ? fmtPeriodo(
                          homCp00[homCp00.length - 13]?.t ?? ultCp00.t
                        )
                      : "há um ano"
                  }
                  rotuloAgora={
                    ultCp00 ? fmtPeriodo(ultCp00.t) : "agora"
                  }
                  bomSubir={false}
                />
                <p className="footnote mt-3">
                  Cada linha compara a taxa de inflação homóloga da divisão:
                  ● há um ano, ○ agora. Ordenadas da maior subida para a
                  menor — quem lidera o cabaz está em cima.
                </p>
              </Cartao>
            ) : (
              <EstadoVazio
                titulo="as divisões do cabaz"
                falha={m.estados.serieFalhou}
                fonte={{ nome: "Eurostat", url: fonte?.url }}
              />
            )}

            {/* a linha anotada — índice geral vs alimentação vs energia,
                taxa homóloga na janela de 10 anos; a faixa do IVA zero
                tem fonte e data em data/fiscal/eventos.json */}
            {linhaSeries.length > 0 ? (
              <Cartao
                amplo
                breadcrumb="INFLAÇÃO / GERAL · ALIMENTAÇÃO · ENERGIA · EUROSTAT"
                icone="inflacao"
                meta={["taxa homóloga, %"]}
                estado={estadoCp00}
                estadoRotulo={rotulos.estados[estadoCp00]}
                fonte={{
                  rotulo: m.common.fonte,
                  itens: [{ nome: "Eurostat — IHPC mensal", url: fonte?.url }],
                }}
                acoes={[
                  {
                    copiar: "/api/hicp-pt-cp00.json",
                    rotulo: rotulos.json,
                    ariaLabel: rotulos.jsonAria,
                  },
                ]}
              >
                <LineChart
                  series={linhaSeries}
                  unidade="%"
                  eventos={eventos.eventos.filter((e) => e.alvo === "ihpc")}
                  estado={estadoCp00}
                />
              </Cartao>
            ) : (
              <EstadoVazio
                compacto
                titulo="a série da inflação"
                falha={m.estados.serieFalhou}
                fonte={{ nome: "Eurostat", url: fonte?.url }}
              />
            )}
          </div>
        }
        confirma={
          <>
            <PaginaDetalhe rotulo="A tabela completa, por categoria">
              <div className="overflow-x-auto">
                <table className="w-full text-corpo-sm">
                  <thead>
                    <tr className="text-left border-b-2 border-ink">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Categoria
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Índice
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Mês anterior
                      </th>
                      <th scope="col" className="py-2 font-medium text-right">
                        Homóloga (12 m)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map(({ cod, nome, serie }) => (
                      <tr key={cod} className="border-b border-line">
                        <td className="py-2 pr-4 text-ink2">
                          {nome}
                          <span className="num text-rotulo text-muted ml-2">
                            {cod}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right num">
                          {serie ? fmtNum(ultimoValor(serie)!, 2) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <Delta
                            value={serie ? variacao(serie, 1) : null}
                            casas={1}
                          />
                        </td>
                        <td className="py-2 text-right">
                          <Delta
                            value={serie ? variacao(serie, 12) : null}
                            casas={1}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="footnote mt-3">
                ▲ a subir é mau para a carteira em preços; ▼ é bom.
              </p>
              <Source
                nome="Eurostat, IHPC mensal"
                url={fonte?.url}
                serieAte={cp00?.meta.serieAte}
                recolhidoEm={fonte?.recolhidoEm}
              />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo={`A base do índice — ${base ?? "…"}=100`}>
              <div className="body-copy space-y-4">
                <p>
                  O índice não é um preço — é uma posição relativa. O
                  Eurostat fixa a média de {base ?? "o ano-base"} em 100: um
                  índice de 130 significa que esse cabaz está{" "}
                  <strong>30 % mais caro</strong> do que em {base ?? "o ano-base"}.
                  A base vem do campo <code>unidade</code> da própria série (
                  {cp00?.meta.unidade ?? "—"}) — quando o Eurostat refizer a
                  base, o texto actualiza-se sozinho.
                </p>
              </div>
              <Source nome={cp00?.meta.fonte ?? "Eurostat"} url={fonte?.url} />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="IHPC ou IPC — qual é qual">
              <div className="body-copy space-y-4">
                <p>
                  Portugal tem dois índices oficiais. O <strong>IPC</strong> é
                  o índice nacional, calculado pelo INE — é o que entra nas
                  actualizações de rendas e em muitos contratos. O{" "}
                  <strong>IHPC</strong> é a versão harmonizada calculada para
                  todos os países da UE pelo mesmo método — é o que permite
                  comparar Portugal com a Zona Euro e o que alimenta as
                  decisões do BCE.
                </p>
                <p>
                  Cobrem cabaz ligeiramente diferentes (o IHPC não inclui o
                  custo de habitação própria, por exemplo) e por isso dão
                  números parecidos mas não iguais. Esta página usa o IHPC:
                  a série mensal Eurostat por categoria, comparável com a
                  Europa.
                </p>
              </div>
              <Source
                nome="Eurostat — prc_hicp_minr"
                url={fonte?.url}
                nota="O IPC nacional é publicado pelo INE."
              />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="O teu salário em termos reais">
              {temDados ? (
                <SalarioReal serie={cp00!.series} />
              ) : (
                <EstadoVazio
                  compacto
                  titulo="a série do IHPC"
                  falha={m.estados.serieFalhou}
                  fonte={{ nome: "Eurostat", url: fonte?.url }}
                />
              )}
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="Metodologia — e o que o índice não mede">
              <div className="body-copy space-y-4">
                <p>
                  A série é o IHPC mensal do Eurostat (
                  <code>prc_hicp_minr</code>, ECOICOP 2018, índice{" "}
                  {base ?? "2025"}=100) para Portugal, por divisão do cabaz.
                  A taxa homóloga compara cada mês com o mesmo mês do ano
                  anterior — é por isso que um mês muito caro há um ano pode
                  mostrar inflação baixa hoje mesmo sem preços a descer (o
                  «efeito de base»).
                </p>
                <p>
                  O IHPC mede um cabaz <em>médio</em>. O teu cabaz pessoal pode
                  ter subido mais ou menos — depende do que compras. E índice
                  não é preço: diz <em>quanto variou</em>, não quanto custa.
                  Para preços em euros ao litro, vê{" "}
                  <a
                    href="/precos"
                    className="underline decoration-line2 underline-offset-2"
                  >
                    combustíveis
                  </a>{" "}
                  — a única família com dados diários oficiais em Portugal.
                </p>
              </div>
              <Source
                nome="Eurostat, IHPC mensal"
                url={fonte?.url}
                serieAte={cp00?.meta.serieAte}
                recolhidoEm={fonte?.recolhidoEm}
              />
            </PaginaDetalhe>
          </>
        }
        seguinte={{
          href: "/credito",
          rotulo: "E o dinheiro emprestado, quanto custa?",
        }}
      />
    </>
  );
}
