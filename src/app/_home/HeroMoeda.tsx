/**
 * HeroMoeda — o primeiro ecrã da home (S2-01): «a moeda de 100
 * cêntimos». Wrapper SERVIDOR: carrega a grelha canónica
 * (data/derived/cenarios-salario.json), emagrece-a para o cliente,
 * compõe o h1 (o LCP — SSR puro, sem animação de entrada), o
 * <details> da resposta sem JS e o rodapé de fonte, e entrega tudo ao
 * <HeroMoedaCliente> por props.
 *
 * Montagem na page.tsx (orquestrador): <HeroMoeda /> como primeiro
 * bloco da home; o CSS próprio é o hero-moeda.css ao lado — importado
 * aqui, co-localizado (não vai para globals.css).
 *
 * Números: só da tabela derivada do motor — nada é recalculado aqui.
 * O custo do h1 é o da linha bruto===meta.brutoRef (1 500 € → 1 856 €).
 */
import { comUnidade, fmtEUR0, fmtNum, fmtPct } from "@/lib/format";
import { m, t } from "@/lib/messages";
import cenariosJson from "@data/derived/cenarios-salario.json";
import retencaoJson from "@data/fiscal/retencao-2026.json";
import irsJson from "@data/fiscal/irs-2026.json";
import type { CenariosSalario } from "@/lib/cenarios";
import {
  HeroMoedaCliente,
  type HeroStrings,
  type LinhaHero,
} from "./HeroMoedaCliente";
import "./hero-moeda.css";

const cenarios = cenariosJson as unknown as CenariosSalario;

export function HeroMoeda({ className }: { className?: string }) {
  const meta = cenarios.meta;
  const linhas: LinhaHero[] = cenarios.linhas.map((l) => ({
    bruto: l.bruto,
    custo: l.custo,
    tsu: l.tsu,
    irs: l.irs,
    ss: l.ss,
    liquido: l.liquido,
    centimos: {
      tsu: l.centimos.tsu,
      irs: l.centimos.irs,
      ss: l.centimos.ss,
      fica: l.centimos.fica,
    },
  }));
  const canonica =
    linhas.find((l) => l.bruto === meta.brutoRef) ?? linhas[0];

  // a copy: m.home.hero (a proposta nova da sessão — rever pelo dono)
  // + as chaves que o herói reutiliza de guess/regua
  const s: HeroStrings = {
    ...m.home.hero,
    kicker: m.guess.kicker,
    revelar: m.guess.botao,
    marcadorRealidade: m.guess.realidade,
    marcadorMinimo: m.regua.minimo,
    reguaDica: m.regua.dica,
    limiteMin: m.regua.limiteRazaoMin,
    limiteMax: m.regua.limiteRazaoMax,
  };

  const mes = (v: number) => `${fmtEUR0(v)}/mês`;
  const cc = (v: number) => comUnidade(fmtNum(v), "c");

  // a resposta sem a moeda — o caminho sem JS e o «confirma» rápido:
  // os quatro valores (cêntimos + €/mês) e a frase, sempre no HTML
  const resposta = (
    <details className="hm-resposta">
      <summary>{s.respostaSummary}</summary>
      <div className="hm-resposta-corpo">
        <p>
          {t(s.equivalente, {
            bruto: fmtEUR0(canonica.bruto),
            fica: fmtNum(canonica.centimos.fica),
            tsu: fmtNum(canonica.centimos.tsu),
            irs: fmtNum(canonica.centimos.irs),
            ss: fmtNum(canonica.centimos.ss),
          })}
        </p>
        <ul>
          <li>
            {s.partes.tsu} — {cc(canonica.centimos.tsu)} ·{" "}
            {mes(canonica.tsu)}
          </li>
          <li>
            {s.partes.irs} — {cc(canonica.centimos.irs)} ·{" "}
            {mes(canonica.irs)}
          </li>
          <li>
            {s.partes.ss} — {cc(canonica.centimos.ss)} ·{" "}
            {mes(canonica.ss)}
          </li>
          <li>
            {s.partes.fica} — {cc(canonica.centimos.fica)} ·{" "}
            {mes(canonica.liquido)}
          </li>
        </ul>
      </div>
    </details>
  );

  // o rodapé do instrumento: motores + fontes fiscais com ligação —
  // cada número tem fonte e data (regra nº1)
  const rodape = (
    <p className="hm-fonte">
      <span className="hm-marca" aria-hidden="true" />
      <span>
        {s.fonteMotores} ·{" "}
        <a
          href={retencaoJson.fonteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {retencaoJson.fonte.split(",")[0]}
        </a>{" "}
        ·{" "}
        <a
          href={irsJson.fonteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {s.fonteEscaloes}
        </a>{" "}
        · TSU {fmtPct(meta.taxas.tsu, 2)} · SS {fmtPct(meta.taxas.ss, 0)} ·{" "}
        {meta.perfil}
      </span>
    </p>
  );

  return (
    <section
      className={`hm-hero${className ? ` ${className}` : ""}`}
      aria-labelledby="hm-pergunta"
    >
      <p className="kicker">{s.kicker}</p>
      <h1 id="hm-pergunta" className="titulo-hero hm-titulo">
        {s.h1a} <span className="hm-num">{fmtEUR0(canonica.custo)}</span>{" "}
        {s.h1b} <span className="hm-q">{s.h1q}</span>
      </h1>
      <HeroMoedaCliente
        linhas={linhas}
        meta={{ ano: meta.ano, smn: meta.smn, brutoRef: meta.brutoRef }}
        s={s}
        rodape={rodape}
        resposta={resposta}
      />
    </section>
  );
}
