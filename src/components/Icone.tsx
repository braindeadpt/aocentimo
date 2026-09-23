import type { CSSProperties } from "react";

/**
 * Icone — o sistema de símbolos da casa (1B-01). Conjunto FECHADO,
 * desenhado à mão em SVG: grelha 20×20, traço 1,5 px, terminações e
 * juntas redondas, sem preenchimentos. Iconografia stock é proibida —
 * cada desenho nasceu nesta grelha, não veio de uma biblioteca.
 *
 * Três famílias:
 *   · páginas — um sinal por pergunta (salario … aprender)
 *   · acções  — vivem sempre dentro de <button>/<a> com nome acessível
 *   · estado  — a família do OrbeEstado em linguagem de traço (pontos)
 *
 * O svg é decorativo por omissão (aria-hidden): o significado mora no
 * texto ao lado ou no nome do controlo que o envolve. `rotulo` existe
 * só para o caso raro de um ícone sozinho com significado próprio
 * (role="img" + aria-label) — nunca para repetir o que já está escrito.
 *
 * Movimento (tipo 2 — responde): ao passar/focar o controlo que o
 * envolve, o traço desenha-se uma vez (stroke-dashoffset sobre
 * pathLength=1, --dur-micro + passo por traço) — CSS puro, sem JS;
 * o bloco global de reduced-motion deixa-o já desenhado.
 *
 * Herda do <Glifo> 12×12 revertido (B-03, commit 2da28c6) a técnica —
 * pathLength=1 + dashoffset em currentColor — mas não o componente:
 * a grelha é 20×20, o conjunto é fechado e o gatilho é o hover/focus
 * do controlo em CSS, não um useLayoutEffect por mudança de tipo.
 */

/* um ponto stroked na grelha — círculo escrito em arcos para o
   pathLength=1 funcionar em todo o lado (a lição do Glifo) */
