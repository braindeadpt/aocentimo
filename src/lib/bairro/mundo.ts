/**
 * `mundoBairro()` — as camadas do mapa, montadas em texto, no SERVIDOR
 * (P1-1 do PACK V5 PRODUÇÃO, §2.2: «o mapa nasce pronto no HTML»).
 *
 * O protótipo montava isto em `mapa.innerHTML = …` depois de a página
 * carregar. Aqui é uma função pura: entra a `MapaBairro` que `planta.ts`
 * desenhou, sai a string HTML que entra na página. Sem DOM, sem efeito
 * de lado, testável em Vitest — e, sobretudo, o mapa e os números estão
 * no HTML antes de haver uma linha de JavaScript.
 *
 * A ORDEM DAS CAMADAS É CONTRATO. Vem do protótipo e não se mexe sem o
 * dono voltar a ver o mesmo desenho:
 *
 *   b-cFundo (padrões, nuvens a passar, sol, chão, fila de cima)
 *   → b-cA (quem anda na avenida) → b-cFrente (a Ribeira)
 *   → b-cB (quem anda cá em baixo, pombos, barcos atracados)
 *   → b-cRio (rabelos e metro a passar, Gaia e o tabuleiro da ponte)
 *   → b-cPonte (a treliça da frente) → b-cCeu (nadador e miúdos)
 *   → o véu da noite → b-cTopo (estrelas, lua, luzes, marcadores)
 *
 * A animação do eléctrico e das personagens corre dentro dos SVG: ao
 * contrário das peças isoladas, segue a transformação da sua camada.
 *
 * O que anda sempre — nuvens, barcos, metro — é um `<g>` animado por CSS
 * DENTRO da sua camada (ver `viajante()`). O protótipo punha-os em SVG
 * solto, no compositor; em produção isso promovia as camadas gigantes por
 * cima deles e matava a página no iPhone (auditoria de 2026-10-06).
 *
 * NADA É INVENTADO AQUI. Este ficheiro só embrulha o que a planta e o
 * `iso.ts` desenham. Os números dos marcadores já chegaram formatados
 * de `dadosBairro()`; o céu, as estrelas e a lua são decorado, não dado.
 */
import {
  larguraPin,
  MUNDO,
  ORIGEM,
  f1,
  metroIso,
  nuvem,
  padroes,
  pin,
  Pcom,
  rabelo,
  type Ponto,
} from "./iso";
import {
  HP,
  JM,
  TERRENO,
  eletricoIso,
  type MapaBairro,
  type Pino,
} from "./planta";

/** `P()` já com o terreno do bairro — o `P()` do protótipo. */
const Pt = Pcom(TERRENO);

const PONTOS_SALPICOS = [Pt(15.18, 12.55, -22), Pt(15.18, 13.35, -22)];

function salpicosSvg(): string {
  return PONTOS_SALPICOS.map(([x, y], k) =>
    `<g class="miudo b-salpicos" data-b-salpico="${k}" opacity="0" transform="translate(${f1(x)} ${f1(y)})"><ellipse rx="16" ry="6" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M-8 -4 l-4 -12 M0 -6 v-16 M8 -4 l4 -12" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></g>`
  ).join("");
}

/** Reexportado do `iso.ts` — ver o porquê lá. */
export { MUNDO };

/**
 * Os nomes das duas camadas que TÊM EDIFÍCIOS dentro (a da avenida e a
 * da Ribeira). Vêm de `messages/pt.json` como o resto da copy.
 */
export interface RotulosCamada {
  /** A camada de trás: fábrica, Segurança Social, Finanças, banco, correios e bomba. */
  avenida: string;
  /** A camada da frente: mercearia, pastelaria, a casa da Inês, o quiosque e a escola. */
  ribeira: string;
}

/**
 * Uma camada do cenário: um SVG grande, do tamanho do mundo inteiro.
 *
 * COM `rotulo` a camada é conteúdo: deixa de estar escondida e ganha
 * nome — é o caso das duas que têm os edifícios focáveis dentro.
 * Esconder um subtree com `tabindex="0"` dentro é a violação
 * `aria-hidden-focus` do axe: os onze botões ficam fora da árvore de
 * acessibilidade enquanto continuam na ordem de tabulação. As
 * camadas só de desenho (nuvens, chão, gente, água, céu, estrelas) e
 * as peças soltas continuam `aria-hidden`, que é o que elas são.
 */
