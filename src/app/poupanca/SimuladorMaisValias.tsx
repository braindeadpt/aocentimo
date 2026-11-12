"use client";

import { useMemo, useState } from "react";
import type { EscalaoIRS, RegrasIRS } from "@/lib/engines/irs";
import { fmtEUR, fmtPct } from "@/lib/format";

export interface RegrasMaisValiasProps {
  mobiliarios: {
    taxaAutonoma: number;
    exclusoesDetencao: { anosMin: number; exclusao: number }[];
  };
  cripto: {
    isencaoDetencaoDias: number;
    taxa: number;
  };
  imoveis: {
    percentagemEnglobada: number;
  };
}

export type TipoAtivo = "mobiliarios" | "cripto" | "imovel";

function impostoPorEscaloesPuro(rc: number, regras: RegrasIRS): number {
  let restante = rc;
  let anterior = 0;
  let total = 0;
  for (const e of regras.escaloes) {
    const limite = e.ate ?? Infinity;
    const fatia = Math.min(restante, limite - anterior);
    if (fatia <= 0) break;
    total += fatia * e.taxa;
    restante -= fatia;
    anterior = limite;
  }
  for (const s of regras.solidariedade) {
    if (rc > s.de) {
      const topo = s.ate ?? Infinity;
      total += (Math.min(rc, topo) - s.de) * s.taxa;
    }
  }
  return total;
}

function abatimentoME(rb: number, de: number, regras: RegrasIRS): number {
  const me = regras.minimoExistencia;
  const vr = me.valorReferencia;
  const limiteDG = me.limiteDespesasGerais / me.taxa1Escalao;
  const L = vr - limiteDG / 3.6 + me.limite1Escalao / 3.6;

  let abatimento: number;
  if (rb <= vr) {
    abatimento = vr - (de + limiteDG);
  } else if (rb <= L) {
    abatimento = vr - 2.6 * (rb - vr) - (de + limiteDG);
  } else {
    abatimento = L - me.limite1Escalao - 1.35 * (rb - L) - de;
  }
  return Math.max(0, Math.min(abatimento, rb - de));
}

function coletavelSalarioPuro(
  brutoMensal: number,
  regras: RegrasIRS,
  ssTrab: number
): number {
  const rb = brutoMensal * 14;
  const contrib = rb * ssTrab;
  const de = Math.max(regras.deducaoEspecificaFixa, contrib);
  const aplicaME = rb <= regras.minimoExistencia.naoAplicaAcimaPorTitular;
  const abat = aplicaME ? abatimentoME(rb, de, regras) : 0;
  return Math.max(0, rb - de - abat);
}

function parseClamp(
  s: string,
  min: number,
  max: number,
  inteiro = false
): number {
  const limpo = s.trim().replace(/\s+/g, "").replace(",", ".");
  if (limpo === "") return min;
  const n = Number(limpo);
  if (!Number.isFinite(n)) return min;
  const val = inteiro ? Math.round(n) : n;
  return Math.min(max, Math.max(min, val));
}

function CampoNumero({
  id,
  label,
  valor,
  onChange,
  min = 0,
  max = 10_000_000,
  inteiro = false,
}: {
  id: string;
  label: string;
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  inteiro?: boolean;
}) {
  const [texto, setTexto] = useState(() => String(valor).replace(".", ","));
  const padrao = inteiro ? /^\d*$/ : /^\d*(?:[.,]\d*)?$/;

  return (
    <div>
      <label className="kicker block mb-1.5" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={(e) => {
          const cru = e.target.value;
          if (cru !== "" && !padrao.test(cru.trim().replace(/\s+/g, ""))) {
            return;
          }
          setTexto(cru);
          onChange(parseClamp(cru, min, max, inteiro));
        }}
        onBlur={() => {
          const final = parseClamp(texto, min, max, inteiro);
          onChange(final);
          setTexto(String(final).replace(".", ","));
        }}
        className="field min-h-[44px]"
      />
    </div>
  );
}

