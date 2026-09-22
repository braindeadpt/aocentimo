"use client";

import { Fragment, useMemo, useState } from "react";
import { simularSalario } from "@/lib/engines/irs";
import { TSU_ENTIDADE, TSU_TRABALHADOR } from "@/lib/engines/seg-social";
import { reciboMensal, FormaPagamentoSA } from "@/lib/engines/recibo";
import { SituacaoRetencao } from "@/lib/engines/retencao";
import { FitaTalao } from "@/components/FitaTalao";
import { TweenNum } from "@/components/TweenNum";
import { SITE_URL } from "@/lib/site";
import { useArmado } from "@/lib/useArmado";
import { Cascata } from "@/components/Cascata";
import { Regua } from "@/components/Regua";
import { fmtEUR, fmtNum, fmtPct, fmtData } from "@/lib/format";
import sa from "@data/fiscal/subsidio-alimentacao.json";
import irsJovem from "@data/fiscal/irs-jovem.json";

type Situacao = "solteiro" | "casado2" | "casado1";
const PARA_RETENCAO: Record<Situacao, SituacaoRetencao> = {
  solteiro: "naoCasado",
  casado2: "casadoDoisTitulares",
  casado1: "casadoUnicoTitular",
};

/** Fração do ano → "15 mai 2026" (dia da liberdade fiscal). */
function diaDoAno(fracao: number, ano: number): string {
  const d = new Date(Date.UTC(ano, 0, 1));
  d.setUTCDate(d.getUTCDate() + Math.round(fracao * 365));
  return fmtData(d.toISOString().slice(0, 10));
}

/** config da régua do bruto — strings e marcador chegam do servidor
    (client components não leem messages nem data) */
export interface ReguaSalario {
  rotulo: string;
  marcador: { valor: number; rotulo: string } | null;
  presets: { rotulo: string; valor: number }[];
  descricao?: string;
}

