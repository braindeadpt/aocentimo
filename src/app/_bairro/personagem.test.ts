import { describe, it, expect, afterEach } from "vitest";
import { escolhaPendente, consumirPendente, PONTE_JS } from "./personagem";

/**
 * A ponte que segura o clique feito antes da hydration. O teste do
 * comportamento inteiro (clicar, o bairro abrir o painel) vive no e2e
 * `e2e/bairro-cartas.spec.ts`; aqui prova-se a fila, que é a parte com
 * regra (uma escolha, uma vez).
 */
const ponte = globalThis as { __bEscolhaPendente?: string; __bPonte?: number };

describe("escolhaPendente — o clique que chegou antes do React", () => {
  afterEach(() => {
    ponte.__bEscolhaPendente = undefined;
  });

  it("devolve null quando não houve clique nenhum", () => {
    expect(escolhaPendente()).toBeNull();
  });

  it("devolve a chave que a ponte anotou", () => {
    ponte.__bEscolhaPendente = "ines";
    expect(escolhaPendente()).toBe("ines");
  });

  it("consome: a mesma escolha não se entrega duas vezes", () => {
    ponte.__bEscolhaPendente = "rui";
    // ler não gasta — a entrega pode falhar e tentar-se outra vez
    expect(escolhaPendente()).toBe("rui");
    expect(escolhaPendente()).toBe("rui");
    consumirPendente();
    expect(escolhaPendente()).toBeNull();
  });

  it("uma escolha mais recente substitui a anterior", () => {
    ponte.__bEscolhaPendente = "ines";
    ponte.__bEscolhaPendente = "goncalo";
    expect(escolhaPendente()).toBe("goncalo");
  });

  it("a ponte só se instala uma vez e só se cala com as DUAS partes prontas", () => {
    // o texto tem de ser o que vai no HTML: sem import, sem framework,
    // e a escuta tem de ficar atrás das duas flags — se se calasse com o
    // bairro pronto, um clique antes de as cartas ligarem o onClick
    // perdia-se outra vez
    expect(PONTE_JS).toContain('addEventListener("click"');
    expect(PONTE_JS).toContain(".b-carta[data-k]");
    expect(PONTE_JS).toContain("__bBairroPronto&&w.__bCartasPronto");
    expect(PONTE_JS).toContain("__bPonte");
    expect(PONTE_JS.length).toBeLessThan(400);
  });
});