export function SimuladorMaisValias({
  regrasMV,
  regrasIrs,
  ssTrab,
}: {
  regrasMV: RegrasMaisValiasProps;
  regrasIrs: RegrasIRS;
  ssTrab: number;
}) {
  const [tipo, setTipo] = useState<TipoAtivo>("mobiliarios");
  const [compra, setCompra] = useState(10000);
  const [venda, setVenda] = useState(15000);
  const [despesas, setDespesas] = useState(0);
  const [anos, setAnos] = useState(3);
  const [dias, setDias] = useState(400);
  const [reinvestida, setReinvestida] = useState(0);
  const [salario, setSalario] = useState(1500);

  const coletavel = useMemo(
    () =>
      coletavelSalarioPuro(
        Math.min(100_000, Math.max(0, salario)),
        regrasIrs,
        ssTrab
      ),
    [salario, regrasIrs, ssTrab]
  );

  const r = useMemo(() => {
    const anosDet = Math.min(50, Math.max(0, anos));
    const diasDet = Math.min(36_500, Math.max(0, dias));
    const pctReinv = Math.min(1, Math.max(0, reinvestida / 100));
    const mv = Math.max(0, venda - compra - despesas);

    let tributavel = mv;
    let excluido = 0;
    let autonomo: number | null = null;

    if (tipo === "cripto") {
      if (diasDet >= regrasMV.cripto.isencaoDetencaoDias) {
        tributavel = 0;
        excluido = 1;
      } else {
        autonomo = mv * regrasMV.cripto.taxa;
      }
    } else if (tipo === "imovel") {
      const base = mv * regrasMV.imoveis.percentagemEnglobada;
      tributavel = base * (1 - Math.min(1, pctReinv));
      excluido = 1 - tributavel / Math.max(mv, 1e-9);
    } else {
      const ex =
        regrasMV.mobiliarios.exclusoesDetencao
          .filter((e) => anosDet >= e.anosMin)
          .at(-1)?.exclusao ?? 0;
      tributavel = mv * (1 - ex);
      excluido = ex;
      autonomo = tributavel * regrasMV.mobiliarios.taxaAutonoma;
    }

    const englobado =
      impostoPorEscaloesPuro(coletavel + tributavel, regrasIrs) -
      impostoPorEscaloesPuro(coletavel, regrasIrs);

    const melhor: "autonomo" | "englobado" | "impovel" =
      tipo === "imovel"
        ? "impovel"
        : autonomo !== null && autonomo <= englobado
          ? "autonomo"
          : "englobado";

    return {
      maisValia: mv,
      tributavel,
      impostoAutonomo: autonomo,
      impostoEnglobado: englobado,
      melhor,
      excluido,
    };
  }, [
    venda,
    compra,
    tipo,
    despesas,
    anos,
    dias,
    reinvestida,
    coletavel,
    regrasMV,
    regrasIrs,
  ]);

  const imposto = r.impostoAutonomo !== null && r.melhor === "autonomo"
    ? r.impostoAutonomo
    : r.impostoEnglobado;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="mv-tipo">O que vendeste</label>
          <select id="mv-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoAtivo)}
            className="field min-h-[44px]">
            <option value="mobiliarios">Ações / ETF / fundos</option>
            <option value="cripto">Cripto</option>
            <option value="imovel">Imóvel</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoNumero id="mv-compra" label="Compraste por" valor={compra} onChange={setCompra} min={0} max={10_000_000} />
          <CampoNumero id="mv-venda" label="Vendeste por" valor={venda} onChange={setVenda} min={0} max={10_000_000} />
          <CampoNumero id="mv-desp" label="Despesas (comissões, obras)" valor={despesas} onChange={setDespesas} min={0} max={10_000_000} />
          {tipo === "cripto" ? (
            <CampoNumero key="mv-dias" id="mv-dias" label="Dias na carteira" valor={dias} onChange={setDias} min={0} max={36_500} inteiro />
          ) : (
            <CampoNumero key="mv-anos" id="mv-anos" label="Anos de detenção" valor={anos} onChange={setAnos} min={0} max={50} inteiro />
          )}
          {tipo === "imovel" && (
            <CampoNumero key="mv-reinv" id="mv-reinv" label="% reinvestida noutra HPP" valor={reinvestida} onChange={setReinvestida} min={0} max={100} />
          )}
          <CampoNumero id="mv-sal" label="O teu bruto mensal (p/ englobar)" valor={salario} onChange={setSalario} min={0} max={100_000} />
        </div>
        <p className="footnote">
          Mobiliários em mercado regulamentado: exclusão de 10 % (&gt;2 anos),
          20 % (≥5) ou 30 % (≥8). Imóveis englobam metade da mais-valia —
          a correção monetária não é aplicada aqui, o imposto real é
          ligeiramente menor.
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6" aria-live="polite">
        <div className="border-b border-line px-5 py-3">
          <span className="kicker">O imposto sobre o ganho</span>
        </div>
        <dl className="px-5 py-4 text-corpo-sm">
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Mais-valia</dt>
            <dd className="num">{fmtEUR(r.maisValia)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Tributável{r.excluido > 0 && ` (${fmtPct(r.excluido, 0)} excluído)`}</dt>
            <dd className="num">{fmtEUR(r.tributavel)}</dd>
          </div>
          {r.impostoAutonomo !== null && (
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Taxa autónoma (28 %)</dt>
              <dd className="num">{fmtEUR(r.impostoAutonomo)}</dd>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Englobado nos teus escalões</dt>
            <dd className="num">{fmtEUR(r.impostoEnglobado)}</dd>
          </div>
          <div className="mt-1 border-t-2 border-ink py-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="font-medium">Pagas</dt>
            <dd className="num-read font-medium text-up">{fmtEUR(imposto)}</dd>
            <dd className="w-full text-rotulo text-muted">
              {r.melhor === "autonomo"
                ? "a taxa autónoma é a que fica mais barata"
                : r.melhor === "englobado"
                  ? "englobar compensa — a tua taxa marginal é menor que 28 %"
                  : "englobamento obrigatório em imóveis"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
export type { EscalaoIRS };

