"use client";

import { Cartao } from "@/components/Cartao";
import { fmtEUR0 } from "@/lib/format";
import type { ResultadoTitular } from "@/lib/engines/irs";
import { SimuladorAcerto } from "./SimuladorAcerto";
import { SimuladorIrsJovem } from "./SimuladorIrsJovem";

/**
 * Nível 2 de /irs (3A-02) — «Explora»: a nota de liquidação (o
 * acerto de contas, com o veredito como herói do documento) e o IRS
 * Jovem como barra de traços de dez anos. Dois instrumentos, duas
 * perguntas: «recebo ou pago?» e «quanto poupa o regime?».
 * 4B-02: o termo «rendimento coletável» vive aqui, com a conversão
 * bruto → coletável explicada em números reais do cenário canónico.
 */
export function ExploraIrs({
  ano,
  ias,
  exemploColetavel,
  reguaJovem,
}: {
  ano: number;
  ias: number;
  /** titular do cenário canónico — bruto, dedução específica,
      mínimo de existência e coletável calculados pelo motor no
      servidor */
  exemploColetavel: ResultadoTitular;
  reguaJovem: {
    min: number;
    max: number;
    passo: number;
    pontos: number[];
    inicial: number;
  };
}) {
  return (
    <div className="space-y-10">
      <Cartao
        breadcrumb={`O TEU IRS / RENDIMENTO COLETÁVEL · ${ano}`}
        fonte={{
          rotulo: "Fontes",
          itens: [
            { nome: "dedução específica — art. 25.º CIRS" },
            { nome: "mínimo de existência — art. 70.º CIRS" },
          ],
        }}
      >
        <p className="leitura-insight">
          Antes dos escalões, o fisco tira as deduções do teu bruto —
          o que sobra é o <strong>rendimento coletável</strong>, o
          número sobre o qual os escalões trabalham.
        </p>
        <div className="mt-4 space-y-1 border-t border-divider pt-3 font-mono text-sm">
          <p className="flex justify-between">
            <span className="text-ink2">Salário bruto anual</span>
            <span className="num">{fmtEUR0(exemploColetavel.brutoAnual)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-ink2">− Dedução específica</span>
            <span className="num">
              − {fmtEUR0(exemploColetavel.deducaoEspecifica)}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-ink2">− Mínimo de existência</span>
            <span className="num">
              − {fmtEUR0(exemploColetavel.abatimentoME)}
            </span>
          </p>
          <p className="flex justify-between border-t border-divider pt-1 font-semibold">
            <span>Rendimento coletável</span>
            <span className="num">{fmtEUR0(exemploColetavel.coletavel)}</span>
          </p>
        </div>
      </Cartao>

      <Cartao
        breadcrumb={`O TEU IRS / LIQUIDAÇÃO · ${ano}`}
        fonte={{
          rotulo: "Fontes",
          itens: [
            { nome: "deduções — art. 78.º e ss. CIRS" },
            { nome: "retenção estimada = recibo × 14 meses" },
          ],
        }}
      >
        <p className="leitura-insight">
          Retiveste o ano inteiro — em maio a conta acerta-se.
        </p>
        <div className="mt-4">
          <SimuladorAcerto ano={ano} />
        </div>
      </Cartao>

      <Cartao
        breadcrumb={`O TEU IRS / IRS JOVEM · ${ano}`}
        fonte={{
          rotulo: "Fonte",
          itens: [{ nome: "IRS Jovem — art. 12.º-B CIRS" }],
        }}
      >
        <p className="leitura-insight">
          Dez anos de isenção a escoar — cada ano vale menos que o
          anterior.
        </p>
        <div className="mt-4">
          <SimuladorIrsJovem ano={ano} ias={ias} regua={reguaJovem} />
        </div>
      </Cartao>
    </div>
  );
}
