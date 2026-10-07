import { describe, it, expect } from "vitest";
import { horaDe, horaEfetiva, CLASSE_HORA, SCRIPT_HORA, type Hora } from "./hora";

describe("a hora do bairro", () => {
  it("segue a regra do protótipo", () => {
    expect(horaDe(6)).toBe("noite");
    expect(horaDe(7)).toBe("dia");
    expect(horaDe(17)).toBe("dia");
    expect(horaDe(18)).toBe("tarde");
    expect(horaDe(19)).toBe("tarde");
    expect(horaDe(20)).toBe("noite");
  });

  /** Corre o script em linha contra um palco e um <html> de mentira. */
  function correrScript(h: number, tema: string | undefined): string {
    const classes = new Set<string>(["b-noite"]);
    const palco = {
      classList: {
        remove: (...c: string[]) => c.forEach((x) => classes.delete(x)),
        add: (c: string) => classes.add(c),
      },
    };
    const RealDate = Date;
    const fn = new Function("document", "Date", SCRIPT_HORA);
    fn(
      {
        currentScript: { parentNode: palco },
        documentElement: { dataset: { theme: tema } },
      },
      class extends RealDate {
        getHours() {
          return h;
        }
      }
    );
    return [...classes].join(" ");
  }

  it("o script em linha dá a mesma classe que horaDe, a todas as horas (tema claro)", () => {
    for (let h = 0; h < 24; h++) {
      expect(correrScript(h, "light")).toBe(CLASSE_HORA[horaDe(h)]);
      expect(correrScript(h, undefined)).toBe(CLASSE_HORA[horaDe(h)]);
    }
  });

  it("em tema escuro o script em linha põe sempre a noite, a todas as horas", () => {
    for (let h = 0; h < 24; h++) {
      expect(correrScript(h, "dark")).toBe(CLASSE_HORA.noite);
    }
  });
});

describe("a hora efetiva: o clique > o tema escuro > o relógio", () => {
  const horas: Hora[] = ["dia", "tarde", "noite"];

  it("sem clique, em escuro, é sempre noite — seja qual for a hora do relógio", () => {
    for (const horaLocal of horas) {
      expect(horaEfetiva({ escolha: null, escuro: true, horaLocal })).toBe("noite");
    }
  });

  it("sem clique, em claro, segue o relógio", () => {
    for (const horaLocal of horas) {
      expect(horaEfetiva({ escolha: null, escuro: false, horaLocal })).toBe(horaLocal);
    }
  });

  it("o clique manda sobre o tema e sobre o relógio", () => {
    for (const escolha of horas)
      for (const horaLocal of horas)
        for (const escuro of [true, false])
          expect(horaEfetiva({ escolha, escuro, horaLocal })).toBe(escolha);
  });
});