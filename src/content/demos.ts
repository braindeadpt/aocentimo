/**
 * Micro-demonstrações do glossário (M-19) — cada termo mostra-se, não se
 * descreve. Quatro idiomas visuais, todos resolvidos em CSS (a revelação
 * usa animation-timeline: view() — o desenho acontece ao entrar no
 * viewport; quem não suporta vê o estado final, que é também o estado
 * de reduced-motion).
 *
 * Os valores são os dos exemplos editoriais do próprio glossário — são
 * ilustrações do conceito, não dados oficiais; por isso vivem aqui, no
 * conteúdo, e não em data/.
 */

export interface Seg {
  rotulo: string;
  /** largura ou altura proporcional, 0–100 */
  pct: number;
  /** tinta: cheio (omissão), acento, aviso ou oco (invisível/cativação) */
  cor?: "acento" | "aviso" | "oco";
}

export interface Vaso {
  rotulo: string;
  /** 0–1 — quanto do recipiente está cheio */
  cheio: number;
}

export interface Demo {
  tipo: "pilha" | "barras" | "vasos" | "passos";
  /** pilha: segmentos lado a lado; `total` fecha a soma à direita */
  pilha?: Seg[];
  total?: string;
  /** barras: linhas independentes comparadas */
  barras?: Seg[];
  /** vasos: mini-escalões que enchem (IRS progressivo) */
  vasos?: Vaso[];
  /** passos: colunas que sobem/descem em sequência */
  passos?: Seg[];
  /** equivalente textual do desenho (role=img) */
  alt: string;
}

const PILHA_TAN: Seg[] = [
  { rotulo: "Euribor 6M · 2,0 %", pct: 67 },
  { rotulo: "spread · 1,0 %", pct: 33, cor: "acento" },
];

