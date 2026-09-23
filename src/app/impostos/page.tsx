import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { Cartao } from "@/components/Cartao";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Source } from "@/components/Source";
import { fmtData, fmtEUR, fmtLitro, fmtNum, fmtPct } from "@/lib/format";
import {
  decomporCombustivel,
  ivaContido,
  IVA_NORMAL,
} from "@/lib/engines/impostos";
import { loadFonte, loadFreshness } from "@/lib/data";
import { estadoDe, rotulosLeitura } from "@/lib/leitura";
import { m } from "@/lib/messages";
import iva from "@data/fiscal/iva.json";
import isp from "@data/fiscal/isp.json";
import { JsonLd, webApplication } from "@/lib/jsonld";
import { CABAZ } from "./cabaz";
import { CampoCabaz } from "./CampoCabaz";
import { LitroFuel, type LitroFuelItem } from "./LitroFuel";
import { TalaoCompras } from "./TalaoCompras";

export const metadata: Metadata = {
  title: "Impostos — o imposto dentro do preço",
  description:
    "IVA por produto em Portugal e a decomposição do preço dos combustíveis: ISP, taxa de carbono e a cascata do IVA sobre impostos.",
  alternates: { canonical: "/impostos", types: ALT_FEED },
};

/** os dois combustíveis com PMD DGEG + taxas ISP versionadas */
const FUELS: { id: "gasoleo" | "gasolina95"; pmd: string }[] = [
  { id: "gasoleo", pmd: "pmd-gasoleo-diario" },
  { id: "gasolina95", pmd: "pmd-gasolina95-diario" },
];

