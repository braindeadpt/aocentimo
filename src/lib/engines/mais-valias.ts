import maisValias from "@data/fiscal/mais-valias.json";
import { REGRAS_IRS, impostoPorEscaloes } from "./irs";

/**
 * Mais-valias (cat. G): taxa autónoma vs englobamento. Mobiliários com
 * exclusão por tempo de detenção; cripto isenta ≥365 dias; imóveis
 * englobam 50 % (com isenção proporcional por reinvestimento em HPP).
 */

interface RegrasMV {
  fonte: string;
  fonteUrl: string;
  mobiliarios: {
    taxaAutonoma: number;
    exclusoesDetencao: { anosMin: number; exclusao: number }[];
    perdasCompensaveisAnos: number;
  };
  cripto: { isencaoDetencaoDias: number; taxa: number };
  imoveis: { percentagemEnglobada: number };
}

export const REGRAS_MV = maisValias as RegrasMV;

export type TipoAtivo = "mobiliarios" | "cripto" | "imovel";

export interface ResultadoMaisValia {
  maisValia: number;
  tributavel: number; // após exclusões/reinvestimento
  impostoAutonomo: number | null; // null = englobamento obrigatório (imóvel)
  impostoEnglobado: number; // imposto extra por englobar
  melhor: "autonomo" | "englobado" | "impovel";
  excluido: number; // fração excluída por detenção/reinvestimento
}

export function simularMaisValia(
  venda: number,
  compra: number,
  opts: {
    tipo?: TipoAtivo;
    despesas?: number;
    diasDetencao?: number; // cripto
    anosDetencao?: number; // mobiliários/imóvel
    mercadoRegulamentado?: boolean;
    pctReinvestida?: number; // imóvel HPP
    coletavelOutros?: number; // rendimento coletável sem a mais-valia
    ano?: number;
  } = {}
): ResultadoMaisValia {
  const {
    tipo = "mobiliarios",
    despesas = 0,
    diasDetencao = 0,
    anosDetencao = 0,
    mercadoRegulamentado = true,
    pctReinvestida = 0,
    coletavelOutros = 0,
    ano = 2026,
  } = opts;
  const regras = REGRAS_IRS[ano];
  const mv = Math.max(0, venda - compra - despesas);

  let tributavel = mv;
  let excluido = 0;
  let autonomo: number | null = null;

  if (tipo === "cripto") {
    if (diasDetencao >= REGRAS_MV.cripto.isencaoDetencaoDias) {
      tributavel = 0;
      excluido = 1;
    } else {
      autonomo = mv * REGRAS_MV.cripto.taxa;
    }
  } else if (tipo === "imovel") {
    const base = mv * REGRAS_MV.imoveis.percentagemEnglobada;
    tributavel = base * (1 - Math.min(1, pctReinvestida));
    excluido = 1 - (tributavel / Math.max(mv, 1e-9));
    // englobamento obrigatório — sem taxa autónoma
  } else {
    const ex = mercadoRegulamentado
      ? (REGRAS_MV.mobiliarios.exclusoesDetencao
          .filter((e) => anosDetencao >= e.anosMin)
          .at(-1)?.exclusao ?? 0)
      : 0;
    tributavel = mv * (1 - ex);
    excluido = ex;
    autonomo = tributavel * REGRAS_MV.mobiliarios.taxaAutonoma;
  }

  const englobado =
    impostoPorEscaloes(coletavelOutros + tributavel, regras) -
    impostoPorEscaloes(coletavelOutros, regras);

  const melhor =
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
}
