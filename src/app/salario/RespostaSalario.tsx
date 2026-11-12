"use client";

import { useMemo } from "react";
import { Cartao } from "@/components/Cartao";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { fmtEUR, fmtNum } from "@/lib/format";
import { useSalario } from "./contexto";

/**
 * Nível 1 de /salario (3A-01 + T11): UM instrumento — o cartão com o
 * líquido canónico como número herói e a régua do bruto na zona de
 * medição — mais a frase simples (FraseSalario, renderizada pelo
 * <Pagina> dentro de .pg-frase).
 *
 * O herói é o `recibo.liquido` do cenário canónico (S1-02 §6): o
 * mesmo número que a home conta. No SSR sai o valor final — sem JS
 * a resposta está lá; com JS, a régua reescreve-o por TweenNum.
 */
export function RespostaSalario() {
  const s = useSalario();
  const smnAtual = s.smnRegioes[s.regiao];

  const pontosRegua = useMemo(() => {
    const base = s.cenarios.linhas.map((l) => l.bruto);
    if (base.includes(smnAtual)) return base;
    return [...base, smnAtual].sort((a, b) => a - b);
  }, [s.cenarios.linhas, smnAtual]);

  const rotuloMin =
    s.regiao === "acores"
      ? "mín. Açores"
      : s.regiao === "madeira"
        ? "mín. Madeira"
        : (s.regua.marcador?.rotulo ?? "mínimo");

  const presets = useMemo(
    () =>
      s.regua.presets.map((p, i) =>
        i === 0 ? { rotulo: rotuloMin, valor: smnAtual } : p
      ),
    [s.regua.presets, rotuloMin, smnAtual]
  );

  const brutoMes =
    s.recibo.bruto + (s.recibo.duodecimosBruto ?? 0) + s.recibo.saTotal;

  return (
    <Cartao
      icone="salario"
      breadcrumb={`O QUE GANHAS / ${s.tipoRendimento === "pensao" ? "PENSÃO CAT. H" : "SALÁRIO"} · MOTORES ${s.ano}`}
      controlos={
        <Regua
          id="bruto"
          rotulo={
            s.tipoRendimento === "pensao"
              ? "Pensão bruta mensal"
              : s.regua.rotulo
          }
          valor={s.bruto}
          onChange={s.setBruto}
          min={s.cenarios.meta.inicio}
          max={s.cenarios.meta.fim}
          passo={s.cenarios.meta.passo}
          pontos={pontosRegua}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
          marcadorAgora={
            s.regua.marcador
              ? { valor: smnAtual, rotulo: rotuloMin }
              : undefined
          }
          presets={presets}
          descricao={s.regua.descricao}
          limites={s.regua.limites}
        />
      }
    >
      <p className="leitura-insight">Líquido no fim do mês</p>
      <NumHero valor={fmtEUR(s.recibo.liquido)} animar={s.recibo.liquido} casas={2} />
      <p className="leitura-breadcrumb mt-1">
        de {fmtEUR(brutoMes)} brutos por mês — o recibo e a repartição estão em
        «2 · Explora»
      </p>
    </Cartao>
  );
}

/** a frase da resposta — reage à régua; inline (vive dentro de
    .pg-frase, que é um <p>: só elementos de texto) */
export function FraseSalario() {
  const s = useSalario();
  const porEuro =
    s.recibo.custoEmpresa > 0
      ? (s.recibo.liquido / s.recibo.custoEmpresa) * 100
      : 0;
  if (s.tipoRendimento === "pensao") {
    return (
      <>
        Da pensão bruta de{" "}
        <strong className="num">{fmtEUR(s.recibo.custoEmpresa)}</strong>{" "}
        chegam-te <strong className="num">{fmtEUR(s.recibo.liquido)}</strong> —{" "}
        {fmtNum(porEuro, 0)} cêntimos de cada euro (isenta dos 11 % de Segurança
        Social).
      </>
    );
  }
  return (
    <>
      Da tua empresa saem{" "}
      <strong className="num">{fmtEUR(s.recibo.custoEmpresa)}</strong>;
      chegam-te <strong className="num">{fmtEUR(s.recibo.liquido)}</strong> —{" "}
      {fmtNum(porEuro, 0)} cêntimos de cada euro.
    </>
  );
}
