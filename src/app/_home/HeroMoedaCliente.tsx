"use client";

/**
 * HeroMoedaCliente — o instrumento do herói da home (S2-01): a moeda
 * de 1 € que se desfaz em 100 cêntimos e voa para os quatro montes
 * (TSU da empresa · IRS retido · Segurança Social · o que te chega).
 *
 * Máquina de estados local:
 *   repouso   — a moeda oscila; a régua do palpite e «Revelar» /
 *               «Mostrar sem adivinhar» estão à vista
 *   revelado  — layout "montes"; o palpite fica marcado na régua ao
 *               lado do valor real e o veredicto entra na legenda do
 *               palco QUANDO os montes assentam (nunca antes)
 *
 * «Montes assentaram» lê-se no `data-assentou` do `.cc-palco` — sinal
 * público do CampoCentimos desde a S4 (pedido da sessão 2 resolvido):
 * liga quando a coreografia termina (em reduced-motion é imediato —
 * `saltarPara`). O `data-pronto` NÃO serve para isto: marca a entrega
 * SSR→canvas no primeiro frame, não os montes.
 *
 * A régua do bruto anda na grelha canónica (103 pontos exactos, S1-09)
 * — `setDados` do campo reorganiza os pontos ao vivo; ao salário
 * mínimo o IRS fica a 0 e o rótulo diz «não te toca» (textos.zero).
 *
 * Sem JS: o SSR entrega a moeda parada + o <details> da resposta
 * (composto no servidor, prop `resposta`). Dados e strings chegam por
 * props — aqui não entra pt.json nem data/*.json.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CampoCentimos,
  type ParteCentimos,
  type TextosCentimos,
} from "@/components/CampoCentimos";
import { Regua } from "@/components/Regua";
import { Botao } from "@/components/Botao";
import { OrbeEstado } from "@/components/OrbeEstado";
import { comUnidade, fmtEUR0, fmtNum } from "@/lib/format";
import { t } from "@/lib/t";
import type { Messages } from "@/lib/messages";

/** a copy do herói: o bloco `home.hero` do pt.json (PROPOSTA de copy,
    a rever pelo dono) + as chaves reutilizadas de outros namespaces —
    montada no servidor (HeroMoeda.tsx); aqui nunca entra pt.json */
export type HeroStrings = Messages["home"]["hero"] & {
  /** «adivinha primeiro» — m.guess.kicker */
  kicker: string;
  /** «revelar» — m.guess.botao */
  revelar: string;
  /** «a realidade» — m.guess.realidade (marcador na régua do palpite) */
  marcadorRealidade: string;
  /** «mínimo» — m.regua.minimo (marcador «agora» da régua do bruto) */
  marcadorMinimo: string;
  /** ajuda de teclado da régua — m.regua.dica */
  reguaDica: string;
  /** «o salário mínimo» — m.regua.limiteRazaoMin */
  limiteMin: string;
  /** «o fim da tabela calculada» — m.regua.limiteRazaoMax */
  limiteMax: string;
};

/** linha emagrecida da grelha canónica — só o que o herói precisa.
 *  Os €/mês (tsu/irs/ss/liquido) alimentam o detalhe dos montes. */
export interface LinhaHero {
  bruto: number;
  /** custo total para a empresa /mês */
  custo: number;
  tsu: number;
  irs: number;
  ss: number;
  liquido: number;
  /** cêntimos reais de cada euro de custo (com decimais) */
  centimos: { tsu: number; irs: number; ss: number; fica: number };
}

export interface HeroMeta {
  ano: number;
  smn: number;
  brutoRef: number;
}

/* ————— funções puras (testadas em hero-moeda.test.tsx) ————— */

/** linha → as quatro partes do campo (ordem dos montes: saem à
    esquerda, «fica» à direita — convenção do CampoCentimos) */
export function partesDaLinha(l: LinhaHero, s: HeroStrings): ParteCentimos[] {
  const mes = (v: number) => `${fmtEUR0(v)}/mês`;
  return [
    {
      id: "tsu",
      rotulo: s.partes.tsu,
      rotuloCurto: s.partesCurtas.tsu,
      valor: l.centimos.tsu,
      tom: "sai",
      detalhe: mes(l.tsu),
    },
    {
      id: "irs",
      rotulo: s.partes.irs,
      rotuloCurto: s.partesCurtas.irs,
      valor: l.centimos.irs,
      tom: "sai",
      detalhe: mes(l.irs),
    },
    {
      id: "ss",
      rotulo: s.partes.ss,
      rotuloCurto: s.partesCurtas.ss,
      valor: l.centimos.ss,
      tom: "sai",
      detalhe: mes(l.ss),
    },
    {
      id: "fica",
      rotulo: s.partes.fica,
      rotuloCurto: s.partesCurtas.fica,
      valor: l.centimos.fica,
      tom: "fica",
      detalhe: mes(l.liquido),
    },
  ];
}