const camada = (id: string, html: string, rotulo?: string): string =>
  `<svg class="b-camada" id="${id}" viewBox="${MUNDO.x} ${MUNDO.y} ${MUNDO.w} ${MUNDO.h}" width="${MUNDO.w}" height="${MUNDO.h}"${
    rotulo ? ` role="group" aria-label="${rotulo}"` : ` aria-hidden="true"`
  }>${html}</svg>`;

/**
 * Uma peça que viaja (nuvem, metro, rabelo): um `<g>` DENTRO de uma camada,
 * animado por CSS (`translate`).
 *
 * Antes era um `<svg class="b-solto">` solto, em `position: absolute`, entre
 * as camadas. Um elemento HTML com `translate` animado ganha camada própria
 * no compositor — e TODAS as camadas de 3600×2500 pintadas por cima dele, que
 * se sobrepõem, são promovidas também (a regra de sobreposição). No WebKit
 * (Safari e Chrome do iPhone) isso são quatro superfícies gigantes mais o
 * véu da noite à escala do ecrã Retina: o processo da página esgota a
 * memória e o iOS recarrega a página — o «crash ao chegar ao mapa».
 * Reproduzido no WebKit a DPR 2 e 3 e confirmado por bissecção (docs/
 * AUDITORIA-MAPA-2026-10.md). Um filho de SVG nunca ganha camada própria:
 * a mesma animação passa a repintar só o rectângulo da peça.
 *
 * O desenho já vem em coordenadas do mundo (o viewBox do antigo solto era
 * a própria caixa da peça), por isso a passagem é exacta, ao píxel.
 */
const viajante = (cls: string, html: string, id?: string, estilo = ""): string =>
  `<g class="b-viagem ${cls}"${id ? ` id="${id}"` : ""}${estilo ? ` style="${estilo}"` : ""}>${html}</g>`;

/* ——————————————————————————————— o céu ——————————————————————————————— */

/** As cinco nuvens soltas que passeiam pelo céu, com o seu vão e o seu tempo. */
const NUVENS: readonly (readonly [number, number, number])[] = [
  [-260, 60, 1],
  [420, -40, 0.8],
  [1180, -20, 1.1],
  [1850, 180, 0.9],
  [-420, 360, 0.7],
];

function nuvensSoltas(): string {
  // o vão e o tempo de cada nuvem são os do protótipo (`nuvemAnda`)
  return NUVENS.map(([x, y, e], k) =>
    viajante("nuvem-sp", nuvem(x, y, e), undefined, `--dx:${180 + k * 40}px;--dur:${60 + k * 12}s`)
  ).join("");
}

/** O sol do fim de tarde, por trás de tudo. Só se vê depois das 18h. */
const SOL = `<circle cx="1640" cy="110" r="58" fill="#ffb347" stroke="#16130f" stroke-width="2.6"/><circle cx="1640" cy="110" r="84" fill="#ffd27a" opacity=".35"/>`;

/* ———————————————————————————— as estrelas ———————————————————————————— */

/**
 * 70 estrelas em posições pseudo-aleatórias MAS DETERMINISTAS: o gerador
 * é um LCG com semente fixa, o mesmo do protótipo. Duas execuções do
 * servidor dão o mesmo céu — sem isto, cada build desenhas as estrelas
 * noutro sítio e a hidratação queixava-se de HTML diferente.
 */
function estrelas(): string {
  let semente = 3;
  const acaso = (): number => (semente = (semente * 9301 + 49297) % 233280) / 233280;
  let s = "";
  for (let k = 0; k < 70; k++) {
    const x = -700 + acaso() * 3200;
    // só onde é céu: à esquerda o miradouro é baixo, à direita o de Gaia
    const y = x < 250 ? -300 + acaso() * 560 : x > 1500 ? -300 + acaso() * 640 : -320 + acaso() * 230;
    s += `<circle class="estrela" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.2 + acaso() * 1.8).toFixed(1)}" fill="#fff8d6"/>`;
  }
  return s;
}

/** A lua, por cima do véu da noite. */
const LUA = `<g transform="translate(60 40)"><circle r="34" fill="#fff4c4" stroke="#16130f" stroke-width="2.6"/><circle cx="14" cy="-8" r="30" fill="#16235c"/><circle cx="-12" cy="10" r="4" fill="#e9dca6"/></g>`;

/* ———————————————————— os barcos e o metro ———————————————————— */

