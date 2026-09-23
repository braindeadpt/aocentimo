/**
 * paineis — os construtores servidor das composições <Painel>
 * (1B-06): o «Hoje em Portugal» da home e «O país, em leituras» de
 * /dados. Montam a configuração declarativa (codificação + tamanho
 * preferido + spec serializável por cartão) a partir das fontes
 * reais — nada é inventado: séries de data/sources, derivados de
 * data/derived, decomposição de data/fiscal + motores.
 *
 * SERVIDOR-ONLY: importa `m`/`t` e `loadFonte`/`loadDerivado` —
 * nunca importar num client component. O <Painel> recebe o
 * resultado por props e só faz composição.
 */
import type {
  CartaoIso,
  CartaoLinha,
  CartaoPainel,
  CascaPainel,
} from "@/components/Painel";
import type { OpcaoSegmento } from "@/components/Segmentado";
import type { EstadoLeitura, PontoLeitura } from "@/components/Leitura";
import {
  loadDerivado,
  loadFonte,
  loadFreshness,
  loadPainel,
} from "@/lib/data";
import {
  anotacaoDe,
  estadoDe,
  homologa,
  insightMediana,
  janela10,
  mediana,
  rotulosLeitura,
  type Cartao,
} from "@/lib/leitura";
import {
  comUnidade,
  fmtLitro,
  fmtNum,
  fmtPeriodo,
} from "@/lib/format";
import { JANELA_ORDEM, cortarJanela, type JanelaId } from "@/lib/painel";
import { decomporCombustivel } from "@/lib/engines/impostos";
import { m, t } from "@/lib/messages";
import isp from "@data/fiscal/isp.json";

type PontoS = PontoLeitura;

/** a forma mínima de uma fonte de série — cobre data/sources e os
    derivados com meta de fonte */
interface FontePais {
  meta: { fonte: string; url: string; serieAte?: string };
  series: PontoS[];
}

/* ————— helpers partilhados ————— */

const ult = (s: PontoS[]) => s[s.length - 1];

/** anotações por janela — cada recorte tem o SEU extremo real,
    calculado no servidor (a anotação é sempre um dado) */
function anotacoes(
  serie: PontoS[],
  tipo: "max" | "min",
  fmt: (v: number) => string
): CartaoLinha["linha"]["anotacoes"] {
  const out: Partial<Record<JanelaId, { t: string; rotulo: string }>> = {};
  for (const j of JANELA_ORDEM) {
    const a = anotacaoDe(cortarJanela(serie, j), tipo, fmt);
    if (a) out[j] = a;
  }
  return out;
}

/** a casca Ledger comum dos cartões não-linha — orbe + «leitura
    {período}» + fonte + acções, a mesma anatomia do Leitura */
function casca(o: {
  breadcrumb: string;
  leitura: string;
  estado: EstadoLeitura;
  estadoRotulo: string;
  fonteNome: string;
  fonteUrl: string;
  href: string;
  hrefJson: string;
  titulo: string;
}): CascaPainel {
  const rotulos = rotulosLeitura();
  return {
    breadcrumb: o.breadcrumb,
    meta: [`${rotulos.leitura} ${o.leitura}`],
    estado: o.estado,
    estadoRotulo: o.estadoRotulo,
    fonte: {
      rotulo: rotulos.fonte,
      itens: [{ nome: o.fonteNome, url: o.fonteUrl }],
    },
    acoes: [
      { href: o.href, rotulo: `${rotulos.pagina} →`, ariaLabel: o.titulo },
      {
        copiar: o.hrefJson,
        rotulo: rotulos.json,
        ariaLabel: rotulos.jsonAria,
      },
    ],
  };
}

/** o slot nunca desaparece — fonte em falta = EstadoVazio no lugar,
    codificação «isometrico» (a ilustração da peça em falta) */