export type Juizo = "certeiro" | "perto" | "longe";

/** o juízo do palpite — os limiares do protótipo aprovado:
    |d| ≤ 2 → certeiro · ≤ 8 → perto · senão longe */
export function juizoDoPalpite(palpite: number, real: number): Juizo {
  const d = Math.abs(palpite - real);
  return d <= 2 ? "certeiro" : d <= 8 ? "perto" : "longe";
}

const c100 = (v: number) => Math.round(v * 100) / 100;

/** as variáveis do veredicto — `extenso` escreve «cêntimos» por
    inteiro (região viva / leitor de ecrã); senão a unidade curta «c» */
export function varsVeredicto(
  palpite: number | null,
  fica: number,
  s: HeroStrings,
  extenso = false
): Record<string, string> {
  const u = (v: number) =>
    extenso ? `${fmtNum(v)} cêntimos` : comUnidade(fmtNum(v), "c");
  const saem = c100(100 - fica);
  if (palpite === null) {
    return { real: u(fica), saem: u(saem) };
  }
  const d = palpite - fica;
  return {
    juizo: s.juizo[juizoDoPalpite(palpite, fica)],
    palpite: u(palpite),
    real: u(fica),
    diff: u(c100(Math.abs(d))),
    direcao: d > 0 ? s.direcaoMais : s.direcaoMenos,
  };
}

/** a frase do veredicto em texto corrido — testes e região viva */
export function textoVeredicto(
  palpite: number | null,
  fica: number,
  s: HeroStrings,
  extenso = false
): string {
  return t(
    palpite === null ? s.veredictoSem : s.veredictoCom,
    varsVeredicto(palpite, fica, s, extenso)
  );
}

/** o equivalente textual do campo para esta linha — «De cada euro que
    a empresa gasta contigo (bruto de …), …» */
export function equivalenteLinha(l: LinhaHero, s: HeroStrings): string {
  return t(s.equivalente, {
    bruto: fmtEUR0(l.bruto),
    fica: fmtNum(l.centimos.fica),
    tsu: fmtNum(l.centimos.tsu),
    irs: fmtNum(l.centimos.irs),
    ss: fmtNum(l.centimos.ss),
  });
}

/** template {chave} → ReactNode[]; as chaves de `fortes` entram em <b>
    (os números da legenda do palco pesam — `.cc-legenda b`) */
export function franja(
  tpl: string,
  vars: Record<string, string>,
  fortes: readonly string[] = []
): ReactNode[] {
  const f = new Set(fortes);
  return tpl.split(/(\{[a-zA-Z]+\})/g).map((seg, i) => {
    const m = /^\{([a-zA-Z]+)\}$/.exec(seg);
    if (!m) return seg;
    const v = vars[m[1]] ?? seg;
    return f.has(m[1]) ? <b key={i}>{v}</b> : v;
  });
}

/* ————— o instrumento ————— */

