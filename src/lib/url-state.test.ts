import { describe, expect, it } from "vitest";
import {
  construirUrl,
  lerBool,
  lerEnum,
  lerFloat,
  lerInt,
  obterSearchParams,
  serializarParams,
  snapValor,
} from "./url-state";

describe("url-state — lerInt", () => {
  it("lê inteiros válidos positivos e negativos", () => {
    expect(lerInt("1500")).toBe(1500);
    expect(lerInt("-20")).toBe(-20);
    expect(lerInt("0")).toBe(0);
  });

  it("aplica clamp com min e max", () => {
    expect(lerInt("500", 800, 5000)).toBe(800);
    expect(lerInt("9999", 800, 5000)).toBe(5000);
    expect(lerInt("2000", 800, 5000)).toBe(2000);
  });

  it("descarta inputs maliciosos e inválidos (NaN, Infinity, script, decimais)", () => {
    expect(lerInt("<script>alert(1)</script>")).toBeUndefined();
    expect(lerInt("NaN")).toBeUndefined();
    expect(lerInt("Infinity")).toBeUndefined();
    expect(lerInt("12.5")).toBeUndefined();
    expect(lerInt("")).toBeUndefined();
    expect(lerInt(null)).toBeUndefined();
    expect(lerInt(undefined, 0, 100, 42)).toBe(42);
  });
});

describe("url-state — lerFloat", () => {
  it("lê floats com ponto ou vírgula", () => {
    expect(lerFloat("3.25")).toBe(3.25);
    expect(lerFloat("3,25")).toBe(3.25);
    expect(lerFloat("-1.5")).toBe(-1.5);
  });

  it("aplica clamp com limites", () => {
    expect(lerFloat("-10.5", 0, 10)).toBe(0);
    expect(lerFloat("15.2", 0, 10)).toBe(10);
  });

  it("descarta strings maliciosas e não numéricas", () => {
    expect(lerFloat("evil-input")).toBeUndefined();
    expect(lerFloat("NaN")).toBeUndefined();
    expect(lerFloat("<svg/onload=alert(1)>")).toBeUndefined();
  });
});

describe("url-state — lerBool", () => {
  it("lê 1, true, sim como true", () => {
    expect(lerBool("1")).toBe(true);
    expect(lerBool("true")).toBe(true);
    expect(lerBool("sim")).toBe(true);
    expect(lerBool("TRUE")).toBe(true);
  });

  it("lê 0, false, nao como false", () => {
    expect(lerBool("0")).toBe(false);
    expect(lerBool("false")).toBe(false);
    expect(lerBool("nao")).toBe(false);
  });

  it("usa omissão para valores desconhecidos", () => {
    expect(lerBool("outro", false)).toBe(false);
    expect(lerBool("outro", true)).toBe(true);
    expect(lerBool(null, false)).toBe(false);
  });
});

describe("url-state — lerEnum", () => {
  const opcoes = ["continente", "madeira", "acores"] as const;

  it("aceita apenas valores da lista permitida", () => {
    expect(lerEnum("madeira", opcoes)).toBe("madeira");
    expect(lerEnum("acores", opcoes)).toBe("acores");
  });

  it("descarta injeções e valores desconhecidos", () => {
    expect(lerEnum("lisboa", opcoes)).toBeUndefined();
    expect(lerEnum("<script>", opcoes, "continente")).toBe("continente");
    expect(lerEnum(null, opcoes, "continente")).toBe("continente");
  });
});

describe("url-state — snapValor", () => {
  const grelha = [800, 1000, 1200, 1500, 2000, 3000];

  it("faz snap ao ponto mais próximo", () => {
    expect(snapValor(820, grelha)).toBe(800);
    expect(snapValor(910, grelha)).toBe(1000);
    expect(snapValor(1700, grelha)).toBe(1500);
    expect(snapValor(1800, grelha)).toBe(2000);
  });
});

describe("url-state — serializarParams e construirUrl", () => {
  it("omite parâmetros com valor igual à omissão", () => {
    const params = {
      bruto: 1500,
      modo: "trabalho",
      adse: true,
      duod: "14",
    };
    const defaults = {
      bruto: 1500,
      modo: "trabalho",
      adse: false,
      duod: "14",
    };
    const qs = serializarParams(params, defaults);
    expect(qs).toBe("?adse=1");
  });

  it("constrói URL limpo preservando âncora", () => {
    const url = construirUrl(
      "/salario#pensao",
      { modo: "pensao", adse: false },
      { modo: "trabalho", adse: false }
    );
    expect(url).toBe("/salario?modo=pensao#pensao");
  });

  it("round-trip: constrói URL e faz parse com obterSearchParams", () => {
    const url = construirUrl("/salario", {
      bruto: 2500,
      adse: true,
      regiao: "acores",
    });
    const sp = obterSearchParams(url.split("?")[1]);
    expect(lerInt(sp.get("bruto"))).toBe(2500);
    expect(lerBool(sp.get("adse"))).toBe(true);
    expect(lerEnum(sp.get("regiao"), ["continente", "madeira", "acores"])).toBe(
      "acores"
    );
  });
});