function vazio(o: {
  id: string;
  titulo: string;
  desde?: string;
  fonte: { nome: string; url?: string };
  tamanho?: CartaoIso["tamanho"];
  tamanhos?: CartaoIso["tamanhos"];
}): CartaoIso {
  return {
    id: o.id,
    codificacao: "isometrico",
    tamanho: o.tamanho,
    tamanhos: o.tamanhos,
    isometrico: {
      tipo: "vazio",
      titulo: o.titulo,
      falha: m.estados.serieFalhou,
      desde: o.desde,
      fonte: o.fonte,
    },
  };
}

/** riscos consecutivos do mesmo sinal no fim da série — a contagem
    da barra de traços («sobe há N trimestres») */
function riscos(serie: PontoS[]): { n: number; sobe: boolean } {
  const u = ult(serie);
  if (!u) return { n: 0, sobe: true };
  const sobe = u.v >= 0;
  let n = 0;
  for (let i = serie.length - 1; i >= 0; i--) {
    if ((serie[i].v >= 0) === sobe) n++;
    else break;
  }
  return { n, sobe };
}

/** as opções do <Segmentado> partilhado — o rótulo vem das messages */
export function opcoesJanela(): OpcaoSegmento[] {
  return JANELA_ORDEM.map((id) => ({
    id,
    rotulo: m.painel.janela.opcoes[id],
  }));
}

export const ROTULO_JANELA = () => m.painel.janela.rotulo;

/* ————— «Hoje em Portugal» — a grelha da home ————— */

