import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { mundoBairro, type RotulosCamada } from "@/lib/bairro/mundo";
import pt from "../../../messages/pt.json";
import { montarMapa, type MarcadoresBairro } from "@/lib/bairro/planta";

/**
 * O CSS do bairro contra o HTML que o servidor gera (P1, veredicto do
 * design).
 *
 * O hotfix da P1 nasceu aqui: o CSS escrevia `.b-ed`, `.b-pin`,
 * `.b-sombra-d`… e o HTML gerado usava `ed`, `pin`, `sombra-d` — cada
 * regra apontava ao lado e NADA aplicava. Passava nos testes porque eles
 * liam texto e não geometria; no site publicado as sombras não se
 * apagavam, os edifícios não levantavam ao passar e os marcadores não
 * cresciam.
 *
 * Este teste lê o `bairro.css` como texto, tira todos os seletores e
 * exige que cada classe `b-…` exista (a) no HTML que o servidor gera,
 * (b) no código do cliente, ou (c) na lista de classes de ESTADO — que
 * são postas por JavaScript e por isso não estão no HTML estático.
 *
 * Os `@keyframes` têm nomes `b-*` legítimos que não são classes; são
 * excluídos antes da análise.
 */

const CSS = readFileSync(
  join(process.cwd(), "src/app/_bairro/bairro.css"),
  "utf8"
);

/** As classes de estado — postas por JS, nunca no HTML do servidor. */
const ESTADOS = new Set([
  "b-on", // marcador aceso (cartão aberto)
  "b-ativo", // edifício aberto
  "b-arrasto", // a câmara está a ser arrastada
  "b-fim-tarde", // hora do dia
  "b-noite", // hora do dia
  "b-repinta", // a câmara pede pintura nova à escala
  "b-sobe", // as luzes sobem com o edifício focado
]);

/**
 * O CSS de blocos que AINDA NÃO têm JSX — chegam em P1-4 (as cartas) e
 * no P2b (o `b-confirma` da cena da Segurança Social). O pack manda
 * escrever o contrato visual do protótipo em bloco; este teste é o que
 * garante que não envelhece sem ninguém dar por isso: quando o JSX
 * chegar, a classe SAIO daqui — foi o que o P2a fez com as onze do
 * painel e da moldura das cenas. Se um bloco for entretanto abandonado,
 * o teste continua a apontar-lhe.
 */
const FUTURO_P1 = new Set([
  // a cena da Segurança Social (P2b): o recibo com a tabela
  "b-confirma",
  // o logótipo do protótipo — sem lar ainda (a casa não repete o cabeçalho)
  "b-logo",
]);
/** Os nomes reais das duas camadas com edifícios — `messages/pt.json`. */
const ROTULOS: RotulosCamada = {
  avenida: pt.bairro.mapa.rotuloAvenida,
  ribeira: pt.bairro.mapa.rotuloRibeira,
};

/** O HTML completo que o servidor gera, com marcadores de mentira. */
function htmlGerado(): string {
  const D: MarcadoresBairro = {
    salario: "1 500 €", tsu: "23,75 %", irs: "168 €", liquido: "1 167 €",
    cabaz: "+35 %", cafes: "+47 %", euribor: "2,95 %", ca: "2,50 %",
    gasoleo: "2,181", gasolina: "2,097",
    gasoleoUn: "2,181\u202F€/L", gasolinaUn: "2,097\u202F€/L",
    inflacao: "+3,6 %", desemprego: "5,7 %",
  } as unknown as MarcadoresBairro;
  const { html, css } = mundoBairro(montarMapa(D), ROTULOS);
  return html + css;
}

/** Todo o código do cliente que põe ou procura classes (JSX incluído). */
function codigoCliente(): string {
  const ler = (p: string): string => readFileSync(join(process.cwd(), p), "utf8");
  return (
    ler("src/app/_bairro/Bairro.tsx") +
    ler("src/app/_bairro/Cartas.tsx") +
    ler("src/app/_bairro/HomeBairro.tsx") +
    ler("src/app/_bairro/camara.ts") +
    ler("src/app/_bairro/ambiente.ts") +
    // as cenas P2a: os seletores de conteúdo (.b-calc, .b-talão…) vivem
    // nos seus componentes e no bairro-cenas.css, carregado no chunk
    ler("src/app/_bairro/bairro-cenas.css") +
    ["CenaFabrica", "CenaFinancas", "CenaBanco", "CenaMercearia", "CenaDePerto"]
      .map((f) => ler(`src/app/_bairro/cenas/${f}.tsx`))
      .join("")
  );
}

/** As classes `b-…` referenciadas em seletores do CSS (sem keyframes). */
function classesDoCss(): string[] {
  const semKeyframes = CSS.replace(
    /@keyframes\s+[\w-]+\s*\{(?:[^{}]|\{[^{}]*\})*\}/g,
    ""
  );
  return [...new Set(semKeyframes.match(/\.((?:b-)?[a-zA-Z][\w-]*)/g) ?? [])]
    .map((c) => c.slice(1))
    .filter((c) => c.startsWith("b-"));
}

describe("o CSS do bairro só usa classes que existem", () => {
  const html = htmlGerado();
  const codigo = codigoCliente();

  it("cada classe b-… do CSS existe no HTML, no código ou é um estado", () => {
    const semLar: string[] = [];
    for (const classe of classesDoCss()) {
      const noHtml = html.includes(classe);
      const noCodigo = codigo.includes(classe);
      const eEstado = ESTADOS.has(classe);
      const eFuturo = FUTURO_P1.has(classe);
      if (!noHtml && !noCodigo && !eEstado && !eFuturo) semLar.push(classe);
    }
    expect(
      semLar,
      `seletores do bairro.css sem nenhum alvo real: ${semLar.join(", ")}`
    ).toEqual([]);
  });

  it("as classes de estrutura não levam b- no HTML nem o CSS espera que levem", () => {
    // o veredicto: o CSS escrevia .b-ed onde o HTML usa .ed. Se alguém
    // renomear as classes no HTML para as alinhar com o CSS antigo (ou
    // vice-versa), este teste diz que lado ficou desalinhado.
    const htmlClasses = new Set(
      [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))
    );
    // estas NÃO podem existir no HTML gerado — são os fantasmas do hotfix
    for (const fantasma of ["b-ed", "b-pin", "b-pin-corpo", "b-sombra-d", "b-miudo"]) {
      expect(
        htmlClasses.has(fantasma),
        `"${fantasma}" apareceu no HTML: o CSS e o HTML deixaram de falar a mesma língua`
      ).toBe(false);
    }
  });
});

describe("o posicionamento das camadas (o outro defeito do hotfix)", () => {
  it("o CSS declara .b-camada como absolute — senão as camadas empilham-se em fluxo", () => {
    expect(CSS).toMatch(/\.b-camada\s*\{[^}]*position:\s*absolute/);
  });

  it("nenhuma peça animada é HTML posicionado entre as camadas (o crash do iPhone)", () => {
    // um .b-solto absoluto com `translate` animado promovia as camadas de
    // 3600×2500 por cima dele no WebKit e a página morria por memória
    expect(CSS).not.toMatch(/\.b-solto\s*\{/);
    expect(CSS).toMatch(/\.nuvem-sp\s*\{[^}]*animation:\s*b-nuvem-anda/);
  });
});