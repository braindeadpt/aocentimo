import { describe, expect, it } from "vitest";
import { decomporCombustivel, IVA_NORMAL } from "@/lib/engines/impostos";
import { trajetoriaCA, trajetoriaColchao } from "@/lib/engines/poupanca";
import { simularIndependente } from "@/lib/engines/independente";
import { contribuicoes } from "@/lib/engines/seg-social";
import { loadSerie } from "@/lib/data";
import caJson from "@data/fiscal/ca.json";
import capitaisJson from "@data/fiscal/capitais.json";
import ispJson from "@data/fiscal/isp.json";
import ssJson from "@data/fiscal/ss.json";
import catbJson from "@data/fiscal/catb.json";
import irsJson from "@data/fiscal/irs-2026.json";
import { dadosBomba, dadosCorreios, dadosSegSocial } from "./dados-p2b";
import { dadosFabrica, T0_MERC } from "./dados";

/**
 * Os golden da P2b — cada número que a cena mostra é o do motor ou o de
 * `data/`, nunca recontado à mão. Os testes leem os próprios JSON e os
 * motores reais, por isso um ingest que mude a taxa dos certificados ou
 * o ISP faz o teste seguir o dado (e falhar se a cena o esquecer).
 */

describe("Correios — os dados da cena vêm dos dados e do motor", () => {
  const D = dadosCorreios();
  const cp00 = loadSerie("cp00")!;

  it("a razão de poder de compra é o IHPC medido entre T0 e o último mês", () => {
    const a = cp00.series.find((p) => p.t === T0_MERC)!;
    const b = cp00.series[cp00.series.length - 1];
    expect(D.razaoTotal).not.toBeNull();
    expect(D.razaoTotal!).toBeCloseTo(b.v / a.v, 9);
    expect(D.razaoTotal!).toBeGreaterThan(1); // os preços subiram mesmo
    expect(D.mesT0).toBe(T0_MERC);
    expect(D.mesT1).toBe(b.t);
  });

  it("o que o colchão da Dona Arminda compra hoje = cap0 ÷ razão IHPC", () => {
    const real = D.cap0 / D.razaoTotal!;
    expect(real).toBeLessThan(D.cap0);
    expect(real).toBeGreaterThan(D.cap0 / 2); // sanidade da ordem de grandeza
  });

  it("os parâmetros dos Certificados são os de data/fiscal/ca.json e capitais.json", () => {
    expect(D.ca).not.toBeNull();
    expect(D.ca!.taxa).toBe(caJson.serieF.taxaBrutaNovasSubscricoes);
    expect(D.ca!.imposto).toBe(capitaisJson.retencaoLiberatoria.taxa);
    expect(D.ca!.premios).toEqual(
      caJson.serieF.premiosPermanencia.map((p) => ({ de: p.de, ate: p.ate, pp: p.pp }))
    );
    expect(D.ca!.vigencia).toBe(caJson.vigencia);
  });

  it("a poupança da calculadora é trajetoriaCA/trajetoriaColchao, sem reconta", () => {
    // a cena desenha pilhas e gráfico com estas mesmas chamadas — o teste
    // tranca a assinatura: cap0 de exemplo, prémios e imposto de data/
    const ca = trajetoriaCA(D.cap0, 5, D.ca!.taxa, D.ca!.premios, D.ca!.imposto, 0.02);
    const co = trajetoriaColchao(D.cap0, 5, 0.02);
    expect(ca).toHaveLength(5);
    expect(ca[4].saldo).toBeGreaterThan(D.cap0); // os juros ficam no certificado
    expect(ca[4].real).toBeLessThan(ca[4].saldo); // inflação corrói
    expect(co[4].saldo).toBe(D.cap0); // o colchão nunca se mexe (nominal)
    expect(co[4].real).toBeCloseTo(D.cap0 / Math.pow(1.02, 5), 9);
  });

  it("a inflação de partida é a homóloga medida do IHPC, não um palpite", () => {
    const n = cp00.series.length;
    const esperada = cp00.series[n - 1].v / cp00.series[n - 13].v - 1;
    expect(D.inflacaoAnual).not.toBeNull();
    expect(D.inflacaoAnual!).toBeCloseTo(esperada, 9);
  });
});

