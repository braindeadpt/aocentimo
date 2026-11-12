"use client";

import { Fragment, type ReactNode } from "react";
import { AnelPontos, type PontoAnel } from "@/components/AnelPontos";
import { CampoCentimos, type ParteCentimos } from "@/components/CampoCentimos";
import { Cartao } from "@/components/Cartao";
import { Chip } from "@/components/Chip";
import { Interruptor } from "@/components/Interruptor";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import { ZeroInformativo } from "@/components/ZeroInformativo";
import type { RegiaoIrs } from "@/lib/engines/irs";
import type { ModoDuodecimos } from "@/lib/engines/recibo";
import { SITE_URL } from "@/lib/site";
import { useArmado } from "@/lib/useArmado";
import { comUnidade, fmtEUR, fmtEUR0, fmtNum, fmtPct } from "@/lib/format";
import {
  diaLiberdade,
  useSalario,
  type Situacao,
  type TipoRendimento,
} from "./contexto";

/**
 * Nível 2 de /salario (3A-01 + T11) — «Explora»: os controlos físicos, o
 * talão de vencimento (a melhor peça do site — fica), o custo total
 * como campo de cêntimos em montes (substitui a explosão isométrica,
 * que não era proporcional) e o dia da liberdade fiscal num anel de
 * 365 pontos — calculado, não ilustrado.
 */

/** Formata valor monetário preservando 3 casas decimais quando o diploma legal as fixa (ex.: 10,455 €). */
function fmtMoedaExata(v: number): string {
  const temTresCasas = Math.round(v * 1000) % 10 !== 0;
  return temTresCasas ? comUnidade(fmtNum(v, 3), "€") : fmtEUR(v);
}

/** Contador — o controlo físico de contagem baixa (dependentes, ano
    de gozo, €/dia): botões pílula −/+ ≥ 44×44 px à volta do valor em mono. */
function Contador({
  id,
  rotulo,
  valor,
  onChange,
  min,
  max,
  passo = 1,
  formato,
  nota,
}: {
  id: string;
  rotulo: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  passo?: number;
  formato: (v: number) => string;
  nota?: ReactNode;
}) {
  const casas = (String(passo).split(".")[1] ?? "").length;
  const move = (d: number) =>
    onChange(
      Math.min(max, Math.max(min, Number((valor + d * passo).toFixed(casas))))
    );
  const btn =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-controlo border border-line2 bg-panel font-mono text-corpo text-ink2 transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-ink2";
  return (
    <div role="group" aria-labelledby={`${id}-rot`}>
      <span id={`${id}-rot`} className="kicker mb-1.5 block">
        {rotulo}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => move(-1)}
          disabled={valor <= min}
          aria-label={`${rotulo} — menos`}
        >
          −
        </button>
        <span
          role="status"
          aria-live="polite"
          className="num min-w-20 text-center text-corpo"
        >
          {formato(valor)}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => move(1)}
          disabled={valor >= max}
          aria-label={`${rotulo} — mais`}
        >
          +
        </button>
      </div>
      {nota && <p className="footnote mt-1">{nota}</p>}
    </div>
  );
}

/** os controlos — físicos, não selects de browser: segmentado para o
    tipo de rendimento (Cat. A vs. Cat. H), região, duodécimos, situação
    e forma de pagamento; contadores e chips para subsídio de alimentação;
    interruptor para ADSE */