export function cartoesHome(): CartaoPainel[] {
  const painel = loadPainel();
  const pSerie = (id: string) =>
    painel?.series.find((s) => s.id === id) ?? null;
  const c = m.painel.cartoes;
  const rotulos = rotulosLeitura();

  // ————— inflação — o herói em linha anotada (L) —————
  const infl = pSerie("inflacao-homologa");
  const hicp = loadFonte("eurostat", "hicp-pt-cp00");
  const serieInfl = hicp ? janela10(homologa(hicp.series, 12)) : [];
  const cartaoInfl: CartaoPainel =
    infl && serieInfl.length > 1
      ? {
          id: "inflacao",
          codificacao: "linha",
          tamanho: "L",
          tamanhos: ["L"],
          janela: true,
          linha: {
            breadcrumb: c.inflacao.breadcrumb,
            titulo: c.inflacao.titulo,
            insight: insightMediana(infl.valor, infl.referencia, infl.unidade),
            valor: infl.valor,
            unidade: infl.unidade,
            formato: "pct",
            serie: serieInfl,
            referencia: infl.referencia ?? undefined,
            anotacoes: anotacoes(serieInfl, "max", (v) =>
              comUnidade(fmtNum(v, 1), "%")
            ),
            leitura: fmtPeriodo(infl.rotuloAte ?? infl.t),
            estado: infl.estado,
            fonteNome: infl.fonte,
            fonteUrl: infl.url,
            href: "/inflacao",
            hrefJson: "/api/hicp-pt-cp00.json",
            rotulos,
          },
        }
      : vazio({
          id: "inflacao",
          titulo: c.inflacao.titulo,
          desde: hicp?.meta.serieAte
            ? fmtPeriodo(hicp.meta.serieAte)
            : undefined,
          fonte: {
            nome: hicp?.meta.fonte ?? "Eurostat",
            url: hicp?.meta.url ?? "https://ec.europa.eu/eurostat",
          },
          tamanho: "L",
          tamanhos: ["L"],
        });

  // ————— Euribor — os quatro prazos em haltere (pontos, M) —————
  const eur = pSerie("euribor-12m-mensal");
  const PRAZOS: { id: string; fonte: string; rotulo: string }[] = [
    { id: "1M", fonte: "euribor-1m-mensal", rotulo: "Euribor 1M" },
    { id: "3M", fonte: "euribor-3m-mensal", rotulo: "Euribor 3M" },
    { id: "6M", fonte: "euribor-6m-mensal", rotulo: "Euribor 6M" },
    { id: "12M", fonte: "euribor-12m-mensal", rotulo: "Euribor 12M" },
  ];
  const eurFontes = PRAZOS.map((p) => ({
    ...p,
    dados: loadFonte("bpstat", p.fonte),
  }));
  const eur12 = eurFontes[3].dados;
  const cartaoEur: CartaoPainel =
    eur && eurFontes.every((f) => f.dados && janela10(f.dados.series).length > 1)
      ? {
          id: "euribor",
          codificacao: "pontos",
          tamanho: "M",
          janela: true,
          pontos: {
            casca: casca({
              breadcrumb: c.euribor.breadcrumb,
              leitura: fmtPeriodo(eur.rotuloAte ?? eur.t),
              estado: eur.estado,
              estadoRotulo: rotulos.estados[eur.estado],
              fonteNome: eur.fonte,
              fonteUrl: eur.url,
              href: "/credito",
              hrefJson: "/api/euribor-12m-mensal.json",
              titulo: c.euribor.titulo,
            }),
            insight: insightMediana(
              eur.valor,
              eur.referencia,
              eur.unidade
            ),
            valor: { v: eur.valor, casas: 2, unidade: "%" },
            categorias: eurFontes.map((f) => ({
              id: f.id,
              rotulo: f.rotulo,
              rotuloCurto: f.id,
              serie: janela10(f.dados!.series),
            })),
            formato: "pct",
            bomSubir: false,
          },
        }
      : vazio({
          id: "euribor",
          titulo: c.euribor.titulo,
          desde: eur12?.meta.serieAte
            ? fmtPeriodo(eur12.meta.serieAte)
            : undefined,
          fonte: {
            nome: eur12?.meta.fonte ?? "Banco de Portugal — BPstat",
            url: eur12?.meta.url ?? "https://bpstat.bportugal.pt",
          },
        });

  // ————— desemprego — PT contra a UE em linha (S) —————
  const une = pSerie("une-pt-total");
  const unePt = loadFonte("eurostat", "une-pt-total");
  const uneUe = loadFonte("eurostat", "une-ue27-total");
  const serieUne = unePt ? janela10(unePt.series) : [];
  const serieUe = uneUe ? janela10(uneUe.series) : [];
  const cartaoUne: CartaoPainel =
    une && serieUne.length > 1 && serieUe.length > 1
      ? {
          id: "desemprego",
          codificacao: "linha",
          tamanho: "S",
          janela: true,
          linha: {
            breadcrumb: c.desemprego.breadcrumb,
            titulo: c.desemprego.titulo,
            insight: une.referencia
              ? t(m.painel.insightUe, {
                  abs: fmtNum(
                    Math.abs(une.valor - une.referencia.valor),
                    1
                  ),
                  direcao:
                    une.valor >= une.referencia.valor
                      ? m.painel.acima
                      : m.painel.abaixo,
                })
              : comUnidade(fmtNum(une.valor, 1), "%"),
            valor: une.valor,
            unidade: une.unidade,
            formato: "pct1",
            serie: serieUne,
            referencia: { pontos: serieUe, rotulo: m.leitura.ue27 },
            anotacoes: anotacoes(serieUne, "max", (v) =>
              comUnidade(fmtNum(v, 1), "%")
            ),
            leitura: fmtPeriodo(une.rotuloAte ?? une.t),
            estado: une.estado,
            fonteNome: une.fonte,
            fonteUrl: une.url,
            href: "/trabalho",
            hrefJson: "/api/une-pt-total.json",
            rotulos,
          },
        }
      : vazio({
          id: "desemprego",
          titulo: c.desemprego.titulo,
          desde: unePt?.meta.serieAte
            ? fmtPeriodo(unePt.meta.serieAte)
            : undefined,
          fonte: {
            nome: unePt?.meta.fonte ?? "Eurostat",
            url: unePt?.meta.url ?? "https://ec.europa.eu/eurostat",
          },
        });

  // ————— habitação — a subida em barra de traços (S): cada traço
  //   é um trimestre da risca consecutiva de variação homóloga —————
  const hpi = pSerie("hpi-pt");
  const hpiFonte = loadFonte("eurostat", "hpi-pt");
  const serieHpi = hpiFonte ? janela10(homologa(hpiFonte.series, 4)) : [];
  const homHpi = hpiFonte ? homologa(hpiFonte.series, 4) : [];
  const valorHpi = ult(serieHpi)?.v;
  const riscosHpi = riscos(homHpi);
  const cartaoHab: CartaoPainel =
    hpi && serieHpi.length > 1 && valorHpi !== undefined && riscosHpi.n > 0
      ? {
          id: "habitacao",
          codificacao: "tracos",
          tamanho: "S",
          tracos: {
            casca: casca({
              breadcrumb: c.habitacao.breadcrumb,
              leitura: fmtPeriodo(hpi.rotuloAte ?? hpi.t),
              estado: hpi.estado,
              estadoRotulo: rotulos.estados[hpi.estado],
              fonteNome: hpi.fonte,
              fonteUrl: hpi.url,
              href: "/dados",
              hrefJson: "/api/hpi-pt.json",
              titulo: c.habitacao.titulo,
            }),
            insight: insightMediana(
              valorHpi,
              { valor: mediana(serieHpi.map((p) => p.v)) ?? 0 },
              "%"
            ),
            valor: { v: valorHpi, casas: 1, unidade: "%" },
            grupos: [
              {
                n: riscosHpi.n,
                tom: "marca",
                rotulo: riscosHpi.sobe
                  ? m.painel.tracosSubir
                  : m.painel.tracosDescer,
              },
            ],
            unidadeTraco: m.painel.umTrimestre,
            rotulo: riscosHpi.sobe
              ? m.painel.tracosSubir
              : m.painel.tracosDescer,
            valorTracos: fmtNum(riscosHpi.n, 0),
            nota: fmtPeriodo(ult(homHpi)?.t ?? ""),
          },
        }
      : vazio({
          id: "habitacao",
          titulo: c.habitacao.titulo,
          desde: hpiFonte?.meta.serieAte
            ? fmtPeriodo(hpiFonte.meta.serieAte)
            : undefined,
          fonte: {
            nome: hpiFonte?.meta.fonte ?? "Eurostat",
            url: hpiFonte?.meta.url ?? "https://ec.europa.eu/eurostat",
          },
        });

  // ————— gasóleo — a estrutura do litro em isométrico (S): IVA,
  //   ISP e carbono sobre o combustível — decomposição real —————
  const gas = pSerie("pmd-gasoleo-diario");
  const gasFonte = loadFonte("dgeg", "pmd-gasoleo-diario");
  const precoGas = ult(gasFonte?.series ?? [])?.v;
  const serieGas10 = gasFonte ? janela10(gasFonte.series) : [];
  const medGas = mediana(serieGas10.map((p) => p.v));
  const decGas =
    precoGas !== undefined
      ? decomporCombustivel(
          precoGas,
          isp.gasoleo.ispELitro,
          isp.gasoleo.carbonoELitro
        )
      : null;
  const isoGas = m.painel.isoGasoleo;
  const cartaoGas: CartaoPainel =
    gas && gasFonte && precoGas !== undefined && decGas && medGas !== null
      ? {
          id: "gasoleo",
          codificacao: "isometrico",
          tamanho: "S",
          isometrico: {
            tipo: "estrutura",
            nome: "gasoleo",
            casca: casca({
              breadcrumb: c.gasoleo.breadcrumb,
              leitura: fmtPeriodo(gas.rotuloAte ?? gas.t),
              estado: gas.estado,
              estadoRotulo: rotulos.estados[gas.estado],
              fonteNome: `${gasFonte.meta.fonte} + ${isp.fonte.split(";")[0]}`,
              fonteUrl: gasFonte.meta.url,
              href: "/precos",
              hrefJson: "/api/pmd-gasoleo-diario.json",
              titulo: c.gasoleo.titulo,
            }),
            insight: t(m.painel.insightLitro, {
              abs: fmtNum(Math.abs(precoGas - medGas) * 100, 1),
              direcao: precoGas >= medGas ? m.painel.acima : m.painel.abaixo,
            }),
            numero: {
              kicker: isoGas.kicker,
              valor: fmtLitro(precoGas),
              pequeno: fmtPeriodo(gas.rotuloAte ?? gas.t),
            },
            camadas: [
              {
                id: "litro",
                forma: "moeda",
                rotulo: isoGas.litro.rotulo,
                detalhe: isoGas.litro.detalhe,
                tom: "neutro",
                textoLista: fmtLitro(precoGas),
              },
              {
                id: "iva",
                forma: "placa",
                rotulo: isoGas.iva.rotulo,
                detalhe: isoGas.iva.detalhe,
                tom: "corte",
                texto: fmtLitro(decGas.iva),
                textoLista: fmtLitro(decGas.iva),
              },
              {
                id: "isp",
                forma: "placa",
                rotulo: isoGas.isp.rotulo,
                detalhe: isoGas.isp.detalhe,
                tom: "corte",
                texto: fmtLitro(decGas.isp),
                textoLista: fmtLitro(decGas.isp),
              },
              {
                id: "carbono",
                forma: "placa",
                rotulo: isoGas.carbono.rotulo,
                detalhe: isoGas.carbono.detalhe,
                tom: "corte",
                texto: fmtLitro(decGas.carbono),
                textoLista: fmtLitro(decGas.carbono),
              },
              {
                id: "produto",
                forma: "base",
                rotulo: isoGas.produto.rotulo,
                detalhe: isoGas.produto.detalhe,
                tom: "neutro",
                texto: fmtLitro(decGas.produto),
                textoLista: fmtLitro(decGas.produto),
              },
            ],
          },
        }
      : vazio({
          id: "gasoleo",
          titulo: c.gasoleo.titulo,
          desde: gasFonte?.meta.serieAte
            ? fmtPeriodo(gasFonte.meta.serieAte)
            : undefined,
          fonte: {
            nome: gasFonte?.meta.fonte ?? "DGEG",
            url: gasFonte?.meta.url ?? "https://www.dgeg.gov.pt",
          },
        });

  // ————— PIB — variação homóloga em linha (S) —————
  const pib = pSerie("pib-pt-homologo");
  const pibFonte = loadFonte("eurostat", "pib-pt-homologo");
  const seriePib = pibFonte ? janela10(pibFonte.series) : [];
  const cartaoPib: CartaoPainel =
    pib && seriePib.length > 1
      ? {
          id: "pib",
          codificacao: "linha",
          tamanho: "S",
          janela: true,
          linha: {
            breadcrumb: c.pib.breadcrumb,
            titulo: c.pib.titulo,
            insight: insightMediana(pib.valor, pib.referencia, pib.unidade),
            valor: pib.valor,
            unidade: pib.unidade,
            formato: "pct1",
            serie: seriePib,
            referencia: pib.referencia ?? undefined,
            anotacoes: anotacoes(seriePib, "min", (v) =>
              comUnidade(fmtNum(v, 1), "%")
            ),
            leitura: fmtPeriodo(pib.rotuloAte ?? pib.t),
            estado: pib.estado,
            fonteNome: pib.fonte,
            fonteUrl: pib.url,
            href: "/dados",
            hrefJson: "/api/pib-pt-homologo.json",
            rotulos,
          },
        }
      : vazio({
          id: "pib",
          titulo: c.pib.titulo,
          desde: pibFonte?.meta.serieAte
            ? fmtPeriodo(pibFonte.meta.serieAte)
            : undefined,
          fonte: {
            nome: pibFonte?.meta.fonte ?? "Eurostat",
            url: pibFonte?.meta.url ?? "https://ec.europa.eu/eurostat",
          },
        });

  return [cartaoInfl, cartaoEur, cartaoUne, cartaoHab, cartaoGas, cartaoPib];
}

