import { describe, expect, it } from "vitest";
import { impostoPorEscaloes, REGRAS_IRS } from "@/lib/engines/irs";
import cenarios from "@data/derived/cenarios-salario.json";
import { coletavel, gavetaMaisAlta, irsGavetas, irsPorEscaloes } from "./irs-gavetas";
import { dadosFinancas } from "./dados";

/** Os dados reais do repo — os mesmos que a cena leva do servidor. */
const F = dadosFinancas();
const ESC = F.escaloes;

describe("o IRS em gavetas", () => {
  it("enche as gavetas de baixo para cima e cada taxa aplica-se ao que está lá dentro", () => {
    // 25 000 €: a primeira gaveta enche toda; a segunda fica com o resto.
    // As taxas vêm de irs-2026.json, não são escritas aqui.
    const g = irsGavetas(ESC, 25000);
    expect(g[0].dentro).toBeCloseTo(ESC[0].ate!, 6);
    expect(g[0].imposto).toBeCloseTo(ESC[0].ate! * ESC[0].taxa, 6);
    expect(g[1].dentro).toBeCloseTo(Math.min(25000, ESC[1].ate!) - ESC[0].ate!, 6);
    // o rendimento reparte-se todo: a soma das gavetas é o rendimento
    expect(g.reduce((a, x) => a + x.dentro, 0)).toBeCloseTo(25000, 6);
  });

  it("o rendimento abaixo do primeiro escalão só enche a primeira gaveta", () => {
    const g = irsGavetas(ESC, 3000);
    expect(g[0].dentro).toBe(3000);
    for (const x of g.slice(1)) expect(x.dentro).toBe(0);
  });

  it("rendimento zero não paga nada", () => {
    expect(irsPorEscaloes(ESC, 0)).toBe(0);
  });

  it("bate certo com o MOTOR DO SITE, impostoPorEscaloes, no domínio da cena", () => {
    // A EXIGÊNCIA DO PACK (§P2a): a conta das gavetas da cena é a mesma do
    // motor fiscal. Compara-se contra impostoPorEscaloes (o de /irs e de
    // /salario) numa amostra de rendimentos ABAIXO da taxa de
    // solidariedade — a cena, como o protótipo, ensina os escalões do
    // art. 68.º; a solidariedade (2,5 % acima de 80 000 €) não é desenhada
    // em gaveta nenhuma e a nota de rodapé da cena manda o valor alto para
    // o simulador.
    const regras = REGRAS_IRS[F.ano];
    expect(regras).toBeTruthy();
    expect(regras.solidariedade[0].de).toBeGreaterThanOrEqual(80000);
    for (const rc of [0, 5000, 9000, 16000, 25000, 40000, 79000]) {
      expect(irsPorEscaloes(ESC, rc)).toBeCloseTo(impostoPorEscaloes(rc, regras), 2);
    }
  });

  it("o IRS anual do rodapé da cena é o do motor, vindo pronto de data/", () => {
    // o número que a cena escreve na nota («no simulador, com as deduções,
    // é X») não se reconta aqui: vem de cenarios-salario.json, que o build
    // gera pelo motor fiscal. Só se verifica que não é o IRS só dos
    // escalões (é menor, porque leva as deduções à coleta).
    const meta = cenarios.meta as { brutoRef: number };
    const linha = (cenarios.linhas as { bruto: number; ano14: { irsAnual: number } }[]).find(
      (l) => l.bruto === meta.brutoRef
    );
    expect(linha).toBeTruthy();
    expect(F.motorIrsAnual).toBeCloseTo(linha!.ano14.irsAnual, 2);

    const c = coletavel(1500, F.dedEsp, F.ssTaxa);
    expect(irsPorEscaloes(ESC, c)).toBeGreaterThan(F.motorIrsAnual);
  });

  it("a taxa média fica sempre abaixo ou igual ao degrau", () => {
    // a propriedade que a cena desenha: a curva sobe devagar e nunca
    // passa o degrau da gaveta mais alta
    for (const c of [10000, 20000, 40000, 80000]) {
      const med = irsPorEscaloes(ESC, c) / c;
      const degrau = gavetaMaisAlta(ESC, c)!.taxa;
      expect(med).toBeLessThanOrEqual(degrau + 1e-12);
    }
  });

  it("o exemplo do aumento da Inês (1500 → 1650) fica com mais dinheiro", () => {
    // o passo 2 da cena: subiu de escalão e AINDA assim fica com mais
    const aum = 150 * 14;
    const c0 = coletavel(1500, F.dedEsp, F.ssTaxa);
    const c1 = coletavel(1650, F.dedEsp, F.ssTaxa);
    const ganho = aum - aum * F.ssTaxa - (irsPorEscaloes(ESC, c1) - irsPorEscaloes(ESC, c0));
    expect(gavetaMaisAlta(ESC, c0)!.k).not.toBe(gavetaMaisAlta(ESC, c1)!.k); // mudou de gaveta
    expect(ganho).toBeGreaterThan(0);
  });

  it("a dedução específica ganha à taxa da SS nas ordens de grandeza do bairro", () => {
    // a conta do coletável usa o MAIOR entre a dedução fixa e 11 % —
    // para brutos normais é a dedução fixa que ganha
    expect(F.dedEsp).toBeGreaterThan(1500 * 14 * F.ssTaxa);
    expect(coletavel(1500, F.dedEsp, F.ssTaxa)).toBe(1500 * 14 - F.dedEsp);
  });
});
