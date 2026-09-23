import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  easeEntra,
  retarget,
  terminado,
  valorEm,
  type Animado,
} from "./useValorAnimado";
import { TweenNum } from "@/components/TweenNum";
import { Odometer } from "@/components/Odometer";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("motor de valores animados — máquina pura", () => {
  it("a curva vai de 0 a 1 e é monótona (easeEntra)", () => {
    expect(easeEntra(0)).toBe(0);
    expect(easeEntra(1)).toBe(1);
    let anterior = -1;
    for (let p = 0; p <= 1; p += 0.05) {
      const v = easeEntra(p);
      expect(v).toBeGreaterThan(anterior);
      anterior = v;
    }
  });

  it("valorEm: extremos exactos, meio entre de e para", () => {
    const a: Animado = { de: 100, para: 200, t0: 0, dur: 600 };
    expect(valorEm(a, 0)).toBe(100);
    expect(valorEm(a, 600)).toBe(200);
    expect(valorEm(a, 9999)).toBe(200); // nunca passa do alvo
    const meio = valorEm(a, 300);
    expect(meio).toBeGreaterThan(100);
    expect(meio).toBeLessThan(200);
  });

  it("valorEm antes de t0 fica no ponto de partida", () => {
    const a: Animado = { de: 50, para: 90, t0: 100, dur: 600 };
    expect(valorEm(a, 0)).toBe(50);
  });

  it("dur 0 → alvo imediato", () => {
    const a: Animado = { de: 0, para: 42, t0: 0, dur: 0 };
    expect(valorEm(a, 0)).toBe(42);
    expect(terminado(a, 0)).toBe(true);
  });

  it("retarget a meio: parte de onde está — o número nunca fica errado", () => {
    const a: Animado = { de: 0, para: 1000, t0: 0, dur: 600 };
    const pos = valorEm(a, 300);
    const b = retarget(a, 200, 300);
    expect(b.de).toBe(pos); // continuidade — sem salto
    expect(b.para).toBe(200);
    expect(b.t0).toBe(300);
    // e converge para o novo alvo
    expect(valorEm(b, 300 + b.dur)).toBe(200);
  });

  it("retarget em cadeia mantém-se entre os extremos vistos", () => {
    let a: Animado = { de: 0, para: 500, t0: 0, dur: 600 };
    a = retarget(a, 900, 150);
    a = retarget(a, 100, 300);
    for (let t = 300; t <= 900; t += 60) {
      const v = valorEm(a, t);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(900);
    }
  });
});

describe("TweenNum — contrato SSR e aria-live", () => {
  it("o DOM traz o valor final no primeiro paint", () => {
    const h = html(<TweenNum valor={1234.5} casas={2} texto="1 234,50" />);
    expect(h).toContain("1 234,50");
  });

  it("sr-only com aria-live anuncia o final; o visual é aria-hidden", () => {
    const h = html(<TweenNum valor={920} casas={0} texto="920" />);
    expect(h).toContain('class="sr-only"');
    expect(h).toContain('aria-live="polite"');
    expect(h).toContain('aria-hidden="true"');
  });

  it("o visual usa tabular-nums — a largura não muda ao animar", () => {
    const h = html(<TweenNum valor={1} casas={0} texto="1" />);
    expect(h).toContain("tabular-nums");
  });
});

describe("Odometer — o apresentador de revelação", () => {
  it("o DOM traz o valor final formatado (nunca zeros no SSR)", () => {
    const h = html(<Odometer valor={920} sufixo="€" />);
    expect(h).toContain("920");
    // a unidade vai no fino inseparável (U+202F) — nunca espaço normal
    expect(h).toContain(" €");
    expect(h).not.toContain(" €");
  });

  it("sr-only com aria-live; rodas aria-hidden", () => {
    const h = html(<Odometer valor={1500} />);
    expect(h).toContain('aria-live="polite"');
    expect(h).toContain('aria-hidden="true"');
    // as rodas existem (dígitos 0-9 por casa) mas o sr-only é o texto real
    expect(h).toContain("od-wheel");
  });
});
