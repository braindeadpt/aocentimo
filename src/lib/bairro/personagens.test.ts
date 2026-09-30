import { describe, it, expect } from "vitest";
import { CHAVES_ELENCO, ELENCO, PASSANTES, cabelo, escurecer, pessoa } from "./personagens";

describe("escurecer()", () => {
  it("escurece multiplicando os três canais", () => {
    expect(escurecer("#ffffff", 0.5)).toBe("#808080");
    expect(escurecer("#ffffff")).toBe("#c7c7c7");
  });

  it("nunca passa de 255 nem de duas algarismos por canal", () => {
    // um factor grande manteria 255 sem o clamp e escreveria «100» num canal
    expect(escurecer("#ffffff", 2)).toBe("#ffffff");
    for (let i = 0; i < 5; i++) expect(escurecer("#3b2418", i / 4)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("cabelo()", () => {
  it("devolve a parte de trás e a de frente consoante a fase", () => {
    expect(cabelo("bob", "#3b2418", "tras")).not.toBe(cabelo("bob", "#3b2418", "frente"));
    expect(cabelo("bob", "#3b2418", "frente")).toContain("fill=\"#3b2418\"");
  });

  it("«rabo» só tem rabo de trás", () => {
    expect(cabelo("rabo", "#3b2418", "tras")).toContain("rabo-cavalo");
    expect(cabelo("rabo", "#3b2418", "frente")).not.toContain("rabo-cavalo");
  });

  it("sem tipo não devolve nada em vez de devolver lixo", () => {
    expect(cabelo(undefined, "#3b2418", "frente")).toBe("");
  });

  it("O LENÇO É ARGUMENTO, NÃO GLOBAL — duas personagens não se contaminam", () => {
    // No protótipo, `cabelo()` lia `lencoAtual`, uma global de módulo escrita
    // por `pessoa()` e nunca limpa: a Marta desenhada depois do Rui via o
    // lenço da Marta. Aqui a Marta tem lenço e o Rui não, e a ordem não conta.
    const comLenco = pessoa(ELENCO.marta);
    const semLenco = pessoa(ELENCO.rui);
    expect(comLenco).toContain("#ffc62b");
    // o Rui não ganha o lenço da Marta, mesmo desenhado depois
    expect(pessoa(ELENCO.rui)).toBe(semLenco);
    expect(pessoa(ELENCO.marta)).toBe(comLenco);
    // o lenço só aparece no cabelo «afro» — a Marta é a única que o tem
    const outra = { ...ELENCO.diana, lenco: "#ffc62b" };
    expect(pessoa(outra)).not.toContain("M-17 -123 q17 -9 34 0");
  });
});

describe("pessoa()", () => {
  it("leva o nome em data-nome — é por ele que o e2e a encontra", () => {
    expect(pessoa(ELENCO.ines)).toContain('data-nome="Inês"');
    expect(pessoa({ roupa: "#fff" })).toContain('data-nome=""');
  });

  it("mantém as classes que o GSAP vai animar", () => {
    const svg = pessoa(ELENCO.ines);
    for (const cls of ["escala", "perna-e", "perna-d", "tronco", "braco-e", "braco-d", "cabeca", "olhos", "boca"]) {
      expect(svg).toContain(`class="${cls}"`);
    }
  });

  it("a escala vai no transform do grupo .escala, não no tamanho do desenho", () => {
    // o Gonçalo é miúdo: 0,86 no transform, e o resto do SVG igual
    expect(pessoa(ELENCO.goncalo)).toContain('transform="scale(0.86)"');
  });

  it("as calções passam as pernas a mostrar a pele, não as calças", () => {
    // o Pedro (pele c = #d49a72) vai de calções amarelos (#f0b429): as pernas
    // ficam de pele e há um pedaço curto de calças pintado da cor das calças.
    const pedro = pessoa(ELENCO.pedro);
    expect(pedro).toContain('fill="#d49a72" stroke="#16130f" stroke-width="2.6"'); // perna de pele
    expect(pedro).toContain('fill="#f0b429" stroke="#16130f" stroke-width="2.4"'); // pedaço de calças

    // a Inês, de calças compridas, vai de calças na perna inteira e sem pele
    const ines = pessoa(ELENCO.ines);
    expect(ines).not.toContain('fill="#d49a72" stroke="#16130f" stroke-width="2.6"');
    expect(ines).toContain('fill="#1f2b45" stroke="#16130f" stroke-width="2.6"');
  });

  it("nunca deixa undefined nem NaN", () => {
    for (const c of CHAVES_ELENCO) {
      const svg = pessoa(ELENCO[c]);
      expect(svg).not.toContain("undefined");
      expect(svg).not.toContain("NaN");
    }
    for (const p of PASSANTES) {
      expect(pessoa(p)).not.toContain("undefined");
    }
  });
});

describe("o elenco", () => {
  it("são as oito personagens do protótipo", () => {
    expect(CHAVES_ELENCO).toHaveLength(8);
    expect(Object.keys(ELENCO)).toEqual([...CHAVES_ELENCO]);
  });

  it("todas têm nome, roupa e cor de cabelo — nenhuma sai sem cor", () => {
    for (const chave of CHAVES_ELENCO) {
      const p = ELENCO[chave];
      expect(p.nome).toBeTruthy();
      expect(p.roupa).toMatch(/^#[0-9a-f]{6}$/);
      expect(p.corCabelo).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("todas desenham sem partir nada", () => {
    for (const chave of CHAVES_ELENCO) {
      expect(pessoa(ELENCO[chave]).length).toBeGreaterThan(500);
    }
  });

  it("cada personagem é uma pessoa diferente — nenhuma é cópia de outra", () => {
    const desenhos = CHAVES_ELENCO.map((c) => pessoa(ELENCO[c]));
    expect(new Set(desenhos).size).toBe(CHAVES_ELENCO.length);
  });

  it("os passantes não têm nome — não são personagens, é decorativo", () => {
    for (const p of PASSANTES) {
      expect(p.nome).toBeUndefined();
      expect(pessoa(p)).toContain('data-nome=""');
    }
  });
});
