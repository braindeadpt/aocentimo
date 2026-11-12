export interface Termo {
  slug: string;
  termo: string;
  definicao: string;
  exemplo?: string;
  sinonimos?: string[];
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
      "A taxa marginal é a do teu último escalão; a efetiva é o imposto total dividido pelo rendimento — sempre menor. Quando alguém diz «pago 35 % de IRS», normalmente é a marginal; a efetiva pode ser metade disso.",
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
    sinonimos: [
      "recibos verdes",
      "trabalhador independente",
      "faturação",
      "segurança social",
    ],
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
  /* PROPOSTA (revisão do dono) — 19 novos termos do glossário (T12) */
  {
    slug: "homologo",
    termo: "Variação homóloga vs em cadeia",
    definicao:
      "A variação homóloga compara o valor de um mês ou trimestre com o mesmo período do ano anterior (12 meses de intervalo), eliminando o efeito da sazonalidade. A variação em cadeia compara com o período imediatamente anterior.",
    exemplo:
      "Se a inflação homóloga for 2,5\u202f% e a em cadeia \u22120,2\u202f%, os preços subiram face ao ano passado mas abrandaram face ao mês anterior.",
    sinonimos: [
      "homólogo",
      "homologo",
      "variação homóloga",
      "variação em cadeia",
      "inflação homóloga",
    ],
  },
  {
    slug: "pib",
    termo: "PIB",
    definicao:
      "Produto Interno Bruto: o valor a preços de mercado de todos os bens e serviços finais produzidos num país num dado período. É a medida padrão da dimensão e do crescimento de uma economia.",
    exemplo:
      "Um crescimento homólogo do PIB de 1,8\u202f% significa que a economia produziu mais 1,8\u202f% de riqueza real do que no mesmo trimestre do ano anterior.",
    sinonimos: ["produto interno bruto", "economia", "crescimento"],
  },
  {
    slug: "populacao-ativa",
    termo: "População ativa e taxa de desemprego",
    definicao:
      "A população ativa inclui as pessoas com emprego e as desempregadas que procuram ativamente trabalho. A taxa de desemprego mede a percentagem de desempregados sobre a população ativa — quem estuda ou não procura emprego fica de fora do denominador.",
    exemplo:
      "Se existirem 350\u202f000 desempregados numa população ativa de 5\u202f300\u202f000 pessoas, a taxa de desemprego é de 6,6\u202f%.",
    sinonimos: [
      "desemprego",
      "taxa de desemprego",
      "população ativa",
      "emprego",
    ],
  },
  {
    slug: "indice-precos-habitacao",
    termo: "Índice de Preços da Habitação (HPI)",
    definicao:
      "Mede a evolução dos preços de transação das habitações adquiridas pelas famílias (casas novas e existentes). É a referência oficial do INE e do Eurostat para acompanhar o mercado imobiliário residencial.",
    exemplo:
      "Com a base 2015 = 100, um índice de 205 indica que os preços de compra das casas mais do que duplicaram face a 2015.",
    sinonimos: ["HPI", "preços das casas", "imobiliário", "habitação"],
  },
  {
    slug: "ias",
    termo: "IAS",
    definicao:
      "Indexante dos Apoios Sociais: o valor de referência fixado anualmente por portaria para calcular e atualizar prestações sociais, limites de isenção e tetos legais. Em 2026 fixa-se em 537,13\u202f€.",
    exemplo:
      "Em 2026, o teto do subsídio de desemprego é 2,5 × IAS = 1\u202f342,83\u202f€ por mês.",
    sinonimos: ["indexante dos apoios sociais", "537,13"],
  },
  {
    slug: "rendimento-coletavel",
    termo: "Rendimento coletável",
    definicao:
      "O valor sobre o qual incidem as taxas dos escalões do IRS. Obtém-se subtraindo ao rendimento bruto as deduções específicas (como 8,54 × IAS no trabalho dependente) e eventuais abatimentos legais como o mínimo de existência.",
    exemplo:
      "Num salário anual de 21\u202f000\u202f€ (1\u202f500\u202f€ × 14), abatem-se 4\u202f587,09\u202f€ de dedução específica, ficando 16\u202f412,91\u202f€ de rendimento coletável.",
    sinonimos: ["coletável", "matéria coletável", "base de incidência"],
  },
  {
    slug: "irs-jovem",
    termo: "IRS Jovem",
    definicao:
      "Regime fiscal do art. 12.º-B do CIRS para jovens trabalhadores (até aos 35 anos) que entregam declaração de IRS sozinhos. Dá uma isenção parcial durante dez anos: 100\u202f% no 1.º ano, 75\u202f% nos 2.º a 4.º, 50\u202f% nos 5.º a 7.º e 25\u202f% nos 8.º a 10.º, até ao teto anual de 55 × IAS.",
    exemplo:
      "No 1.º ano de trabalho independente ou por conta de outrem, até 29\u202f542,15\u202f€ de rendimento (55 × 537,13\u202f€) fica totalmente livre de IRS.",
    sinonimos: ["isenção jovem", "artigo 12-b", "jovens trabalhadores"],
  },
  {
    slug: "duodecimos",
    termo: "Duodécimos",
    definicao:
      "Modalidade em que os subsídios de férias e de Natal são pagos fracionados ao longo dos 12 meses do ano (a 50\u202f% ou 100\u202f%) em vez de pagos por inteiro nos meses habituais. No recibo, cada fração retém à taxa autónoma prevista no art. 99.º-C do CIRS.",
    exemplo:
      "Com 50\u202f% em duodécimos num salário de 1\u202f200\u202f€, recebes mais 100\u202f€ brutos todos os meses e metade de cada subsídio na respetiva época.",
    sinonimos: [
      "fracionamento",
      "pagamento em duodécimos",
      "subsídios fracionados",
    ],
  },
  {
    slug: "subsidio-alimentacao",
    termo: "Subsídio de alimentação",
    definicao:
      "Compensação pecuniária por dia de trabalho efetivo para despesas de refeição. Em 2026 é isento de IRS e de Segurança Social até 6,15\u202f€/dia se pago em dinheiro, ou até 10,455\u202f€/dia se pago em cartão ou vale de refeição (+70\u202f% por lei). O excedente tributa como salário normal.",
    exemplo:
      "Um subsídio de 9,00\u202f€/dia pago em cartão de refeição fica 100\u202f% isento; se fosse pago em dinheiro tributaria IRS e SS sobre 2,85\u202f€ por dia.",
    sinonimos: ["subsídio de refeição", "cartão refeição", "vale refeição"],
  },
  {
    slug: "adse",
    termo: "ADSE",
    definicao:
      "Subsistema público de proteção na doença dos trabalhadores em funções públicas. O desconto é de 3,5\u202f% sobre as remunerações base e pensões ao longo de 14 meses. Para admitidos a partir de 2006 é facultativo e acumula com os 11\u202f% de Segurança Social geral.",
    exemplo:
      "Num vencimento de 1\u202f500\u202f€, o desconto de 3,5\u202f% para a ADSE retira 52,50\u202f€ por mês (735,00\u202f€ por ano a 14 meses).",
    sinonimos: [
      "saúde função pública",
      "desconto 3,5 %",
      "proteção na doença",
    ],
  },
  {
    slug: "imt",
    termo: "IMT e IMT Jovem",
    definicao:
      "Imposto Municipal sobre as Transmissões Onerosas de Imóveis: pago ao Estado no ato de compra de um imóvel. O IMT Jovem isenta totalmente jovens até aos 35 anos na aquisição de primeira habitação própria e permanente com valor até 330\u202f539\u202f€ em 2026.",
    exemplo:
      "Uma casa de 200\u202f000\u202f€ para habitação própria paga cerca de 3\u202f509\u202f€ de IMT na tabela geral; com o benefício do IMT Jovem paga 0\u202f€.",
    sinonimos: ["IMT Jovem", "imposto de transmissão", "compra de casa"],
  },
  {
    slug: "imposto-selo",
    termo: "Imposto do Selo",
    definicao:
      "O tributo mais antigo do sistema fiscal português, incidente sobre contratos, documentos, títulos e operações financeiras. Na compra de casa com empréstimo cobra 0,8\u202f% sobre o valor da escritura e 0,6\u202f% sobre o montante financiado a mais de 5 anos.",
    exemplo:
      "Comprar uma casa de 200\u202f000\u202f€ com empréstimo de 180\u202f000\u202f€ paga 1\u202f600\u202f€ de selo da compra e 1\u202f080\u202f€ de selo do crédito = 2\u202f680\u202f€.",
    sinonimos: ["selo", "tabela geral imposto do selo", "IS"],
  },
  {
    slug: "imi",
    termo: "IMI e Valor Patrimonial Tributário",
    definicao:
      "Imposto Municipal sobre Imóveis: cobrado todos os anos sobre o Valor Patrimonial Tributário (VPT) dos prédios rústicos e urbanos. Nos prédios urbanos a taxa situa-se entre 0,3\u202f% e 0,45\u202f%, fixada anualmente por cada assembleia municipal.",
    exemplo:
      "Um apartamento com VPT de 120\u202f000\u202f€ num concelho com taxa de 0,324\u202f% paga 388,80\u202f€ de IMI por ano, dividido em duas prestações.",
    sinonimos: ["VPT", "valor patrimonial tributário", "imposto municipal"],
  },
  {
    slug: "isv-iuc",
    termo: "ISV e IUC",
    definicao:
      "Os dois impostos principais sobre automóveis: o ISV (Imposto sobre Veículos) paga-se uma única vez ao matricular o veículo; o IUC (Imposto Único de Circulação) é anual e incide sobre a propriedade, calculados em função da cilindrada e das emissões de CO2.",
    exemplo:
      "Ao comprar um carro novo ligeiro a gasolina paga-se ISV no ato da matrícula e depois IUC todos os anos no mês de aniversário da matrícula.",
    sinonimos: [
      "imposto sobre veículos",
      "imposto único de circulação",
      "selo do carro",
    ],
  },
  {
    slug: "taxa-mista",
    termo: "Taxa fixa, mista e variável",
    definicao:
      "Modalidades de taxa de juro no crédito habitação: a variável varia com a Euribor; a fixa mantém o mesmo valor do primeiro ao último dia; a mista combina um período inicial a taxa fixa (ex.: 2, 5 ou 10 anos) seguido de taxa variável até ao fim do contrato.",
    exemplo:
      "Um crédito a 30 anos com taxa mista a 5 anos fixa a prestação durante 60 meses; a partir do 6.º ano a taxa passa a Euribor mais spread.",
    sinonimos: [
      "taxa mista",
      "taxa fixa",
      "taxa variável",
      "modalidade de juro",
    ],
  },
  {
    slug: "taxa-esforco",
    termo: "Taxa de esforço (DSTI)",
    definicao:
      "Debt Service-to-Income: a percentagem do rendimento líquido mensal do agregado familiar destinada ao pagamento das prestações de todos os créditos contratados. A recomendação macroprudencial do Banco de Portugal fixa o limite máximo geral em 50\u202f%.",
    exemplo:
      "Prestações de crédito de 700\u202f€ num agregado com rendimento líquido de 2\u202f000\u202f€ correspondem a uma taxa de esforço de 35\u202f%.",
    sinonimos: [
      "DSTI",
      "debt service to income",
      "esforço financeiro",
      "limite BdP",
    ],
  },
  {
    slug: "mais-valias",
    termo: "Mais-valias",
    definicao:
      "O ganho financeiro obtido na venda de bens ou direitos por valor superior ao custo de aquisição (imóveis, ações, participações). Nos imóveis para habitação própria e permanente há isenção se o valor for reinvestido noutra habitação própria nos prazos legais.",
    exemplo:
      "Ações compradas por 1\u202f000\u202f€ e vendidas por 1\u202f500\u202f€ geram 500\u202f€ de mais-valia mobiliária, pagando 28\u202f% de taxa autónoma (140\u202f€).",
    sinonimos: ["lucro de venda", "ganho de capital", "reinvestimento"],
  },
  {
    slug: "servicos-minimos-bancarios",
    termo: "Serviços mínimos bancários",
    definicao:
      "Conta de depósito à ordem com cartão de débito, homebanking e transferências sem comissões abusivas para quem não tenha outra conta. O encargo anual máximo está travado por lei em 1\u202f% do IAS (5,37\u202f€ por ano em 2026).",
    exemplo:
      "Em vez de pagar 60\u202f€ ou 80\u202f€ anuais em comissões de manutenção de conta, uma conta de serviços mínimos bancários tem o custo anual limitado a 5,37\u202f€.",
    sinonimos: ["SMB", "conta essencial", "comissões bancárias reduzidas"],
  },
  {
    slug: "fundo-garantia-depositos",
    termo: "Fundo de Garantia de Depósitos",
    definicao:
      "Mecanismo público de proteção que garante o reembolso dos depósitos bancários constituídos nas instituições de crédito participantes até ao limite de 100\u202f000\u202f€ por depositante e por instituição, caso o banco entre em incumprimento ou falência.",
    exemplo:
      "Se um cliente tiver 80\u202f000\u202f€ depositados num banco que entre em liquidação, o FGD assegura o reembolso integral dos 80\u202f000\u202f€.",
    sinonimos: [
      "FGD",
      "garantia de depósitos",
      "100 000 euros",
      "proteção bancária",
    ],
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
  "retencao-capitais": /(?<![\d,.])28[\s\u202f]?%(?!\w)|\breten[cç][ãa]o liberat[oó]ria\b/i,
  "deducao-coleta": /\bdedu[cç][õo]es?\b/i,
  "limite-deducoes": /\blimite global\b|\bart\.? ?78\b/i,
  ppr: /\bPPR\b/,
  "rendimento-relevante": /\brendimento relevante\b/i,
  englobamento: /\benglobamento\b|\benglobar\b|\btaxa aut[oó]noma\b/i,
  "salario-real": /\bsal[aá]rio real\b|\bpoder de compra\b/i,
  homologo: /\bhom[oó]log[ao]s?\b|\bvaria[cç][ãa]o em cadeia\b/i,
  pib: /\bPIB\b|\bProduto Interno Bruto\b/i,
  "populacao-ativa": /\bpopula[cç][ãa]o ativa\b|\btaxa de desemprego\b/i,
  "indice-precos-habitacao": /\bHPI\b|\bpre[cç]os da habita[cç][ãa]o\b/i,
  ias: /\bIAS\b|\bindexante dos apoios sociais\b/i,
  "rendimento-coletavel": /\brendimento colet[aá]vel\b/i,
  "irs-jovem": /\bIRS Jovem\b/i,
  duodecimos: /\bduod[eé]cimos?\b/i,
  "subsidio-alimentacao": /\bsubs[ií]dio de alimenta[cç][ãa]o\b|\bsubs[ií]dio de refei[cç][ãa]o\b/i,
  adse: /\bADSE\b/,
  imt: /\bIMT\b/,
  "imposto-selo": /\bImposto do Selo\b/i,
  imi: /\bIMI\b|\bVPT\b|\bValor Patrimonial Tribut[aá]rio\b/i,
  "isv-iuc": /\bISV\b|\bIUC\b/,
  "taxa-mista": /\btaxa mista\b|\btaxa fixa\b/i,
  "taxa-esforco": /\btaxa de esfor[cç]o\b|\bDSTI\b/i,
  "mais-valias": /\bmais-valias?\b/i,
  "servicos-minimos-bancarios": /\bservi[cç]os m[ií]nimos banc[aá]rios\b|\bSMB\b/i,
  "fundo-garantia-depositos": /\bFundo de Garantia de Dep[oó]sitos\b|\bFGD\b/i,
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
