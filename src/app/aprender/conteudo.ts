/**
 * Conteúdo editorial da rota /aprender (sessão 3D) — vive dentro da
 * pasta da rota porque só /aprender o usa: a organização pelas quatro
 * perguntas, a frase simples de nível 1, o exemplo com números e a
 * ficha de legislação/fonte de cada termo.
 *
 * Regra nº 1: nada aqui inventa dados. Os exemplos são ilustrações do
 * conceito (o mesmo estatuto dos valores em `src/content/demos.ts`) e
 * os que se apoiam em valores oficiais citam a fonte na ficha. As
 * fichas apontam para os `data/fiscal/*.json` reais — nunca para leis
 * escritas de memória.
 *
 * NOTA para o dono: `FRASE`, `EXEMPLO` e as descrições de grupo são
 * copy novo a rever — registado em NOTAS-V4-sessao-3d.md. Se fizerem
 * sentido como campos do `Termo`, mudam-se para `src/content/glossario.ts`
 * sem custo (a página consome-os pelas funções abaixo).
 */

import { GLOSSARIO, termoPorSlug, type Termo } from "@/content/glossario";

export type GrupoId = "ganhas" | "pagas" | "banco" | "pais";

/** A pergunta de cada grupo — o glossário organiza-se pela mesma
 *  arquitetura da navegação (rótulos vêm de m.nav.grupo*). */
export const ORDEM_GRUPOS: GrupoId[] = ["ganhas", "pagas", "banco", "pais"];

/** slug → pergunta — atribuição editorial, explícita (não derivada:
 *  o sítio onde um termo mora é uma decisão de leitura, não um dado). */
export const GRUPO_DE: Record<string, GrupoId> = {
  // O que ganhas — salário, IRS, trabalho
  "escalao-irs": "ganhas",
  "taxa-efetiva-marginal": "ganhas",
  "deducao-especifica": "ganhas",
  "minimo-existencia": "ganhas",
  "retencao-fonte": "ganhas",
  tsu: "ganhas",
  "deducao-coleta": "ganhas",
  "limite-deducoes": "ganhas",
  "rendimento-relevante": "ganhas",
  englobamento: "ganhas",
  "salario-real": "ganhas",
  // O que pagas — impostos, preços, inflação
  iva: "pagas",
  isp: "pagas",
  // O banco — crédito, casa, poupança
  euribor: "banco",
  spread: "banco",
  tan: "banco",
  taeg: "banco",
  mtic: "banco",
  "certificados-aforro": "banco",
  "taxa-real": "banco",
  "retencao-capitais": "banco",
  ppr: "banco",
  // O país — os números oficiais (a estatística em si, não o preço)
  "ipc-ihpc": "pais",
};

/** A frase de nível 1 — uma definição que se lê sem saber nenhum outro
 *  termo, ≤ ~25 palavras, tom de quem explica a alguém de 12 anos. */
