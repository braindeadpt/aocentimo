import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { CalculadoraIva } from "./CalculadoraIva";
import { TalaoCompras } from "./TalaoCompras";
import { DecomposicaoFuel } from "./DecomposicaoFuel";
import { Source } from "@/components/Source";
import { fmtPct } from "@/lib/format";
import iva from "@data/fiscal/iva.json";
import isp from "@data/fiscal/isp.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Impostos — o imposto dentro do preço",
  description:
    "IVA por produto em Portugal e a decomposição do preço dos combustíveis: ISP, taxa de carbono e a cascata do IVA sobre impostos.",
  alternates: { canonical: "/impostos", types: ALT_FEED },
};

export default function ImpostosPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Impostos dentro do preço — Portugal",
          "/impostos",
          "O imposto dentro do preço: IVA por produto e decomposição do preço dos combustíveis (ISP, taxa de carbono, IVA sobre impostos)."
        )}
      />
      <h1 className="titulo-pagina">
        O imposto dentro do preço
      </h1>
      <p className="lede mt-5">
        Quase tudo o que compras já traz imposto incluído. No pão são 6 %, num
        telemóvel 23 %, na gasolina mais de metade do litro é Estado.
      </p>

      <Figure
        title="As três taxas de IVA no continente"
        source={<Source nome={iva.fonte} vigencia={iva.vigencia} />}
      >
        <div className="grid md:grid-cols-3 gap-4">
          {iva.taxas.map((t) => (
            <div key={t.nome} className="bg-panel border border-line px-5 py-4">
              <p className="kicker">{t.nome}</p>
              <p className="num-read mt-1">{fmtPct(t.taxa, 0)}</p>
              <p className="footnote mt-2">{t.exemplos.join(", ")}</p>
            </div>
          ))}
        </div>
        {iva.notas.map((n, i) => (
          <p key={i} className="footnote mt-2">{n}</p>
        ))}
      </Figure>

      <Figure
        title="Quanto do preço é IVA?"
        source={
          <Source
            nome="Cálculo próprio sobre as taxas de IVA"
            vigencia={iva.vigencia}
          />
        }
      >
        <CalculadoraIva />
      </Figure>

      <Figure
        title="Um talão de supermercado, lido por dentro"
        source={
          <Source
            nome="Cálculo próprio sobre as taxas de IVA"
            vigencia={iva.vigencia}
          />
        }
      >
        <TalaoCompras />
      </Figure>

      <Figure
        title="Um litro de combustível, desmontado"
        source={<Source nome={isp.fonte} vigencia={isp.vigencia} />}
      >
        <DecomposicaoFuel />
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-display-sm text-ink">A cascata que ninguém vê</h2>
        <p>
          No combustível acontece uma coisa peculiar: o IVA de 23 % incide sobre
          o preço <em>depois</em> de somar ISP e taxa de carbono. Ou seja,
          pagas 23 % de IVA sobre… imposto. Quando o preço do crude sobe, a
          receita de IVA sobe com ele — é por isso que o Governo às vezes
          devolve essa fatia extra através de um desconto no ISP.
        </p>
        <p>
          Na eletricidade há ainda a contribuição audiovisual (CAV, ~3 €/mês) e
          taxas de acesso à rede dentro da mesma fatura — impostos e taxas que
          aparecem disfarçados de consumo.
        </p>
      </section>
    </div>
  );
}
