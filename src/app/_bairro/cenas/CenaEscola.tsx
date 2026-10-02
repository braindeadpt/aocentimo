"use client";

/**
 * A cena da Escola (P2c) — aprender a ler gráficos e as palavras do
 * dinheiro.
 *
 * A porta de `cenaEscola()` do protótipo: três lições — o eixo que
 * começa em zero contra o eixo cortado (os dois minis da MESMA série),
 * a variação em cadeia contra a homóloga, e as palavras do glossário
 * que levam a cada edifício por âncora.
 *
 * Os minis são os desenhos de `escola-arte` (o truque é o próprio eixo,
 * por isso não usam `grafico-linhas` — o gráfico reutilizável não faz
 * eixos batoteiros). As definições são as do glossário real do site;
 * um termo que não exista no glossário não entra na lição. A cena não
 * tem GSAP — não há nada a animar que ensine.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { fmtNum, fmtPeriodo, FINO } from "@/lib/format";
import type { DadosEscola } from "./dados-p2c";
import { interiorEscola, mini } from "./escola-arte";
import { mesCurto } from "./mercearia-arte";
import CenaDePerto from "./CenaDePerto";
import { pontosDaSerie } from "./utils";
import * as T from "./textos-p2c";

const pct1 = (v: number) => `${fmtNum(v * 100, 1)}${FINO}%`;

export default function CenaEscola({
  D,
  aoFechar,
}: {
  D: DadosEscola;
  aoFechar: () => void;
}) {
  const [passo, setPasso] = useState(1);
  const [acertou, setAcertou] = useState<boolean | null>(null);

  const interior = useMemo(() => interiorEscola(T.escPlaca, T.escPerguntaCurta), []);

  // os dois minis — a mesma série de 13 meses, um desde zero e o outro
  // cortado no mínimo
  const ptsComida = useMemo(() => pontosDaSerie(D.comida), [D.comida]);
  const miniA = useMemo(() => mini(ptsComida, true, mesCurto), [ptsComida]);
  const miniB = useMemo(() => mini(ptsComida, false, mesCurto), [ptsComida]);

  // a segunda lição: cp00 em cadeia (mês anterior) e homóloga (12 meses)
  const ptsTotal = useMemo(() => pontosDaSerie(D.total), [D.total]);
  const cadeia =
    ptsTotal.length >= 2 && ptsTotal.at(-2)!.v !== 0
      ? { v: ptsTotal.at(-1)!.v / ptsTotal.at(-2)!.v - 1, t: ptsTotal.at(-2)!.t }
      : null;
  const homologa =
    ptsTotal.length > 12 && ptsTotal.at(-13)!.v !== 0
      ? { v: ptsTotal.at(-1)!.v / ptsTotal.at(-13)!.v - 1, t: ptsTotal.at(-13)!.t }
      : null;
  const mes = ptsTotal.at(-1)?.t ?? null;

  const responde = (mesmo: boolean) => {
    setAcertou(mesmo);
    setPasso(2);
  };

  return (
    <CenaDePerto
      quem={T.escQuem}
      fonte={D.fonte}
      aoFechar={aoFechar}
      arteHtml={interior}
      rotuloArte={T.escRotuloArte}
    >
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.escFala1
              : passo === 2
                ? T.escFala2(
                    acertou ? T.escFala2Certo : T.escFala2Errado,
                    D.subidaComida !== null ? pct1(D.subidaComida) : "—"
                  )
                : passo === 3
                  ? T.escFala3(
                      mes ? mesCurto(mes) : "—",
                      cadeia && cadeia.v < 0 ? T.escDesceram : T.escSubiram,
                      cadeia ? pct1(Math.abs(cadeia.v)) : "—",
                      homologa ? pct1(Math.abs(homologa.v)) : "—"
                    )
                  : T.escFala4,
        }}
      />
      <div className="b-corpo">
        {passo <= 2 && (
          <>
            {passo === 1 && (
              <p className="pergunta-fin" dangerouslySetInnerHTML={{ __html: T.escPergunta }} />
            )}
            <div className="b-minis">
              <figure>
                <b>{T.escMiniA}</b>
                {miniA.svg && (
                  <div dangerouslySetInnerHTML={{ __html: miniA.svg }} />
                )}
                <figcaption>{T.escMiniALeg}</figcaption>
              </figure>
              <figure>
                <b>{T.escMiniB}</b>
                {miniB.svg && (
                  <div dangerouslySetInnerHTML={{ __html: miniB.svg }} />
                )}
                <figcaption>
                  {T.escMiniBLeg(fmtNum(miniB.lo, 0))}
                </figcaption>
              </figure>
            </div>
            {passo === 2 && (
              <p dangerouslySetInnerHTML={{ __html: T.escExplicaEixo }} />
            )}
          </>
        )}
        {passo === 3 && (
          <>
            <p>{T.escExplica3a}</p>
            <div className="b-calc">
              <div className="b-calc-linha">
                <span dangerouslySetInnerHTML={{ __html: T.escCadeia(cadeia ? mesCurto(cadeia.t) : "—") }} />
                <b>{cadeia ? pct1(cadeia.v) : "—"}</b>
              </div>
              <div className="b-calc-linha">
                <span dangerouslySetInnerHTML={{ __html: T.escHomologa(homologa ? mesCurto(homologa.t) : "—") }} />
                <b>{homologa ? pct1(homologa.v) : "—"}</b>
              </div>
            </div>
            <p dangerouslySetInnerHTML={{ __html: T.escExplica3b }} />
            <p className="nota-fin">
              {T.escNotaIndices(mes ? fmtPeriodo(mes) : "—")}
            </p>
          </>
        )}
        {passo === 4 && (
          <div className="b-glossario">
            {D.gloss.map((g) => {
              const onde = T.escOnde[g.slug];
              return (
                <div key={g.slug} className="b-gloss-card">
                  <b>{g.termo}</b>
                  <p>{g.def}</p>
                  <div className="b-gloss-links">
                    {onde && (
                      <a href={onde.href}>{T.escVerEm(onde.titulo)}</a>
                    )}
                    <Link href={`/aprender/${g.slug}`}>{T.escVerGlossario}</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="b-acoes">
        {passo === 1 && (
          <>
            <button className="b-btn b-claro" type="button" onClick={() => responde(false)}>
              {T.escBtnA}
            </button>
            <button className="b-btn b-claro" type="button" onClick={() => responde(false)}>
              {T.escBtnB}
            </button>
            <button className="b-btn" type="button" onClick={() => responde(true)}>
              {T.escBtnMesmo}
            </button>
          </>
        )}
        {passo === 2 && (
          <button className="b-btn" type="button" onClick={() => setPasso(3)}>
            {T.escBtnLicao2}
          </button>
        )}
        {passo === 3 && (
          <button className="b-btn" type="button" onClick={() => setPasso(4)}>
            {T.escBtnLicao3}
          </button>
        )}
        {passo === 4 && (
          <>
            <button className="b-btn b-claro" type="button" onClick={aoFechar}>
              {T.escBtnVoltar}
            </button>
            <button
              className="b-btn b-claro"
              type="button"
              onClick={() => {
                setPasso(1);
                setAcertou(null);
              }}
            >
              {T.escBtnOutra}
            </button>
            <Link className="b-btn" href="/aprender">
              {T.escLinkAprender}
            </Link>
          </>
        )}
      </div>
    </CenaDePerto>
  );
}
