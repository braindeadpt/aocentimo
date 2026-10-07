"use client";

/**
 * A cena das Finanças (P2a) — o IRS em gavetas.
 *
 * A porta de `cenaFinancas()` do protótipo: quatro passos, a cómoda que
 * enche, o gráfico degrau/curva e a calculadora do slider. As contas são
 * as de `irs-gavetas.ts` (testadas contra o motor do site); os textos,
 * de `textos.ts` (PROPOSTA); o desenho, de `financas-arte.ts`.
 *
 * As gavetas e o ponto do gráfico enchem por MANIPULAÇÃO DIRETA do SVG
 * (`useEffect` + `setAttribute`), como o protótipo fazia e como o
 * `<Bairro>` manipula os pins — a árvore React nunca vê o interior.
 * Com movimento as gavetas enchem animadas e a senha pisca (GSAP de
 * `anima.ts`/`senha.ts`); com `prefers-reduced-motion` os valores finais
 * entram logo — o estado final é sempre o mesmo.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtEUR0 as fmtEUR } from "@/lib/format";
import type { DadosFinancas } from "./dados";
import { coletavel, gavetaMaisAlta, irsPorEscaloes } from "./irs-gavetas";
import {
  graficoIrs,
  interiorFinancas,
  moeda,
  pctTaxa,
  pontoGrafico,
} from "./financas-arte";
import CenaDePerto from "./CenaDePerto";
import { chamarSenha, reporSenha } from "./senha";
import { useGsap } from "./anima";
import * as T from "./textos";

const ordinal = (n: number) => `${n}.º`;

/** A calculadora: o slider do salário e as quatro linhas de contas. */
function Calc({
  D,
  valor,
  aoMudar,
}: {
  D: DadosFinancas;
  valor: number;
  aoMudar: (v: number) => void;
}) {
  const c = coletavel(valor, D.dedEsp, D.ssTaxa);
  const irs = irsPorEscaloes(D.escaloes, c);
  const g = gavetaMaisAlta(D.escaloes, c);
  const med = c ? irs / c : 0;
  return (
    <div className="b-calc">
      <label htmlFor="finSal">
        <b>{T.finCalcRotulo}</b> <output htmlFor="finSal">{fmtEUR(valor)}</output>
      </label>
      <input
        id="finSal"
        type="range"
        min={800}
        max={7000}
        step={50}
        value={valor}
        onChange={(e) => aoMudar(+e.target.value)}
      />
      <div className="b-calc-linha">
        <span>{T.finCalcCol}</span>
        <b>{fmtEUR(c)}</b>
      </div>
      <div className="b-calc-linha">
        <span>{T.finCalcIrs}</span>
        <b className="b-r">{fmtEUR(irs)}</b>
      </div>
      <div className="b-calc-linha">
        <span>{T.finCalcMarg}</span>
        <b>{g ? `${pctTaxa(g.taxa)} (${ordinal(g.k + 1)} escalão)` : "—"}</b>
      </div>
      <div className="b-calc-linha">
        <span>{T.finCalcMed}</span>
        <b>{c ? pctTaxa(med) : "—"}</b>
      </div>
    </div>
  );
}