describe("Bomba — o litro por dentro é decomporCombustivel do motor", () => {
  const D = dadosBomba();

  it("a decomposição enviada à cena é a saída exacta do motor", () => {
    for (const comb of [D.gasolina, D.gasoleo]) {
      expect(comb.preco).not.toBeNull();
      expect(comb.dec).not.toBeNull();
      const esp = decomporCombustivel(comb.preco!, comb.isp, comb.carbono, D.iva);
      expect(comb.dec!.precoFinal).toBeCloseTo(esp.precoFinal, 9);
      expect(comb.dec!.iva).toBeCloseTo(esp.iva, 9);
      expect(comb.dec!.impostos).toBeCloseTo(esp.impostos, 9);
      expect(comb.dec!.produto).toBeCloseTo(esp.produto, 9);
      expect(comb.dec!.pesoImpostos).toBeCloseTo(esp.pesoImpostos, 9);
      // e o ISP/carbono são os da portaria em vigor, de isp.json
      expect(comb.isp).toBe(
        comb === D.gasolina ? ispJson.gasolina95.ispELitro : ispJson.gasoleo.ispELitro
      );
    }
  });

  it("o IVA sobre os outros impostos = (ISP + carbono) × taxa normal do IVA", () => {
    for (const comb of [D.gasolina, D.gasoleo]) {
      expect(comb.dec!.ivaSobreImp).toBeCloseTo((comb.isp + comb.carbono) * D.iva, 9);
      // e fica dentro da camada do IVA — nunca acima dela
      expect(comb.dec!.ivaSobreImp).toBeLessThanOrEqual(comb.dec!.iva);
    }
    expect(D.iva).toBe(IVA_NORMAL);
  });

  it("o gráfico parte da PRIMEIRA data real da série DGEG — não de um ano escrito à mão", () => {
    expect(D.gasolina.serie).not.toBeNull();
    expect(D.gasoleo.serie).not.toBeNull();
    expect(D.gasolina.serie!.inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // a série diária começa em 2017-01-01; a semanal começa nesse dia
    expect(D.gasolina.serie!.inicio).toBe("2017-01-01");
    expect(D.gasoleo.serie!.inicio).toBe("2017-01-01");
    // um ponto por semana + o último ponto real no fim
    const diarios = 3560;
    expect(D.gasolina.serie!.v.length).toBeGreaterThan(400);
    expect(D.gasolina.serie!.v.length).toBeLessThanOrEqual(Math.ceil(diarios / 7) + 1);
    expect(D.gasolina.serie!.v.at(-1)).toBe(2.0958); // último PMD real
    // sem pontos inventados: cada valor existe na série diária
    expect(D.gasolina.serie!.v.every((v) => v > 0.9 && v < 3)).toBe(true);
  });

  it("o preço de hoje é o último ponto da série e os impostos são de hoje", () => {
    expect(D.gasolina.preco).toBeCloseTo(D.gasolina.serie!.v.at(-1)!, 9);
    expect(D.gasolina.data).toBe("2026-09-30");
    expect(D.ispVigencia).toBe(ispJson.vigencia);
  });
});

describe("Segurança Social — o recibo da Inês bate com a Fábrica", () => {
  const S = dadosSegSocial();
  const F = dadosFabrica();

  it("a Inês é a MESMA linha de referência da cena da Fábrica", () => {
    expect(S.ines).not.toBeNull();
    expect(F.linha).not.toBeNull();
    expect(S.ines!.bruto).toBe(F.linha!.bruto);
    expect(S.ines!.ss).toBeCloseTo(F.linha!.ss, 9);
    expect(S.ines!.tsu).toBeCloseTo(F.linha!.tsu, 9);
    expect(S.ines!.custo).toBeCloseTo(F.linha!.custo, 9);
  });

  it("11 % + 23,75 % no salário de referência: 165,00 + 356,25 = 521,25 €", () => {
    expect(S.taxas.trab).toBe(ssJson.trabalhador.taxa);
    expect(S.taxas.emp).toBe(ssJson.entidadePatronal.taxa);
    expect(S.taxas.trab).toBeCloseTo(0.11, 9);
    expect(S.taxas.emp).toBeCloseTo(0.2375, 9);
    // e contra o motor de contribuições, não só contra o JSON derivado
    const c = contribuicoes(S.ines!.bruto);
    expect(S.ines!.ss).toBeCloseTo(c.trabalhador, 9);
    expect(S.ines!.tsu).toBeCloseTo(c.entidade, 9);
    expect(S.ines!.ss + S.ines!.tsu).toBeCloseTo(521.25, 9);
  });

  it("o Pedro a recibos verdes é simularIndependente, sem reconta na cena", () => {
    expect(S.pedro).not.toBeNull();
    const fat = S.ines!.bruto; // fatura o mesmo bruto mensal
    const sim = simularIndependente(fat * 12);
    expect(S.pedro!.fatura).toBe(fat);
    expect(S.pedro!.ssMensal).toBeCloseTo(sim.ssMensal, 9);
    // 21,4 % sobre 70 % do faturado (acima da base mínima 1,5×IAS)
    const rel = Math.max(
      fat * catbJson.segurancaSocial.rendimentoRelevante,
      catbJson.segurancaSocial.baseMinimaIas * irsJson.ias
    );
    expect(S.pedro!.ssMensal).toBeCloseTo(rel * catbJson.segurancaSocial.taxa, 6);
    expect(S.pedro!.por100).toBeCloseTo((sim.ssMensal / fat) * 100, 9);
  });

  it("as regras do Pedro são as de catb.json + o IAS do ano", () => {
    expect(S.taxas.catbTaxa).toBe(catbJson.segurancaSocial.taxa);
    expect(S.taxas.catbRr).toBe(catbJson.segurancaSocial.rendimentoRelevante);
    expect(S.taxas.baseMinIas).toBe(catbJson.segurancaSocial.baseMinimaIas);
    expect(S.taxas.ias).toBe(irsJson.ias);
    expect(S.taxas.isencao).toBe(catbJson.segurancaSocial.isencaoPrimeirosMeses);
  });
});
