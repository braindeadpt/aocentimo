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

/* Os valores que `dadosBairro()` entrega: texto JÁ FORMATADO. A planta
   não formata nada e o mundo também não. */
const D: MarcadoresBairro = {
  salario: "1 500 €",
  tsu: "23,75 %",
  irs: "168 €",
  liquido: "1 167 €",
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
    expect(marcadoresSvg(M.pinos)).toContain("1 500 €");
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
    // a câmara enquadra `ENQUADRAMENTOS.longe` com uma largura de vista
    // max(1500, 1140/razao). A janela de referência é a do contentor do
    // mapa num ecrã de 1440 px, que é onde este valor foi apurado.
    const largura = 1240;
    const altura = 740;
    const razao = altura / largura;
    const vbw = Math.max(1500, 1140 / razao);
    const s = largura / vbw;
    const c = ENQUADRAMENTOS.longe;
    const vb = { x: c.x - vbw / 2, y: c.y - (vbw * razao) / 2 };

    const cssVista = transformDoCss(bloco("desktop"), largura);
    // a tolerância é de meio por cento: o CSS arredonda a quatro casas
    expect(Math.abs(cssVista.s / s - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.tx / (-(vb.x - MUNDO.x) * s) - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.ty / (-(vb.y - MUNDO.y) * s) - 1)).toBeLessThan(0.005);
  });

  it("no telemóvel é o enquadramento que a câmara escolhe ao arrancar", () => {
    const largura = 375;
    const altura = 600;
    const razao = altura / largura;
    const vbw = 820;
    const s = largura / vbw;
    // o centro vem da planta: `ENQUADRAMENTOS.perto`, na cota da Avenida
    const [cx, cy] = ENQUADRAMENTOS.perto;
    const vb = { x: cx - vbw / 2, y: cy - 10 - (vbw * razao) / 2 };

    const cssVista = transformDoCss(bloco("telemovel"), largura);
    expect(Math.abs(cssVista.s / s - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.tx / (-(vb.x - MUNDO.x) * s) - 1)).toBeLessThan(0.005);
    expect(Math.abs(cssVista.ty / (-(vb.y - MUNDO.y) * s) - 1)).toBeLessThan(0.005);
  });
});

/* ————————————————————————————————————————————————————————————
   O APARO FINO DAS COORDENADAS (P4). A precisão do desenho vive numa
   função só — `fi`, em iso.ts — e hoje é ao inteiro. O que pode ter
   décimas no mapa é só o que não passa por `fi`: os literais de direção
   dos `matrix(.8944 .4472 …)` e os ângulos dos `rotate(26.57 …)`. Este
   teste é o contrato: se alguém voltar a pôr décimas no desenho, é
   deliberado e passa por aqui.
   ———————————————————————————————————————————————————————————— */

describe("o aparo fino das coordenadas", () => {
  const { html } = mundoBairro(M);

  const decimaisForaDe = (ctx: string): string[] =>
    ctx.match(/-?\d+\.\d+/g) ?? [];

  it("o viewBox das camadas e das peças soltas é inteiro", () => {
    for (const m of html.matchAll(/viewBox="([^"]+)"/g)) {
      expect(decimaisForaDe(m[1])).toEqual([]);
    }
  });

  it("os atributos d, points e as translações dos matrix são inteiros", () => {
    for (const m of html.matchAll(/\b(d|points)="([^"]+)"/g)) {
      expect(decimaisForaDe(m[2]), `em ${m[1]}="${m[2].slice(0, 60)}…"`).toEqual([]);
    }
    // nos matrix só as translações (componentes e/f) podem ter número;
    // os literais .8944/.4472 são a direção isométrica e ficam intactos —
    // a esquerda leva (.8944 .4472), a direita a espelhada (.8944 -.4472).
    for (const m of html.matchAll(/transform="matrix\(([^)]+)\)"/g)) {
      const [a, b, c, dd] = m[1].trim().split(/[\s,]+/);
      expect(Number(a)).toBeCloseTo(0.8944, 3);
      expect(Math.abs(Number(b))).toBeCloseTo(0.4472, 3);
      expect(Number(c)).toBe(0);
      expect(Number(dd)).toBe(1);
    }
  });

  it("fora de direções e estilos de traço, o mapa não tem um decimal", () => {
    // O que pode ter décimas, e só isto: os literais de direção/escala
    // (matrix, scale), o ângulo dos rotate, o traço (stroke-width,
    // dasharray, opacity) e o raio das estrelas. Tudo o resto — posição,
    // caixas, translações — é inteiro.
    const limpo = html
      .replace(/\b(matrix|scale)\([^)]*\)/g, "X()")
      .replace(/\brotate\(-?[\d.]+/g, "rotate(")
      .replace(/\bstroke-(width|dasharray)="[^"]*"/g, "")
      .replace(/\bopacity="[^"]*"/g, "")
      // font-size é tipografia, não coordenada: arredondá-lo mudava o
      // tamanho do glifo (visível), por isso fica de fora do aparar.
      .replace(/\bfont-size="[\d.]+"/g, "")
      .replace(/(<circle class="estrela"[^>]*?\br=")[\d.]+/g, "$1");
    const sobras = decimaisForaDe(limpo);
    if (sobras.length) {
      const onde = sobras.map((d) => {
        const k = limpo.indexOf(d);
        return `  ${d} @ …${limpo.slice(Math.max(0, k - 90), k + 40).replace(/\n/g, " ")}…`;
      });
      throw new Error(`decimais sobrando (${sobras.length}):
${onde.join("\n")}`);
    }
  });
});
