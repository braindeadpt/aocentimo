export interface Termo {
  slug: string;
  termo: string;
  definicao: string;
  exemplo?: string;
}

export const GLOSSARIO: Termo[] = [
  {
    slug: "euribor",
    termo: "Euribor",
    definicao:
      "Taxa de juro a que os bancos da Zona Euro se emprestam dinheiro entre si, calculada diariamente para vários prazos (1 semana a 12 meses). Nos créditos de taxa variável, é a componente que não se negoceia: o contrato diz apenas qual o prazo de referência.",
    exemplo: "Euribor 6M a 2,0 % + spread de 1,0 % = TAN de 3,0 %.",
  },
  {
    slug: "spread",
    termo: "Spread",
    definicao:
      "A margem do banco sobre a Euribor no crédito habitação, em pontos percentuais, fixada no contrato. É a parte negociável da taxa — reflete o risco que o banco te atribui e o quanto queres negociar.",
    exemplo: "Reduzir o spread de 1,5 % para 1,0 % num empréstimo de 200 000 € a 30 anos poupa dezenas de euros por mês.",
  },
  {
    slug: "tan",
    termo: "TAN",
    definicao:
      "Taxa Anual Nominal: Euribor + spread. É a taxa que gera os juros do empréstimo, mas não inclui seguros nem comissões — para comparar bancos usa-se a TAEG.",
  },
  {
    slug: "taeg",
    termo: "TAEG",
    definicao:
      "Taxa Anual de Encargos Efetiva Global: o custo real anual do crédito, incluindo juros, seguros obrigatórios, comissões e custos de manutenção. É o único número honesto para comparar propostas de bancos diferentes.",
  },
  {
    slug: "mtic",
    termo: "MTIC",
    definicao:
      "Montante Total Imputado ao Consumidor: a soma de tudo o que pagas até ao fim do empréstimo — capital, juros, seguros, comissões. Revela quanto a casa custa de facto.",
    exemplo: "Um empréstimo de 200 000 € pode ter um MTIC acima de 300 000 €.",
  },
  {
    slug: "ipc-ihpc",
    termo: "IPC e IHPC",
    definicao:
      "Índices de preços no consumidor. O IPC é calculado pelo INE com regras nacionais; o IHPC pelo Eurostat com metodologia harmonizada europeia — por isso os números que lês nas notícias às vezes divergem. O IHPC não inclui custos de habitação própria.",
  },
  {
    slug: "escalao-irs",
    termo: "Escalão de IRS",
    definicao:
      "Degrau de rendimento coletável com uma taxa marginal. O IRS é progressivo por fatias: só a parte do rendimento dentro de cada degrau paga a taxa desse degrau. Subir de escalão nunca te faz ganhar menos.",
    exemplo: "Num rendimento de 15 000 €, os primeiros 8 342 € pagam 12,5 %; só o que excede cada limite paga a taxa seguinte.",
  },
  {
    slug: "taxa-efetiva-marginal",
    termo: "Taxa efetiva vs marginal",
    definicao:
      "A taxa marginal é a do teu último escalão; a efetiva é o imposto total dividido pelo rendimento — sempre menor. Quando alguém diz 'pago 35 % de IRS', normalmente é a marginal; a efetiva pode ser metade disso.",
  },
  {
    slug: "deducao-especifica",
    termo: "Dedução específica",
    definicao:
      "Parcela do rendimento de trabalho dependente (cat. A) que não paga IRS — em 2026, 8,54 × IAS. Se as tuas contribuições à Segurança Social forem maiores, vale esse valor.",
  },
  {
    slug: "minimo-existencia",
    termo: "Mínimo de existência",
    definicao:
      "Mecanismo do art. 70.º do CIRS que garante que ninguém paga IRS sobre o rendimento estritamente necessário ao custo de vida — em 2026 protege rendimentos até 14 × o salário mínimo (12 880 €), com abatimento progressivo acima disso.",
  },
  {
    slug: "retencao-fonte",
    termo: "Retenção na fonte",
    definicao:
      "O IRS que a entidade patronal desconta todos os meses e entrega ao Estado em teu nome. É um adiantamento — o acerto faz-se na declaração anual. Retenção a mais = reembolso; a menos = imposto a pagar.",
  },
  {
    slug: "tsu",
    termo: "TSU",
    definicao:
      "Taxa Social Única: a contribuição para a Segurança Social. O trabalhador paga 11 % (visível no recibo); a empresa paga 23,75 % (invisível). O custo real do teu salário é o bruto mais 23,75 %.",
  },
  {
    slug: "isp",
    termo: "ISP",
    definicao:
      "Imposto sobre os Produtos Petrolíferos e Energéticos: valor fixo em cêntimos por litro de combustível, definido por portaria e revisto com frequência. Por cima ainda se cobra IVA — imposto sobre imposto.",
  },
  {
    slug: "iva",
    termo: "IVA",
    definicao:
      "Imposto sobre o Valor Acrescentado: incluído em quase todos os preços, em três taxas no continente — 6 % (bens essenciais), 13 % (restauração, por exemplo) e 23 % (taxa normal).",
  },
  {
    slug: "certificados-aforro",
    termo: "Certificados de Aforro",
    definicao:
      "Dívida pública para poupança das famílias, emitida pelo Estado via IGCP. Capital garantido, taxa variável ligada à Euribor 3M (Série F, limitada a 2,5 %), juros trimestrais e prémios que crescem com o tempo de permanência.",
  },
  {
    slug: "taxa-real",
    termo: "Taxa real vs nominal",
    definicao:
      "A taxa nominal é a que o banco anuncia; a real desconta impostos e inflação. Um depósito a 1,5 % com inflação a 3 % tem taxa real negativa — perdes poder de compra sem o saldo descer.",
  },
  {
    slug: "retencao-capitais",
    termo: "Imposto sobre capitais (28 %)",
    definicao:
      "Os juros de depósitos e certificados pagam uma retenção liberatória de 28 % — descontada automaticamente antes de receberes. Quando a taxa anunciada é 2,5 %, a que chega à conta é 1,8 %.",
  },
  {
    slug: "deducao-coleta",
    termo: "Dedução à coleta",
    definicao:
      "Despesa que baixa diretamente o IRS a pagar, euro a euro, depois de o imposto ser calculado pelos escalões: saúde (15 %, até 1 000 €), educação (30 %, até 800 €), rendas (15 %), PPR (20 %), IVA das faturas. O reembolso de IRS é, em grande parte, deduções à coleta a chegar.",
  },
  {
    slug: "limite-deducoes",
    termo: "Limite global das deduções",
    definicao:
      "Teto do art. 78.º do CIRS à soma de várias categorias de deduções: sem limite no 1.º escalão, 1 000 € no último, e um valor intermédio nos restantes — majorado em 5 % por dependente a partir do terceiro.",
  },
  {
    slug: "ppr",
    termo: "PPR",
    definicao:
      "Plano Poupança-Reforma. Deduzes ao IRS 20 % das entregas do ano (até 400 € se tiveres menos de 35 anos) e, no resgate dentro das condições legais, os rendimentos pagam só 8 % efetivos em vez de 28 %. Resgatar fora das condições obriga a devolver o benefício com penalização — é dinheiro preso.",
  },
  {
    slug: "rendimento-relevante",
    termo: "Rendimento relevante",
    definicao:
      "A base sobre a qual um trabalhador independente paga Segurança Social: 70 % do que faturas em serviços. Sobre esse valor aplica-se a taxa de 21,4 % — na prática, cerca de 15 % do teu bruto, apurado trimestralmente.",
  },
  {
    slug: "englobamento",
    termo: "Englobamento vs taxa autónoma",
    definicao:
      "Duas formas de tributar um rendimento. Taxa autónoma: um imposto fixo (ex.: 28 % nas mais-valias) que fecha a conta. Englobamento: somar esse rendimento ao resto e pagar a tua taxa marginal de IRS. Englobar compensa quando a tua marginal é menor que a autónoma — em imóveis é obrigatório.",
  },
  {
    slug: "salario-real",
    termo: "Salário real",
    definicao:
      "O salário corrigido pela inflação — o que ele compra de facto, não os euros que diz no recibo. Se o teu bruto subiu 5 % e os preços subiram 8 %, tiveste um aumento nominal e um corte real.",
    exemplo: "1 200 € em 2020 valem ~1 440 € hoje; se agora ganhas 1 400 €, perdeste poder de compra.",
  },
];

