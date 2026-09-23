"use client";

/**
 * Painel — a composição de dashboards (1B-06): a grelha de três
 * tamanhos (S ⅓ · M ⅔ · L linha inteira) onde o «Hoje em Portugal»
 * da home e as leituras de /dados vivem.
 *
 * As regras são de composição, não de cartão:
 *
 *  - **Nenhum órfão.** A grelha de 6 colunas só fecha em padrões
 *    completos — {L}, {M+S}, {S+M}, {S+S+S} — e `comporPainel`
 *    atribui os tamanhos dentro dos permitidos por cartão para que
 *    cada linha feche exactamente. Abaixo de lg tudo é linha
 *    inteira: o órfão nem sequer se pode desenhar.
 *  - **Vizinhança de codificações.** Cada cartão declara a sua
 *    `codificacao` (linha · pontos · traços · anel · isométrico — o
 *    vazio conta como isométrico, que é a sua ilustração) e dois
 *    seguidos nunca repetem — em dev o painel avisa, no teste unit
 *    falha.
 *  - **Janela partilhada.** UM <Segmentado> por painel («1A · 5A ·
 *    Máx») fatia todas as séries que a suportam (`janela: true`) —
 *    a mediana de 10 anos fica sempre como referência, o que muda é
 *    o recorte desenhado.
 *  - **Frescura.** Todos os cartões nascem sobre o <Cartao> (ou o
 *    <EstadoVazio>): orbe + «leitura {período}» sempre visíveis.
 *
 * Determinista: `comporPainel` é pura — SSR e hidratação atribuem
 * os mesmos tamanhos. `--ei` vai na célula (o índice na leitura do
 * painel) e alimenta o escalonamento de entrada de todos os corpos.
 */
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnelPontos, type PontoAnel } from "@/components/AnelPontos";
import { BarraTracos, type GrupoTracos } from "@/components/BarraTracos";
import {
  Cartao,
  type AcaoCartao,
  type EstadoCartao,
  type FonteCartao,
} from "@/components/Cartao";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Haltere } from "@/components/Haltere";
import type { NomeIcone } from "@/components/Icone";
import { Isometrico, type CamadaIsometrica } from "@/components/Isometrico";
import {
  Leitura,
  type LeituraProps,
  type PontoLeitura,
} from "@/components/Leitura";
import { Odometer } from "@/components/Odometer";
import { Segmentado, type OpcaoSegmento } from "@/components/Segmentado";
import { Valor } from "@/components/Valor";
import { fmtPeriodo } from "@/lib/format";
import { fmtViz, type FormatoViz } from "@/lib/viz/formatos";
import {
  comporPainel,
  cortarJanela,
  validarVizinhanca,
  type CodificacaoPainel,
  type JanelaId,
  type TamanhoPainel,
} from "@/lib/painel";

/* ————— a configuração: o que um cartão declara ————— */

/** a casca Ledger comum — a mesma anatomia do Leitura, montada à
    mão para as outras codificações (orbe + «leitura …» garantidos) */
export interface CascaPainel {
  breadcrumb: string;
  icone?: NomeIcone;
  /** spans do cabeçalho — «leitura {período}» é obrigatória */
  meta: string[];
  estado: EstadoCartao;
  estadoRotulo: string;
  fonte: FonteCartao;
  acoes: AcaoCartao[];
}

/** o número herói de um cartão — valor + casas + unidade (o
    Odometer trata do resto) */
export interface ValorPainel {
  v: number;
  casas: number;
  /** sem espaço — «%», «€/L»; a ponte é o FINO do Valor */
  unidade?: string;
}

export interface SpecLinha
  extends Omit<LeituraProps, "amplo" | "entrada" | "anotacao"> {
  /** UMA anotação por janela — calculada no servidor sobre a série
      já fatiada; fora da janela a anotação simplesmente não se
      desenha */
  anotacoes?: Partial<Record<JanelaId, { t: string; rotulo: string }>>;
}

export interface CategoriaHaltereSerie {
  id: string;
  rotulo: string;
  rotuloCurto?: string;
  /** a série inteira — «antes»/«agora» saem da fatia da janela */
  serie: PontoLeitura[];
}

export interface SpecHaltere {
  casca: CascaPainel;
  insight: string;
  /** número herói — a leitura principal (ex.: a 12M do conjunto) */
  valor?: ValorPainel;
  categorias: CategoriaHaltereSerie[];
  formato: FormatoViz;
  unidadeDelta?: string;
  bomSubir?: boolean;
}

