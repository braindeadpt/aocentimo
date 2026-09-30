import { describe, it, expect } from "vitest";
import { loadFonte, loadSerie } from "@/lib/data";
import caBase from "@data/derived/ca-base.json";
import cenarios from "@data/derived/cenarios-salario.json";
import ss from "@data/fiscal/ss.json";
import { FINO } from "@/lib/format";
import { FALHOU, dadosBairro, fontes, linhaSalario, marcadores, moedasDaLinha } from "./dados";

const M = marcadores();

describe("marcadores()", () => {
  it("devolve os doze campos, todos texto", () => {
    for (const v of Object.values(M)) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("nenhum campo traz undefined nem NaN — a falha é declarada, não o vazio", () => {
    for (const [campo, v] of Object.entries(M)) {
      expect(v, campo).not.toContain("undefined");
      expect(v, campo).not.toContain("NaN");
    }
  });

  it("o salário vem da linha de referência dos cenários", () => {
    // o formatador põe o espaço fino e a vírgula decimal à pt — o teste
    // compara os DÍGITOS, não a forma, para não repetir o formatador
    // fmtEUR escreve sempre duas casas — daí dividir por cem
    const comoNumero = (s: string) => Number(s.replace(/[^\d]/g, "")) / 100;
    const ref = cenarios.linhas.find((l) => l.bruto === cenarios.meta.brutoRef)!;
    expect(comoNumero(M.salario)).toBe(ref.bruto);
    expect(comoNumero(M.liquido)).toBeCloseTo(ref.liquido, 2);
    expect(M.salario).toContain("€");
    expect(M.salario).toContain(FINO);
  });

  it("a TSU da entidade vem de data/fiscal/ss.json — não é uma constante escrita à mão", () => {
    // o protótipo tinha "23,75 %" digitado à mão em mapa.tpl.html
    expect(ss.entidadePatronal.taxa).toBe(0.2375);
    expect(M.tsu).toContain("23,75");
    // se a lei mudar o JSON, o texto muda — que é o ponto
    expect(M.tsu).not.toBe(FALHOU);
  });

  it("a Euribor é reexpressada em percentagem, não multiplicada porcem", () => {
    const e = loadFonte("bpstat", "euribor-12m-mensal")!;
    const v = e.series.at(-1)!.v; // 2,9537 — já em percentagem
    expect(M.euribor).toContain(String(v.toFixed(2)).replace(".", ","));
    expect(M.euribor).not.toContain("295"); // o bug de dividir por 100 a mais
  });

  it("o preço do litro sai com três casas, como a DGEG publica", () => {
    const g = loadFonte("dgeg", "pmd-gasoleo-diario")!;
    expect(M.gasoleo).toMatch(/^\d+,\d{3}$/);
    expect(M.gasoleo).toContain(g.series.at(-1)!.v.toFixed(3).replace(".", ","));
    expect(M.gasoleoUn.endsWith("€/L")).toBe(true);
    // e o espaço antes da unidade é o FINO (U+202F), nunca um espaço normal:
    // o `audit` de lettering reprova a página se for normal ou NBSP largo
    expect(M.gasoleoUn).toBe(`${M.gasoleo}\u202F€/L`);
    // nenhum espaço NORMAL nem NBSP largo: só o FINO que separa o número
    // da unidade (o «/» do «/L» é parte da unidade, não um espaço)
    expect(M.gasoleoUn.replace(/\u202F/g, "")).not.toMatch(/[\s\u00A0]/);
  });

  it("a variação do cabaz e dos cafés é homóloga desde 2020-08", () => {
    const cp01 = loadSerie("cp01")!;
    const base = cp01.series.find((p) => p.t === "2020-08")!;
    const topo = cp01.series.at(-1)!;
    const esperado = Math.round((topo.v / base.v - 1) * 100);
    expect(M.cabaz).toBe(`+${String(esperado)}${FINO}%`);
  });

  it("a inflação é homóloga de doze meses, não desde o início da série", () => {
    const cp00 = loadSerie("cp00")!;
    const s = cp00.series;
    // uma casa decimal: o protótipo e o ticker do site mostram «+3,6 %».
    // Arredondar a «+4 %» publicava um número que não é o da fonte.
    const bruto = (s.at(-1)!.v / s.at(-13)!.v - 1) * 100;
    const esperado = bruto.toFixed(1).replace(".", ",");
    expect(M.inflacao).toBe(`+${esperado}${FINO}%`);
  });

  it("cada valor tem a fonte à vista nas notas", () => {
    const f = fontes().join(" · ");
    for (const pedaco of ["DGEG", "BPstat", "Eurostat", "IGCP", "motores AO CÊNTIMO"]) {
      expect(f).toContain(pedaco);
    }
  });

  it("o valor do certificado de aforro é o oficial do IGCP", () => {
    const oficial = caBase.meta.oficialPct;
    expect(M.ca).toContain(String(oficial).replace(".", ","));
  });
});

describe("linhaSalario()", () => {
  const l = linhaSalario();

  it("traz a linha de referência com o ano e o perfil de meta", () => {
    expect(l).not.toBeNull();
    expect(l!.bruto).toBe(cenarios.meta.brutoRef);
    expect(l!.ano).toBe(cenarios.meta.ano);
    expect(l!.perfil).toBe(cenarios.meta.perfil);
  });

  it("a conta fecha: do bruto saem o SS e o IRS, e o líquido é o que sobra", () => {
    // A TSU DA ENTIDADE NÃO sai do salário: é o que a empresa paga por cima
    // (é o `custo`). Confundi-la com o que desconta ao trabalhador dava uma
    // conta que não fechava por 356,25 €.
    expect(l!.bruto - l!.ss - l!.irs).toBeCloseTo(l!.liquido, 6);
    // e o custo é o bruto mais essa TSU
    expect(l!.custo).toBeCloseTo(l!.bruto + l!.tsu, 6);
    expect(l!.tsu).toBeGreaterThan(0);
  });
});

describe("moedasDaLinha()", () => {
  const l = linhaSalario();

  it("somam sempre o total, sem faltar nem sobrar moeda", () => {
    for (const total of [20, 30, 7]) {
      const m = moedasDaLinha(l, total)!;
      const { total: t, ...partes } = m;
      expect(t).toBe(total);
      expect(Object.values(partes).reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it("são inteiras e proporcionais ao que sai", () => {
    const m = moedasDaLinha(l, 20)!;
    const { total, ...partes } = m;
    for (const n of Object.values(partes)) expect(Number.isInteger(n)).toBe(true);
    // o que fica tem de ser a maior parte, porque é o que sobra do bruto
    expect(partes.fica).toBeGreaterThan(partes.irs);
    expect(total).toBe(20);
  });

  it("sem linha não há moedas — null, nunca zero", () => {
    expect(moedasDaLinha(null)).toBeNull();
  });

  it("com uma linha toda a zero não há moedas — null, não vinte zeros", () => {
    const zero = { ...l!, tsu: 0, ss: 0, irs: 0, liquido: 0 };
    expect(moedasDaLinha(zero)).toBeNull();
  });
});

describe("dadosBairro()", () => {
  const d = dadosBairro();

  it("devolve os marcadores, o salário, as moedas, o mapa e as fontes", () => {
    expect(d.marcadores).toBeDefined();
    expect(d.salario).not.toBeNull();
    expect(d.moedas).not.toBeNull();
    expect(d.mapa.pinos.length).toBeGreaterThan(10);
    expect(d.fontes.length).toBeGreaterThan(3);
  });

  it("o mapa já sai com os valores dentro dos pinos", () => {
    const porId = Object.fromEntries(d.mapa.pinos.map(([id, , , , v]) => [id, v]));
    expect(porId.fabrica).toBe(d.marcadores.salario);
    expect(porId.banco).toBe(d.marcadores.euribor);
  });

  it("é determinístico — dois Chamadas dão o mesmo mapa", () => {
    expect(dadosBairro().mapa.tras).toBe(dadosBairro().mapa.tras);
  });

  it("nenhuma camada do mapa traz undefined nem NaN", () => {
    const todo = d.mapa.chao + d.mapa.tras + d.mapa.frente + d.mapa.gaia + d.mapa.agua;
    expect(todo).not.toContain("undefined");
    expect(todo).not.toContain("NaN");
  });
});
