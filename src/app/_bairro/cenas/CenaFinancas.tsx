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
 * Sem GSAP: `prefers-reduced-motion` não muda nada aqui porque nada
 * anima; os valores finais estão sempre no SVG e no HTML.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtEUR } from "@/lib/format";
import type { DadosFinancas } from "./dados";
import { coletavel, gavetaMaisAlta, irsPorEscaloes } from "./irs-gavetas";
import {
  graficoIrs,
  interiorFinancas,
  pctTaxa,
  pontoGrafico,
} from "./financas-arte";
import CenaDePerto from "./CenaDePerto";
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

  const c0 = coletavel(1500, D.dedEsp, D.ssTaxa);
  const g0 = gavetaMaisAlta(D.escaloes, c0)!;
  const c1 = coletavel(1650, D.dedEsp, D.ssTaxa);
  const g1 = gavetaMaisAlta(D.escaloes, c1)!;

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
    const c = coletavel(visto, D.dedEsp, D.ssTaxa);
    const W = 246; // GV.w - 4, dentro do desenho
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
      fica.setAttribute("width", wf.toFixed(1));
      irsR.setAttribute("x", (GVX + 2 + wf).toFixed(1));
      irsR.setAttribute("width", (W * fr * e.taxa).toFixed(1));
      g.classList.toggle("ativa", !!topo && topo.k === k);
    });
  }, [D, visto, passo]);

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
                  : T.finFala4(pctTaxa(g0.taxa)),
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={() => setPasso(2)}>
            {T.finBtnSenha}
          </button>
        )}
        {passo === 2 && (
          <>
            <p className="pergunta-fin">
              {T.finPalpite(fmtEUR(1500), fmtEUR(1650), ordinal(g0.k + 1), ordinal(g1.k + 1))}
            </p>
            <div className="opcoes" role="group" aria-label="O teu palpite">
              <button className="b-btn b-claro" type="button" onClick={() => { setPalpite("menos"); setVisto(1650); setPasso(3); }}>{T.finBtnMenos}</button>
              <button className="b-btn b-claro" type="button" onClick={() => { setPalpite("igual"); setVisto(1650); setPasso(3); }}>{T.finBtnIgual}</button>
              <button className="b-btn b-claro" type="button" onClick={() => { setPalpite("mais"); setVisto(1650); setPasso(3); }}>{T.finBtnMais}</button>
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
            <div className="opcoes" role="group" aria-label="Ver as gavetas da Inês">
              <button className="b-btn b-claro" type="button" onClick={() => setVisto(1500)}>{T.finAntes(fmtEUR(1500))}</button>
              <button className="b-btn b-claro" type="button" onClick={() => setVisto(1650)}>{T.finDepois(fmtEUR(1650))}</button>
            </div>
            <Calc D={D} valor={salario} aoMudar={setVistoEMarca} />
          </>
        )}
        {passo === 4 && (
          <>
            {/* o gráfico fica na coluna da conversa, como no protótipo */}
            <div dangerouslySetInnerHTML={{ __html: grafico }} />
            <p>{T.finGraficoTexto(pctTaxa(g0.taxa), pctTaxa(irsPorEscaloes(D.escaloes, c0) / c0))}</p>
            <p className="nota-fin">{T.finNotaRodape(D.motorIrsAnual === null ? "—" : fmtEUR(D.motorIrsAnual))}</p>
            <Calc D={D} valor={salario} aoMudar={setVistoEMarca} />
          </>
        )}
      </div>
      <div className="b-acoes">
        {passo === 3 && (
          <button className="b-btn" type="button" onClick={() => setPasso(4)}>
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
