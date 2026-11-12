"use client";

import { useMemo, useState } from "react";
import { Regua } from "@/components/Regua";
import { Valor } from "@/components/Valor";
import { simularTaeg } from "@/lib/engines/taeg";
import {
  FINO,
  comUnidade,
  fmtEUR,
  fmtEUR0,
  fmtNum,
} from "@/lib/format";
import { useCredito } from "./CreditoSim";

/* PROPOSTA (revisão do dono) */
export interface SimuladorTaegProps {
  /** Tecto legal anual da Conta de Serviços Mínimos Bancários (5,37 € em 2026) */
  smbTectoAnual: number;
  /** Ano de vigência do IAS (2026) */
  smbAno: number;
}

/**
 * Simulador TAN vs. TAEG e MTIC — Ouro Escondido #1.
 *
 * Mostra porque é que o spread mais baixo pode sair mais caro quando
 * o banco impõe seguros de vida/multirriscos mais caros ou comissões
 * de manutenção de conta elevadas.
 *
 * Consome o motor puro `simularTaeg()` (cálculo por bisseção) partilhando
 * o mesmo capital, prazo, Euribor e spread do <CreditoProvider>.
 */
export function SimuladorTaeg({
  smbTectoAnual,
  smbAno,
}: SimuladorTaegProps) {
  const { capital, anos, eurEf, spread } = useCredito();

  // Custos padrão de mercado em Portugal (estimativa indicativa)
  const [custosMensais, setCustosMensais] = useState(50);
  const [custosIniciais, setCustosIniciais] = useState(2500);

  const taxaEur = eurEf !== null ? eurEf / 100 : 0.03;
  const taxaSpread = spread / 100;
  const prazoMeses = anos * 12;

  const resultado = useMemo(() => {
    return simularTaeg(capital, prazoMeses, taxaEur, taxaSpread, {
      iniciais: custosIniciais,
      mensais: custosMensais,
    });
  }, [capital, prazoMeses, taxaEur, taxaSpread, custosIniciais, custosMensais]);

  const semCustos = useMemo(() => {
    return simularTaeg(capital, prazoMeses, taxaEur, taxaSpread, {
      iniciais: 0,
      mensais: 0,
    });
  }, [capital, prazoMeses, taxaEur, taxaSpread]);

  const difTaxa = (resultado.taeg - resultado.tan) * 100;
  const custosTotaisAdicionais = resultado.mtic - semCustos.mtic;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <p className="text-corpo-sm text-ink2">
          {/* PROPOSTA (revisão do dono) */}
          O spread é apenas a margem comercial do banco na TAN. O custo real
          do empréstimo inclui comissões iniciais (dossier, avaliação, imposto do
          selo e registos) e encargos mensais (seguro de vida, multirriscos e
          manutenção de conta). A TAEG junta todos estes custos; o MTIC revela
          o total que sai da tua conta.
        </p>

        <Regua
          id="taeg-mensais"
          rotulo="Custos mensais (seguros + comissão de conta)"
          valor={custosMensais}
          onChange={setCustosMensais}
          min={0}
          max={250}
          passo={5}
          unidade="€/mês"
          formato={(v) => fmtNum(v, 0)}
        />

        <Regua
          id="taeg-iniciais"
          rotulo="Custos iniciais (dossier, avaliação, registos, selo)"
          valor={custosIniciais}
          onChange={setCustosIniciais}
          min={0}
          max={10000}
          passo={100}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />

        {/* Dica oficial de Serviços Mínimos Bancários */}
        <div className="border border-line bg-panel p-4 text-corpo-sm text-ink2 space-y-2">
          <p className="font-medium text-ink">
            {/* PROPOSTA (revisão do dono) */}
            Poupar na conta: Serviços Mínimos Bancários
          </p>
          <p>
            {/* PROPOSTA (revisão do dono) */}
            A manutenção de conta à ordem associada ao crédito pode ser convertida
            em Serviços Mínimos Bancários: a lei fixa o tecto máximo de 1{FINO}% do
            IAS ({comUnidade(fmtNum(smbTectoAnual, 2), "€/ano")} em {smbAno}, ou cerca
            de {fmtEUR(smbTectoAnual / 12)}/mês), incluindo cartão de débito e transferências
            (DL n.º 27-C/2000).
          </p>
        </div>
      </div>

      {/* Painel de Resultados */}
      <div
        className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6"
        aria-live="polite"
      >
        <div className="border-b border-line px-5 py-3 flex items-baseline justify-between gap-3">
          <span className="kicker">Comparação TAN vs. TAEG</span>
          <span className="kicker-sm text-up">
            +{fmtNum(difTaxa, 2)}{FINO}p.p. com custos
          </span>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4 border-b border-line/60 pb-4">
            <div>
              <span className="kicker-sm block text-muted">TAN (taxa nominal)</span>
              <p className="font-display text-2xl font-bold text-ink tabular-nums mt-1">
                <Valor numero={fmtNum(resultado.tan * 100, 2)} unidade="%" />
              </p>
              <span className="text-rotulo text-ink2">Euribor + spread</span>
            </div>
            <div>
              <span className="kicker-sm block text-up">TAEG (custo real)</span>
              <p className="font-display text-2xl font-bold text-up tabular-nums mt-1">
                <Valor numero={fmtNum(resultado.taeg * 100, 2)} unidade="%" />
              </p>
              <span className="text-rotulo text-ink2">inclui todos os custos</span>
            </div>
          </div>

          <dl className="text-corpo-sm space-y-2.5">
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Prestação só empréstimo</dt>
              <dd className="num">{fmtEUR(resultado.prestacao)}/mês</dd>
            </div>
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Prestação com seguros e conta</dt>
              <dd className="num font-semibold text-up">
                {fmtEUR(resultado.prestacaoComCustos)}/mês
              </dd>
            </div>
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">MTIC total ({comUnidade(fmtNum(anos, 0), "anos")})</dt>
              <dd className="num font-bold text-ink">
                {fmtEUR0(resultado.mtic)}
              </dd>
            </div>
            <div className="flex justify-between pb-1">
              <dt className="text-ink2">Custos adicionais somam ao MTIC</dt>
              <dd className="num text-up font-medium">
                +{fmtEUR0(custosTotaisAdicionais)}
              </dd>
            </div>
          </dl>

          <p className="footnote border-t border-line/60 pt-3">
            {/* PROPOSTA (revisão do dono) */}
            Ao fim de {comUnidade(fmtNum(anos, 0), "anos")}, os custos adicionais somam{" "}
            <strong>{fmtEUR0(custosTotaisAdicionais)}</strong> ({fmtEUR0(custosIniciais)} iniciais +{" "}
            {fmtEUR0(custosMensais * prazoMeses)} em seguros e comissões). Um spread
            0,15{FINO}p.p. mais baixo num banco que exija seguros ou comissões mais caras
            de +30{FINO}€/mês ({fmtEUR0(30 * prazoMeses)} no prazo) sai mais caro na TAEG e no MTIC.
          </p>
        </div>
      </div>
    </div>
  );
}