export function CalculadoraSalario({
  ano,
  regua,
}: {
  ano: number;
  regua: ReguaSalario;
}) {
  const [bruto, setBruto] = useState(1500);
  const [situacao, setSituacao] = useState<Situacao>("solteiro");
  const [conjuge, setConjuge] = useState(1500);
  const [dependentes, setDependentes] = useState(0);
  const [saPorDia, setSaPorDia] = useState(0);
  const [formaSA, setFormaSA] = useState<FormaPagamentoSA>("cartao");
  const [anoJovem, setAnoJovem] = useState(0);

  const recibo = useMemo(
    () =>
      reciboMensal({
        bruto,
        situacao: PARA_RETENCAO[situacao],
        dependentes,
        saPorDia,
        formaSA,
        anoIrsJovem: anoJovem,
        ano,
      }),
    [bruto, situacao, dependentes, saPorDia, formaSA, anoJovem, ano]
  );

  // Em "casado único titular" o cônjuge sem rendimentos conta para o
  // quociente conjugal (÷2) mas não tem dedução específica própria.
  const resultado = useMemo(() => {
    const brutos =
      situacao === "solteiro"
        ? [bruto]
        : situacao === "casado2"
          ? [bruto, conjuge]
          : [bruto, 0];
    return simularSalario(brutos, dependentes, ano);
  }, [bruto, conjuge, situacao, dependentes, ano]);

  const limiteSA = sa.isentoPorDia[formaSA];

  // reimpressão: dados novos = recibo novo — o <dl> remonta-se e cada
  // linha imprime escalonada (talao-linha + --linha); o contador repõe-se
  // a cada render para as linhas ficarem sequenciais mesmo quando a
  // linha do subsídio não existe
  const reciboKey = [
    recibo.bruto,
    recibo.saTotal,
    recibo.ss,
    recibo.retencao,
    recibo.liquido,
    recibo.custoEmpresa,
  ].join("-");
  const { ref: talaoRef, arm: talaoArm } = useArmado<HTMLDivElement>(reciboKey);
  let linha = -1;
  const prox = () => ++linha;

  // a outra metade da história — a fita liga o recibo ao custo total:
  // o talão mostra o que tu vês; a fita mostra o que a empresa paga
  const medidasFita = {
    custo: recibo.custoEmpresa,
    tsu: recibo.custoEmpresa - recibo.bruto - recibo.saTotal,
    irs: recibo.retencao,
    ss: recibo.ss,
    liquido: recibo.liquido,
    estado: recibo.custoEmpresa - recibo.liquido,
    taxaTsu: TSU_ENTIDADE,
    taxaSs: TSU_TRABALHADOR,
  };

  return (
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-10">
      {/* inputs */}
      <div className="space-y-5">
        {/* o bruto é uma régua física (V3 §5): o input range real cobre
            a pista — o id e o rótulo acessível não mudam */}
        <Regua
          id="bruto"
          rotulo={regua.rotulo}
          valor={bruto}
          onChange={setBruto}
          min={870}
          max={5000}
          passo={10}
          unidade=" €"
          formato={(v) => fmtNum(v, 0)}
          marcadorAgora={regua.marcador ?? undefined}
          presets={regua.presets}
          descricao={regua.descricao}
        />

        <div>
          <label className="kicker block mb-1.5" htmlFor="situacao">
            Situação
          </label>
          <select
            id="situacao"
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as Situacao)}
            className="field"
          >
            <option value="solteiro">Não casado(a)</option>
            <option value="casado2">Casado(a) — dois titulares</option>
            <option value="casado1">Casado(a) — único titular</option>
          </select>
        </div>

        {situacao === "casado2" && (
          <div>
            <label className="kicker block mb-1.5" htmlFor="conjuge">
              Bruto mensal do cônjuge
            </label>
            <input
              id="conjuge"
              type="number"
              min={0}
              step={50}
              value={conjuge}
              onChange={(e) => setConjuge(Number(e.target.value) || 0)}
              className="field"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="dep">
              Dependentes
            </label>
            <input
              id="dep"
              type="number"
              min={0}
              max={10}
              value={dependentes}
              onChange={(e) => setDependentes(Math.max(0, Number(e.target.value) || 0))}
              className="field"
            />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="jovem">
              IRS Jovem — ano
            </label>
            <select
              id="jovem"
              value={anoJovem}
              onChange={(e) => setAnoJovem(Number(e.target.value))}
              className="field"
            >
              <option value={0}>Não</option>
              {irsJovem.isencaoPorAno.map((p, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}.º ano — {fmtPct(p, 0)} isento
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="sa">
              Subs. alimentação (€/dia)
            </label>
            <input
              id="sa"
              type="number"
              min={0}
              step={0.5}
              value={saPorDia}
              onChange={(e) => setSaPorDia(Number(e.target.value) || 0)}
              className="field"
            />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="formasa">
              Pago em
            </label>
            <select
              id="formasa"
              value={formaSA}
              onChange={(e) => setFormaSA(e.target.value as FormaPagamentoSA)}
              className="field"
            >
              <option value="cartao">Cartão/vale</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
        </div>

        <p className="footnote">
          O recibo usa as <strong>tabelas de retenção reais de {ano}</strong>{" "}
          (Despacho 233-A/2026). O subs. de alimentação é isento até{" "}
          {fmtEUR(limiteSA)}/dia em {formaSA === "cartao" ? "cartão" : "dinheiro"} — o
          excedente tributa como salário. O ano usa os escalões do IRS com
          dedução específica e mínimo de existência.
        </p>
      </div>

      {/* output — a resposta primeiro: o líquido domina e transita;
          o talão é o artefacto que prova a conta — remonta-se e
          reimprime linha a linha a cada mudança, com o carimbo RETIDO
          a cair sobre cada linha cortada (M-11) */}
      <div>
        <div className="border-b-2 border-ink pb-4">
          <p className="kicker-xs">Líquido no fim do mês</p>
          <p className="num-hero mt-1">
            <TweenNum
              valor={recibo.liquido}
              casas={2}
              texto={fmtEUR(recibo.liquido)}
              sufixo=" €"
            />
          </p>
          <p className="footnote mt-1">
            de {fmtEUR(recibo.bruto + recibo.saTotal)} brutos por mês — o
            recibo em baixo, o custo total na fita
          </p>
        </div>
        <div className="talao-wrap mt-6 self-start md:sticky md:top-6" ref={talaoRef}>
          <div className="talao">
            <span className="carimbo">simulação</span>
            <div className="talao-face px-6 pb-5 pt-7">
              <p className="talao-head text-center">
                Recibo de vencimento
              </p>
              <p className="talao-sub mt-1 text-center talao-dim">
                * * * simulado * * *
              </p>
              <dl className="talao-body mt-4">
                <Fragment key={reciboKey}>
                <div
                  className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-dim">SALÁRIO BRUTO</dt>
                  <dd>{fmtEUR(recibo.bruto)}</dd>
                </div>
                {recibo.saTotal > 0 && (
                  <div
                    className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">
                      SUBS. ALIMENTAÇÃO
                      {recibo.saTributavel > 0 && (
                        <span className="talao-note block">
                          {fmtEUR(recibo.saTributavel)} TRIBUTÁVEIS
                        </span>
                      )}
                    </dt>
                    <dd>{fmtEUR(recibo.saTotal)}</dd>
                  </div>
                )}
                <div
                  className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-dim">SEG. SOCIAL 11%</dt>
                  <dd>
                    {fmtEUR(recibo.ss)} −
                    <span className={"talao-retido " + talaoArm("talao-carimbo-anim")} aria-hidden>Retido</span>
                  </dd>
                </div>
                <div
                  className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-dim">
                    IRS RETIDO
                    <span className="talao-note block">
                      TAXA EFETIVA {fmtPct(recibo.taxaEfetiva)}
                      {anoJovem > 0 && ` · JOVEM ${anoJovem}.º ANO`}
                    </span>
                  </dt>
                  <dd>
                    {fmtEUR(recibo.retencao)} −
                    <span className={"talao-retido " + talaoArm("talao-carimbo-anim")} aria-hidden>Retido</span>
                  </dd>
                </div>
                <div
                  className={talaoArm("talao-linha") + " talao-cut mt-1 flex items-baseline justify-between gap-4 py-3"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-total">
                    Líquido no fim do mês
                  </dt>
                  <dd className="text-4xl font-bold">
                    {fmtEUR(recibo.liquido)}
                  </dd>
                </div>
                <div
                  className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-dim">CUSTO TOTAL P/ A EMPRESA</dt>
                  <dd className="talao-dim">{fmtEUR(recibo.custoEmpresa)}/mês</dd>
                </div>
                </Fragment>
              </dl>
              <div className="talao-barras mt-5" aria-hidden />
              <p className="talao-meta mt-2 flex justify-between talao-dim">
                <span>TABELA {recibo.tabela} · {ano}</span>
                <span>{new URL(SITE_URL).host.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <p className="footnote mt-6">
            A retenção é um adiantamento — o IRS certo acerta-se na liquidação
            anual. Subsídios de férias e de Natal retêm em separado.
          </p>
        </div>
      </div>

      {/* a cascata — explica-me o recibo */}
      <div className="md:col-span-2">
        <p className="kicker-sm mb-3">
          Explica-me o recibo — para onde vai o bruto
        </p>
        <Cascata
          passos={[
            {
              label: "Bruto + subsídios",
              valor: recibo.bruto + recibo.saTotal,
              tipo: "base",
            },
            { label: "Segurança Social", valor: -recibo.ss, tipo: "corte" },
            { label: "IRS retido", valor: -recibo.retencao, tipo: "corte" },
            { label: "Líquido", valor: recibo.liquido, tipo: "total" },
          ]}
        />
      </div>

      {/* o ano inteiro */}
      <div className="md:col-span-2 bg-raised border border-line shadow-raised" aria-live="polite">
        <div className="border-b border-line px-5 py-3 flex justify-between items-baseline">
          <span className="kicker">O ano inteiro, a 14 meses</span>
          <span className="num text-xs text-muted">estimativa IRS {ano}</span>
        </div>
        <dl className="px-5 py-4 text-sm">
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Salário bruto anual</dt>
            <dd className="num">{fmtEUR(resultado.brutoAnualTotal)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Segurança Social (11 %)</dt>
            <dd className="num text-up">{fmtEUR(resultado.ssAnual)} −</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">IRS {ano} (estimativa)</dt>
            <dd className="num text-up">{fmtEUR(resultado.irsAnual)} −</dd>
          </div>
          <div className="flex justify-between py-2.5 mt-1 border-t-2 border-ink">
            <dt className="font-medium">Líquido anual</dt>
            <dd className="num-read font-medium">{fmtEUR(resultado.liquidoAnual)}</dd>
          </div>
          <div className="flex justify-between py-1 text-ink2">
            <dt>Líquido por mês (14 meses)</dt>
            <dd className="num">{fmtEUR(resultado.liquidoMensal14)}</dd>
          </div>
          <div className="flex justify-between py-1 text-ink2">
            <dt>Líquido por mês (12 meses, duodécimos)</dt>
            <dd className="num">{fmtEUR(resultado.liquidoMensal12)}</dd>
          </div>
        </dl>

        <div className="border-t border-line px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="kicker">Taxa efetiva IRS</p>
            <p className="num-read mt-1">{fmtPct(resultado.taxaEfetiva)}</p>
          </div>
          <div>
            <p className="kicker">Taxa marginal</p>
            <p className="num-read mt-1">{fmtPct(resultado.taxaMarginal)}</p>
          </div>
          <div>
            <p className="kicker">Para o Estado, no total</p>
            <p className="num-read mt-1 text-up">{fmtPct(resultado.pesoEstado)}</p>
          </div>
          <div>
            <p className="kicker">Dia da liberdade fiscal</p>
            <p className="num-read mt-1">{diaDoAno(resultado.pesoEstado, ano)}</p>
          </div>
        </div>
        <p className="footnote px-5 pb-4">
          &ldquo;Para o Estado&rdquo; soma IRS, a tua SS (11 %) e a TSU da
          empresa (23,75 %) sobre o custo total. O <em>dia da liberdade
          fiscal</em> marca a data em que, se trabalhasses primeiro só para
          essa fatia, passavas a trabalhar para ti.
        </p>
      </div>

      {/* a outra metade da história — o recibo conta o que tu vês; a
          fita liga-o ao custo total que a empresa paga (M-11). A mesma
          história do EuroBar, no artefacto-assinatura, em variante
          compacta — aqui a fita é peça de apoio, não a hero da home */}
      <div className="md:col-span-2">
        <p className="kicker-sm mb-3">
          O que o recibo não mostra — o custo total para a empresa
        </p>
        <FitaTalao compacta medidas={medidasFita} />
      </div>
    </div>
  );
}