export interface SpecTracos {
  casca: CascaPainel;
  insight: string;
  valor?: ValorPainel;
  grupos: GrupoTracos[];
  /** «1 trimestre», «1 mês» — escreve-se «1 traço = {unidadeTraco}» */
  unidadeTraco: string;
  /** o que se conta — «trimestres seguidos a subir» */
  rotulo: string;
  /** o número da contagem, já formatado («50») */
  valorTracos?: string;
  nota?: string;
  equivalente?: string;
}

export interface SpecAnel {
  casca: CascaPainel;
  insight: string;
  pontos: PontoAnel[];
  centro: { valor: string; rotulo?: string };
  comRotulos?: boolean;
  equivalente?: string;
}

export interface CamadaIsoPainel {
  id: string;
  forma: CamadaIsometrica["forma"];
  rotulo: string;
  detalhe: string;
  tom: CamadaIsometrica["tom"];
  texto?: string;
  textoLista?: string;
}

export interface SpecIso {
  tipo: "estrutura";
  casca: CascaPainel;
  insight: string;
  camadas: CamadaIsoPainel[];
  numero?: { kicker: string; valor: string; pequeno?: string };
  /** nome do equivalente — vira data-{nome}-lista na <ol> */
  nome: string;
}

export interface SpecVazio {
  tipo: "vazio";
  titulo: string;
  falha?: string;
  desde?: string;
  fonte?: { nome: string; url?: string };
}

interface BaseCartao {
  id: string;
  /** tamanho preferido — defeito "M" */
  tamanho?: TamanhoPainel;
  /** tamanhos aceites — defeito ["S","M"]; o herói declara ["L"] */
  tamanhos?: readonly TamanhoPainel[];
  /** true → a série responde ao <Segmentado> de janela */
  janela?: boolean;
}

export interface CartaoLinha extends BaseCartao {
  codificacao: "linha";
  linha: SpecLinha;
}
export interface CartaoPontos extends BaseCartao {
  codificacao: "pontos";
  pontos: SpecHaltere;
}
export interface CartaoTracos extends BaseCartao {
  codificacao: "tracos";
  tracos: SpecTracos;
}
export interface CartaoAnel extends BaseCartao {
  codificacao: "anel";
  anel: SpecAnel;
}
export interface CartaoIso extends BaseCartao {
  codificacao: "isometrico";
  isometrico: SpecIso | SpecVazio;
}

export type CartaoPainel =
  | CartaoLinha
  | CartaoPontos
  | CartaoTracos
  | CartaoAnel
  | CartaoIso;

export interface PainelProps {
  /** os cartões na ordem de leitura — ordem editorial, o packing
      só decide tamanhos */
  cartoes: CartaoPainel[];
  /** nome acessível + legenda do controlo de janela —
      «Janela temporal» */
  rotuloJanela: string;
  /** as opções na ordem do Segmentado — «1A · 5A · Máx» */
  opcoesJanela: readonly OpcaoSegmento[];
  className?: string;
}

/* ————— anatomia comum dos cartões não-linha ————— */

function Casca({ casca, children }: { casca: CascaPainel; children: ReactNode }) {
  return (
    <Cartao
      breadcrumb={casca.breadcrumb}
      icone={casca.icone}
      meta={casca.meta}
      estado={casca.estado}
      estadoRotulo={casca.estadoRotulo}
      fonte={casca.fonte}
      acoes={casca.acoes}
    >
      {children}
    </Cartao>
  );
}

/** o corpo no registo Leitura: insight serifado + número herói
    opcional + a figura */
function Corpo({
  insight,
  valor,
  children,
}: {
  insight: string;
  valor?: ValorPainel;
  children: ReactNode;
}) {
  return (
    <>
      <p className="leitura-insight">{insight}</p>
      {valor && (
        <p className="leitura-valor num">
          <Valor
            numero={<Odometer valor={valor.v} casas={valor.casas} />}
            unidade={valor.unidade}
          />
        </p>
      )}
      {children}
    </>
  );
}

const SPAN_CLASSE: Record<TamanhoPainel, string> = {
  S: "col-span-6 lg:col-span-2",
  M: "col-span-6 lg:col-span-4",
  L: "col-span-6",
};

