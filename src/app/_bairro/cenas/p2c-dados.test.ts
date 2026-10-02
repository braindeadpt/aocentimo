/**
 * Golden tests da P2c — cada número que a cena mostra tem de sair dos
 * ficheiros de `data/` (regra nº1: nada inventado). Cada teste refaz a
 * conta a partir do ficheiro-fonte e compara com o que `dados-p2c.ts`
 * passa às cenas.
 */
import { describe, expect, it } from "vitest";
import casaDer from "@data/derived/casa-em-salarios.json";
import hpiPt from "@data/sources/eurostat/hpi-pt.json";
import hicpCp11 from "@data/sources/eurostat/hicp-pt-cp11.json";
import hicpCp01 from "@data/sources/eurostat/hicp-pt-cp01.json";
import hicpCp00 from "@data/sources/eurostat/hicp-pt-cp00.json";
import uneTotal from "@data/sources/eurostat/une-pt-total.json";
import uneJovem from "@data/sources/eurostat/une-pt-jovem.json";
import uneUe27 from "@data/sources/eurostat/une-ue27-total.json";
import pibJson from "@data/sources/eurostat/pib-pt-homologo.json";
import confJson from "@data/sources/eurostat/confianca-pt.json";
import smnJson from "@data/fiscal/smn.json";
import ivaJson from "@data/fiscal/iva.json";
import {
  dadosCasaP2c,
  dadosEscolaP2c,
  dadosPastelariaP2c,
  dadosQuiosqueP2c,
} from "./dados-p2c";
import { pontosDaSerie } from "./utils";

const DESDE = "2019-01";
const DESDE_CASA = "2015-Q1";

describe("Casa da Inês — meses de trabalho por uma casa", () => {
  const D = dadosCasaP2c();

  it("a razão «hpi ÷ lci» é a série derivada do repositório, desde 2015-Q1", () => {
    const fonte = casaDer.series.filter((p) => p.t >= DESDE_CASA);
    expect(D.razao.length).toBe(fonte.length);
    expect(D.razao[0]).toEqual(fonte[0]);
    expect(D.razao.at(-1)).toEqual(fonte.at(-1));
  });

  it("a resposta em meses é o último ponto arredondado — nunca um número escrito à mão", () => {
    const ult = casaDer.series.at(-1)!.v;
    expect(D.meses).toBe(Math.round(ult));
    expect(D.meses).toBeGreaterThan(60); // defesa contra trocar a série
  });

  it("as duas linhas do gráfico: hpi real e lci derivado (hpi ÷ razão × 100)", () => {
    const hpi = hpiPt.series.filter((p) => p.t >= DESDE_CASA);
    const razao = casaDer.series.filter((p) => p.t >= DESDE_CASA);
    expect(D.hpi).toEqual(hpi);
    expect(D.lci).toEqual(
      hpi.map((p, k) => ({ t: p.t, v: (p.v * 100) / razao[k].v }))
    );
    expect(D.ate).toBe(casaDer.meta.rotuloAte);
  });
});

describe("Pastelaria — comer fora vs em casa", () => {
  const D = dadosPastelariaP2c();

  it("as duas séries HICP existem de facto em data/sources/eurostat", () => {
    // cp11 = restaurantes/cafés, cp01 = comida — as séries da conversa
    expect(pontosDaSerie(D.fora)).toEqual(hicpCp11.series.filter((p) => p.t >= DESDE));
    expect(pontosDaSerie(D.comida)).toEqual(hicpCp01.series.filter((p) => p.t >= DESDE));
    expect(D.ate).toBe(hicpCp11.meta.serieAte);
  });

  it("a subida «fora» é a razão da própria série cp11 — não um número do protótipo", () => {
    const s = hicpCp11.series.filter((p) => p.t >= DESDE);
    const esperado = s.at(-1)!.v / s[0].v - 1;
    expect(D.subidaFora).toBeCloseTo(esperado, 10);
  });

  it("o IVA do café é a taxa intermédia marcada com restauração em iva.json", () => {
    const intermedia = ivaJson.taxas.find((t) => t.nome === "Intermédia")!;
    expect(D.ivaCafe).toBe(intermedia.taxa);
    expect(intermedia.exemplos.join(" ")).toMatch(/restaura/i);
    // e o pão/mercearia conta com a taxa reduzida
    const reduzida = ivaJson.taxas.find((t) => t.nome === "Reduzida")!;
    expect(D.ivaMercearia).toBe(reduzida.taxa);
  });

  it("o índice comum das barras é o t0 que a Mercearia já usa", () => {
    expect(D.t0).toBe("2020-08");
    const p0 = hicpCp00.series.find((p) => p.t === D.t0);
    expect(p0).toBeTruthy();
    expect(pontosDaSerie(D.fora).find((p) => p.t === D.t0)).toBeTruthy();
  });
});

describe("Quiosque — Jornal do Bairro", () => {
  const D = dadosQuiosqueP2c();

  it("desemprego: Portugal, jovens e UE das séries Eurostat reais", () => {
    expect(pontosDaSerie(D.desemprego.pt)).toEqual(uneTotal.series.filter((p) => p.t >= DESDE));
    expect(pontosDaSerie(D.desemprego.jovens)).toEqual(uneJovem.series.filter((p) => p.t >= DESDE));
    expect(pontosDaSerie(D.desemprego.ue)).toEqual(uneUe27.series.filter((p) => p.t >= DESDE));
    // cada número do jornal é o último ponto da SUA série, com a SUA data
    expect(D.desemprego.ultJovens).toEqual(uneJovem.series.at(-1));
    expect(D.desemprego.ultPt).toEqual(uneTotal.series.at(-1));
    expect(D.desemprego.ultUe).toEqual(uneUe27.series.at(-1));
    expect(D.desemprego.ultJovens!.v).toBeGreaterThan(D.desemprego.ultPt!.v);
  });

  it("PIB e confiança: o último ponto de cada fonte, com a sua data", () => {
    expect(D.pib).toEqual(pibJson.series.at(-1));
    expect(D.confianca).toEqual(confJson.series.at(-1));
  });

  it("o salário mínimo vem de smn.json e o de 2015 é o ponto com esse ano", () => {
    expect(D.smn).toBe(smnJson.regioes.continente);
    const p2015 = smnJson.serie.find((p) => p.ano === 2015)!;
    expect(D.smn0).toEqual({ ano: 2015, valor: p2015.valor });
  });

  it("a inflação homóloga é a variação cp00 a 12 meses", () => {
    const s = hicpCp00.series;
    const esperado = s.at(-1)!.v / s.at(-13)!.v - 1;
    expect(D.inflacao!.v).toBeCloseTo(esperado, 10);
    expect(D.inflacao!.t).toBe(s.at(-1)!.t);
  });
});

describe("Escola — minis do protótipo", () => {
  const D = dadosEscolaP2c();

  it("os minis são os últimos 13 meses de cp01; a segunda lição usa cp00 desde 2019", () => {
    expect(pontosDaSerie(D.comida)).toEqual(hicpCp01.series.slice(-13));
    expect(pontosDaSerie(D.total)).toEqual(hicpCp00.series.filter((p) => p.t >= DESDE));
  });

  it("a resposta do jogo é a conta que a cena conta", () => {
    const s = hicpCp01.series.slice(-13);
    expect(D.subidaComida).toBeCloseTo(s.at(-1)!.v / s[0].v - 1, 10);
    const t = hicpCp00.series.filter((p) => p.t >= DESDE);
    expect(D.varHomologa).toBeCloseTo(t.at(-1)!.v / t.at(-13)!.v - 1, 10);
  });
});
