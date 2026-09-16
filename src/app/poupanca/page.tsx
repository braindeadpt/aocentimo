import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { ComparadorPoupanca } from "./ComparadorPoupanca";
import { fmtPct } from "@/lib/format";
import ca from "@data/fiscal/ca.json";

export const metadata: Metadata = {
  title: "Poupança — Certificados de Aforro, depósitos e inflação",
  description:
    "Como funcionam os Certificados de Aforro, a tributação de 28 % sobre juros, e porque a taxa que importa é a real, não a nominal.",
};

export default function PoupancaPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Módulo 05</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-2">
        Onde rende o que poupas
      </h1>
      <p className="lede mt-5">
        Um depósito a 1,5 % com inflação a 3 % faz-te perder dinheiro — devagar
        e sem aviso. A taxa que interessa é a <strong>real</strong>: nominal
        menos imposto menos inflação.
      </p>

      <Figure n={1} title="Comparador de poupança" source="Cálculo próprio · taxas IGCP e CIRS">
        <ComparadorPoupanca />
      </Figure>

      <Figure
        n={2}
        title="Certificados de Aforro, Série F"
        source={`${ca.fonte} · ${ca.vigencia}`}
      >
        <div className="bg-surface border border-line px-5 py-5 grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="kicker">Taxa bruta (novas subscrições)</p>
            <p className="num text-3xl mt-1">{fmtPct(ca.serieF.taxaBrutaNovasSubscricoes, 2)}</p>
            <p className="footnote mt-2">{ca.serieF.base}</p>
          </div>
          <div>
            <p className="kicker">Prémios de permanência</p>
            <ul className="mt-2 space-y-1 num text-ink2">
              {ca.serieF.premiosPermanencia.map((p) => (
                <li key={p.anos} className="flex justify-between border-b border-line/60 pb-1">
                  <span>{p.anos} ano</span>
                  <span>+{p.pp.toFixed(2).replace(".", ",")} p.p.</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="footnote mt-3">
          {ca.serieF.juros} · {ca.serieF.garantia} · Prazo {ca.serieF.prazo} ·
          Tributação: {fmtPct(ca.tributacaoCapitais.taxa, 0)} sobre os juros.
        </p>
      </Figure>

      <section className="max-w-2xl py-8 text-ink2 text-[0.95rem] leading-relaxed space-y-4">
        <h2 className="font-display text-2xl text-ink">Três ideias que valem dinheiro</h2>
        <p>
          <strong>1.</strong> Os juros de depósitos e CA pagam 28 % de imposto
          logo à saída — a taxa anunciada pelo banco é sempre bruta.{" "}
          <strong>2.</strong> O dinheiro parado na conta à ordem rende 0 % e
          perde para a inflação todos os anos. <strong>3.</strong> Os CA têm
          capital garantido pelo Estado e seguem a Euribor 3M — quando as taxas
          descem, descem; o prémio de permanência compensa quem fica.
        </p>
      </section>
    </div>
  );
}