export const DEMOS: Record<string, Demo> = {
  euribor: {
    tipo: "pilha",
    pilha: PILHA_TAN,
    total: "TAN 3,0 %",
    alt: "A Euribor de 2 % soma-se ao spread de 1 % e forma a TAN de 3 %",
  },
  spread: {
    tipo: "pilha",
    pilha: [
      { rotulo: "Euribor 6M · 2,0 %", pct: 67 },
      { rotulo: "spread — a parte negociável · 1,0 %", pct: 33, cor: "acento" },
    ],
    total: "TAN 3,0 %",
    alt: "Sobre a Euribor de 2 % assenta o spread negociável de 1 %",
  },
  tan: {
    tipo: "pilha",
    pilha: PILHA_TAN,
    total: "TAN 3,0 %",
    alt: "A TAN é a soma: Euribor mais spread",
  },
  taeg: {
    tipo: "pilha",
    pilha: [
      { rotulo: "TAN · 3,0 %", pct: 71 },
      { rotulo: "seguros", pct: 18 },
      { rotulo: "comissões", pct: 11 },
    ],
    total: "TAEG ≈ 4,2 %",
    alt: "A TAEG engorda: à TAN somam-se seguros e comissões",
  },
  mtic: {
    tipo: "pilha",
    pilha: [
      { rotulo: "capital · 200 000 €", pct: 67 },
      { rotulo: "juros", pct: 28 },
      { rotulo: "seguros + comissões", pct: 5 },
    ],
    total: "MTIC ≈ 300 000 €",
    alt: "O MTIC é tudo o que se paga: o capital mais os juros, seguros e comissões",
  },
  "ipc-ihpc": {
    tipo: "barras",
    barras: [
      { rotulo: "IPC (INE)", pct: 80 },
      { rotulo: "IHPC (Eurostat)", pct: 72 },
    ],
    alt: "IPC e IHPC medem a mesma inflação com réguas diferentes — os valores divergem um pouco",
  },
  "escalao-irs": {
    tipo: "vasos",
    vasos: [
      { rotulo: "12,5 %", cheio: 1 },
      { rotulo: "16 %", cheio: 1 },
      { rotulo: "23,5 %", cheio: 0.45 },
      { rotulo: "…", cheio: 0 },
    ],
    alt: "O rendimento enche os escalões por ordem: 12,5 % cheio, 16 % cheio, e só uma parte no escalão de 23,5 %",
  },
  "taxa-efetiva-marginal": {
    tipo: "barras",
    barras: [
      { rotulo: "marginal (último escalão)", pct: 70 },
      { rotulo: "efetiva (média real)", pct: 34, cor: "acento" },
    ],
    alt: "A taxa marginal de 35 % assusta, mas a efetiva — o imposto total sobre o rendimento — fica perto de metade",
  },
  "deducao-especifica": {
    tipo: "pilha",
    pilha: [
      { rotulo: "isenta — 8,54 × IAS", pct: 32, cor: "oco" },
      { rotulo: "tributável", pct: 68 },
    ],
    alt: "Uma fatia do salário fica isenta antes de o IRS começar a contar",
  },
  "minimo-existencia": {
    tipo: "pilha",
    pilha: [
      { rotulo: "protegido — até 12 880 €", pct: 45, cor: "oco" },
      { rotulo: "tributável", pct: 55 },
    ],
    alt: "O mínimo de existência protege o rendimento essencial: até 12 880 euros não paga IRS",
  },
  "retencao-fonte": {
    tipo: "barras",
    barras: [
      { rotulo: "retido mês a mês", pct: 78 },
      { rotulo: "IRS devido no fim", pct: 70, cor: "acento" },
    ],
    alt: "Reténs todos os meses; na declaração o Estado compara com o devido e acerta a diferença",
  },
  tsu: {
    tipo: "pilha",
    pilha: [
      { rotulo: "tu · 11 %", pct: 32 },
      { rotulo: "empresa · 23,75 % — invisível no recibo", pct: 68, cor: "oco" },
    ],
    alt: "A TSU é 11 % teu, à vista, mais 23,75 % da empresa, invisível no recibo",
  },
  isp: {
    tipo: "pilha",
    pilha: [
      { rotulo: "combustível", pct: 40 },
      { rotulo: "ISP", pct: 37 },
      { rotulo: "IVA — também sobre o ISP", pct: 23, cor: "acento" },
    ],
    alt: "No preço do litro somam-se o combustível, o ISP fixo e o IVA — que incide também sobre o ISP",
  },
  iva: {
    tipo: "barras",
    barras: [
      { rotulo: "6 % — essenciais", pct: 26 },
      { rotulo: "13 % — restauração", pct: 57 },
      { rotulo: "23 % — taxa normal", pct: 100 },
    ],
    alt: "O IVA tem três taxas no continente: 6, 13 e 23 %",
  },
  "certificados-aforro": {
    tipo: "passos",
    passos: [
      { rotulo: "ano 1", pct: 22 },
      { rotulo: "ano 3", pct: 34 },
      { rotulo: "ano 5", pct: 52 },
      { rotulo: "ano 10", pct: 88, cor: "acento" },
    ],
    alt: "Os juros compostos e os prémios de permanência fazem o valor subir em escada com os anos",
  },
  "taxa-real": {
    tipo: "barras",
    barras: [
      { rotulo: "nominal · +1,5 %", pct: 50 },
      { rotulo: "real · −1,5 %", pct: 24, cor: "aviso" },
    ],
    alt: "A taxa nominal de 1,5 % vira real negativa quando a inflação é de 3 %",
  },
  "retencao-capitais": {
    tipo: "pilha",
    pilha: [
      { rotulo: "chega à conta · 1,8 %", pct: 72 },
      { rotulo: "fisco · 28 %", pct: 28, cor: "aviso" },
    ],
    total: "2,5 % bruto",
    alt: "Dos 2,5 % anunciados, o fisco retém 28 %: chegam 1,8 % à conta",
  },
  "deducao-coleta": {
    tipo: "barras",
    barras: [
      { rotulo: "IRS calculado", pct: 100 },
      { rotulo: "após deduções", pct: 62, cor: "acento" },
    ],
    alt: "As deduções à coleta cortam o IRS euro a euro, depois de calculado",
  },
  "limite-deducoes": {
    tipo: "pilha",
    pilha: [
      { rotulo: "deduções que contam", pct: 78 },
      { rotulo: "acima do teto — perdidas", pct: 22, cor: "oco" },
    ],
    alt: "As deduções somam até ao teto do escalão; o que passa o limite não conta",
  },
  ppr: {
    tipo: "barras",
    barras: [
      { rotulo: "entregas no ano", pct: 100 },
      { rotulo: "voltam no IRS · 20 %", pct: 20, cor: "acento" },
    ],
    alt: "Vinte por cento das entregas ao PPR volta como dedução no IRS",
  },
  "rendimento-relevante": {
    tipo: "pilha",
    pilha: [
      { rotulo: "relevante · 70 %", pct: 70 },
      { rotulo: "fora da base", pct: 30, cor: "oco" },
    ],
    total: "× 21,4 % SS",
    alt: "A Segurança Social conta 70 % da faturação e cobra 21,4 % sobre essa parte",
  },
  englobamento: {
    tipo: "barras",
    barras: [
      { rotulo: "taxa autónoma · 28 %", pct: 56 },
      { rotulo: "englobar à marginal · 21 %", pct: 42, cor: "acento" },
    ],
    alt: "Englobar compensa quando a taxa marginal é menor que a autónoma de 28 %",
  },
  "salario-real": {
    tipo: "barras",
    barras: [
      { rotulo: "nominal · +5 %", pct: 70 },
      { rotulo: "real · −3 %", pct: 42, cor: "aviso" },
    ],
    alt: "O salário nominal sobe 5 %, mas com inflação de 8 % o real desce 3 %",
  },
};