function ControlosSalario() {
  const s = useSalario();
  const ePensao = s.tipoRendimento === "pensao";
  const presetsSA = [
    { rotulo: comUnidade(fmtNum(0, 0), "€"), valor: 0 },
    { rotulo: comUnidade(fmtNum(6, 2), "€"), valor: 6 },
    {
      rotulo: `${comUnidade(fmtNum(s.saIsento.dinheiro, 2), "€")} (isento dinheiro)`,
      valor: s.saIsento.dinheiro,
    },
    { rotulo: comUnidade(fmtNum(10.2, 2), "€"), valor: 10.2 },
  ];

  const extraMesDuo =
    s.recibo.liquido - (s.recibo.liquidoSemDuodecimos ?? s.recibo.liquido);

  return (
    <div className="space-y-5">
      {/* PROPOSTA (revisão do dono) — Categoria A vs. Categoria H (Pensão de reforma) */}
      <div id="pensao" className="scroll-mt-24">
        <span className="kicker mb-1.5 block">Rendimento</span>
        <Segmentado
          rotulo="Tipo de rendimento"
          valor={s.tipoRendimento}
          onChange={(v) => s.setTipoRendimento(v as TipoRendimento)}
          opcoes={[
            { id: "trabalho", rotulo: "Trabalho (Cat. A)" },
            { id: "pensao", rotulo: "Pensão (Cat. H)" },
          ]}
        />
        {ePensao && (
          <p className="footnote mt-1.5">
            Uma pensão de {fmtEUR0(s.bruto)} está{" "}
            <strong>isenta dos 11 % de Segurança Social</strong> e retém IRS
            pelas <strong>Tabelas VIII e IX</strong> do Despacho n.º
            233-A/2026. Na liquidação anual (art. 53.º CIRS), a dedução
            específica é de {fmtEUR(s.pensaoDeducaoEspecifica)} (8,54×IAS).
          </p>
        )}
      </div>

      {/* PROPOSTA (revisão do dono) — Região Autónoma: Continente · Açores · Madeira */}
      <div>
        <span className="kicker mb-1.5 block">Região</span>
        <Segmentado
          rotulo="Região"
          valor={s.regiao}
          onChange={(v) => s.setRegiao(v as RegiaoIrs)}
          opcoes={[
            { id: "continente", rotulo: "Continente" },
            { id: "acores", rotulo: "Açores" },
            { id: "madeira", rotulo: "Madeira" },
          ]}
        />
        <p className="footnote mt-1.5">
          Salário mínimo regional em {s.ano}:{" "}
          <strong>{fmtEUR0(s.smnRegioes[s.regiao])}</strong>.{" "}
          {s.regiao === "acores" && (
            <>
              Nos <strong>Açores</strong> (art. 47.º do DLR n.º 15-A/2021/A), o
              IRS anual tem uma redução oficial de{" "}
              <strong>{fmtPct(s.acoresReducaoIrsPct, 0)}</strong> em todos os
              escalões do art. 68.º do CIRS (o recibo mensal mantém a tabela de
              referência do Despacho n.º 233-A/2026, exclusiva do Continente).
            </>
          )}
          {s.regiao === "madeira" && (
            <>
              Na <strong>Madeira</strong> o salário mínimo regional é de{" "}
              <strong>{fmtEUR0(s.smnRegioes.madeira)}</strong>. As taxas por
              escalão do DLR n.º 8/2025/M e os despachos regionais de retenção
              são próprios da Região Autónoma — por rigor (Regra n.º 1), o
              cálculo de IRS mantém a tabela nacional de referência sem
              extrapolar escalões não verificados.
            </>
          )}
        </p>
      </div>

      <div>
        <span className="kicker mb-1.5 block">Situação</span>
        <Segmentado
          rotulo="Situação"
          valor={s.situacao}
          onChange={(v) => s.setSituacao(v as Situacao)}
          opcoes={[
            { id: "solteiro", rotulo: "Não casado(a)" },
            { id: "casado2", rotulo: "Casado(a) · 2" },
            { id: "casado1", rotulo: "Casado(a) · 1" },
          ]}
        />
        <p className="footnote mt-1.5">
          «Casado(a) · 2» — dois titulares; «Casado(a) · 1» — único
          titular.
        </p>
      </div>

      {s.situacao === "casado2" && (
        <Regua
          id="conjuge"
          rotulo={
            ePensao ? "Pensão bruta mensal do cônjuge" : "Bruto mensal do cônjuge"
          }
          valor={s.conjuge}
          onChange={s.setConjuge}
          min={s.cenarios.meta.inicio}
          max={s.cenarios.meta.fim}
          passo={s.cenarios.meta.passo}
          pontos={s.cenarios.linhas.map((l) => l.bruto)}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />
      )}

      {/* PROPOSTA (revisão do dono) — Duodécimos (art. 99.º-C CIRS) */}
      <div>
        <span className="kicker mb-1.5 block">
          Subsídios de férias e de Natal
        </span>
        <Segmentado
          rotulo="Subsídios de férias e de Natal"
          valor={s.duodecimos}
          onChange={(v) => s.setDuodecimos(v as ModoDuodecimos)}
          opcoes={[
            { id: "14", rotulo: "14 meses" },
            { id: "50", rotulo: "Duod. 50 %" },
            { id: "100", rotulo: "Duod. 100 %" },
          ]}
        />
        <p className="footnote mt-1.5">
          {s.duodecimos === "14" ? (
            <>
              Em <strong>14 meses</strong> recebes o subsídio de férias e o de
              Natal por inteiro nos respetivos meses. Se passares para{" "}
              <strong>duodécimos</strong>, recebes mais todos os meses mas o{" "}
              <strong>líquido anual ({fmtEUR(s.resultado.liquidoAnual)})</strong>{" "}
              e o <strong>IRS anual ({fmtEUR(s.resultado.irsAnual)})</strong>{" "}
              são idênticos ao cêntimo.
            </>
          ) : (
            <>
              Com duodécimos a <strong>{s.duodecimos} %</strong> entram{" "}
              <strong>+{fmtEUR(extraMesDuo)}/mês</strong> líquidos na conta: as
              frações dos subsídios têm{" "}
              <strong>retenção autónoma (art. 99.º-C CIRS)</strong> — não somam
              ao base para subir o escalão do mês. Ao fim dos 14 meses, o{" "}
              <strong>líquido anual ({fmtEUR(s.resultado.liquidoAnual)})</strong>{" "}
              e o <strong>IRS anual ({fmtEUR(s.resultado.irsAnual)})</strong>{" "}
              são idênticos ao cêntimo!
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Contador
          id="dep"
          rotulo="Dependentes"
          valor={s.dependentes}
          onChange={s.setDependentes}
          min={0}
          max={10}
          formato={(v) => fmtNum(v, 0)}
        />
        {!ePensao && (
          <Contador
            id="jovem"
            rotulo="IRS Jovem"
            valor={s.anoJovem}
            onChange={s.setAnoJovem}
            min={0}
            max={s.irsJovemIsencao.length}
            formato={(v) => (v === 0 ? "Não" : `${v}.º ano`)}
            nota={
              s.anoJovem > 0
                ? `${fmtPct(s.irsJovemIsencao[s.anoJovem - 1], 0)} isento`
                : undefined
            }
          />
        )}
      </div>

      {/* PROPOSTA (revisão do dono) — Perfil Diana: Subsistema ADSE (3,5 % × 14 meses) */}
      <div>
        <Interruptor
          ligado={s.adse}
          onChange={s.setAdse}
          rotulo={`Subsistema ADSE (${fmtPct(s.adseRegras.taxaDesconto, 1)} — Função Pública)`}
          nota={
            ePensao
              ? `desconto facultativo nos 14 meses com limiar de salvaguarda em ${fmtEUR(s.adseRegras.limiarSalvaguardaPensoes)} (DL 118/83 art. 47.º)`
              : `acumula com os 11\u202F% de SS para trabalhadores em funções públicas admitidos desde 2006 (DL 118/83 art. 46.º)`
          }
          className="text-corpo-sm"
        />
      </div>

      {!ePensao && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Contador
              id="sa"
              rotulo="Subs. alimentação"
              valor={s.saPorDia}
              onChange={s.setSaPorDia}
              min={0}
              max={30}
              passo={0.05}
              formato={(v) => comUnidade(fmtNum(v, 2), "€/dia")}
            />
            <div>
              <span className="kicker mb-1.5 block">Subsídio pago em</span>
              <Segmentado
                rotulo="Subsídio pago em"
                valor={s.formaSA}
                onChange={(v) => s.setFormaSA(v as "cartao" | "dinheiro")}
                opcoes={
                  s.saPorDia > 0
                    ? [
                        { id: "cartao", rotulo: "Cartão/vale" },
                        { id: "dinheiro", rotulo: "Dinheiro" },
                      ]
                    : [
                        {
                          id: "cartao",
                          rotulo: "Cartão/vale",
                          desativado: true,
                          razao:
                            "sem subsídio de alimentação não há forma de pagamento",
                        },
                        {
                          id: "dinheiro",
                          rotulo: "Dinheiro",
                          desativado: true,
                          razao:
                            "sem subsídio de alimentação não há forma de pagamento",
                        },
                      ]
                }
              />
            </div>
          </div>

          {/* PROPOSTA (revisão do dono) — Chips de preset rápido para o subsídio de alimentação */}
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Valores de referência de subsídio de alimentação"
          >
            {presetsSA.map((p) => (
              <Chip
                key={p.valor}
                ativo={Math.abs(s.saPorDia - p.valor) < 0.005}
                onClick={() => {
                  s.setSaPorDia(p.valor);
                  if (
                    Math.abs(p.valor - s.saIsento.dinheiro) < 0.005 &&
                    s.formaSA !== "dinheiro"
                  ) {
                    s.setFormaSA("dinheiro");
                  }
                }}
              >
                {p.rotulo}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <p className="footnote">
        O recibo usa as <strong>tabelas de retenção reais de {s.ano}</strong>{" "}
        (Despacho 233-A/2026).{" "}
        {!ePensao && (
          <>
            O subs. de alimentação é isento até {fmtMoedaExata(s.limiteSA)}/dia
            em {s.formaSA === "cartao" ? "cartão" : "dinheiro"} — o excedente
            tributa como salário.{" "}
          </>
        )}
        O ano usa os escalões do IRS com dedução específica e mínimo de
        existência.
      </p>
    </div>
  );
}

/** o talão de vencimento — o artefacto que prova a conta. Remonta-se
    e reimprime linha a linha a cada mudança, com o carimbo RETIDO a
    cair sobre cada linha cortada (M-11); o IRS a zero ganha o zero
    informativo e o carimbo neutro «Não retido» (1B-05, 1D-02) */
function TalaoRecibo() {
  const s = useSalario();
  const recibo = s.recibo;
  const ePensao = s.tipoRendimento === "pensao";
  const duoBruto = recibo.duodecimosBruto ?? 0;
  const descAdse = recibo.adse ?? 0;

  const reciboKey = [
    s.tipoRendimento,
    s.duodecimos,
    s.adse,
    recibo.bruto,
    duoBruto,
    recibo.saTotal,
    recibo.ss,
    descAdse,
    recibo.retencao,
    recibo.liquido,
    recibo.custoEmpresa,
  ].join("-");
  const { ref: talaoRef, arm: talaoArm } =
    useArmado<HTMLDivElement>(reciboKey);
  let linha = -1;
  const prox = () => ++linha;

  return (
    <div>
      <div
        className="talao-wrap mt-6 self-start md:sticky md:top-6 md:mt-0"
        ref={talaoRef}
      >
        <div className="talao">
          <span className="carimbo">simulação</span>
          <div className="talao-face px-6 pb-5 pt-7">
            <p className="talao-head text-center">
              {ePensao ? "Recibo de pensão" : "Recibo de vencimento"}
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
                  <dt className="talao-dim">
                    {ePensao ? "PENSÃO BRUTA" : "SALÁRIO BRUTO"}
                  </dt>
                  <dd>{fmtEUR(recibo.bruto)}</dd>
                </div>
                {duoBruto > 0 && (
                  <div
                    className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">
                      DUODÉCIMOS ({s.duodecimos} %)
                      <span className="talao-note block">
                        RETENÇÃO AUTÓNOMA ART. 99.º-C
                      </span>
                    </dt>
                    <dd>{fmtEUR(duoBruto)}</dd>
                  </div>
                )}
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
                  <dt className="talao-dim">SEG. SOCIAL 11 %</dt>
                  <dd>
                    {ePensao ? (
                      <>
                        <ZeroInformativo
                          valor={fmtNum(0, 2)}
                          unidade="€"
                          nota="isento nas pensões"
                        />
                        <span
                          className={
                            "talao-retido talao-retido-neutro " +
                            talaoArm("talao-carimbo-anim")
                          }
                          aria-hidden
                        >
                          Isento
                        </span>
                      </>
                    ) : (
                      <>
                        {fmtEUR(recibo.ss)} −
                        <span className={"talao-retido " + talaoArm("talao-carimbo-anim")} aria-hidden>Retido</span>
                      </>
                    )}
                  </dd>
                </div>
                {s.adse && (
                  <div
                    className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">
                      ADSE {fmtPct(s.adseRegras.taxaDesconto, 1)}
                    </dt>
                    <dd>
                      {descAdse === 0 ? (
                        <ZeroInformativo
                          valor={fmtNum(0, 2)}
                          unidade="€"
                          nota="limiar de salvaguarda 635 €"
                        />
                      ) : (
                        <>
                          {fmtEUR(descAdse)} −
                          <span
                            className={
                              "talao-retido " + talaoArm("talao-carimbo-anim")
                            }
                            aria-hidden
                          >
                            Retido
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                )}
                <div
                  className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-dim">
                    IRS RETIDO
                    <span className="talao-note block">
                      TAXA EFETIVA {fmtPct(recibo.taxaEfetiva)}
                      {!ePensao &&
                        s.anoJovem > 0 &&
                        ` · JOVEM ${s.anoJovem}.º ANO`}
                    </span>
                  </dt>
                  <dd>
                    {recibo.retencao === 0 ? (
                      <>
                        <ZeroInformativo
                          valor={fmtNum(0, 2)}
                          unidade="€"
                          nota="não te toca"
                        />
                        <span
                          className={
                            "talao-retido talao-retido-neutro " +
                            talaoArm("talao-carimbo-anim")
                          }
                          aria-hidden
                        >
                          {s.seloNaoRetido}
                        </span>
                      </>
                    ) : (
                      <>
                        {fmtEUR(recibo.retencao)} −
                        <span className={"talao-retido " + talaoArm("talao-carimbo-anim")} aria-hidden>Retido</span>
                      </>
                    )}
                  </dd>
                </div>
                <div
                  className={talaoArm("talao-linha") + " talao-cut mt-1 flex items-baseline justify-between gap-4 py-3"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-total">Líquido no fim do mês</dt>
                  <dd className="text-display-lg font-bold">
                    {fmtEUR(recibo.liquido)}
                  </dd>
                </div>
                <div
                  className={talaoArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                  style={{ "--linha": prox() } as React.CSSProperties}
                >
                  <dt className="talao-dim">
                    {ePensao ? "VALOR BRUTO PAGO" : "CUSTO TOTAL P/ A EMPRESA"}
                  </dt>
                  <dd className="talao-dim">
                    {fmtEUR(recibo.custoEmpresa)}/mês
                  </dd>
                </div>
              </Fragment>
            </dl>
            <div className="talao-barras mt-5" aria-hidden />
            <p className="talao-meta mt-2 flex justify-between talao-dim">
              <span>
                TABELA {recibo.tabela} · {s.ano}
              </span>
              <span>{new URL(SITE_URL).host.toUpperCase()}</span>
            </p>
          </div>
        </div>
        <p className="footnote mt-6">
          A retenção é um adiantamento — o IRS certo acerta-se na
          liquidação anual. Subsídios de férias e de Natal retêm em
          separado.
        </p>
      </div>
    </div>
  );
}

/** o custo total em cêntimos — «de cada euro que a empresa gasta
    contigo»: CampoCentimos em montes substitui a explosão isométrica
    (que não era proporcional). Os rótulos vêm de messages/pt.json via
    props do provedor; os valores reagem ao recibo. */
function CustoMontes() {
  const s = useSalario();
  const r = s.recibo;
  const ePensao = s.tipoRendimento === "pensao";
  const porEuro = r.custoEmpresa > 0 ? 100 / r.custoEmpresa : 0;
  const mes = (v: number) => `${fmtEUR0(v)}/mês`;
  const descAdse = r.adse ?? 0;

  const partes: ParteCentimos[] = [
    ...(ePensao
      ? []
      : [
          {
            id: "tsu",
            rotulo: "TSU — a parte da empresa",
            rotuloCurto: "TSU",
            valor: r.tsuEntidade * porEuro,
            tom: "sai" as const,
            detalhe: mes(r.tsuEntidade),
          },
        ]),
    {
      id: "irs",
      rotulo: "IRS retido",
      rotuloCurto: "IRS",
      valor: r.retencao * porEuro,
      tom: "sai",
      detalhe: r.retencao > 0 ? mes(r.retencao) : undefined,
    },
    ...(ePensao
      ? []
      : [
          {
            id: "ss",
            rotulo: "Segurança Social — a tua parte",
            rotuloCurto: "Seg. Social",
            valor: r.ss * porEuro,
            tom: "sai" as const,
            detalhe: mes(r.ss),
          },
        ]),
    ...(s.adse && descAdse > 0
      ? [
          {
            id: "adse",
            rotulo: "Subsistema ADSE (3,5\u202F%)",
            rotuloCurto: "ADSE",
            valor: descAdse * porEuro,
            tom: "sai" as const,
            detalhe: mes(descAdse),
          },
        ]
      : []),
    {
      id: "fica",
      rotulo: "Chega à tua conta",
      rotuloCurto: "Fica-te",
      valor: r.liquido * porEuro,
      tom: "fica",
      detalhe: mes(r.liquido),
    },
  ];
  const fica = r.liquido * porEuro;
  return (
    <Cartao
      icone="salario"
      breadcrumb={`O TEU ${ePensao ? "RENDIMENTO / PENSÃO" : "SALÁRIO / CUSTO TOTAL"} · MOTORES ${s.ano}`}
      fonte={{
        rotulo: "Fontes",
        itens: [
          { nome: "TSU — seg-social.pt" },
          { nome: "retenção — Despacho 233-A/2026" },
        ],
      }}
    >
      <p className="leitura-insight">
        {ePensao
          ? "Sem Segurança Social nem TSU patronal — de cada euro bruto de pensão, quanto fica e quanto retém IRS."
          : "O recibo mostra o que tu vês — este campo mostra o que a empresa paga."}
      </p>
      <CampoCentimos
        className="mt-4"
        partes={partes}
        layout="montes"
        textos={{
          pronto: ePensao ? (
            <>
              De cada euro de pensão bruta,{" "}
              <b>{comUnidade(fmtNum(fica), "c")}</b> chegam-te.
            </>
          ) : (
            <>
              De cada euro que a empresa gasta contigo,{" "}
              <b>{comUnidade(fmtNum(fica), "c")}</b> chegam-te.
            </>
          ),
        }}
        equivalente={
          ePensao
            ? `De cada euro da tua pensão bruta (${fmtEUR0(r.bruto)}): ${fmtNum(fica)} cêntimos chegam à tua conta e ${fmtNum(r.retencao * porEuro)} vão para o IRS retido.`
            : `De cada euro que a empresa gasta contigo (bruto de ${fmtEUR0(r.bruto)}): ${fmtNum(fica)} cêntimos chegam à tua conta; ${fmtNum(r.tsuEntidade * porEuro)} vão para a TSU da empresa, ${fmtNum(r.retencao * porEuro)} para o IRS e ${fmtNum(r.ss * porEuro)} para a Segurança Social.`
        }
      />
    </Cartao>
  );
}

/** «O teu dia da liberdade fiscal» — os 365 dias do ano em pontos:
    os que pagam impostos e contribuições em «sai», os teus em «fica»;
    o ponto da viragem leva o anel de marca. Calculado do peso real do
    Estado no custo — nunca ilustrado. */
function AnelLiberdade() {
  const s = useSalario();
  const peso = s.resultado.pesoEstado;
  const dias = Math.max(0, Math.min(365, Math.round(peso * 365)));
  const data = diaLiberdade(peso, s.ano);
  const pontos: PontoAnel[] = Array.from({ length: 365 }, (_, i) => ({
    id: `d${i + 1}`,
    rotulo: `${i + 1}.º dia do ano`,
    tom: i < dias ? "sai" : "fica",
    atual: i === dias,
  }));
  return (
    <Cartao
      breadcrumb={`O TEU ANO / DIA DA LIBERDADE · ${s.ano}`}
      meta={[`Estado ${fmtPct(peso, 0)}`]}
    >
      <p className="leitura-insight">
        Trabalhas para o Estado até {data.completo} — a partir daí, cada
        dia é teu.
      </p>
      <div className="mx-auto mt-4 max-w-md">
        <AnelPontos
          pontos={pontos}
          comRotulos={false}
          centro={{ valor: data.curto, rotulo: "dia da liberdade fiscal" }}
          equivalente={`Dos 365 dias do ano, ${dias} pagam impostos e contribuições. Trabalhas para o Estado até ${data.completo}; a partir daí trabalhas para ti.`}
        />
      </div>
      <p className="footnote mt-3">
        O peso do Estado soma o IRS, a tua Segurança Social (11&#8239;%) e a
        TSU da empresa (23,75&#8239;%) sobre o custo total — {fmtPct(peso)}
        do ano.
      </p>
    </Cartao>
  );
}

/** a grelha do nível 2: controlo à esquerda, o talão a provar à
    direita; por baixo, o custo em cêntimos e o ano em dias */
export function ExploraSalario() {
  return (
    <div className="space-y-10">
      <div className="grid items-start gap-10 md:grid-cols-[1fr_1.2fr]">
        <ControlosSalario />
        <TalaoRecibo />
      </div>
      <CustoMontes />
      <AnelLiberdade />
    </div>
  );
}