/* ————— modelo de conteúdo —————
 * Decisão (B-2, 2026-09-18): o glossário fica em TS tipado, não MDX nem
 * JSON+renderer. Com output:"export" o TS compila para o build na mesma,
 * passa no typecheck de graça e faz diff limpo em git; não há hoje um
 * artigo longo que justifique o custo de um pipeline MDX. Quando houver,
 * o modelo aceita campos novos (ex.: seccoes) sem mudar a estrutura —
 * MDX reavalia-se nessa altura.
 *
 * As relações entre termos NÃO são escritas à mão: derivam de menções
 * literais nos textos (MENCOES = as formas como cada conceito aparece
 * escrito). Relação inventada seria dado inventado — regra nº1. */

/** Formas superficiais de cada termo em texto corrido. Só reconhece
 *  menções literais ao conceito — inclui o nome do índice/conceito
 *  quando o glossário tem um único termo para ele (IRS → escalão,
 *  inflação → IPC/IHPC, Segurança Social → TSU). */
const MENCOES: Record<string, RegExp> = {
  euribor: /\beuribor\b/i,
  spread: /\bspread\b/i,
  tan: /\bTAN\b/,
  taeg: /\bTAEG\b/,
  mtic: /\bMTIC\b/,
  "ipc-ihpc": /\bIH?PC\b|\binfla[cç][ãa]o\b/i,
  "escalao-irs": /\bescal[ãa]o\b|\bescal[õo]es\b|\bIRS\b/i,
  "taxa-efetiva-marginal": /\btaxa (efetiva|marginal)\b/i,
  "deducao-especifica": /\bdedu[cç][ãa]o espec[ií]fica\b/i,
  "minimo-existencia": /m[ií]nimo de exist[êe]ncia/i,
  "retencao-fonte": /\breten[cç][ãa]o\b/i,
  tsu: /\bTSU\b|\bSeguran[cç]a Social\b/i,
  isp: /\bISP\b/,
  iva: /\bIVA\b/,
  "certificados-aforro": /\bcertificados de aforro\b/i,
  "taxa-real": /\btaxa real\b|\btaxa nominal\b/i,
  "retencao-capitais": /\b28 ?%\b|\breten[cç][ãa]o liberat[oó]ria\b/i,
  "deducao-coleta": /\bdedu[cç][õo]es?\b/i,
  "limite-deducoes": /\blimite global\b|\bart\.? ?78\b/i,
  ppr: /\bPPR\b/,
  "rendimento-relevante": /\brendimento relevante\b/i,
  englobamento: /\benglobamento\b|\benglobar\b|\btaxa aut[oó]noma\b/i,
  "salario-real": /\bsal[aá]rio real\b|\bpoder de compra\b/i,
};

