import { describe, it, expect } from "vitest";
import { horaDe, CLASSE_HORA, SCRIPT_HORA } from "./hora";

describe("a hora do bairro", () => {
  it("segue a regra do protótipo", () => {
    expect(horaDe(6)).toBe("noite");
    expect(horaDe(7)).toBe("dia");
    expect(horaDe(17)).toBe("dia");
    expect(horaDe(18)).toBe("tarde");
    expect(horaDe(19)).toBe("tarde");
    expect(horaDe(20)).toBe("noite");
  });

  it("o script em linha dá a mesma classe que horaDe, a todas as horas", () => {
    for (let h = 0; h < 24; h++) {
      const classes = new Set<string>(["b-noite"]);
      const palco = {
        classList: {
          remove: (...c: string[]) => c.forEach((x) => classes.delete(x)),
          add: (c: string) => classes.add(c),
        },
      };
      const RealDate = Date;
      const fn = new Function("document", "Date", SCRIPT_HORA);
      fn({ currentScript: { parentNode: palco } }, class extends RealDate { getHours() { return h; } });
      const esperado = CLASSE_HORA[horaDe(h)];
      expect([...classes].join(" ")).toBe(esperado);
    }
  });
});
