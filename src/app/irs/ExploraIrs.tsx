"use client";

import { Cartao } from "@/components/Cartao";
import { SimuladorAcerto } from "./SimuladorAcerto";
import { SimuladorIrsJovem } from "./SimuladorIrsJovem";

/**
 * Nível 2 de /irs (3A-02) — «Explora»: a nota de liquidação (o
 * acerto de contas, com o veredito como herói do documento) e o IRS
 * Jovem como barra de traços de dez anos. Dois instrumentos, duas
 * perguntas: «recebo ou pago?» e «quanto poupa o regime?».
 */
export function ExploraIrs({
  ano,
  ias,
  reguaJovem,
}: {
  ano: number;
  ias: number;
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