export default function CenaFinancas({ D, aoFechar }: { D: DadosFinancas; aoFechar: () => void }) {
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState<"menos" | "igual" | "mais">("mais");
  const [salario, setSalario] = useState(1650);
  // o rendimento que as gavetas e o gráfico mostram (os botões antes/depois)
  const [visto, setVisto] = useState(1500);
  const arteRef = useRef<HTMLDivElement>(null);
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);
  const gsapRef = useGsap();
  // a próxima mudança das gavetas anima (botões e passos — como o
  // `onchange` do protótipo); arrastar o slider escreve direto
  const animarRef = useRef(false);

  const c0 = coletavel(1500, D.dedEsp, D.ssTaxa);
  const g0 = gavetaMaisAlta(D.escaloes, c0)!;
  const c1 = coletavel(1650, D.dedEsp, D.ssTaxa);
  const g1 = gavetaMaisAlta(D.escaloes, c1)!;
  // o que o `visto` está a mostrar — no passo 4 a fala e o texto do
  // gráfico seguem ESTE degrau (o da gaveta acesa no desenho), não o
  // fixo de 1 500 €: se o slider mexer, mudam os dois juntos
  const cV = coletavel(visto, D.dedEsp, D.ssTaxa);
  const gV = gavetaMaisAlta(D.escaloes, cV);
  const medV = cV > 0 ? irsPorEscaloes(D.escaloes, cV) / cV : 0;

  const interior = useMemo(() => interiorFinancas(D.escaloes), [D.escaloes]);
  const grafico = useMemo(() => graficoIrs(D.escaloes, T.finGraficoAria), [D.escaloes]);
  // no passo 4 o gráfico entra na COLUNA DO TEXTO (`.b-corpo`), como no
  // protótipo — por isso os efeitos procuram a partir da `.b-cena` toda:
  // os ids do interior (gav…) estão na arte, os do gráfico (grLinha,
  // grMarg…) no texto. Se o gráfico fosse para a arte sobrepunha-se ao
  // desenho e ficava ilegível.

  // AS GAVETAS: para cada escalão, a largura verde (fica) e vermelha (IRS)
  // do salário `visto`, escritas directamente no SVG do interior.
  useEffect(() => {
    const raiz = arteRef.current?.closest(".b-cena");
    if (!raiz) return;
    // como no protótipo, a cómoda está VAZIA até à resposta (passo 3)
    const c = passo >= 3 ? coletavel(visto, D.dedEsp, D.ssTaxa) : 0;
    const W = 246; // GV.w - 4, dentro do desenho
    const gsap = gsapRef.current;
    const anima = animarRef.current;
    const topo = gavetaMaisAlta(D.escaloes, c);
    let de = 0;
    D.escaloes.forEach((e, k) => {
      const g = raiz.querySelector<SVGGElement>(`#gav${k}`);
      if (!g) return;
      const ate = e.ate ?? Infinity;
      const dentro = Math.max(0, Math.min(c, ate) - de);
      de = ate;
      const cap = (e.ate ?? e.de + 60000) - e.de;
      const fr = Math.min(1, dentro / cap);
      const fica = g.querySelector<SVGRectElement>(".g-fica");
      const irsR = g.querySelector<SVGRectElement>(".g-irs");
      if (!fica || !irsR) return;
      const wf = W * fr * (1 - e.taxa);
      const wi = W * fr * e.taxa;
      gsap?.killTweensOf([fica, irsR]);
      if (anima && gsap) {
        gsap.to(fica, { attr: { width: wf }, duration: 0.55, delay: k * 0.07, ease: "power2.out" });
        gsap.to(irsR, { attr: { width: wi, x: GVX + 2 + wf }, duration: 0.55, delay: k * 0.07, ease: "power2.out" });
      } else {
        fica.setAttribute("width", wf.toFixed(1));
        irsR.setAttribute("x", (GVX + 2 + wf).toFixed(1));
        irsR.setAttribute("width", wi.toFixed(1));
      }
      g.classList.toggle("ativa", !!topo && topo.k === k);
    });
    animarRef.current = false;
  }, [D, visto, passo, gsapRef]);

  // PASSO 3, como no protótipo: a cómoda enche primeiro com os 1 500 € e,
  // 1,5 s depois, sobe para os 1 650 € do aumento
  useEffect(() => {
    if (passo !== 3 || !gsapRef.current) return;
    const t = setTimeout(() => {
      animarRef.current = true;
      setVisto(1650);
    }, 1500);
    return () => clearTimeout(t);
  }, [passo, gsapRef]);

  // O PONTO DO GRÁFICO (passo 4): acompanha o `visto`
  useEffect(() => {
    if (passo !== 4) return;
    const raiz = arteRef.current?.closest(".b-cena");
    if (!raiz) return;
    const c = coletavel(visto, D.dedEsp, D.ssTaxa);
    const p = pontoGrafico(D.escaloes, c);
    const GR = { y0: 250, x1: 500 };
    const q = (id: string) => raiz.querySelector<SVGElement>(`#${id}`);
    q("grLinha")?.setAttribute("d", `M${p.x.toFixed(1)} ${GR.y0} V${p.yDegrau.toFixed(1)}`);
    if (q("grMarg")) {
      q("grMarg")!.setAttribute("cx", String(p.x));
      q("grMarg")!.setAttribute("cy", String(p.yDegrau));
    }
    if (q("grMed")) {
      q("grMed")!.setAttribute("cx", String(p.x));
      q("grMed")!.setAttribute("cy", String(p.yMedia));
    }
    const r = q("grRot");
    if (r) {
      r.textContent = Math.abs(visto - 1500) < 1e-9 ? "a Inês" : "tu";
      r.setAttribute("x", String(Math.min(p.x + 10, GR.x1 - 40)));
      r.setAttribute("y", String(p.yMedia + 24));
    }
  }, [D, visto, passo]);

  // o palpite: com movimento a cómoda enche com os 1 500 € e o efeito do
  // passo 3 sobe-a para 1 650 €; sem movimento fica logo nos 1 650 €
  const escolher = (p: "menos" | "igual" | "mais") => {
    setPalpite(p);
    animarRef.current = true;
    setVisto(gsapRef.current ? 1500 : 1650);
    setPasso(3);
  };

  const ganho = fmtEUR(
    150 * 14 - 150 * 14 * D.ssTaxa - (irsPorEscaloes(D.escaloes, c1) - irsPorEscaloes(D.escaloes, c0))
  );

  return (
    <CenaDePerto
      quem={T.finQuem}
      fonte={D.fonte}
      aoFechar={aoFechar}
      arteHtml={interior}
      refArte={arteRef}
      rotuloArte={T.finRotuloArte}
    >
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.finFala1
              : passo === 2
                ? T.finFala2("A 023")
                : passo === 3
                  ? `<b>${palpite === "mais" ? T.finAcertou : T.finAfinalNao}</b> <span class="b-g">${T.finResposta(ganho)}</span>`
                  : T.finFala4(gV ? pctTaxa(gV.taxa) : "—"),
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <button
            className="b-btn"
            type="button"
            onClick={() =>
              chamarSenha(
                arteRef.current,
                { painel: "#finPainel", nova: "A 023", talao: "#finTalao", braco: "#finFunc .braco-d", atrasoBraco: 0.5 },
                () => vivo.current && setPasso(2)
              )
            }
          >
            {T.finBtnSenha}
          </button>
        )}
        {passo === 2 && (
          <>
            <p
              className="pergunta-fin"
              dangerouslySetInnerHTML={{ __html: T.finPalpite(fmtEUR(1500), fmtEUR(1650), ordinal(g0.k + 1), ordinal(g1.k + 1)) }}
            />
            <div className="opcoes" role="group" aria-label={T.finPalpiteAria}>
              <button className="b-btn b-claro" type="button" onClick={() => escolher("menos")}>{T.finBtnMenos}</button>
              <button className="b-btn b-claro" type="button" onClick={() => escolher("igual")}>{T.finBtnIgual}</button>
              <button className="b-btn b-claro" type="button" onClick={() => escolher("mais")}>{T.finBtnMais}</button>
            </div>
          </>
        )}
        {passo === 3 && (
          <>
            {T.finExplica(
              ordinal(g1.k + 1),
              fmtEUR(g1.dentro),
              pctTaxa(g1.taxa),
              fmtEUR(150 * 14),
              fmtEUR(irsPorEscaloes(D.escaloes, c1) - irsPorEscaloes(D.escaloes, c0)),
              fmtEUR(150 * 14 * D.ssTaxa)
            ).map((p, k) => (
              <p key={k} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
            <div className="opcoes" role="group" aria-label={T.finGavetasAria}>
              <button className="b-btn b-claro" type="button" onClick={() => { animarRef.current = true; setVisto(1500); }}>{T.finAntes(fmtEUR(1500))}</button>
              <button className="b-btn b-claro" type="button" onClick={() => { animarRef.current = true; setVisto(1650); }}>{T.finDepois(fmtEUR(1650))}</button>
            </div>
            <Calc D={D} valor={salario} aoMudar={setVistoEMarca} />
          </>
        )}
        {passo === 4 && (
          <>
            {/* o gráfico fica na coluna da conversa, como no protótipo */}
            <div dangerouslySetInnerHTML={{ __html: grafico }} />
            <p dangerouslySetInnerHTML={{ __html: T.finGraficoTexto(gV ? pctTaxa(gV.taxa) : "—", cV > 0 ? pctTaxa(medV) : "—") }} />
            <p className="nota-fin" dangerouslySetInnerHTML={{ __html: T.finNotaRodape(D.motorIrsAnual === null ? "—" : fmtEUR(D.motorIrsAnual)) }} />
            <Calc D={D} valor={salario} aoMudar={setVistoEMarca} />
          </>
        )}
      </div>
      <div className="b-acoes">
        {passo === 3 && (
          // o protótipo recomeça em 1 500 € ao entrar no gráfico
          // (calcFinancas(1500)): senão a fala dizia o degrau dos 1 500 e
          // a gaveta acesa e o ponto mostravam os 1 650 do palpite
          <button className="b-btn" type="button" onClick={() => { animarRef.current = true; setVisto(1500); setSalario(1500); setPasso(4); }}>
            {T.finBtnGrafico}
          </button>
        )}
        {passo === 4 && (
          <>
            <button className="b-btn b-claro" type="button" onClick={aoFechar}>
              {T.finBtnVoltar}
            </button>
            <button
              className="b-btn b-claro"
              type="button"
              onClick={() => {
                reporSenha(arteRef.current, "#finPainel", "A 022", "#finTalao");
                setPasso(1);
                setVisto(1500);
                setSalario(1650);
              }}
            >
              {T.finBtnOutra}
            </button>
          </>
        )}
      </div>
      {/* a tabela oficial, para quem quer confirmar (como no protótipo) */}
      <details className="b-confirma">
        <summary>{T.finTabelaResumo}</summary>
        <table>
          <thead>
            <tr>
              <th>{T.finTabelaEscalao}</th>
              <th>{T.finTabelaRendimento}</th>
              <th>{T.finTabelaTaxa}</th>
            </tr>
          </thead>
          <tbody>
            {D.escaloes.map((e, k) => (
              <tr key={k}>
                <td>{ordinal(k + 1)}</td>
                <td>{e.ate != null ? T.finTabelaFaixa(moeda(e.de, 0), moeda(e.ate, 0)) : T.finTabelaAcima(moeda(e.de, 0))}</td>
                <td>{pctTaxa(e.taxa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </CenaDePerto>
  );

  // o slider muda o que as gavetas mostram E a calculadora
  function setVistoEMarca(v: number) {
    setSalario(v);
    setVisto(v);
  }
}

/** A coordenada x das gavetas dentro do desenho (tem de bater com `financas-arte`). */
const GVX = 372;
