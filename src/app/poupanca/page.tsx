import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Leitura } from "@/components/Leitura";
import { Source } from "@/components/Source";
import { ComparadorPoupanca } from "./ComparadorPoupanca";
import { CadernetaAforro } from "./CadernetaAforro";
import { SimuladorPpr } from "./SimuladorPpr";
import { SimuladorMaisValias } from "./SimuladorMaisValias";
import { loadDerivado } from "@/lib/data";
import { comUnidade, fmtData, fmtNum, fmtPct, fmtPeriodo } from "@/lib/format";
import {
  anotacaoDe,
  insightMediana,
  janela10,
  mediana,
  rotulosLeitura,
  type Cartao,
  type Ponto,
} from "@/lib/leitura";
import { m, t } from "@/lib/messages";
import ca from "@data/fiscal/ca.json";
import capitais from "@data/fiscal/capitais.json";
import ppr from "@data/fiscal/ppr.json";
import maisValias from "@data/fiscal/mais-valias.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Poupança — Certificados de Aforro, depósitos e inflação",
  description:
    "Como funcionam os Certificados de Aforro, a tributação de 28 % sobre juros, e porque a taxa que importa é a real, não a nominal.",
  alternates: { canonical: "/poupanca", types: ALT_FEED },
};

/** derivado ca-base: taxa base mensal dos CA Série F (IGCP oficial +
    Euribor 3M indicativa) — o meta é mais rico que uma fonte crua */
interface CaBase {
  meta: {
    fonte: string;
    url: string;
    serieAte: string;
    oficialPct?: number;
  };
  series: Ponto[];
}

export default function PoupancaPage() {
  const rotulos = rotulosLeitura();

  // ————— a taxa base dos Certificados como instrumento —————
  const caBase = loadDerivado<CaBase>("ca-base");
  const serieCa = caBase ? janela10(caBase.series) : [];
  const ultCa = serieCa[serieCa.length - 1];
  const medCa = mediana(serieCa.map((p) => p.v));
  const cap = caBase?.meta.oficialPct;
  const cartao: Cartao | null =
    caBase && ultCa
      ? {
          breadcrumb: m.leitura.certificados.breadcrumb,
          titulo: m.leitura.certificados.titulo,
          insight:
            cap !== undefined && ultCa.v >= cap
              ? t(m.leitura.certificados.cap, {
                  valor: `${comUnidade(fmtNum(cap, 2), "%")}`,
                })
              : insightMediana(
                  ultCa.v,
                  medCa !== null ? { valor: medCa } : null,
                  "%"
                ),
          valor: ultCa.v,
          unidade: "%",
          formato: "pct",
          serie: serieCa,
          referencia:
            medCa !== null
              ? { valor: medCa, rotulo: m.leitura.mediana10 }
              : undefined,
          anotacao: anotacaoDe(serieCa, "max", (v) => `${comUnidade(fmtNum(v, 1), "%")}`),
          leitura: fmtPeriodo(caBase.meta.serieAte),
          estado: "sem-sla",
          fonteNome: caBase.meta.fonte,
          fonteUrl: caBase.meta.url,
          href: "/poupanca",
          hrefJson: "/api/ca-base.json",
          amplo: true,
        }
      : null;

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Comparador de poupança — Portugal",
          "/poupanca",
          "Comparador de poupança em Portugal: Certificados de Aforro, depósitos, PPR e mais-valias — a taxa real, não só a nominal."
        )}
      />
      <h1 className="titulo-pagina">
        O que sobra do que poupas
      </h1>
      <p className="lede mt-5">
        Um depósito a 1,5 % com inflação a 3 % faz-te perder dinheiro — devagar
        e sem aviso. A taxa que interessa é a <strong>real</strong>: nominal
        menos imposto menos inflação.
      </p>

      {cartao && (
        <div className="mt-8">
          <Leitura {...cartao} rotulos={rotulos} />
        </div>
      )}

      <Figure
        title="Comparador de poupança"
        source={
          <Source
            nome="Cálculo próprio — taxas CA (IGCP) e retenção CIRS"
            vigencia={ca.vigencia}
            nota={`${capitais.fonte} · vigente ${fmtData(capitais.vigencia)}`}
          />
        }
      >
        <ComparadorPoupanca />
      </Figure>

      <Figure
        title="A caderneta — Certificados de Aforro, Série F"
        source={<Source nome={ca.fonte} vigencia={ca.vigencia} />}
      >
        <CadernetaAforro />
      </Figure>

      <Figure
        title="PPR — o benefício fiscal, dos dois lados"
        source={<Source nome={ppr.fonte} vigencia={ppr.vigencia} />}
      >
        <SimuladorPpr />
      </Figure>

      <Figure
        title="Mais-valias — o imposto sobre o ganho"
        source={<Source nome={maisValias.fonte} vigencia={maisValias.vigencia} />}
      >
        <SimuladorMaisValias />
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-display-sm text-ink">Três ideias que valem dinheiro</h2>
        <p>
          <strong>1.</strong> Os juros de depósitos e CA pagam{" "}
          {fmtPct(capitais.retencaoLiberatoria.taxa, 0)} de imposto
          logo à saída — a taxa anunciada pelo banco é sempre bruta.{" "}
          <strong>2.</strong> O dinheiro parado na conta à ordem rende 0 % e
          perde para a inflação todos os anos. <strong>3.</strong> Os CA têm
          capital garantido pelo Estado e seguem a Euribor 3M — quando as taxas
          descem, descem; o prémio de permanência compensa quem fica.
        </p>
      </section>
    </div>
  );
}
