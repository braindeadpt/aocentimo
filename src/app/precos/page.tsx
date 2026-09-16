import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { DecomposicaoFuel } from "../impostos/DecomposicaoFuel";

export const metadata: Metadata = {
  title: "Preços — combustíveis dia a dia",
  description:
    "Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG.",
};

export default function PrecosPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Módulo 06</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-2">
        Combustíveis, dia a dia
      </h1>
      <p className="lede mt-5">
        A gasolina e o gasóleo são os únicos bens essenciais em Portugal com
        preços oficiais publicados quase diariamente — pela DGEG. É aqui que a
        variação diária e semanal faz sentido; para os outros bens, a inflação
        oficial é mensal (vê <a href="/inflacao" className="underline decoration-line2 underline-offset-2">Inflação</a>).
      </p>

      <Figure n={1} title="Série diária de preços — em preparação" source="DGEG, precoscombustiveis.dgeg.gov.pt">
        <div className="border border-line bg-surface px-5 py-10 text-center">
          <p className="num text-2xl text-muted">—</p>
          <p className="footnote mt-3 max-w-md mx-auto">
            A ligação à API da DGEG entra na próxima iteração do pipeline
            (ingest diário). Até lá, nenhum número inventado — a honestidade é
            a regra nº 1 deste site.
          </p>
        </div>
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
