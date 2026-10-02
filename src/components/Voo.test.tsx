import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  JANELA_SELO_MS,
  TituloPagina,
  lerSelo,
  limparSelo,
  selar,
  seloPara,
} from "./Voo";

// O selo do voo (1B-04). O marcador vive entre o clique no <LinkVoo> e
// o commit da página de destino — e o commit pode demorar: medido a
// 8 workers, a navegação /estilo → /salario levou até 12,7 s. O prazo
// de segurança tem de chegar lá, senão o morph não acontece numa
// máquina carregada (falha de produto observada no e2e, não de teste).

describe("Voo — o selo do voo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    limparSelo("/salario");
    limparSelo("/irs");
  });

  it("navegação lenta: o selo sobrevive aos 4 s do prazo antigo", () => {
    selar("/salario");
    // a navegação demorou 12,7 s nesta medição
    vi.advanceTimersByTime(12_700);
    expect(seloPara("/salario")).toBe(true);
  });

  it("o prazo de segurança é maior que a navegação mais lenta medida", () => {
    // 12,7 s medidos + folga; o prazo antigo (4 s) matava o selo
    expect(JANELA_SELO_MS).toBeGreaterThan(12_700);
  });

  it("o selo de um clique que nunca navegou expira sozinho", () => {
    selar("/salario");
    expect(seloPara("/salario")).toBe(true);
    vi.advanceTimersByTime(JANELA_SELO_MS);
    expect(seloPara("/salario")).toBe(false);
    // e não pode contaminar uma navegação normal posterior
    expect(lerSelo()).toBeNull();
  });

  it("o prazo do clique antigo não apaga o selo de um clique novo", () => {
    selar("/irs");
    selar("/salario");
    // o prazo do primeiro clique (4 s) passa com o segundo selo vivo
    vi.advanceTimersByTime(4_000);
    expect(seloPara("/salario")).toBe(true);
    expect(seloPara("/irs")).toBe(false);
  });

  it("só a rota selada aterra o voo", () => {
    selar("/salario");
    expect(seloPara("/irs")).toBe(false);
    expect(seloPara("/salario")).toBe(true);
  });

  it("o h1 leva o nome partilhado só na rota selada", () => {
    selar("/salario");
    const voado = renderToStaticMarkup(
      <TituloPagina rota="/salario">Quanto vais receber?</TituloPagina>
    );
    const outro = renderToStaticMarkup(
      <TituloPagina rota="/irs">Quanto pagas de IRS?</TituloPagina>
    );
    expect(voado).toContain("view-transition-name:pg-voo");
    expect(outro).not.toContain("pg-voo");
  });

  it("navegação normal (sem selo) não leva nome nenhum", () => {
    const h = renderToStaticMarkup(
      <TituloPagina rota="/salario">Quanto vais receber?</TituloPagina>
    );
    expect(h).not.toContain("pg-voo");
  });
});