export function HeroMoedaCliente({
  linhas,
  meta,
  s,
  rodape,
  resposta,
}: {
  /** a grelha emagrecida (103 linhas) — ordem ascendente de bruto */
  linhas: readonly LinhaHero[];
  meta: HeroMeta;
  /** toda a copy — montada no servidor (hero-moeda.strings + m.*) */
  s: HeroStrings;
  /** rodapé do instrumento (fonte + data) — composto no servidor */
  rodape?: ReactNode;
  /** o <details> da resposta sem JS — composto no servidor */
  resposta?: ReactNode;
}) {
  const [bruto, setBruto] = useState(meta.brutoRef);
  const [palpite, setPalpite] = useState(50);
  const [revelado, setRevelado] = useState(false);
  /** o palpite congelado no momento do revelar — a régua pode mexer
      depois sem reescrever o veredicto */
  const [palpiteUsado, setPalpiteUsado] = useState<number | null>(null);
  /** os montes assentaram — a porta do veredicto falado */
  const [assentou, setAssentou] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  /** foco só salta depois de uma acção — nunca na montagem */
  const tocou = useRef(false);

  const brutos = useMemo(() => linhas.map((l) => l.bruto), [linhas]);
  const linha = linhas.find((l) => l.bruto === bruto) ?? linhas[0];
  const partes = useMemo(() => partesDaLinha(linha, s), [linha, s]);
  const real = linha.centimos.fica;

  // «os montes assentaram» = o palco ganha data-assentou — sinal
  // público do CampoCentimos (S4, pedido da sessão 2): liga quando
  // a coreografia termina, em reduced-motion no mesmo gesto do salto
  // directo. O data-pronto NÃO serve — marca a entrega SSR→canvas
  // no primeiro frame, não os montes.
  useEffect(() => {
    const palco = raizRef.current?.querySelector(".cc-palco");
    if (!palco) return;
    const sync = () => setAssentou(palco.hasAttribute("data-assentou"));
    const mo = new MutationObserver(sync);
    mo.observe(palco, { attributes: true, attributeFilter: ["data-assentou"] });
    sync();
    return () => mo.disconnect();
  }, []);

  // o foco segue a acção: depois de revelar vai para «Voltar à moeda»;
  // ao voltar regressa a «Revelar» (a coreografia do protótipo)
  useEffect(() => {
    if (!tocou.current) return;
    document.getElementById(revelado ? "hm-voltar" : "hm-revelar")?.focus();
  }, [revelado]);

  const revelar = (comPalpite: boolean) => {
    tocou.current = true;
    setPalpiteUsado(comPalpite ? palpite : null);
    setRevelado(true);
  };
  const voltar = () => {
    tocou.current = true;
    setRevelado(false);
  };

  const fortes = ["cem", "valor", "real", "saem", "palpite", "diff"];
  const vars = varsVeredicto(palpiteUsado, real, s);
  const textos: TextosCentimos = {
    pausa: franja(s.pausa, { cem: "100 cêntimos" }, fortes),
    saiem: franja(
      s.saiem,
      { valor: comUnidade(fmtNum(c100(100 - real)), "c") },
      fortes
    ),
    pronto: franja(
      palpiteUsado === null ? s.veredictoSem : s.veredictoCom,
      vars,
      fortes
    ),
    zero: s.zero,
  };

  // a região viva anuncia o veredicto SÓ depois de os montes
  // assentarem — nunca antes (o palco inteiro é aria-hidden)
  const fala = assentou
    ? `${textoVeredicto(palpiteUsado, real, s, true)} ${equivalenteLinha(linha, s)}`
    : "";

  return (
    <div className="hm-inst" ref={raizRef}>
      <div className="hm-inst-cab">
        <p className="hm-migalha">
          <b>{s.migalhaTitulo}</b> <span className="hm-sep">/</span>{" "}
          {s.migalhaCusto} <span className="hm-sep">·</span>{" "}
          <span>{t(s.migalhaBruto, { bruto: fmtEUR0(bruto) })}</span>
        </p>
        <span className="hm-estado">
          <OrbeEstado estado="em-dia" tamanho={15} />
          {t(s.estadoRotulo, { ano: meta.ano })}
        </span>
      </div>

      <CampoCentimos
        partes={partes}
        layout={revelado ? "montes" : "moeda"}
        textos={textos}
        equivalente={equivalenteLinha(linha, s)}
      />
      <p className="sr-only" role="status">
        {fala}
      </p>

      <div className="hm-ctrl">
        <div className="hm-bloco">
          <Regua
            id="hm-palpite"
            rotulo={s.palpiteRotulo}
            valor={palpite}
            onChange={setPalpite}
            min={0}
            max={100}
            passo={1}
            unidade="c"
            formato={(v) => fmtNum(v)}
            marcadorAgora={
              revelado
                ? { valor: real, rotulo: s.marcadorRealidade }
                : undefined
            }
            descricao={s.reguaDica}
          />
          <div className="hm-acoes">
            {revelado ? (
              <Botao
                id="hm-voltar"
                variante="secundario"
                onClick={voltar}
              >
                {s.voltar}
              </Botao>
            ) : (
              <>
                <Botao
                  id="hm-revelar"
                  variante="primario"
                  onClick={() => revelar(true)}
                >
                  {s.revelar}
                </Botao>
                <Botao variante="terciario" onClick={() => revelar(false)}>
                  {s.semAdivinhar}
                </Botao>
              </>
            )}
          </div>
        </div>
        <div className="hm-bloco">
          <Regua
            id="hm-bruto"
            rotulo={s.brutoRotulo}
            valor={bruto}
            onChange={setBruto}
            min={brutos[0]}
            max={brutos[brutos.length - 1]}
            passo={50}
            pontos={brutos}
            unidade="€"
            formato={(v) => fmtNum(v, 0)}
            marcadorAgora={{ valor: meta.smn, rotulo: s.marcadorMinimo }}
            presets={[
              { rotulo: s.presetMinimo, valor: meta.smn },
              { rotulo: fmtEUR0(meta.brutoRef), valor: meta.brutoRef },
              { rotulo: fmtEUR0(3000), valor: 3000 },
            ]}
            descricao={s.reguaDica}
            limites={{ min: s.limiteMin, max: s.limiteMax }}
          />
        </div>
      </div>

      {resposta}

      <div className="hm-rodape">
        {rodape}
        <span className="hm-nota">{s.notaPonto}</span>
      </div>
    </div>
  );
}