/* ————— «O país, em leituras» — a grelha de /dados ————— */

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function cartoesDados(): CartaoPainel[] {
  const fresh = loadFreshness();
  const rotulos = rotulosLeitura();
  const rotPais = m.leitura.pais;
  const c = m.painel.cartoes;

  /** leitura em linha — o cartaoPais de /dados adaptado ao spec do
      painel (anotações por janela incluídas) */
  const linhaPais = (
    fonte: FontePais | null,
    rot: { breadcrumb: string; titulo: string },
    o: {
      id: string;
      href: string;
      formato: Cartao["formato"];
      unidade: string;
      casas: number;
      anot: "max" | "min";
      semSla?: boolean;
      insight?: (ult: number, med: number | null) => string;
      referencia?: Cartao["referencia"];
      rotuloFmt?: (v: number) => string;
      tamanho?: CartaoLinha["tamanho"];
    }
  ): CartaoPainel => {
    const serie = fonte ? janela10(fonte.series) : [];
    const u = ult(serie);
    if (!fonte || !u || serie.length < 2) {
      return vazio({
        id: o.id,
        titulo: rot.titulo,
        desde: fonte?.meta.serieAte ? fmtPeriodo(fonte.meta.serieAte) : undefined,
        fonte: { nome: fonte?.meta.fonte ?? "Eurostat", url: fonte?.meta.url },
        tamanho: o.tamanho,
      });
    }
    const med = mediana(serie.map((p) => p.v));
    const estado: EstadoLeitura = o.semSla ? "sem-sla" : estadoDe(fresh, o.id);
    const fmtRot =
      o.rotuloFmt ?? ((v: number) => comUnidade(fmtNum(v, o.casas), o.unidade));
    return {
      id: o.id,
      codificacao: "linha",
      tamanho: o.tamanho ?? "S",
      janela: true,
      linha: {
        breadcrumb: rot.breadcrumb,
        titulo: rot.titulo,
        insight: o.insight
          ? o.insight(u.v, med)
          : insightMediana(u.v, med !== null ? { valor: med } : null, o.unidade),
        valor: u.v,
        unidade: o.unidade,
        formato: o.formato,
        serie,
        referencia:
          o.referencia ??
          (med !== null
            ? { valor: med, rotulo: m.leitura.mediana10 }
            : undefined),
        anotacoes: anotacoes(serie, o.anot, fmtRot),
        leitura: fmtPeriodo(u.t),
        estado,
        fonteNome: fonte.meta.fonte,
        fonteUrl: fonte.meta.url,
        href: o.href,
        hrefJson: `/api/${o.id}.json`,
        rotulos,
      },
    };
  };

  // ————— confiança — o ano em anel de pontos (S): os últimos 12
  //   meses são um ciclo, o «agora» ganha o anel de marca —————
  const confFonte = loadFonte("eurostat", "confianca-pt");
  const conf12 = confFonte ? confFonte.series.slice(-12) : [];
  const confUlt = ult(conf12);
  const confMed = confFonte
    ? mediana(janela10(confFonte.series).map((p) => p.v))
    : null;
  const confEstado = estadoDe(fresh, "confianca-pt");
  const cartaoConf: CartaoPainel =
    confFonte && conf12.length === 12 && confUlt
      ? {
          id: "confianca-pt",
          codificacao: "anel",
          tamanho: "S",
          anel: {
            casca: casca({
              breadcrumb: rotPais.confianca.breadcrumb,
              leitura: fmtPeriodo(confUlt.t),
              estado: confEstado,
              estadoRotulo: rotulos.estados[confEstado],
              fonteNome: confFonte.meta.fonte,
              fonteUrl: confFonte.meta.url,
              href: "/dados",
              hrefJson: "/api/confianca-pt.json",
              titulo: rotPais.confianca.titulo,
            }),
            insight: insightMediana(
              confUlt.v,
              confMed !== null ? { valor: confMed } : null,
              "p.p."
            ),
            pontos: conf12.map((p) => ({
              id: p.t,
              rotulo: fmtPeriodo(p.t),
              rotuloCurto: MESES_CURTOS[Number(p.t.slice(5, 7)) - 1],
              tom: "neutro" as const,
              atual: p.t === confUlt.t,
            })),
            centro: {
              valor: fmtNum(confUlt.v, 1),
              rotulo: m.painel.anel.saldo,
            },
            comRotulos: true,
          },
        }
      : vazio({
          id: "confianca-pt",
          titulo: rotPais.confianca.titulo,
          desde: confFonte?.meta.serieAte
            ? fmtPeriodo(confFonte.meta.serieAte)
            : undefined,
          fonte: {
            nome: confFonte?.meta.fonte ?? "Eurostat",
            url: confFonte?.meta.url,
          },
        });

  // ————— custo do trabalho — a risca em traços (S): trimestres
  //   consecutivos de crescimento homólogo —————
  const lciFonte = loadFonte("eurostat", "lci-pt-homologo");
  const lciUlt = ult(lciFonte?.series ?? []);
  const serieLci = lciFonte ? janela10(lciFonte.series) : [];
  const lciMed = mediana(serieLci.map((p) => p.v));
  const riscosLci = riscos(lciFonte?.series ?? []);
  const lciEstado = estadoDe(fresh, "lci-pt-homologo");
  const cartaoLci: CartaoPainel =
    lciFonte && lciUlt && riscosLci.n > 0
      ? {
          id: "lci-pt-homologo",
          codificacao: "tracos",
          tamanho: "S",
          tracos: {
            casca: casca({
              breadcrumb: rotPais.custoTrabalho.breadcrumb,
              leitura: fmtPeriodo(lciUlt.t),
              estado: lciEstado,
              estadoRotulo: rotulos.estados[lciEstado],
              fonteNome: lciFonte.meta.fonte,
              fonteUrl: lciFonte.meta.url,
              href: "/trabalho",
              hrefJson: "/api/lci-pt-homologo.json",
              titulo: rotPais.custoTrabalho.titulo,
            }),
            insight: insightMediana(
              lciUlt.v,
              lciMed !== null ? { valor: lciMed } : null,
              "%"
            ),
            valor: { v: lciUlt.v, casas: 1, unidade: "%" },
            grupos: [
              {
                n: riscosLci.n,
                tom: "marca",
                rotulo: riscosLci.sobe
                  ? m.painel.tracosCrescer
                  : m.painel.tracosDescer,
              },
            ],
            unidadeTraco: m.painel.umTrimestre,
            rotulo: riscosLci.sobe
              ? m.painel.tracosCrescer
              : m.painel.tracosDescer,
            valorTracos: fmtNum(riscosLci.n, 0),
            nota: fmtPeriodo(lciUlt.t),
          },
        }
      : vazio({
          id: "lci-pt-homologo",
          titulo: rotPais.custoTrabalho.titulo,
          desde: lciFonte?.meta.serieAte
            ? fmtPeriodo(lciFonte.meta.serieAte)
            : undefined,
          fonte: {
            nome: lciFonte?.meta.fonte ?? "Eurostat",
            url: lciFonte?.meta.url,
          },
        });

  // ————— desemprego PT−UE — haltere dos dois mercados (pontos, S):
  //   Portugal e UE27 lado a lado, «antes → agora» —————
  const gapDeriv = loadDerivado<FontePais>("desemprego-gap");
  const unePt = loadFonte("eurostat", "une-pt-total");
  const uneUe = loadFonte("eurostat", "une-ue27-total");
  const gapUlt = ult(gapDeriv?.series ?? []);
  const unePtUlt = ult(unePt?.series ?? []);
  const uneUeUlt = ult(uneUe?.series ?? []);
  const gapEstado = estadoDe(fresh, "une-pt-total");
  const cartaoGap: CartaoPainel =
    unePt &&
    uneUe &&
    gapDeriv &&
    gapUlt &&
    unePtUlt &&
    uneUeUlt &&
    janela10(unePt.series).length > 1 &&
    janela10(uneUe.series).length > 1
      ? {
          id: "desemprego-gap",
          codificacao: "pontos",
          tamanho: "S",
          janela: true,
          pontos: {
            casca: casca({
              breadcrumb: rotPais.gap.breadcrumb,
              leitura: fmtPeriodo(gapUlt.t),
              estado: gapEstado,
              estadoRotulo: rotulos.estados[gapEstado],
              fonteNome: gapDeriv.meta.fonte,
              fonteUrl: gapDeriv.meta.url,
              href: "/trabalho",
              hrefJson: "/api/desemprego-gap.json",
              titulo: rotPais.gap.titulo,
            }),
            insight: t(m.painel.insightUe, {
              abs: fmtNum(Math.abs(gapUlt.v), 1),
              direcao: gapUlt.v >= 0 ? m.painel.acima : m.painel.abaixo,
            }),
            valor: { v: gapUlt.v, casas: 1, unidade: "p.p." },
            categorias: [
              {
                id: "pt",
                rotulo: m.painel.gap.portugal,
                rotuloCurto: "PT",
                serie: janela10(unePt.series),
              },
              {
                id: "ue",
                rotulo: m.painel.gap.ue,
                rotuloCurto: "UE",
                serie: janela10(uneUe.series),
              },
            ],
            formato: "pct1",
            bomSubir: false,
          },
        }
      : vazio({
          id: "desemprego-gap",
          titulo: rotPais.gap.titulo,
          desde: gapDeriv?.meta.serieAte
            ? fmtPeriodo(gapDeriv.meta.serieAte)
            : undefined,
          fonte: {
            nome: gapDeriv?.meta.fonte ?? "Eurostat",
            url: gapDeriv?.meta.url,
          },
        });

  return [
    linhaPais(loadFonte("eurostat", "pib-pt-homologo"), c.pib, {
      id: "pib-pt-homologo", href: "/dados", formato: "pct1", unidade: "%",
      casas: 1, anot: "min", tamanho: "M",
    }),
    cartaoConf,
    linhaPais(loadFonte("eurostat", "elec-pt-domestico"), rotPais.eletricidade, {
      id: "elec-pt-domestico", href: "/precos", formato: "kwh",
      unidade: "€/kWh", casas: 4, anot: "max", tamanho: "M",
      insight: (v, med) =>
        med !== null
          ? t(m.painel.insightElec, {
              abs: fmtNum(Math.abs(v - med) * 100, 1),
              direcao: v >= med ? m.painel.acima : m.painel.abaixo,
            })
          : comUnidade(fmtNum(v, 4), "€/kWh"),
    }),
    cartaoLci,
    linhaPais(loadFonte("eurostat", "une-pt-jovem"), rotPais.jovem, {
      id: "une-pt-jovem", href: "/trabalho", formato: "pct1", unidade: "%",
      casas: 1, anot: "max", tamanho: "S",
    }),
    cartaoGap,
    linhaPais(loadDerivado<FontePais>("casa-em-salarios"), rotPais.casaTrabalho, {
      id: "casa-em-salarios", href: "/casa", formato: "num",
      unidade: "índice 2015=100", casas: 1, anot: "max", semSla: true,
      rotuloFmt: (v) => fmtNum(v, 1), tamanho: "S",
      insight: (v) =>
        t(m.painel.insightCasaTrabalho, {
          v: fmtNum(Math.abs(v - 100), 0),
          direcao: v >= 100 ? m.painel.acima : m.painel.abaixo,
        }),
    }),
  ];
}