export default function ImpostosPage() {
  const fresh = loadFreshness();
  const rotulos = rotulosLeitura();

  /* ————— nível 1 — os cêntimos de IVA do cabaz de exemplo (o mesmo
     cabaz que o talão do nível 2 deixa editar) ————— */
  const totalCabaz = CABAZ.reduce((a, i) => a + i.preco, 0);
  const ivaCabaz = CABAZ.reduce(
    (a, i) => a + ivaContido(i.preco, i.taxa).iva,
    0
  );
  const centimosIva = (ivaCabaz / totalCabaz) * 100;

  /* ————— o litro — último PMD DGEG decomposto pelo motor fiscal ————— */
  const combustiveis: LitroFuelItem[] = FUELS.flatMap(({ id, pmd }) => {
    const s = loadFonte("dgeg", pmd);
    const ult = s?.series[s.series.length - 1];
    if (!s || !ult) return [];
    const f = isp[id];
    const dec = decomporCombustivel(ult.v, f.ispELitro, f.carbonoELitro);
    const estado = estadoDe(fresh, pmd);
    return [
      {
        id,
        rotulo: m.leitura.combustiveis[id].titulo,
        precoLitro: ult.v,
        leituraAte: fmtData(s.meta.serieAte),
        dec,
        estado,
        estadoRotulo: rotulos.estados[estado],
      },
    ];
  });
  const pmd = loadFonte("dgeg", "pmd-gasoleo-diario");

  return (
    <>
      <JsonLd
        data={webApplication(
          "Impostos dentro do preço — Portugal",
          "/impostos",
          "O imposto dentro do preço: IVA por produto e decomposição do preço dos combustíveis (ISP, taxa de carbono, IVA sobre impostos)."
        )}
      />
      <Pagina
      pergunta="Quanto do que compras é imposto?"
      rota="/impostos"
      kicker="Impostos — o imposto dentro do preço"
      resposta={{
        instrumento: (
          <CampoCabaz
            partes={[
              {
                id: "iva",
                rotulo: "IVA",
                valor: centimosIva,
                tom: "sai",
                detalhe: `${fmtEUR(ivaCabaz)} de ${fmtEUR(totalCabaz)}`,
              },
              {
                id: "sem-iva",
                rotulo: "o preço sem imposto",
                rotuloCurto: "sem IVA",
                valor: 100 - centimosIva,
                tom: "neutro",
              },
            ]}
            textos={{
              pausa: "Um euro são 100 cêntimos…",
              saiem: `Destes, ${fmtNum(centimosIva, 1)} saem em IVA`,
              pronto: `${fmtNum(centimosIva, 1)} cêntimos de cada euro vão para o Estado`,
            }}
            equivalente={`De cada euro deste cabaz de exemplo (${fmtEUR(
              totalCabaz
            )}): ${fmtNum(centimosIva, 1)} cêntimos são IVA e ${fmtNum(
              100 - centimosIva,
              1
            )} cêntimos são o preço sem imposto.`}
            breadcrumb="IMPOSTOS / CABAZ DE EXEMPLO · IVA"
            meta={[`total ${fmtEUR(totalCabaz)}`, "preços de exemplo"]}
            rotuloFonte={m.common.fonte}
            fonteNome={iva.fonte}
            fonteUrl={iva.fonteUrl}
          />
        ),
        frase: `De cada euro deste cabaz de exemplo, ${fmtNum(
          centimosIva,
          1
        )} cêntimos são IVA — o resto é o preço real das coisas.`,
      }}
      explora={
        <div className="stack-fig space-y-10">
          {/* o talão de papel — os preços do cabaz são editáveis e o IVA
              separa-se de cada linha para o cupão RESUMO IVA por taxa */}
          <Cartao
            breadcrumb="IMPOSTOS / O TALÃO · CABAZ DE EXEMPLO"
            icone="impostos"
            meta={["preços editáveis"]}
            fonte={{
              rotulo: m.common.fonte,
              itens: [{ nome: iva.fonte, url: iva.fonteUrl }],
            }}
          >
            <TalaoCompras scrubAria={m.chart.scrubAria} />
          </Cartao>

          {/* o litro em duas peças — estrutura (isométrico) e quantidade
              (cêntimos em montes) do mesmo litro ao PMD de hoje */}
          {combustiveis.length > 0 ? (
            <LitroFuel
              combustiveis={combustiveis}
              rotuloCombustivel="Combustível"
              rotuloFonte={m.common.fonte}
              fonteDgeg={{ nome: "DGEG — PMD", url: pmd?.meta.url }}
              fonteIsp={{ nome: isp.fonte, url: isp.fonteUrl }}
            />
          ) : (
            <EstadoVazio
              titulo="a série de preços dos combustíveis"
              falha={m.estados.serieFalhou}
              fonte={{
                nome: "DGEG",
                url: "https://precoscombustiveis.dgeg.gov.pt",
              }}
            />
          )}
        </div>
      }
      confirma={
        <>
          <PaginaDetalhe rotulo="As três taxas de IVA no continente">
            <div className="grid md:grid-cols-3 gap-4">
              {iva.taxas.map((t) => (
                <div
                  key={t.nome}
                  className="bg-panel border border-line px-5 py-4"
                >
                  <p className="kicker">{t.nome}</p>
                  <p className="num-read mt-1">{fmtPct(t.taxa, 0)}</p>
                  <p className="footnote mt-2">{t.exemplos.join(", ")}</p>
                </div>
              ))}
            </div>
            {iva.notas.map((n, i) => (
              <p key={i} className="footnote mt-2">
                {n}
              </p>
            ))}
            <Source
              nome={iva.fonte}
              url={iva.fonteUrl}
              vigencia={iva.vigencia}
              nota={iva.regiao}
            />
          </PaginaDetalhe>

          <PaginaDetalhe rotulo="As portarias do ISP e da taxa de carbono">
            <dl className="grid gap-4 sm:grid-cols-2">
              {FUELS.map(({ id }) => (
                <div key={id} className="bg-panel border border-line px-5 py-4">
                  <dt className="kicker">{m.leitura.combustiveis[id].titulo}</dt>
                  <dd className="num text-grande mt-1">
                    {fmtLitro(isp[id].ispELitro)}{" "}
                    <span className="text-rotulo text-muted">ISP</span>
                  </dd>
                  <dd className="num mt-1">
                    {fmtLitro(isp[id].carbonoELitro)}{" "}
                    <span className="text-rotulo text-muted">carbono</span>
                  </dd>
                  <dd className="footnote mt-2">{isp[id].nota}</dd>
                </div>
              ))}
            </dl>
            <p className="footnote mt-3">
              Por cima de ISP + carbono incide o IVA à taxa normal (
              {fmtPct(IVA_NORMAL, 0)}).
            </p>
            <Source
              nome={isp.fonte}
              url={isp.fonteUrl}
              vigencia={isp.vigencia}
              nota={isp.nota}
            />
          </PaginaDetalhe>

          <PaginaDetalhe rotulo="As fórmulas — e a cascata do imposto sobre imposto">
            <div className="body-copy space-y-4">
              <p>
                O IVA já vem dentro do preço que pagas. Para o separar:{" "}
                <code>iva = preço − preço ÷ (1 + taxa)</code>. A 23 %, um
                preço de 1,00 € contém 0,187 € de IVA — não 0,23 €, porque a
                taxa mede-se sobre o preço <em>sem</em> imposto.
              </p>
              <p>
                No combustível a conta corre em cascata:{" "}
                <code>preço com IVA = (produto + margens + carbono + ISP) ×
                1,23</code>
                . O IVA incide sobre o preço <em>depois</em> de somar ISP e
                taxa de carbono — pagas 23 % de IVA sobre… imposto. Quando o
                crude sobe, a receita de IVA sobe com ele; é por isso que o
                Governo às vezes devolve a fatia extra num desconto do ISP.
              </p>
              <p>
                Na eletricidade há ainda a contribuição audiovisual (CAV,
                ~3 €/mês) e taxas de acesso à rede dentro da mesma fatura —
                impostos e taxas disfarçados de consumo.
              </p>
            </div>
            <Source
              nome={`${iva.fonte} · ${isp.fonte}`}
              vigencia={isp.vigencia}
            />
          </PaginaDetalhe>
        </>
      }
      seguinte={{ href: "/precos", rotulo: "Quanto custa encher o depósito hoje?" }}
    />
    </>
  );
}
