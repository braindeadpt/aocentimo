import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * O prefetch das cenas, sem browser: o que se prova aqui é o CACHE e o
 * CANCELAMENTO, que no e2e só se veem pelo efeito (o JSON não ser
 * pedido duas vezes).
 *
 *   - um id, um pedido: o prefetch e a cena abierta usam o mesmo cache;
 *   - uma falha NÃO fica em cache (a próxima tentar de verdade);
 *   - `cancelarPedido()` aborta o que ainda voa e limpa a entrada;
 *   - Save-Data é CUTOFF: nem por âncora nem por ociosidade.
 */
import {
  cancelarEspeculativo,
  cancelarPedido,
  pedirCena,
  podePrecarregar,
  prefetearCena,
} from "./prefetch";

/** Um `fetch` falso que nunca resolve — para o cancelamento ter o que abortar. */
function fetchPendente() {
  const ctrl: AbortSignal[] = [];
  const fn = vi.fn((_url: string, init?: RequestInit) => {
    if (init?.signal) ctrl.push(init.signal);
    return new Promise<Response>(() => {});
  });
  vi.stubGlobal("fetch", fn);
  return { fn, ctrl };
}

describe("o cache das cenas", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { connection: { saveData: false } });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    cancelarEspeculativo();
  });

  it("um id, um pedido: o prefetch aquece o que a cena vai buscar", async () => {
    const { fn } = fetchPendente();
    const a = pedirCena("banco");
    const b = pedirCena("banco");
    expect(a).toBe(b);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0]).toBe("/cenas/banco.json");
  });

  it("o prefetch não volta a pedir o que a cena já pediu", async () => {
    const { fn } = fetchPendente();
    prefetearCena("bomba");
    pedirCena("bomba");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uma falha NÃO fica em cache — a próxima tenta de verdade", async () => {
    const fn = vi.fn(async () => new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fn);
    await expect(pedirCena("correios")).rejects.toThrow(/HTTP 500/);
    await expect(pedirCena("correios")).rejects.toThrow(/HTTP 500/);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("o que ainda voa pode ser cancelado, e a próxima volta a pedir", () => {
    const { fn, ctrl } = fetchPendente();
    pedirCena("fabrica");
    expect(ctrl[0].aborted).toBe(false);
    cancelarPedido("fabrica");
    expect(ctrl[0].aborted, "o pedido foi cancelado a meio");
    // o cancelamento limpa a entrada: a próxima é um pedido novo
    pedirCena("fabrica");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("já lido não se cancela — o cache fica", async () => {
    const fn = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fn);
    await pedirCena("escola");
    cancelarPedido("escola");
    await pedirCena("escola");
    expect(fn, "os dados já lidos ficam em cache").toHaveBeenCalledTimes(1);
  });
});

describe("as regras de poupa de dados", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cancelarEspeculativo();
  });

  it("com Save-Data não se pede nada — nem por âncora", () => {
    vi.stubGlobal("navigator", { connection: { saveData: true } });
    expect(podePrecarregar()).toBe(false);
    const fn = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fn);
    prefetearCena("banco");
    expect(fn).not.toHaveBeenCalled();
  });

  it("sem Save-Data, o prefetch vai buscar os dados", () => {
    vi.stubGlobal("navigator", { connection: { saveData: false } });
    expect(podePrecarregar()).toBe(true);
  });
});