const dot = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy}a${r} ${r} 0 1 1${-2 * r} 0a${r} ${r} 0 1 1${2 * r} 0`;

/* anel de n posições a distância R do centro da grelha (10,10) */
const anel = (n: number, R: number, a0 = -90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((a0 + (360 / n) * i) * Math.PI) / 180;
    return [
      +(10 + R * Math.cos(a)).toFixed(2),
      +(10 + R * Math.sin(a)).toFixed(2),
    ] as const;
  });

/** cada nome = a lista dos seus traços (d de path) */
export const ICONES = {
  // ————— páginas — um sinal por pergunta —————
  salario: [
    // a nota que chega — o salário
    "M4 6.5h12A1.5 1.5 0 0 1 17.5 8v4A1.5 1.5 0 0 1 16 13.5H4A1.5 1.5 0 0 1 2.5 12V8A1.5 1.5 0 0 1 4 6.5z",
    "M11.5 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 1 1 3 0",
    "M5.6 10h1.1",
    "M13.3 10h1.1",
  ],
  irs: [
    // a nota de liquidação — folha com dobra e linhas
    "M6 3.5h5.6l2.9 2.9v10.1H6z",
    "M11.6 3.5v2.9h2.9",
    "M7.7 9.7h4.6",
    "M7.7 12.3h4.6",
    "M7.7 14.9h2.9",
  ],
  trabalho: [
    // a pasta de trabalho
    "M4 7.5h12A1.5 1.5 0 0 1 17.5 9v6A1.5 1.5 0 0 1 16 16.5H4A1.5 1.5 0 0 1 2.5 15V9A1.5 1.5 0 0 1 4 7.5z",
    "M7.4 7.5V5.7a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.8",
    "M2.5 11.4h15",
  ],
  impostos: [
    // o talão em duas partes — a tua e a do Estado
    "M5.5 4h9v3.9h-9z",
    "M5.5 12.1h9V16h-9z",
    "M6.3 10h2.1",
    "M11.6 10h2.1",
  ],
  precos: [
    // a etiqueta de preço
    "M4 4.5h6l5.5 5.5-5.5 5.5H4z",
    "M8 7.3a0.9 0.9 0 1 1-1.8 0 0.9 0.9 0 1 1 1.8 0",
  ],
  inflacao: [
    // o balão — o que sobe
    "M14.3 8a4.3 4.3 0 1 1-8.6 0 4.3 4.3 0 1 1 8.6 0",
    "M9.1 13.3l0.9-1.4 0.9 1.4",
    "M10 14.7c0.3 1.5-1.2 1.6-1.1 3",
  ],
  credito: [
    // o cartão — o banco empresta
    "M4 6.5h12A1.5 1.5 0 0 1 17.5 8v4.5A1.5 1.5 0 0 1 16 14H4A1.5 1.5 0 0 1 2.5 12.5V8A1.5 1.5 0 0 1 4 6.5z",
    "M2.5 9.4h15",
    "M5.2 12h2.6",
  ],
  casa: [
    // a casa — telhado, paredes e porta
    "M3.4 10.3L10 4.1l6.6 6.2",
    "M5.7 8.8V16h8.6V8.8",
    "M9.1 16v-3.5h1.8V16",
  ],
  poupanca: [
    // o mealheiro — corpo, orelha, ranhura, focinho, patas, rabicho
    "M15.3 10.7a5 5 0 1 1-10 0 5 5 0 1 1 10 0",
    "M11.9 6.4l0.9-1.9 1.4 1.7",
    "M8 5.9h2.6",
    "M5.3 10.2H4v1.2h1.3",
    "M7.7 15.4v1.2",
    "M12.9 15.4v1.2",
    "M15.6 10.3c0.8-0.5 1.4 0.3 0.7 1",
  ],
  dados: [
    // as barras sobre a linha de base — o país em números
    "M4 16.5h12.5",
    "M6.7 16.5v-4.4",
    "M10.1 16.5V5.8",
    "M13.5 16.5v-7.8",
  ],
  aprender: [
    // o livro aberto
    "M10 5.4C8.7 4.5 6.9 4.3 4.6 4.7v10.9c2.3-0.4 4.1-0.2 5.4 0.7 1.3-0.9 3.1-1.1 5.4-0.7V4.7c-2.3-0.4-4.1-0.2-5.4 0.7z",
    "M10 5.4v10.9",
  ],

  // ————— acções — dentro de <button>/<a> com nome acessível —————
  ver: [
    // a seta que abre a página
    "M4 10h11.4",
    "M11.7 6.3l3.7 3.7-3.7 3.7",
  ],
  json: [
    // as chavetas do documento de dados
    "M7.7 4.2c-1.8 0-2 0.8-2 2v2.3c0 1-0.5 1.5-1.9 1.5 1.4 0 1.9 0.5 1.9 1.5v2.3c0 1.2 0.2 2 2 2",
    "M12.3 4.2c1.8 0 2 0.8 2 2v2.3c0 1 0.5 1.5 1.9 1.5-1.4 0-1.9 0.5-1.9 1.5v2.3c0 1.2-0.2 2-2 2",
  ],
  "copiar-ligacao": [
    // os dois ganchos da ligação
    "M8.5 10.7a3.7 3.7 0 0 0 5.6 0.4l2.3-2.3a3.7 3.7 0 0 0-5.2-5.2l-1.3 1.3",
    "M11.5 9.3a3.7 3.7 0 0 0-5.6-0.4l-2.3 2.3a3.7 3.7 0 0 0 5.2 5.2l1.3-1.3",
  ],
  repor: [
    // a volta ao início — arco e cabeça de seta
    "M16.3 10.3a6.3 6.3 0 1 1-2-4.6",
    "M14.1 2.5l0.2 3.2 3.3-0.3",
  ],
  abrir: [
    // o chevron que abre e fecha (roda 180° no estado aberto)
    "M5.5 8.2l4.5 4.5 4.5-4.5",
  ],
  menu: [
    // os três traços do índice — o do meio mais curto, mão própria
    "M4 6.2h12",
    "M4 10h8.6",
    "M4 13.8h12",
  ],
  pesquisa: [
    // a lupa
    "M14.2 9.2a5 5 0 1 1-10 0 5 5 0 1 1 10 0",
    "M12.8 12.8l3.7 3.7",
  ],
  sol: [
    // tema claro — disco e oito raios
    "M13.1 10a3.1 3.1 0 1 1-6.2 0 3.1 3.1 0 1 1 6.2 0",
    "M10 2.7v1.7",
    "M10 15.6v1.7",
    "M2.7 10h1.7",
    "M15.6 10h1.7",
    "M4.8 4.8l1.2 1.2",
    "M14 14l1.2 1.2",
    "M15.2 4.8L14 6",
    "M6 14l-1.2 1.2",
  ],
  lua: [
    // tema escuro — a crescente
    "M15.9 11.9A6 6 0 1 1 8.1 4.1a4.8 4.8 0 0 0 7.8 7.8z",
  ],

  // ————— estado — a família do OrbeEstado em traço: pontos —————
  "em-dia": [
    // anel completo de pontos + centro — cheio e calmo
    ...anel(8, 6.4).map(([x, y]) => dot(x, y, 0.95)),
    dot(10, 10, 1.3),
  ],
  "a-recolher": [
    // o mesmo anel com ponto-líder — a moldura parada da rotação
    ...anel(8, 6.4).map(([x, y], i) => dot(x, y, i === 0 ? 1.5 : 0.85)),
  ],
  atrasado: [
    // o anel esburacado — faltam dois pontos, como ao orbe falta o centro
    ...anel(8, 6.4)
      .filter((_, i) => i !== 1 && i !== 2)
      .map(([x, y]) => dot(x, y, 0.95)),
  ],
  aviso: [
    // o triângulo com o sinal
    "M10 4.2L16.8 16.1H3.2z",
    "M10 8.6v3.4",
    dot(10, 14.3, 0.85),
  ],
  informacao: [
    // o círculo com o i
    "M16.1 10a6.1 6.1 0 1 1-12.2 0 6.1 6.1 0 1 1 12.2 0",
    "M10 9.3v4.3",
    dot(10, 6.3, 0.85),
  ],
} as const;

export type NomeIcone = keyof typeof ICONES;

export function Icone({
  nome,
  className,
  rotulo,
}: {
  nome: NomeIcone;
  className?: string;
  /** só para ícone sozinho com significado próprio (role="img") —
      dentro de botões/ligações o nome acessível é o do controlo */
  rotulo?: string;
}) {
  const tracos = (ICONES as Record<string, readonly string[]>)[nome];
  if (!tracos) {
    // conjunto fechado — um nome fora da lista é erro de programação
    throw new Error(`[Icone] nome fora do conjunto fechado: "${nome}"`);
  }
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rotulo ? undefined : true}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      focusable="false"
      className={`icone icone-${nome} ${className ?? ""}`}
    >
      {tracos.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          style={{ "--i": i } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/**
 * IconeEmblema — o ícone dentro do quadrado de contorno tracejado da
 * referência: a «moldura de instrumento» que marca o cabeçalho dos
 * cartões <Cartao> (prop `icone`). Decorativa — o nome do cartão é o
 * breadcrumb ao lado.
 */
export function IconeEmblema({
  nome,
  className,
}: {
  nome: NomeIcone;
  className?: string;
}) {
  return (
    <span className={`icone-emblema ${className ?? ""}`} aria-hidden="true">
      <Icone nome={nome} />
    </span>
  );
}