export const FRASE: Record<string, string> = {
  euribor:
    "A taxa a que os bancos se emprestam dinheiro entre si — no teu crédito de taxa variável é a parte que não se negoceia.",
  spread:
    "A margem que o banco soma à taxa de referência do teu crédito — é a parte que podes negociar.",
  tan: "A taxa que faz nascer os juros do empréstimo — a taxa de referência mais a margem do banco.",
  taeg: "O custo real do crédito por ano, já com juros, seguros e comissões — é o número para comparar bancos.",
  mtic: "A soma de tudo o que pagas até ao fim do empréstimo — quanto o crédito custa de verdade.",
  "ipc-ihpc":
    "Os dois termómetros oficiais dos preços: um calculado pelo INE em Portugal, outro pelo Eurostat para comparar países.",
  "escalao-irs":
    "O IRS cobra por fatias: cada fatia do rendimento paga a sua taxa, e subir de escalão nunca te faz ganhar menos.",
  "taxa-efetiva-marginal":
    "A marginal é a taxa do último degrau de rendimento; a efetiva é o imposto total a dividir pelo que ganhas — mais baixa.",
  "deducao-especifica":
    "Uma fatia do salário que fica de fora antes de o IRS contar — em 2026 são cerca de 4 587 € por ano.",
  "minimo-existencia":
    "A lei protege o rendimento essencial para viver: em 2026 ninguém paga IRS sobre até 12 880 € por ano.",
  "retencao-fonte":
    "O IRS que o empregador desconta todos os meses e entrega ao Estado por ti — um adiantamento que se acerta na declaração.",
  tsu: "A contribuição para a Segurança Social: saem 11 % do teu recibo e a empresa paga mais 23,75 % que nunca vês.",
  isp: "O imposto fixo em cêntimos por litro de combustível — e por cima dele ainda se cobra IVA.",
  iva: "O imposto já incluído nos preços: 6 % nos bens essenciais, 13 % nos restaurantes, 23 % na maioria.",
  "certificados-aforro":
    "Emprestas dinheiro ao Estado e recebes juros de três em três meses, com capital garantido.",
  "taxa-real":
    "A taxa que o banco anuncia menos a inflação e os impostos — o que o teu dinheiro rende de verdade.",
  "retencao-capitais":
    "Dos juros que o banco te deve, o fisco fica logo com 28 % — à tua conta só chega o resto.",
  "deducao-coleta":
    "Despesas de saúde, educação e rendas cortam o IRS a pagar euro a euro, depois de o imposto estar calculado.",
  "limite-deducoes":
    "Há um teto para a soma das deduções ao IRS — quanto mais ganhas, mais baixo é o teto.",
  ppr: "Uma poupança para a reforma com benefício no IRS, mas o dinheiro fica preso até às condições legais de resgate.",
  "rendimento-relevante":
    "Para um trabalhador independente, a Segurança Social conta só 70 % do que faturas e cobra sobre essa parte.",
  englobamento:
    "Escolher entre pagar uma taxa fixa sozinha ou somar o rendimento ao resto e pagar a tua taxa de IRS.",
  "salario-real":
    "O salário medido pelo que ele compra: se os preços sobem mais do que o teu aumento, ficas a ganhar menos.",
};

/** Exemplo com números para os termos que ainda não têm `exemplo` no
 *  glossário — ilustração do conceito, nunca dados apresentados como
 *  oficiais. Onde a conta se apoia em valores em vigor (IAS, SMN,
 *  taxas legais), os números saem dos `data/fiscal/` reais. */
export const EXEMPLO: Record<string, string> = {
  tan: "Taxa de referência de 2,0 % + margem de 1,0 % = TAN de 3,0 %.",
  taeg: "TAN de 3,0 % + seguros + comissões ≈ TAEG de 4,2 % — por isso se compara pela TAEG.",
  "ipc-ihpc":
    "Para o mesmo mês, o INE pode dizer 2,4 % e o Eurostat 2,1 % — a mesma inflação, duas réguas.",
  "taxa-efetiva-marginal":
    "Com marginal de 35 %, a efetiva pode ficar perto de 17 % — a média é cerca de metade do último degrau.",
  "deducao-especifica": "Em 2026: 8,54 × IAS de 537,13 € ≈ 4 587 € do ano que não pagam IRS.",
  "minimo-existencia":
    "Em 2026 o mínimo protege 920 € × 14 = 12 880 € — quem ganha o salário mínimo não paga IRS.",
  "retencao-fonte":
    "Se reténs 200 € por mês e o IRS anual devido é 2 200 €, recebes a diferença como reembolso.",
  tsu: "Num salário de 1 000 €: saem 110 € teus e a empresa paga mais 237,50 € — custo real de 1 237,50 €.",
  isp: "Do preço de cada litro, uma parte fixa em cêntimos é ISP — e o IVA de 23 % ainda incide sobre esse imposto.",
  iva: "Um livro de 10 € leva 6 %, um jantar de 20 € leva 13 %, uma televisão de 300 € leva 23 %.",
  "certificados-aforro":
    "1 000 € em Certificados de Aforro: juros a cada três meses e um prémio que cresce quanto mais tempo ficam.",
  "taxa-real":
    "Depósito a 1,5 % com inflação de 3 %: a taxa real é −1,5 % — perdes poder de compra sem o saldo descer.",
  "retencao-capitais":
    "Num depósito anunciado a 2,5 %, o fisco retém 28 % dos juros e à tua conta chegam 1,8 %.",
  "deducao-coleta":
    "250 € de despesas de saúde devolvem 15 % — 37,50 € a menos de IRS a pagar.",
  "limite-deducoes":
    "No 1.º escalão não há teto; no último, a soma das deduções pára nos 1 000 €.",
  ppr: "1 000 € entregues no ano voltam 200 € pelo IRS — mas um resgate fora das regras obriga a devolver o benefício.",
  "rendimento-relevante":
    "Faturas 10 000 € em serviços: a Segurança Social conta 7 000 € e cobra 21,4 % — cerca de 1 498 €.",
  englobamento:
    "1 000 € de mais-valias: à taxa autónoma pagas 280 €; englobadas a uma marginal de 21 %, 210 €.",
};