function CartaoDoPainel({
  c,
  tam,
  janela,
}: {
  c: CartaoPainel;
  tam: TamanhoPainel;
  janela: JanelaId;
}) {
  switch (c.codificacao) {
    case "linha": {
      const { anotacoes, ...s } = c.linha;
      const serie = c.janela ? cortarJanela(s.serie, janela) : s.serie;
      const referencia =
        c.janela && s.referencia && "pontos" in s.referencia
          ? {
              pontos: cortarJanela(s.referencia.pontos, janela),
              rotulo: s.referencia.rotulo,
            }
          : s.referencia;
      const anotacao = c.janela
        ? (anotacoes?.[janela] ?? anotacoes?.max)
        : anotacoes?.max;
      return (
        <Leitura
          {...s}
          serie={serie}
          referencia={referencia}
          anotacao={anotacao}
          amplo={tam === "L"}
        />
      );
    }

    case "pontos": {
      const s = c.pontos;
      const fatias = s.categorias.map((cat) => {
        const serie = c.janela ? cortarJanela(cat.serie, janela) : cat.serie;
        return { cat, serie };
      });
      const primeira = fatias[0]?.serie ?? [];
      const categorias = fatias.map(({ cat, serie }) => ({
        id: cat.id,
        rotulo: cat.rotulo,
        rotuloCurto: cat.rotuloCurto,
        antes: serie[0]?.v ?? 0,
        agora: serie[serie.length - 1]?.v ?? 0,
      }));
      const equivalente = categorias
        .map(
          (cat) =>
            `${cat.rotulo}: ${fmtViz(s.formato, cat.antes)} → ${fmtViz(s.formato, cat.agora)}`
        )
        .join("; ");
      return (
        <Casca casca={s.casca}>
          <Corpo insight={s.insight} valor={s.valor}>
            <Haltere
              categorias={categorias}
              formato={s.formato}
              unidadeDelta={s.unidadeDelta}
              rotuloAntes={
                primeira.length ? fmtPeriodo(primeira[0].t) : ""
              }
              rotuloAgora={
                primeira.length
                  ? fmtPeriodo(primeira[primeira.length - 1].t)
                  : ""
              }
              bomSubir={s.bomSubir}
              equivalente={equivalente}
            />
          </Corpo>
        </Casca>
      );
    }

    case "tracos": {
      const s = c.tracos;
      return (
        <Casca casca={s.casca}>
          <Corpo insight={s.insight} valor={s.valor}>
            <BarraTracos
              grupos={s.grupos}
              unidadeTraco={s.unidadeTraco}
              rotulo={s.rotulo}
              valor={s.valorTracos}
              nota={s.nota}
              equivalente={s.equivalente}
            />
          </Corpo>
        </Casca>
      );
    }

    case "anel": {
      const s = c.anel;
      return (
        <Casca casca={s.casca}>
          <Corpo insight={s.insight}>
            <AnelPontos
              pontos={s.pontos}
              centro={s.centro}
              comRotulos={s.comRotulos}
              equivalente={s.equivalente}
            />
          </Corpo>
        </Casca>
      );
    }

    case "isometrico": {
      const s = c.isometrico;
      if (s.tipo === "vazio") {
        return (
          <EstadoVazio
            titulo={s.titulo}
            falha={s.falha}
            desde={s.desde}
            fonte={s.fonte}
            className="h-full"
          />
        );
      }
      return (
        <Casca casca={s.casca}>
          <Corpo insight={s.insight}>
            <Isometrico
              camadas={s.camadas}
              numero={s.numero}
              nome={s.nome}
            />
          </Corpo>
        </Casca>
      );
    }
  }
}

export function Painel({
  cartoes,
  rotuloJanela,
  opcoesJanela,
  className,
}: PainelProps) {
  const [janela, setJanela] = useState<JanelaId>("max");
  const tams = useMemo(() => comporPainel(cartoes), [cartoes]);

  if (process.env.NODE_ENV !== "production") {
    const faltas = validarVizinhanca(cartoes.map((c) => c.codificacao));
    if (faltas.length) {
      console.warn(
        `[Painel] vizinhança violada — codificação repetida em cartões seguidos: ${faltas
          .map((f) => `#${f.a}/#${f.b} «${f.codificacao}»`)
          .join(", ")}.`
      );
    }
    if (!tams) {
      console.warn(
        "[Painel] nenhuma atribuição de tamanhos fecha a grelha — revê os `tamanhos` permitidos por cartão."
      );
    }
  }

  const temJanela = cartoes.some((c) => c.janela);

  return (
    <div className={className} data-painel>
      {temJanela && (
        <div className="mb-4 flex items-center justify-end gap-3">
          <span className="num text-rotulo text-muted">
            {rotuloJanela}
          </span>
          <Segmentado
            rotulo={rotuloJanela}
            valor={janela}
            onChange={(id) => setJanela(id as JanelaId)}
            opcoes={opcoesJanela}
          />
        </div>
      )}
      <div className="pnl-grid grid grid-cols-6 gap-5">
        {cartoes.map((c, i) => {
          const tam = tams?.[i] ?? c.tamanho ?? "M";
          return (
            <div
              key={c.id}
              className={`pnl-cell ${SPAN_CLASSE[tam]}`}
              data-cod={c.codificacao}
              style={{ "--ei": i } as CSSProperties}
            >
              <CartaoDoPainel c={c} tam={tam} janela={janela} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { CodificacaoPainel, JanelaId, TamanhoPainel };
