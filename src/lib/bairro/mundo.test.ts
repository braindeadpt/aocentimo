import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { MUNDO, ORDEM_CAMADAS, marcadoresSvg, mundoBairro, reflexos, viagensSoltas } from "./mundo";

/** A vista que a câmara escreve no `transform` do mundo. */
interface Vista {
  tx: number;
  ty: number;
  s: number;
}
import { montarMapa, ENQUADRAMENTOS, type MarcadoresBairro } from "./planta";
import { pinosDaCamera } from "./mundo";
import { vistaInicial } from "@/app/_bairro/camara";

/* Os valores que `dadosBairro()` entrega: texto JÁ FORMATADO. A planta
   não formata nada e o mundo também não. */
/* Os valores com o formato que `dadosBairro()` produz HOJE («1 500,00 €»,
   não «1 500 €»): as larguras das placas alimentam a cadeia de arrumação
   e o enquadramento medido — um fixture com formatos velhos aqui dava um
   enquadramento do CSS que não bate com o que a câmara calcula no ar. */
const D: MarcadoresBairro = {
  salario: "1 500,00 €",
  tsu: "23,75 %",
  irs: "168,17 €",
  liquido: "1 166,83 €",
  cabaz: "+35 %",
  cafes: "+47 %",
  euribor: "2,95 %",
  ca: "2,50 %",
  gasoleo: "2,181",
  gasolina: "2,097",
  gasoleoUn: "2,181\u202F€/L",
  gasolinaUn: "2,097\u202F€/L",
  inflacao: "+3,6 %",
  desemprego: "5,7 %",
};

const M = montarMapa(D);

describe("mundoBairro — a ordem das camadas", () => {
  const { html } = mundoBairro(M);

  it("pinta as oito camadas pela ordem do protótipo", () => {
    const pos = ORDEM_CAMADAS.map((id) => html.indexOf(`id="${id}"`));
    expect(pos.every((p) => p >= 0)).toBe(true);
    // sem sobreposição: cada uma vem depois da anterior
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });

  it("as nuvens vêm antes de tudo — são o céu", () => {
    const iNuvem = html.indexOf("nuvem-sp");
    expect(iNuvem).toBeGreaterThanOrEqual(0);
    expect(iNuvem).toBeLessThan(html.indexOf(`id="${ORDEM_CAMADAS[0]}"`));
  });

  it("o véu da noite vem entre o céu e o topo", () => {
    const iNoite = html.indexOf('id="b-noite"');
    expect(iNoite).toBeGreaterThan(html.indexOf(`id="${ORDEM_CAMADAS[6]}"`));
    expect(iNoite).toBeLessThan(html.indexOf(`id="${ORDEM_CAMADAS[7]}"`));
  });

  it("o topo leva as estrelas, a lua, as luzes e os marcadores", () => {
    const topo = html.slice(html.indexOf(`id="${ORDEM_CAMADAS[7]}"`));
    expect(topo).toContain('id="b-gEstrelas"');
    expect(topo).toContain('id="b-gLuzes"');
    expect(topo).toContain('id="b-gPinos"');
    expect(topo).toContain('id="b-gEtiq"');
  });

  it("cada camada é do tamanho do mundo e escondida ao leitor de ecrã", () => {
    for (const id of ORDEM_CAMADAS) {
      expect(html).toContain(
        `id="${id}" viewBox="${MUNDO.x} ${MUNDO.y} ${MUNDO.w} ${MUNDO.h}"`
      );
    }
    // as camadas não se anunciam: quem descreve o mapa é o texto longo
    expect((html.match(/class="b-camada"[^>]*aria-hidden="true"/g) ?? []).length).toBe(
      ORDEM_CAMADAS.length
    );
  });

  it("as peças soltas ficam FORA das camadas (para animarem sem repintar)", () => {
    // barcos e metro são svg soltos; o cenário é que está em camadas
    expect(html).toContain("b-solto barco-sp");
    expect(html).toContain("b-solto metro-sp");
    // nenhum svg solto dentro de uma camada
    const inicioCamada = html.indexOf(`id="${ORDEM_CAMADAS[0]}"`);
    expect(html.indexOf("b-solto barco-sp")).toBeGreaterThan(inicioCamada);
    expect(html).toContain('id="b-cRio"');
  });
});