/** Ficha de nível 3 — a legislação e a fonte oficial de cada termo.
 *  `fonte`/`url` alimentam o <Source>; `letra` é a nota de leitura.
 *  Termos que são conceitos (não leis) dizem-no — a honestidade vale
 *  para a bibliografia como para os números. */
export interface FichaTermo {
  fonte: string;
  url?: string;
  legislacao?: string;
  /** quando o termo não tem lei própria — o que se mostra em vez */
  conceito?: string;
}

const AT = "https://info.portaldasfinancas.gov.pt";
const BPSTAT = "https://bpstat.bportugal.pt";
const CLIENTE_BANCARIO =
  "https://clientebancario.bportugal.pt/pt-pt/taxas-de-juro-credito-aos-consumidores";

export const FICHA: Record<string, FichaTermo> = {
  euribor: {
    fonte: "Banco de Portugal — BPstat (médias mensais)",
    url: BPSTAT,
    legislacao:
      "Calculada diariamente pelo EMMI para a Zona Euro; o Banco de Portugal publica as médias mensais que os bancos aplicam às prestações.",
  },
  spread: {
    fonte: "Banco de Portugal — Portal do Cliente Bancário",
    url: "https://clientebancario.bportugal.pt",
    legislacao:
      "Não há tabela oficial: o spread é fixado em cada contrato, dentro das regras de transparência do crédito (DL 133/2009 e DL 74-A/2017).",
  },
  tan: {
    fonte: "Banco de Portugal — taxas máximas do crédito aos consumidores (DL 133/2009, art. 28.º)",
    url: CLIENTE_BANCARIO,
    legislacao:
      "A TAN é a soma do indexante com o spread. O Banco de Portugal publica os tetos trimestrais de usura por tipo de crédito.",
  },
  taeg: {
    fonte: "Banco de Portugal — taxas máximas do crédito aos consumidores (DL 133/2009, art. 28.º)",
    url: CLIENTE_BANCARIO,
    legislacao:
      "A TAEG agrega juros, seguros obrigatórios e comissões. Os tetos legais de usura aplicam-se sobre a TAEG, revistos por trimestre.",
  },
  mtic: {
    fonte: "Banco de Portugal — Portal do Cliente Bancário",
    url: "https://clientebancario.bportugal.pt",
    legislacao:
      "O MTIC é de divulgação obrigatória na FINE e no contrato — soma capital, juros, comissões, impostos e seguros.",
  },
  "ipc-ihpc": {
    fonte: "Eurostat (IHPC) e INE (IPC)",
    url: "https://ec.europa.eu/eurostat",
    legislacao:
      "O IHPC segue o regulamento europeu de índices harmonizados; o IPC segue a metodologia nacional do INE — os dois medem cabazes diferentes.",
  },
  "escalao-irs": {
    fonte: "Art. 68.º CIRS, redação da Lei n.º 73-A/2025 (OE2026)",
    url: AT,
    legislacao:
      "Os escalões e as taxas marginais são os do art. 68.º do CIRS em vigor — versionados por ano em data/fiscal/irs-2026.json.",
  },
  "taxa-efetiva-marginal": {
    fonte: "Art. 68.º CIRS (escalões) — OE2026",
    url: AT,
    legislacao:
      "A marginal é a taxa do escalão mais alto que o rendimento atinge; a efetiva é a coleta a dividir pelo rendimento coletável.",
  },
  "deducao-especifica": {
    fonte: "Art. 25.º CIRS — OE2026",
    url: AT,
    legislacao:
      "Em 2026 a dedução específica do trabalho dependente é 8,54 × IAS; se as contribuições para a Segurança Social forem maiores, valem elas.",
  },
  "minimo-existencia": {
    fonte: "Art. 70.º CIRS — OE2026",
    url: AT,
    legislacao:
      "Em 2026 o mínimo de existência é 14 × SMN = 12 880 €, com abatimento progressivo até ao limite da fórmula do art. 70.º.",
  },
  "retencao-fonte": {
    fonte: "Despacho n.º 233-A/2026, de 6 de janeiro (DR, 2.ª série, n.º 3)",
    url: "https://files.diariodarepublica.pt/2s/2026/01/003000001/0000200010.pdf",
    legislacao:
      "As tabelas de retenção mensal do continente — aplicam-se aos rendimentos pagos a partir de 1 de janeiro de 2026.",
  },
  tsu: {
    fonte: "Código dos Regimes Contributivos; Lei n.º 110/2009",
    url: "https://www.seg-social.pt",
    legislacao:
      "Trabalhador por conta de outrem: 11 % a cargo do trabalhador e 23,75 % a cargo da entidade empregadora.",
  },
  isp: {
    fonte: "Portaria n.º 372-A/2026/1, de 21 de agosto (taxas efetivas com desconto extraordinário)",
    url: "https://diariodarepublica.pt",
    legislacao:
      "As taxas de ISP mudam por portaria, por vezes semanalmente — cada valor mostrado no site tem data de vigência explícita.",
  },
  iva: {
    fonte: "Código do IVA — Listas I e II anexas; art. 18.º",
    url: AT,
    legislacao:
      "Três taxas no continente: 6 % (bens essenciais, Lista I), 13 % (Lista II — ex.: restauração) e 23 % (taxa normal).",
  },
  "certificados-aforro": {
    fonte: "IGCP — Ficha Técnica Certificados de Aforro Série F (Portaria 149-A/2023 e alterações)",
    url: "https://www.igcp.pt/pt/aforristas/produtos-de-aforro/certificados-de-aforro",
    legislacao:
      "Série F: taxa base = Euribor 3M (média de 10 dias úteis, limitada a 2,50 %) + prémios de permanência crescentes.",
  },
  "taxa-real": {
    fonte: "Eurostat/INE (inflação) — conceito, não lei",
    url: "https://ec.europa.eu/eurostat",
    conceito:
      "Não há legislação própria: a taxa real é a nominal menos a inflação medida pelo IHPC/IPC — e ainda menos o imposto sobre os juros.",
  },
  "retencao-capitais": {
    fonte: "CIRS art. 71.º-72.º — retenção liberatória sobre rendimentos de capitais (cat. E)",
    url: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/",
    legislacao:
      "Juros de depósitos e certificados: retenção liberatória de 28 % — o imposto fica resolvido no momento do pagamento.",
  },
  "deducao-coleta": {
    fonte: "Arts. 78.º a 84.º CIRS (redação OE2026, Lei 73-A/2025)",
    url: "https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Cidadaos/Rendimentos/Declaracao/Deducoes_a_coleta/Paginas/default.aspx",
    legislacao:
      "Saúde 15 % (até 1 000 €), educação 30 % (até 800 €), rendas, PPR 20 % e o IVA das faturas pedidas com NIF.",
  },
  "limite-deducoes": {
    fonte: "Art. 78.º CIRS — limite global das deduções à coleta",
    url: AT,
    legislacao:
      "Sem limite no 1.º escalão, 1 000 € no último e um valor intermédio nos restantes — majorado 5 % por dependente a partir do terceiro.",
  },
  ppr: {
    fonte: "Art. 21.º EBF — benefício fiscal das entregas; taxa efetiva de 8 % no reembolso dentro das condições legais",
    url: AT,
    legislacao:
      "Deduz 20 % das entregas do ano (até 400 € abaixo dos 35 anos); resgatar fora das condições legais devolve o benefício com penalização.",
  },
  "rendimento-relevante": {
    fonte: "Código dos Regimes Contributivos — trabalhadores independentes",
    url: "https://www.seg-social.pt",
    legislacao:
      "Prestação de serviços: o rendimento relevante é 70 % da faturação; sobre ele aplica-se a taxa de 21,4 %, apurada trimestralmente.",
  },
  englobamento: {
    fonte: "CIRS arts. 10.º, 22.º, 43.º e 72.º — regras das mais-valias",
    url: AT,
    legislacao:
      "A taxa autónoma fecha a conta (ex.: 28 % nas mais-valias); o englobamento soma ao resto do rendimento e paga a marginal — em imóveis é obrigatório.",
  },
  "salario-real": {
    fonte: "Eurostat/INE (inflação) — conceito, não lei",
    url: "https://ec.europa.eu/eurostat",
    conceito:
      "Não há legislação própria: o salário real é o nominal corrigido pela inflação oficial — é a medida do poder de compra.",
  },
};

