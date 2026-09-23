"use client";

/**
 * CustoExplodido — o custo do trabalho em explosão isométrica (R-05,
 * Direcção V3 §6). Substitui a composição papel-rasgado desta secção:
 * a metáfora certa é a do euro — placas wireframe afastadas na
 * vertical, não mais papel. De cima para baixo: «A empresa paga»
 * (placa-mãe, fill fraco), os três cortes (TSU da entidade, IRS
 * retido, a tua Seg. Social) e a placa-base «Chega à conta» em
 * --keep. A invariante do desenho: custo − tsu − irs − ss = líquido.
 *
 * Reactivo: as medidas chegam do reciboMensal e seguem a régua do
 * bruto — os valores contam --dur-curta (useValorAnimado no svg,
 * TweenNum na lista), as peças não se remontam nem reanimam a cada
 * mudança. A montagem é a do Isometrico: uma vez, ao entrar no
 * viewport (useArmado); reduced-motion = estado final.
 *
 * O cartão é gramática .leitura: breadcrumb + corpo + rodapé com
 * fontes; hover/focus-within inverte para papel e a <ol> (equivalente
 * sempre visível) interroga as peças por teclado.
 */
import {
  Isometrico,
  type CamadaIsometrica,
} from "@/components/Isometrico";
import { TweenNum } from "@/components/TweenNum";
import { useArmado } from "@/lib/useArmado";
import { useValorAnimado } from "@/lib/useValorAnimado";
import { fmtEUR0, fmtPct } from "@/lib/format";
import { t } from "@/lib/t";

/** Medidas mensais do custo do trabalho — calculadas UMA vez no
    servidor/simulador e passadas por props; o componente não importa
    motores nem data/. (Herdado da antiga FitaTalao, removida em R-06.) */
export interface MedidasEuro {
  custo: number; // custo mensal para a empresa (bruto + TSU entidade)
  tsu: number; // TSU da entidade patronal
  irs: number; // retenção de IRS
  ss: number; // TSU do trabalhador
  liquido: number; // o que chega à conta
  estado: number; // tsu + irs + ss
  taxaTsu: number; // taxa da entidade (rótulos)
  taxaSs: number; // taxa do trabalhador (rótulos)
}

/** As medidas mensais + a taxa efetiva de IRS (detalhe da placa).
    Calculadas no simulador a partir de reciboMensal. */
export interface MedidasCusto extends MedidasEuro {
  /** taxa efetiva de retenção na fonte — rótulo da placa do IRS */
  taxaIrs: number;
}

/** Strings — vêm do servidor (messages/pt.json → salario.custo);
    templates {chave} resolvem-se aqui com t() de @/lib/t. */
export interface RotulosCusto {
  /** kicker da secção por cima do cartão */
  titulo: string;
  /** breadcrumb mono — «O TEU SALÁRIO / CUSTO TOTAL · MOTORES {ano}» */
  breadcrumb: string;
  /** selo do cabeçalho — «o Estado leva {valor} /mês» */
  meta: string;
  /** kicker junto ao número grande — «chega à conta» */
  chegaConta: string;
  /** linha pequena por baixo do número — «por mês» */
  porMes: string;
  /** rodapé — fontes completas numa linha */
  fontes: string;
  pecas: {
    empresa: { rotulo: string; detalhe: string };
    /** rotulo com {taxa} — ex.: «TSU · {taxa}» */
    tsu: { rotulo: string; detalhe: string };
    /** detalhe com {taxa} — a efetiva de retenção */
    irs: { rotulo: string; detalhe: string };
    /** detalhe com {taxa} — os 11 % do trabalhador */
    ss: { rotulo: string; detalhe: string };
    conta: { rotulo: string; detalhe: string };
  };
}

/** valor num rótulo do svg — conta do anterior em --dur-curta (a mesma
    máquina do TweenNum); reduced-motion e SSR mostram o valor final */
function ValorSvg({ v, sinal = "" }: { v: number; sinal?: string }) {
  const a = useValorAnimado(v, { dur: 320 });
  return (
    <tspan>
      {sinal}
      {fmtEUR0(a)}
    </tspan>
  );
}

/** valor de um corte na lista-equivalente — «−356 €» com o menos da
    casa (U+2212), no texto acessível e no visual */
function ValorCorte({ v }: { v: number }) {
  return (
    <TweenNum
      valor={v}
      casas={0}
      texto={`−${fmtEUR0(v)}`}
      prefixo="−"
      sufixo="€"
    />
  );
}

export function CustoExplodido({
  medidas,
  rotulos,
  ano,
}: {
  medidas: MedidasCusto;
  rotulos: RotulosCusto;
  ano: number;
}) {
  // run fixa: a explosão monta-se UMA vez ao entrar — mexer na régua
  // muda valores, nunca remonta peças
  const { ref, arm } = useArmado<HTMLElement>("custo:explodido");
  const { custo, tsu, irs, ss, liquido, estado, taxaTsu, taxaSs, taxaIrs } =
    medidas;
  const R = rotulos.pecas;

  const corte = (
    id: string,
    rotulo: string,
    detalhe: string,
    v: number
  ): CamadaIsometrica => ({
    id,
    forma: "placa",
    rotulo,
    detalhe,
    tom: "corte",
    texto: <ValorSvg v={v} sinal="−" />,
    textoLista: <ValorCorte v={v} />,
  });

  const camadas: CamadaIsometrica[] = [
    {
      id: "empresa",
      forma: "moeda",
      rotulo: R.empresa.rotulo,
      detalhe: R.empresa.detalhe,
      tom: "neutro", // o custo total não é um corte — é o ponto de partida
      texto: <ValorSvg v={custo} />,
      textoLista: (
        <TweenNum valor={custo} casas={0} texto={fmtEUR0(custo)} sufixo="€" />
      ),
    },
    corte("tsu", t(R.tsu.rotulo, { taxa: fmtPct(taxaTsu, 2) }), R.tsu.detalhe, tsu),
    corte(
      "irs",
      R.irs.rotulo,
      t(R.irs.detalhe, { taxa: fmtPct(taxaIrs) }),
      irs
    ),
    corte("ss", R.ss.rotulo, t(R.ss.detalhe, { taxa: fmtPct(taxaSs, 0) }), ss),
    {
      id: "conta",
      forma: "base",
      rotulo: R.conta.rotulo,
      detalhe: R.conta.detalhe,
      tom: "fica",
      texto: <ValorSvg v={liquido} />,
      textoLista: (
        <TweenNum
          valor={liquido}
          casas={0}
          texto={fmtEUR0(liquido)}
          sufixo="€"
        />
      ),
    },
  ];

  return (
    <article
      ref={ref}
      className={`leitura leitura-amplo iso-card ${arm("iso-on")}`}
    >
      <header className="leitura-head">
        <p className="leitura-breadcrumb">
          {t(rotulos.breadcrumb, { ano })}
        </p>
        <p className="leitura-meta num">
          <span>{t(rotulos.meta, { valor: fmtEUR0(estado) })}</span>
        </p>
      </header>

      <div className="leitura-corpo">
        <Isometrico
          nome="custo"
          camadas={camadas}
          numero={{
            kicker: rotulos.chegaConta,
            valor: <ValorSvg v={liquido} />,
            pequeno: rotulos.porMes,
            compacto: true,
          }}
        />
      </div>

      <footer className="leitura-foot">
        <p className="leitura-fonte">{t(rotulos.fontes, { ano })}</p>
      </footer>
    </article>
  );
}