/** Onde o metro da ponte passa: entre o tabuleiro e a treliça da frente. */
const PM = { iA: 14.3, iB: 14.78, j0: JM + 0.1, j1: 18.7 } as const;

/**
 * As duas viagens do metro e as duas dos rabelos. Cada uma devolve o CSS
 * da sua animação e o SVG solto.
 *
 * As `@keyframes` são escritas pelo servidor e injectadas pelo
 * `<Bairro>` num `<style>` próprio. O protótipo inseria-as em
 * `document.head` depois de carregar; aqui já vêm no HTML, o que faz os
 * barcos começar a descer sem esperar pelo JavaScript.
 */
export function viagensSoltas(): { css: string; svg: string; barcos: string; metros: string } {
  // `i` = a posição na ponte · `volta` = o sentido · `dur` = o tempo da
  // viagem · `fase` = o atraso, para as duas composições não chegarem
  // juntas à mesma extremidade
  const METROS: readonly { i: number; volta: number; dur: number; fase: number }[] = [
    { i: PM.iA + (PM.iB - PM.iA) * 0.36, volta: 0, dur: 26, fase: 0 },
    { i: PM.iA + (PM.iB - PM.iA) * 0.66, volta: 1, dur: 26, fase: 13 },
  ];

  const posMetro = (j: number): Ponto => [-64 * j, 32 * j];

  const cssMetro = METROS.map(({ volta, dur, fase }, k) => {
    const [xa, ya] = posMetro(volta ? PM.j1 : PM.j0 + 1.45);
    const [xb, yb] = posMetro(volta ? PM.j0 + 1.45 : PM.j1);
    const [px, py] = posMetro(11);
    return (
      `@keyframes b-metro${k} { 0% { transform: translate(${xa}px, ${ya}px); opacity: 0; } 6% { opacity: 1; } 44% { opacity: 1; } ` +
      `50% { transform: translate(${xb}px, ${yb}px); opacity: 0; } 100% { transform: translate(${xb}px, ${yb}px); opacity: 0; } }\n` +
      `#b-metro${k} { transform: translate(${px}px, ${py}px); animation: b-metro${k} ${dur}s linear -${fase}s infinite; }`
    );
  }).join("\n");

  const svgMetro = METROS.map(({ i }, k) => viajante("metro-sp", metroIso(i, HP), `b-metro${k}`)).join("");

  // As viagens animam `transform: translate()`, nunca a propriedade
  // `translate` individual. Com `translate` (e o balouço em `transform`
  // no mesmo `<g>`), o Chrome de desktop passa a animação para o
  // compositor e pinta o filho do SVG sem a deslocação: o rabelo da 2.ª
  // viagem aparecia em cima da Segurança Social e o metro fora do
  // tabuleiro, embora getBoundingClientRect desse o sítio certo. Com a
  // animação parada (ou --disable-threaded-animation) ficava certo.
  // Reproduzido no Chromium 154, 1440×900 (docs/AUDITORIA-MAPA-2026-10.md).
  // `j` = o ponto de partida de cada viagem: o rabelo anda ao longo de j
  // (a coordenada da profundidade), e i avança com a velocidade
  const BARCOS: readonly { j: number; dur: number; fase: number }[] = [
    { j: 12.1, dur: 58, fase: 0 },
    { j: 13.6, dur: 84, fase: 46 },
  ];

  const posBarco = (i: number, j: number): Ponto => [(i - j) * 64, (i + j) * 32 + 22];

  const cssBarco = BARCOS.map(({ j, dur, fase }, k) => {
    const [x0, y0] = posBarco(-1.6, j);
    const [x1, y1] = posBarco(12.4, j);
    const [xs, ys] = posBarco(k ? 8.5 : 3.5, j);
    return (
      `@keyframes b-desce${k} { 0% { transform: translate(${x0}px, ${y0}px); opacity: 0; } 9% { opacity: 1; } 91% { opacity: 1; } ` +
      `100% { transform: translate(${x1}px, ${y1}px); opacity: 0; } }\n` +
      `#b-barco${k} { transform: translate(${xs}px, ${ys}px); animation: b-desce${k} ${dur}s linear -${fase}s infinite; }`
    );
  }).join("\n");

  const svgBarco = BARCOS.map((_, k) => viajante("barco-sp", rabelo(true), `b-barco${k}`)).join("");

  return {
    css:
      `${cssMetro}\n${cssBarco}\n` +
      // o balouço vai no desenho, dentro da viagem: um só `transform` por
      // elemento (ver o comentário da viagem, acima)
      `.barco-sp > .rabelo { animation: b-balouca 1.6s ease-in-out infinite alternate; }\n` +
      `@keyframes b-balouca { from { transform: translateY(0); } to { transform: translateY(2.5px); } }`,
    svg: svgMetro + svgBarco,
    barcos: svgBarco,
    metros: svgMetro,
  };
}