export function termoPorSlug(slug: string): Termo | undefined {
  return GLOSSARIO.find((t) => t.slug === slug);
}

export interface Mencao {
  slug: string;
  inicio: number;
  fim: number;
}

/** Menções de outros termos dentro de `texto` — spans ordenados, sem
 *  sobreposições (em empate de posição ganha a forma mais longa) e sem
 *  o próprio `excluir`. */
export function mencoesEm(texto: string, excluir?: string): Mencao[] {
  const brutas: Mencao[] = [];
  for (const [slug, re] of Object.entries(MENCOES)) {
    if (slug === excluir) continue;
    for (const m of texto.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))) {
      brutas.push({ slug, inicio: m.index, fim: m.index + m[0].length });
    }
  }
  brutas.sort((a, b) => a.inicio - b.inicio || b.fim - b.inicio - (a.fim - a.inicio));
  const aceites: Mencao[] = [];
  let livre = 0;
  for (const m of brutas) {
    if (m.inicio < livre) continue;
    aceites.push(m);
    livre = m.fim;
  }
  return aceites;
}

/** Termos ligados a `slug`: os que o texto dele menciona + os que o
 *  mencionam a ele. Ordenados pela ordem do glossário. */
export function relacionados(slug: string): Termo[] {
  const t = termoPorSlug(slug);
  if (!t) return [];
  const ligados = new Set<string>();
  for (const m of mencoesEm(`${t.definicao} ${t.exemplo ?? ""}`, slug)) {
    ligados.add(m.slug);
  }
  for (const outro of GLOSSARIO) {
    if (outro.slug === slug || ligados.has(outro.slug)) continue;
    if (mencoesEm(`${outro.definicao} ${outro.exemplo ?? ""}`, outro.slug).some((m) => m.slug === slug)) {
      ligados.add(outro.slug);
    }
  }
  return GLOSSARIO.filter((g) => ligados.has(g.slug));
}
