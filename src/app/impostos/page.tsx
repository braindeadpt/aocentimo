import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { CalculadoraIva } from "./CalculadoraIva";
import { DecomposicaoFuel } from "./DecomposicaoFuel";
import { fmtPct } from "@/lib/format";
import iva from "@data/fiscal/iva.json";
import isp from "@data/fiscal/isp.json";

export const metadata: Metadata = {
  title: "Impostos — o imposto dentro do preço",
  description:
    "IVA por produto em Portugal e a decomposição do preço dos combustíveis: ISP, taxa de carbono e a cascata do IVA sobre impostos.",
};

export default function ImpostosPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Módulo 02</p>
      <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        O imposto dentro do preço
      </h1>
      <p className="lede mt-5">
        Quase tudo o que compras já traz imposto incluído. No pão são 6 %, num
        telemóvel 23 %, na gasolina mais de metade do litro é Estado.
      </p>

      <Figure n={1} title="As três taxas de IVA no continente" source={`${iva.fonte} · vigente ${iva.vigencia}`}>
        <div className="grid md:grid-cols-3 gap-4">
          {iva.taxas.map((t) => (
            <div key={t.nome} className="bg-surface border border-line px-5 py-4">
              <p className="kicker">{t.nome}</p>
              <p className="num text-3xl mt-1">{fmtPct(t.taxa, 0)}</p>
              <p className="footnote mt-2">{t.exemplos.join(", ")}</p>
            </div>
          ))}
        </div>
        {iva.notas.map((n, i) => (
          <p key={i} className="footnote mt-2">{n}</p>
        ))}
      </Figure>

      <Figure n={2} title="Quanto do preço é IVA?" source="Cálculo próprio sobre as taxas em vigor">
        <CalculadoraIva />
      </Figure>

      <Figure
        n={3}
        title="Um litro de combustível, desmontado"
        source={`${isp.fonte} · vigente ${isp.vigencia}`}
      >
        <DecomposicaoFuel />
      </Figure>

      <section className="max-w-2xl py-8 text-ink2 text-[0.95rem] leading-relaxed space-y-4">
        <h2 className="font-display text-2xl text-ink">A cascata que ninguém vê</h2>
        <p>
          No combustível acontece uma coisa peculiar: o IVA de 23 % incide sobre
          o preço <em>depois</em> de somar ISP e taxa de carbono. Ou seja,
          pagas 23 % de IVA sobre… imposto. Quando o preço do crude sobe, a
          receita de IVA sobe com ele — é por isso que o Governo às vezes
          devolve essa fatia extra através de um desconto no ISP.
        </p>
        <p>
          Na eletricidade há ainda a contribuição audiovisual (CAV, ~3 €/mês) e
          taxas de acesso à rede dentro da mesma fatura — impostos e taxas que
          aparecem disfarçados de consumo.
        </p>
      </section>
    </div>
  );
}