/* ——————————————————————— o reflexo no Douro ——————————————————————— */

/**
 * Tira do SVG os `id`, as classes e os atributos de acessibilidade.
 * A cópia do reflexo é só pintura: dois `id` iguais no mesmo documento
 * seria HTML inválido, e uma classe `ed` ali dentro seria um botão
 * invisível ao leitor de ecrã.
 */
function semAcoes(svg: string): string {
  return svg.replace(/\s(?:id|class|tabindex|role|aria-label|data-id)="[^"]*"/g, "");
}

/**
 * O reflexo: as fachadas da Ribeira e a ponte, espelhadas na água, às
 * riscas. No protótipo isto era feito no DOM (clone da `#gRibeira` sem
 * `id` nem classes, mais dois `<use>` da ponte). Aqui é feito em texto.
 *
 * `F1` é o eixo da fachada da Ribeira (plano j = 8,6) e `F2` o da ponte
 * (i = 14,54). Vêm da geometria da própria projeção, com `ORIGEM` — não
 * são números escritos à mão: se a projeção mudar, o reflexo muda com ela.
 */
/**
 * O miúdo a nadar debaixo da ponte — só a cabeça e o braço de fora.
 *
 * Nasce no céu, e não no rio: é uma peça de animação, e a camada do rio
 * tem de ficar quieta para o Douro não repintar a cada braçada.
 */
function nadador(): string {
  const [x, y] = Pcom(TERRENO)(15.05, 12.95, -22);
  return (
    `<g class="b-nadador" transform="translate(${f1(x)} ${f1(y)})">` +
    `<ellipse rx="12" ry="4" fill="#dff2ff" opacity=".7"/>` +
    `<circle cy="-5" r="5.5" fill="#d49a72" stroke="#16130f" stroke-width="1.4"/>` +
    `<path d="M-5.5 -7 q5.5 -6 11 0" fill="#1d1410"/>` +
    `<path class="b-braço-n" d="M5 -2 q7 -6 12 -2" fill="none" stroke="#d49a72" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`
  );
}

export function reflexos(m: MapaBairro): string {
  const F1 = 2 * (ORIGEM.y + 64 * 8.6 - ORIGEM.x / 2) + 44;
  const F2 = 2 * (ORIGEM.y + 64 * 14.54 + ORIGEM.x / 2) + 44;
  return (
    `<g clip-path="url(#b-clipAgua)"><g mask="url(#b-mascOndas)" opacity=".26">` +
    `<g id="b-refRibeira" transform="matrix(1 1 0 -1 0 ${f1(F1)})">${semAcoes(m.ribeira)}</g>` +
    `<use href="#ponteT" transform="matrix(1 -1 0 -1 0 ${f1(F2)})"/>` +
    `<use href="#ponteF" transform="matrix(1 -1 0 -1 0 ${f1(F2)})"/>` +
    `</g></g>`
  );
}

/* ———————————————————————— os marcadores ———————————————————————— */

/** O `data-id` do marcador é o do edifício, sem o índice do marcador gémio. */
const idDoPin = (id: string): string => id.replace(/\d$/, "");

/**
 * Os marcadores no formato que a câmara consome: âncora (x, y) e
 * largura da placa, em coordenadas do mundo. Os `data-x/y/w` do HTML e
 * esta função saem da mesma `larguraPin()` — um número, um sítio. O
 * servidor manda-os por prop (13 objectos pequenos) e é a câmara, no
 * cliente, que sabe onde os vai arrumar: a cadeia depende da largura da
 * janela, que o servidor não conhece.
 */
export function pinosDaCamera(m: MapaBairro): { id: string; x: number; y: number; w: number }[] {
  return m.pinos.map(([id, p, alt, rotulo, valor]) => ({
    id: idDoPin(id),
    x: p[0],
    y: p[1] - alt,
    w: larguraPin(rotulo, valor) + 3,
  }));
}

/**
 * Todos os marcadores, com o `data-id` que os liga aos edifícios (é por
 * ele que o cartão e o realce do mapa sabem a quem pertencem).
 */