/* ————— funções ————— */

export function grupoDe(slug: string): GrupoId {
  return GRUPO_DE[slug] ?? "ganhas";
}

/** A frase de nível 1 — a do mapa editorial, ou a primeira frase da
 *  definição como queda honesta para termos novos (nunca vazio). */
export function fraseDe(t: Termo): string {
  const f = FRASE[t.slug];
  if (f) return f;
  const primeira = t.definicao.split(/(?<=[.!?])\s/)[0];
  return primeira ?? t.definicao;
}

/** O exemplo com números — o do glossário se existir, senão o daqui. */
export function exemploDe(t: Termo): string | undefined {
  return t.exemplo ?? EXEMPLO[t.slug];
}

export interface GrupoGlossario {
  id: GrupoId;
  termos: Termo[];
}

/** Os termos ordenados pelas quatro perguntas, na ordem do glossário.
 *  Um termo novo sem grupo cai no fim de «O que ganhas» (grupoDe) —
 *  nunca desaparece da lista. */
export function gruposDoGlossario(): GrupoGlossario[] {
  const mapa = new Map<GrupoId, Termo[]>(ORDEM_GRUPOS.map((g) => [g, []]));
  for (const t of GLOSSARIO) mapa.get(grupoDe(t.slug))!.push(t);
  return ORDEM_GRUPOS.map((id) => ({ id, termos: mapa.get(id)! }));
}

/** O termo seguinte na ordem das quatro perguntas — a «pergunta
 *  seguinte» de cada /aprender/[slug] percorre o glossário. No último
 *  devolve undefined — a página cai então na saída para /metodologia. */
export function proximoTermo(slug: string): Termo | undefined {
  const ordenado = gruposDoGlossario().flatMap((g) => g.termos);
  const i = ordenado.findIndex((t) => t.slug === slug);
  return i >= 0 ? ordenado[i + 1] : undefined;
}

export { termoPorSlug };
