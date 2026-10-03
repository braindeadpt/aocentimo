import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  drenarEscolhas,
  pedirPersonagem,
  type AlvoEscolhas,
} from "./ponte-cartas";
import type { EscolhaPersonagem } from "./personagem";

/**
 * A ponte carta → bairro não pode ter janela de perda. Medido a 40×
 * de CPU: 6 em 15 toques antes da hidratação iam ao vazio (o onClick
 * da carta ainda não existia) e mais 3 despachavam para um `<Bairro>`
 * que ainda não tinha ouvinte. Um toque num telemóvel lento ficava sem
 * efeito nenhum e o utilizador pensava que a carta não funcionava.
 *
 * Estes testes prendem a FILA: um pedido feito antes de existir quem o
 * serve tem de ser servido quando o servidor aparece.
 */

const INES: EscolhaPersonagem = {
  chave: "ines",
  quem: "Inês · Operária da fábrica",
  fala: 'Olá! Sou a Inês. <span class="b-a">Em breve</span>.',
  extra: "Conta de outrem · setor privado",
  fechar: "Fechar",
};

/** O browser dá a `window`; no teste fabricamos o mesmo mínimo. */
function novoAlvo(): AlvoEscolhas {
  return new EventTarget() as AlvoEscolhas;
}

describe("a ponte das cartas — sem janela de perda", () => {
  let alvo: AlvoEscolhas;

  beforeEach(() => {
    alvo = novoAlvo();
  });

  it("um pedido feito ANTES de existir ouvente fica à espera", () => {
    // o cenário real: a carta pede, o <Bairro> ainda não montou
    pedirPersonagem(INES, alvo);
    expect(alvo.__bEscolhas).toHaveLength(1);
  });

  it("o pedido também é anunciado: quem já esteja à espera ouve logo", () => {
    const ouvido = vi.fn();
    alvo.addEventListener("b:escolhe-personagem", ouvido);
    pedirPersonagem(INES, alvo);
    expect(ouvido).toHaveBeenCalledTimes(1);
  });

  it("o <Bairro> drena a fila ao montar e aplica o pedido perdido", () => {
    pedirPersonagem(INES, alvo); // chegou antes — ninguém ouviu
    const aplicado = vi.fn();
    const quantos = drenarEscolhas(aplicado, alvo);
    expect(quantos).toBe(1);
    expect(aplicado).toHaveBeenCalledWith(INES);
  });

  it("a fila esvazia-se: o mesmo pedido não é aplicado duas vezes", () => {
    pedirPersonagem(INES, alvo);
    drenarEscolhas(vi.fn(), alvo);
    const segundo = vi.fn();
    expect(drenarEscolhas(segundo, alvo)).toBe(0);
    expect(segundo).not.toHaveBeenCalled();
  });

  it("vários toques perdidos são servidos todos, pela ordem", () => {
    pedirPersonagem(INES, alvo);
    pedirPersonagem({ ...INES, chave: "rui", quem: "Rui e Marta · Pescar" }, alvo);
    const ordem: string[] = [];
    const quantos = drenarEscolhas((d) => ordem.push(d.chave), alvo);
    expect(quantos).toBe(2);
    expect(ordem).toEqual(["ines", "rui"]);
  });

  it("sem fila nenhuma, drenar é um no-op (não inventa pedidos)", () => {
    const aplicado = vi.fn();
    expect(drenarEscolhas(aplicado, alvo)).toBe(0);
    expect(aplicado).not.toHaveBeenCalled();
  });
});