export function marcadoresSvg(pinos: readonly Pino[]): string {
  return pinos
    .map(([id, p, alt, rotulo, valor]) =>
      pin(p[0], p[1] - alt, rotulo, valor).replace(
        'class="pin"',
        `class="pin" data-id="${idDoPin(id)}"`
      )
    )
    .join("");
}

/* ———————————————————————— o mundo inteiro ———————————————————————— */

/** O halo de cada candeeiro — acende só à noite (`.b-noite .luz` no CSS). */
const luz = (x: number, y: number): string =>
  `<g transform="translate(${f1(x)} ${f1(y)})"><circle class="luz" cx="0" cy="-60" r="46" fill="url(#b-brilho)" opacity="0"/></g>`;

/** O que fica por cima de tudo: estrelas, lua, as luzes e os pinos. */
function topo(m: MapaBairro): string {
  return (
    `<g id="b-gEstrelas">${estrelas()}${LUA}</g>` +
    `<g id="b-gLuzes">${m.luzes.map(([x, y]) => luz(x, y)).join("")}</g>` +
    `<g id="b-gPinos">${marcadoresSvg(m.pinos)}</g>` +
    `<g id="b-gEtiq"></g>`
  );
}

/** As camadas, pela ordem em que têm de ser pintadas. Os testes contam-nas. */
export const ORDEM_CAMADAS = [
  "b-cFundo",
  "b-cA",
  "b-cFrente",
  "b-cB",
  "b-cRio",
  "b-cPonte",
  "b-cCeu",
  "b-cTopo",
] as const;

/**
 * O mundo do bairro em HTML: as camadas, as peças soltas e o véu da
 * noite. É isto que entra no `<div id="b-mundo">` por
 * `dangerouslySetInnerHTML`.
 *
 * É SEGURO porque não há texto de utilizador em lado nenhum: o SVG vem
 * do código (`iso.ts`, `planta.ts`) e os números de `data/`, já
 * formatados pelo servidor. `mundo.test.ts` vigia essa promessa.
 */
export function mundoBairro(
  m: MapaBairro,
  rotulos: RotulosCamada
): { html: string; css: string } {
  const { barcos, metros, css } = viagensSoltas();
  const html =
    camada(
      "b-cFundo",
      // as nuvens são o céu: as primeiras a pintar, logo a seguir às defs
      `<defs>${padroes()}</defs>` +
        `<g id="b-gNuvensSoltas" aria-hidden="true">${nuvensSoltas()}</g>` +
        `<g id="b-gNuvens" aria-hidden="true"><g class="sol">${SOL}</g></g>` +
        `<g id="b-gChao" aria-hidden="true">${m.chao}</g>` +
        `<g id="b-gTras">${m.tras}</g>`,
      rotulos.avenida
    ) +
    camada(
      "b-cA",
      // a gente da avenida primeiro, o elétrico por cima (o protótipo
      // anexa-o depois das pessoas). A animação ambiente move-o: sem JS
      // fica parado na Avenida, que já é melhor do que não estar
      `<g id="b-movA">${m.gente.avenida}<g id="b-eletrico">${eletricoIso()}</g></g>`
    ) +
    camada("b-cFrente", `<g id="b-gFrente">${m.frente}</g>`, rotulos.ribeira) +
    camada("b-cB", `<g id="b-movB">${m.gente.cais}</g><g id="b-gVida">${m.vida}</g><g id="b-gAgua">${m.agua}</g>`) +
    // a ordem do protótipo: os rabelos antes de Gaia e da ponte; o metro
    // DEPOIS do tabuleiro (`ponte.tras`, com os carris) e antes da treliça
    // da frente (`b-cPonte`). Com o metro antes do tabuleiro, o tabuleiro
    // tapava-o e só se via o tejadilho, ao lado dos carris.
    camada(
      "b-cRio",
      `<g id="b-gViagens" aria-hidden="true">${barcos}</g><g id="b-gGaia">${m.gaia}</g><g id="b-gRio">${m.ponte.tras}</g>` +
        `<g id="b-gMetro" aria-hidden="true">${metros}</g>`
    ) +
    camada("b-cPonte", m.ponte.frente) +
    camada("b-cCeu", `<g id="b-gCeu">${m.gente.ceu}${nadador()}${salpicosSvg()}</g>`) +
    `<div id="b-noite" style="width:${MUNDO.w}px;height:${MUNDO.h}px"></div>` +
    camada("b-cTopo", topo(m));
  return { html, css };
}
