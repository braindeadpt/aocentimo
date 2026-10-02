"use client";

/**
 * A cena dos Correios (P2b) — a poupança da Dona Arminda: o colchão
 * contra os Certificados de Aforro, e o poder de compra a tracejado.
 *
 * A porta de `cenaCorreios()` do protótipo (`cena-correios.js`), com a
 * disciplina da casa:
 *
 *   - o passado é MEDIDO (razão IHPC entre T0 e o último mês, vinda do
 *     servidor); o futuro é HIPÓTESE — as trajectórias são
 *     `trajetoriaCA`/`trajetoriaColchao`, os motores puros, chamados
 *     aqui no cliente com os parâmetros de `ca.json`/`capitais.json`;
 *   - o palpite, a senha e as pilhas animam por GSAP só com movimento
 *     activo; em reduced-motion escreve-se o estado final — o número
 *     certo está sempre no DOM;
 *   - os ids da arte (`corPainel`, `pilhaCol`, `pilhaCA`…) são os do
 *     protótipo e vivem no string SVG — a árvore React não os conhece.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtEUR0, fmtPct, fmtNum, fmtData } from "@/lib/format";
import { trajetoriaCA, trajetoriaColchao } from "@/lib/engines/poupanca";
import type { DadosCorreios } from "./dados-p2b";
import { escreverPilha, graficoAforro, interiorCorreios, PL } from "./correios-arte";
import { mesCurto, mesLongo } from "./mercearia-arte";
import CenaDePerto from "./CenaDePerto";
import * as T from "./textos-p2b";

export default function CenaCorreios({ D, aoFechar }: { D: DadosCorreios; aoFechar: () => void }) {
  /** O passo da história: 1 senha · 2 palpite · 3 a resposta medida · 4 a calculadora · 5 o gráfico. */
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState(9500);
  const [anos, setAnos] = useState(5);
  /** A inflação da hipótese, em % — o arranque é a homóloga medida. */
  const [inflPct, setInflPct] = useState(D.inflacaoAnual === null ? 0 : D.inflacaoAnual * 100);
  const [rodada, setRodada] = useState(0);
  const arteRef = useRef<HTMLDivElement>(null);
  const vivo = useRef(true);
  const tweens = useRef<{ kill: () => void }[]>([]);
  /** Um tween por pilha — um novo mata o anterior (o slider mexe rápido). */
  const pilhaTw = useRef(new Map<string, { kill: () => void }>());
  /** Bilhete por pilha: a chamada mais recente ganha, as atrasadas morrem. */
  const pilhaSeq = useRef(new Map<string, number>());
  useEffect(() => {
    vivo.current = true;
    const tw = tweens.current;
    const pw = pilhaTw.current;
    return () => {
      vivo.current = false;
      tw.forEach((t) => t.kill());
      pw.clear();
    };
  }, []);

  const interior = useMemo(() => interiorCorreios(), []);
  const cap0 = D.cap0;
  const real0 = D.razaoTotal === null ? null : cap0 / D.razaoTotal;
  const infl = inflPct / 100;
  const ca = D.ca;
  const taxaLiq = ca ? ca.taxa * (1 - ca.imposto) : null;

  // as trajectórias do passo 4/5 — motor puro, sem reconta
  const trajCA = useMemo(
    () => (ca ? trajetoriaCA(cap0, anos, ca.taxa, ca.premios, ca.imposto, infl) : []),
    [cap0, anos, infl, ca]
  );
  const trajCo = useMemo(() => trajetoriaColchao(cap0, anos, infl), [cap0, anos, infl]);
  const fimCA = trajCA[trajCA.length - 1];
  const fimCo = trajCo[trajCo.length - 1];
  const jurCA = trajCA.reduce((s, p) => s + p.juro, 0);
  const impCA = trajCA.reduce((s, p) => s + p.imposto, 0);

  /* ————— a senha pisca e a funcionária acena ————— */
  const chamarSenha = async () => {
    const raiz = arteRef.current;
    const p = raiz?.querySelector("#corPainel");
    const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
    if (!motionActiva()) {
      if (p) p.textContent = T.corSenha;
      if (vivo.current) setPasso(2);
      return;
    }
    const { gsap } = await carregarGsap();
    if (!vivo.current) return;
    if (p)
      gsap
        .timeline()
        .to(p, { opacity: 0, duration: 0.12, repeat: 3, yoyo: true })
        .add(() => {
          p.textContent = T.corSenha;
        });
    const braco = raiz?.querySelectorAll("#corFunc .braco-d");
    if (braco?.length)
      gsap
        .timeline({ delay: 0.4 })
        .to(braco, { rotation: -150, transformOrigin: "50% 0%", duration: 0.25 })
        .to(braco, { rotation: 0, duration: 0.3, delay: 0.5 });
    gsap.delayedCall(0.9, () => vivo.current && setPasso(2));
  };

  /* ————— as pilhas seguem o passo e os sliders ————— */
  const porPilha = async (id: string, nominal: number, real: number, anima: boolean) => {
    const g = arteRef.current?.querySelector(`#${id}`);
    if (!g) return;
    const h = (PL.alt * nominal) / PL.max;
    const hr = (PL.alt * real) / PL.max;
    const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
    // um tween de cada vez por pilha: o slider pode chamar isto 60×/s e
    // dois tweens a escrever o mesmo atributo era o defeito da Fábrica.
    // O bilhete tapa a corrida dos awaits: quem chega tarde não escreve.
    const bilhete = (pilhaSeq.current.get(id) ?? 0) + 1;
    pilhaSeq.current.set(id, bilhete);
    pilhaTw.current.get(id)?.kill();
    if (!anima || !motionActiva()) {
      pilhaTw.current.delete(id);
      escreverPilha(g, nominal, h, hr);
      return;
    }
    const { gsap } = await carregarGsap();
    if (!vivo.current || pilhaSeq.current.get(id) !== bilhete) return;
    const notas = g.querySelector(".p-notas");
    const o = { h: +(notas?.getAttribute("height") ?? 0) || 0, hr: +(g.getAttribute("data-hr") ?? h) };
    const tw = gsap.to(o, {
      h,
      hr,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: () => escreverPilha(g, nominal, o.h, o.hr),
    });
    pilhaTw.current.set(id, tw);
    tweens.current.push(tw);
  };

  useEffect(() => {
    const raiz = arteRef.current;
    if (!raiz) return;
    const pilhaCA = raiz.querySelector<SVGGElement>("#pilhaCA");
    if (pilhaCA) pilhaCA.style.opacity = passo >= 4 ? "1" : "0";
    if (passo === 1) {
      // estado de abertura: o colchão cheio, os certificados vazios
      porPilha("pilhaCol", cap0, cap0, false);
      porPilha("pilhaCA", 0, 0, false);
    }
    if (passo === 3 && real0 !== null) porPilha("pilhaCol", cap0, real0, true);
    if (passo >= 4 && fimCA && fimCo) {
      porPilha("pilhaCol", fimCo.saldo, fimCo.real, true);
      porPilha("pilhaCA", fimCA.saldo, fimCA.real, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, anos, infl, rodada, D]);

  /* ————— os gráficos e contas do corpo ————— */
  const trajCA15 = useMemo(
    () => (ca ? trajetoriaCA(cap0, 15, ca.taxa, ca.premios, ca.imposto, infl) : []),
    [cap0, infl, ca]
  );
  const trajCo15 = useMemo(() => trajetoriaColchao(cap0, 15, infl), [cap0, infl]);
  const grafico = useMemo(() => {
    const fC = trajCA15[trajCA15.length - 1];
    const fO = trajCo15[trajCo15.length - 1];
    if (!fC || !fO) return "";
    return graficoAforro(
      cap0,
      trajCA15,
      trajCo15,
      infl,
      T.corGraficoAria(fmtPct(infl), fmtEUR0(cap0), fmtEUR0(fO.real), fmtEUR0(fC.saldo), fmtEUR0(fC.real))
    );
  }, [cap0, infl, trajCA15, trajCo15]);

  const juizo = real0 === null ? "" : T.corJuizo(Math.abs(real0 - palpite), palpite, real0);

  const fala =
    passo === 1
      ? T.corFala1
      : passo === 2
        ? T.corFala2(mesLongo(D.mesT0), fmtEUR0(cap0))
        : passo === 3
          ? real0 === null
            ? T.corSemDados
            : T.corResposta(juizo, fmtEUR0(real0), mesCurto(D.mesT0))
          : passo === 4
            ? T.corFala4(fmtEUR0(cap0))
            : T.corFala5;

  const voltar = (
    <button className="b-btn b-claro" type="button" onClick={aoFechar}>
      {T.corBtnVoltar}
    </button>
  );
  const outra = (
    <button
      className="b-btn b-claro"
      type="button"
      onClick={() => {
        setPasso(1);
        setPalpite(9500);
        setAnos(5);
        setInflPct(D.inflacaoAnual === null ? 0 : D.inflacaoAnual * 100);
        setRodada((r) => r + 1);
      }}
    >
      {T.corBtnOutra}
    </button>
  );

  return (
    <CenaDePerto quem={T.corQuem} fonte={D.fonte} aoFechar={aoFechar} arteHtml={interior} refArte={arteRef} rotuloArte={T.corRotuloArte}>
      <p className="b-fala" aria-live="polite" dangerouslySetInnerHTML={{ __html: fala }} />
      <div className="b-corpo">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={chamarSenha}>
            {T.corBtnSenha(T.corSenha)}
          </button>
        )}
        {passo === 2 && (
          <>
            <p className="pergunta-fin">{T.corPalpite(fmtEUR0(cap0), mesCurto(D.mesT0))}</p>
            <p className="nota-fin">{T.corNotaExemplo(fmtEUR0(cap0))}</p>
            <div className="b-palpite">
              <output htmlFor="corPal">{fmtEUR0(palpite)}</output>
              <input
                id="corPal"
                type="range"
                min={5000}
                max={10000}
                step={100}
                value={palpite}
                onChange={(e) => setPalpite(+e.target.value)}
                aria-label={T.corPalpiteAria}
              />
            </div>
            <button className="b-btn" type="button" onClick={() => setPasso(3)}>
              {T.corBtnResposta}
            </button>
          </>
        )}
        {passo === 3 && !ca && <div className="opcoes">{voltar}</div>}
        {passo === 3 && ca && (
          <>
            <p dangerouslySetInnerHTML={{ __html: T.corExplica(D.razaoTotal === null ? "—" : pctVarTxt(D.razaoTotal), mesCurto(D.mesT1 ?? D.mesT0)) }} />
            <p dangerouslySetInnerHTML={{ __html: T.corExplicaCA(fmtPct(ca.taxa), fmtPct(ca.imposto, 0)) }} />
            <button className="b-btn" type="button" onClick={() => setPasso(4)}>
              {T.corBtnCertificados}
            </button>
          </>
        )}
        {passo >= 4 && ca && (
          <>
            {passo === 4 && (
              <p
                dangerouslySetInnerHTML={{
                  __html: T.corExplicaLiq(fmtPct(ca.taxa), taxaLiq === null ? "—" : fmtPct(taxaLiq)),
                }}
              />
            )}
            {passo === 5 && <div dangerouslySetInnerHTML={{ __html: grafico }} />}
            {passo === 5 && <p dangerouslySetInnerHTML={{ __html: T.corGraficoTexto(fmtEUR0(cap0)) }} />}
            <div className="b-calc">
              <label htmlFor="corAnos">
                <b>{T.corCalcAnos}</b> <output>{T.corAnosOut(anos)}</output>
              </label>
              <input
                id="corAnos"
                type="range"
                min={1}
                max={15}
                step={1}
                value={anos}
                onChange={(e) => setAnos(+e.target.value)}
              />
              <label htmlFor="corInfl">
                <b>{T.corCalcInfl}</b> <output>{fmtPct(infl)}</output>
              </label>
              <input
                id="corInfl"
                type="range"
                min={0}
                max={6}
                step={0.1}
                value={inflPct}
                onChange={(e) => setInflPct(+e.target.value)}
              />
              <div className="b-calc-linha">
                <span>{T.corCalcCol}</span>
                <b>
                  {fimCo ? fmtEUR0(fimCo.saldo) : "—"} · {T.corCompram} <span className="b-r">{fimCo ? fmtEUR0(fimCo.real) : "—"}</span>
                </b>
              </div>
              <div className="b-calc-linha">
                <span>{T.corCalcCA}</span>
                <b>
                  {fimCA ? fmtEUR0(fimCA.saldo) : "—"} · {T.corCompram}{" "}
                  <span className={fimCA && fimCA.real >= cap0 ? "b-g" : "b-r"}>{fimCA ? fmtEUR0(fimCA.real) : "—"}</span>
                </b>
              </div>
              <div className="b-calc-linha">
                <span>{T.corCalcJur(fmtPct(ca.imposto, 0))}</span>
                <b>
                  {fmtEUR0(jurCA)} · {fmtEUR0(impCA)}
                </b>
              </div>
            </div>
            {passo === 4 && (
              <>
                <p className="nota-fin">
                  {T.corNotaHipotese(
                    fmtPct(ca.taxa),
                    fmtData(ca.vigencia),
                    D.inflacaoAnual === null ? "—" : fmtPct(D.inflacaoAnual),
                    ca.garantia
                  )}
                </p>
                <button
                  className="b-btn"
                  type="button"
                  onClick={() => {
                    setAnos(15);
                    setInflPct(D.inflacaoAnual === null ? 0 : D.inflacaoAnual * 100);
                    setPasso(5);
                  }}
                >
                  {T.corBtnGrafico}
                </button>
              </>
            )}
          </>
        )}
        {passo === 5 && (
          <div className="opcoes">
            {voltar}
            {outra}
            <a className="b-btn" href="/poupanca">
              {T.corBtnPoupanca}
            </a>
          </div>
        )}
      </div>
      <div className="b-acoes" />
    </CenaDePerto>
  );
}

/** «+23,4 %» — o pctVar da Mercearia, reutilizado. */
function pctVarTxt(r: number): string {
  const v = fmtNum(Math.abs(r - 1) * 100, 1);
  return `${r >= 1 ? "+" : "−"}${v} %`.replace(" ", "\u202F");
}