describe("mundoBairro — determinismo", () => {
  it("duas chamadas dão exactamente o mesmo HTML", () => {
    // sem isto, cada build desenha as estrelas noutro sítio e a
    // hidratação queixa-se de HTML diferente do servidor
    expect(mundoBairro(M).html).toBe(mundoBairro(M).html);
  });

  it("as estrelas são sempre 70", () => {
    expect((mundoBairro(M).html.match(/class="estrela"/g) ?? []).length).toBe(70);
  });
});

describe("viagensSoltas", () => {
  const { css, svg } = viagensSoltas();

  it("escreve duas viagens de barco e duas de metro", () => {
    expect((css.match(/@keyframes b-desce/g) ?? []).length).toBe(2);
    expect((css.match(/@keyframes b-metro/g) ?? []).length).toBe(2);
    expect((svg.match(/barco-sp/g) ?? []).length).toBe(2);
    expect((svg.match(/metro-sp/g) ?? []).length).toBe(2);
  });

  it("o CSS viaja com o SVG — o barco mexe-se sem esperar pelo JS", () => {
    expect(css).toContain("#b-barco0");
    expect(css).toContain("#b-metro1");
    expect(css).toContain("@keyframes b-balouca");
  });

  it("as peças soltas recebem id para a animação as apanhar", () => {
    expect(svg).toContain('id="b-barco0"');
    expect(svg).toContain('id="b-metro1"');
  });
});

describe("marcadoresSvg", () => {
  it("cada marcador sabe a que edifício pertence", () => {
    const svg = marcadoresSvg(M.pinos);
    for (const [id] of M.pinos) {
      expect(svg).toContain(`data-id="${id.replace(/\d$/, "")}"`);
    }
  });

  it("escreve o valor que recebeu, sem o formatar", () => {
    expect(marcadoresSvg(M.pinos)).toContain(D.salario);
  });
});

describe("reflexos", () => {
  const r = reflexos(M);

  it("a cópia não repete nenhum id do mapa (HTML inválido)", () => {
    const idsDoReflexo = [...r.matchAll(/id="([^"]+)"/g)].map((x) => x[1]);
    // o único id que o reflexo pode ter é o seu próprio contentor
    expect(new Set(idsDoReflexo)).toEqual(new Set(["b-refRibeira"]));
  });

  it("a cópia não tem botões: é pintura, não interface", () => {
    expect(r).not.toContain('role="button"');
    expect(r).not.toContain("tabindex");
    expect(r).not.toContain("aria-label");
    expect(r).not.toContain('data-id="');
  });

  it("espelha a fila da Ribeira e a ponte na água", () => {
    expect(r).toContain('href="#ponteT"');
    expect(r).toContain('href="#ponteF"');
    expect(r).toContain("matrix(1 1 0 -1");
  });
});

describe("a promessa do dangerouslySetInnerHTML", () => {
  const { html } = mundoBairro(M);

  it("não há texto de utilizador no mapa: só o que o código desenhou", () => {
    // o mapa entra no HTML por dangerouslySetInnerHTML. Isto só é seguro
    // porque tudo o que lá está vem do repositório e de data/ — nunca de
    // quem está a usar a página. O teste falha se alguém introduzir texto
    // de fora sem o ver.
    const textos = [...html.matchAll(/>([^<>{}]+)</g)]
      .map((x) => x[1].trim())
      .filter((t) => t.length > 0 && !/^[\d\s.,%+€·–—-]+$/.test(t));
    // tudo o que resta ou é do código (dentro de uma expressão ${}) ou é
    // o valor de um marcador, que já passou pelos formatadores
    for (const t of textos) {
      expect(t).not.toMatch(/[<>&"'\\]/);
    }
  });

  it("os valores dos marcadores são os de data/, não números escritos à mão", () => {
    expect(html).toContain(D.salario);
    expect(html).toContain(D.liquido);
    expect(html).toContain(D.euribor);
  });

  it("não há <script> nem atributos on* no mapa", () => {
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son[a-z]+=/);
  });
});

/* ————————————————————————————————————————————————————————————
   O enquadramento sem JavaScript.

   A câmara escreve um `transform` calculado ao vivo, mas só depois de a
   página carregar. O CSS põe um enquadramento por omissão, para o caso
   de não haver JavaScript. Se os dois divergirem, quem não tem
   JavaScript vê o bairro cortado num sítio diferente de quem o tem — e
   esse erro não aparece em nenhum outro lugar.

   Este teste lê o `bairro.css` e confere que o transform de lá é o
   mesmo que a câmara calcula para a mesma largura de referência.
   ———————————————————————————————————————————————————————————— */

describe("o enquadramento por omissão do CSS", () => {
  const css = readFileSync(
    join(process.cwd(), "src/app/_bairro/bairro.css"),
    "utf8"
  );

  /**
   * O `transform` que o CSS declara para `.b-mundo`, já em píxeis de
   * contentor. `largura` é a largura do contentor do mapa.
   */
  function transformDoCss(bloco: string, largura: number): Vista {
    const m =
      /transform:\s*translate\((-?[\d.]+)cqw,\s*(-?[\d.]+)cqw\)\s*scale\(([\d.]+)\)/.exec(bloco);
    if (!m) throw new Error("bairro.css: sem transform por omissão em .b-mundo");
    const [, tx, ty, sc] = m;
    return {
      // cqw = 1% da largura do contentor do mapa (com container-type)
      tx: (Number(tx) / 100) * largura,
      ty: (Number(ty) / 100) * largura,
      s: Number(sc),
    };
  }

  /** O bloco do CSS do `.b-mundo` (o de fora e o do telemóvel). */
  function bloco(media: "desktop" | "telemovel"): string {
    const desktop = /\[data-pele="v5"\] \.b-mundo \{[^}]*\}/.exec(css);
    if (!desktop) throw new Error("bairro.css: falta a regra do .b-mundo");
    if (media === "desktop") return desktop[0];
    const tel = /@media \(max-width: 700px\) \{\s*\[data-pele="v5"\] \.b-mundo \{[^}]*\}/.exec(css);
    if (!tel) throw new Error("bairro.css: falta o enquadramento do telemóvel");
    return tel[0];
  }

  it("o ponto distante é o (760, 470) do protótipo, não um ponto da planta", () => {
    // Este número está em três sítios — o CSS, a câmara e o protótipo. Um
    // dia alguém derivou-o da planta achando que era mais limpo, e a câmara
    // passou a saltar no primeiro quadro sem o CSS dar conta. O teste
    // abaixo apanha-o; este diz de onde vem.
    expect(ENQUADRAMENTOS.longe).toEqual({ x: 760, y: 470 });
    // e o ponto estreito é mesmo o P(3.6, 5.6) sobre a cota da Avenida
    const [px, py] = ENQUADRAMENTOS.perto;
    expect(px).toBeCloseTo(720 + (3.6 - 5.6) * 64, 5);
    expect(py).toBeCloseTo(250 + (3.6 + 5.6) * 32 - 110, 5);
  });

  it("existe um transform por omissão, senão sem JS o mapa fica fora do ecrã", () => {
    for (const m of ["desktop", "telemovel"] as const) {
      expect(transformDoCss(bloco(m), 1000).s).toBeGreaterThan(0);
    }
  });

  it("no computador é o enquadramento que a câmara escolhe ao arrancar", () => {
    // A câmara agora MEDe os marcadores (`vistaInicial`): a janela de
    // referência é a do contentor do mapa num ecrã de 1440×900 — com os
    // 13 marcadores inteiros e as folgas do dono (12 px em cima, 2 nos
    // lados). O CSS e a câmara saem da mesma função: um número, um sítio.
    const largura = 1240;
    const altura = 666;
    const v = vistaInicial(
      { perto: [...ENQUADRAMENTOS.perto], longe: [ENQUADRAMENTOS.longe.x, ENQUADRAMENTOS.longe.y] },
      largura, altura, pinosDaCamera(montarMapa(D))
    );
    const s = largura / v.w;

    const cssVista = transformDoCss(bloco("desktop"), largura);
    // a tolerância é de meio por cento: o CSS arredonda a quatro casas
    expect(Math.abs(cssVista.s / s - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.tx / (-(v.x - MUNDO.x) * s) - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.ty / (-(v.y - MUNDO.y) * s) - 1)).toBeLessThan(0.005);
  });

  it("no telemóvel é o enquadramento que a câmara escolhe ao arrancar", () => {
    const largura = 375;
    const altura = 0.74 * 812; // o clamp(460px, 74vh, 760px) a 812 de altura
    const v = vistaInicial(
      { perto: [...ENQUADRAMENTOS.perto], longe: [ENQUADRAMENTOS.longe.x, ENQUADRAMENTOS.longe.y] },
      largura, altura, pinosDaCamera(montarMapa(D))
    );
    const s = largura / v.w;

    const cssVista = transformDoCss(bloco("telemovel"), largura);
    expect(Math.abs(cssVista.s / s - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.tx / (-(v.x - MUNDO.x) * s) - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.ty / (-(v.y - MUNDO.y) * s) - 1)).toBeLessThan(0.005);
  });
});
