/**
 * _revisao-copy.mjs — GERA docs/REVISAO-COPY-V5.md.
 *
 * A tabela de revisão de copy é o portão do lançamento (P4 do
 * docs/PACK-V5-PRODUCAO.md): o dono tem de rever TODA a copy PROPOSTA
 * antes de o site V5 entrar. Escrever essa tabela à mão é exactamente o
 * defeito que a Regra nº1 promete não cometer — um número que sai do
 * código e um ficheiro que fica desatualizado.
 *
 * Este script lê as MESMAS fontes de onde a página lê a copy e escreve a
 * tabela. Nada é inventado aqui: o texto sai tal como está no código, com
 * os parâmetros virados em {parametro}, e a coluna «fonte do número»
 * diz de onde vem o número — a expressão que o componente passa.
 *
 * Fontes:
 *   - src/app/_bairro/cenas/textos.ts      (cenas P2a)
 *   - src/app/_bairro/cenas/textos-p2b.ts  (cenas P2b)
 *   - src/app/_bairro/cenas/textos-p2c.ts  (cenas P2c)
 *   - messages/pt.json                     (home, elenco, /estilo, tema)
 *   - docs/NOTAS-V5.md                     (os blocos PROPOSTA da P0/P1)
 *   - docs/AUDITORIA-CENAS-V5.md §2.2      (as 3 propostas de alteração)
 *
 * Uso: node scripts/_revisao-copy.mjs [--check]
 *   --check  não escreve; sai 1 se o ficheiro gerado estiver diferente
 *            do que está em disco (para o CI não ficar a mentir).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// `new URL("..", import.meta.url).pathname` não é um caminho de ficheiro:
// no Windows devolve «/C:/Users/…» (a barra à frente da letra de disco
// entra no caminho) e o script passa a pedir ficheiros a partir desse
// prefixo — ENOENT em tudo. `fileURLToPath` devolve o caminho do sistema.
// A barra final é a de sempre: o script concatena («${RAIZ}docs/…»).
const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const DESTINO = `${RAIZ}docs/REVISAO-COPY-V5.md`;

/* ——————————————————————————— utilidades ——————————————————————————— *//** Números escritos dentro da própria frase (o risco da Regra nº1). */
const RE_NUMERO =
  /\b\d[\d\s., ]*(?:€|%|\s?(?:litros?|meses|anos|euros|pontos|graus|dias?))?\b/gu;

/**
 * Cenografia, não dado. A senha «A 041» da cena do Banco e a senha
 * «A 107» da Segurança Social são números inventados de propósito — são
 * um número de fila, como na vida real; o valor nunca entra em conta
 * nenhuma. Marque-los como número à mão seria barulho a tapar os 50 que
 * são mesmo risco. A chave entra aqui e o ⚠️ desaparece.
 */
const CENOGRAFICO = new Set([
  "banBtnSenha",
  "corSenha",
  "ssSenha",
  "finFala2", // a senha A 023 é cenografia; o resto da fala não tem número
]);

function temNumero(t, chave = "") {
  if (CENOGRAFICO.has(chave)) return "";
  const achados = t.match(RE_NUMERO) ?? [];
  return achados
    .map((s) => s.trim())
    .filter((s) => !/^\d{4}$/.test(s)) // 2015 como base de índice é um marco
    .join(" · ");
}

/** Uma célula de markdown: sem quebras, sem barras a partirem a tabela. */
function celula(s) {
  return String(s)
    .replace(/\s+/gu, " ")
    .replace(/\|/gu, "\\|")
    .trim();
}

/** `<b>x</b>` e `class="…"` são para o reader ver o texto, não o HTML. */
function limpo(t) {
  return String(t)
    .replace(/<span class="b-r">/gu, "«")
    .replace(/<span class="r">/gu, "«")
    .replace(/<span class="a">/gu, "«")
    .replace(/<\/span>/gu, "»")
    .replace(/<b>/gu, "**")
    .replace(/<\/b>/gu, "**")
    .replace(/<\/?p>/gu, " ")
    .replace(/<br\s*\/?>/gu, " ")
    .replace(/<[^>]+>/gu, "");
}

/* ——————————————————————— 1 · ficheiros de copy ——————————————————————— */

const CENAS = [
  ["P2a", "src/app/_bairro/cenas/textos.ts"],
  ["P2b", "src/app/_bairro/cenas/textos-p2b.ts"],
  ["P2c", "src/app/_bairro/cenas/textos-p2c.ts"],
];

/**
 * Todos os call-sites `T.chave(…)` das cenas — a fonte do número.
 * Os parênteses são contados à mão: `fmtEUR(a ? b : c)` fecha antes do
 * `)` da chamada, e uma regex preguiçosa comeria o resto do componente.
 */
function argumentosDeChave(chave) {
  const achados = new Set();
  for (const [, caminho] of CENAS) {
    const pasta = caminho.slice(0, caminho.lastIndexOf("/") + 1);
    for (const comp of listar(`${RAIZ}${pasta}`)) {
      if (!comp.endsWith(".tsx")) continue;
      // a lista vem de `${RAIZ}${pasta}`; ler de `${pasta}${comp}` só
      // batia certo se o script fosse corrido da raiz do repo
      const src = readFileSync(`${RAIZ}${pasta}${comp}`, "utf8");
      // o prefixo `T.` é o que importa: uma chamada solta com o mesmo
      // nome seria outra chave
      let i = src.indexOf(`T.${chave}(`);
      while (i >= 0) {
        let d = 0;
        let j = i + `T.${chave}`.length;
        let fim = -1;
        for (; j < src.length; j += 1) {
          if (src[j] === "(") d += 1;
          else if (src[j] === ")") {
            d -= 1;
            if (d === 0) {
              fim = j;
              break;
            }
          }
        }
        if (fim > 0) {
          const abertura = `T.${chave}`.length + 1;
          const args = src
            .slice(i + abertura, fim)
            .replace(/\s+/gu, " ")
            .trim();
          if (args) achados.add(`${comp}: ${args}`);
        }
        i = src.indexOf(`T.${chave}(`, i + 1);
      }
    }
  }
  return [...achados];
}

function listar(d) {
  try {
    return readdirSync(d);
  } catch {
    return [];
  }
}

/** O valor de um `export const` sem depender de um parser de TS. */
function valorDe(src, chave) {
  const re = new RegExp(
    String.raw`export const ${chave}\s*(?::[^=]*)?=\s*([\s\S]*?);\n`,
    "u"
  );
  const m = re.exec(src);
  if (!m) return null;
  const corpo = m[1];

  // template literal: `${x}` → {x}
  if (corpo.includes("`")) {
    const partes = [...corpo.matchAll(/`([\s\S]*?)`/gu)].map((x) => x[1]);
    return partes
      .join(" ")
      .replace(/\$\{\s*([\w.]+)\s*\}/gu, "{$1}")
      .trim();
  }

  // ternário / return com literais: junta tudo o que é texto
  if (corpo.includes('"')) {
    const lits = [...corpo.matchAll(/"((?:[^"\\]|\\.)*)"/gu)].map((x) => x[1]);
    if (lits.length) return lits.join(" / ").replace(/\\"/gu, '"').trim();
  }
  return null;
}

function chavesDe(src) {
  return [
    ...new Set(
      [...src.matchAll(/^export (?:const|function)\s+(\w+)/gmu)].map((m) => m[1])
    ),
  ];
}

/* ——————————————————————— 2 · mensagens/pt.json ——————————————————————— */

function chavesDeObjecto(o, prefixo = "") {
  const out = [];
  for (const [k, v] of Object.entries(o)) {
    const chave = prefixo ? `${prefixo}.${k}` : k;
    if (v && typeof v === "object") out.push(...chavesDeObjecto(v, chave));
    else out.push(chave);
  }
  return out;
}

function valorEm(o, caminho) {
  return caminho
    .split(".")
    .reduce((a, k) => (a == null ? a : a[k]), o);
}

/* ——————————————————————— 3 · NOTAS-V5 e AUDITORIA ——————————————————————— */

/** Um bloco `### Título` … até ao próximo `###`, como lista de linhas. */
function bloco(md, titulo) {
  const i = md.indexOf(titulo);
  if (i < 0) return [];
  const resto = md.slice(i + titulo.length);
  const j = resto.search(/^#{2,3} /mu);
  return (j < 0 ? resto : resto.slice(0, j)).split("\n");
}

const linhas = [];
function add(grupo, onde, texto, fonte) {
  linhas.push({ grupo, onde: celula(onde), texto: celula(limpo(texto)), fonte: celula(fonte) });
}

/* ——————————————————————————— corpo ——————————————————————————— */

const notas = readFileSync(`${RAIZ}docs/NOTAS-V5.md`, "utf8");

for (const [fase, caminho] of CENAS) {
  const src = readFileSync(`${RAIZ}${caminho}`, "utf8");
  const prefixo = `src/app/_bairro/cenas/${caminho.slice(caminho.lastIndexOf("/") + 1)}`;
  for (const chave of chavesDe(src)) {
    const valor = valorDe(src, chave);
    if (valor === null || !/[A-Za-zÀ-ÿ]/.test(valor)) continue;
    const num = temNumero(valor, chave);
    const args = argumentosDeChave(chave);
    const fonte = num
      ? `⚠️ número escrito na frase: ${num}`
      : args.length
        ? `parâmetro — de onde vem: ${args.slice(0, 2).join(" ; ")}`
        : "sem número";
    add(`cenas ${fase}`, `${prefixo}:${chave}`, valor, fonte);
  }
}

const pt = JSON.parse(readFileSync(`${RAIZ}messages/pt.json`, "utf8"));
for (const chave of chavesDeObjecto(pt.bairro)) {
  const v = valorEm(pt.bairro, chave);
  add(
    "home · bairro",
    `messages/pt.json:bairro.${chave}`,
    v,
    temNumero(v) ? `⚠️ número escrito na frase: ${temNumero(v)}` : "sem número"
  );
}
for (const chave of chavesDeObjecto(pt.estilo)) {
  const v = valorEm(pt.estilo, chave);
  add("`/estilo` (P3c)", `messages/pt.json:estilo.${chave}`, v, "sem número");
}
for (const chave of ["mudarParaClaro", "mudarParaEscuro", "claro", "escuro"]) {
  add("tema", `messages/pt.json:tema.${chave}`, valorEm(pt.tema, chave), "sem número");
}
add(
  "volta ao bairro (P3b)",
  "messages/pt.json:pagina.voltarBairro",
  pt.pagina.voltarBairro,
  "sem número"
);

// SEO: o que cada rota mostra ao ser partilhada. São duas strings por
// rota, e a maior parte já estava publicada no metadata de
// src/app/<rota>/page.tsx antes do P4-SEO — o P4-SEO moveu-as para o
// pt.json. Só três descrições são copy nova a sério (poupanca, sobre e
// trabalho). Estar publicado não é o mesmo que estar aprovado, por isso
// entram todas.
//
// `seo.card` e `seo.altImagem` ficam de fora de propósito: são valores de
// sistema (o texto do cartão e o alt da imagem), não a copy de uma página.
// Se um dia passarem a ser escrita à mão, deservecem grupo próprio.
for (const [rota, v] of Object.entries(pt.seo?.rotas ?? {})) {
  for (const campo of ["titulo", "descricao"]) {
    const texto = v[campo];
    add(
      "SEO (títulos e descrições)",
      `messages/pt.json:seo.rotas.${rota}.${campo}`,
      texto,
      temNumero(texto)
        ? `⚠️ número escrito na frase: ${temNumero(texto)}`
        : "sem número"
    );
  }
}

// NOTAS-V5: os blocos PROPOSTA que não vivem em pt.json (nomes
// acessíveis, rótulos de marcadores, placas desenhadas no mapa).
for (const l of bloco(
  notas,
  "### Nomes acessíveis dos edifícios"
)) {
  const m = /^\|\s*`(\w+)`\s*\|\s*«(.+)»\s*\|/u.exec(l);
  if (m) add("edifícios (aria-label)", `Bairro.tsx:edificio.${m[1]}`, m[2], "sem número");
}
// os rótulos dos marcadores estão partidos por várias linhas do bloco
const marcadores = bloco(notas, "### Rótulos dos marcadores")
  .join(" ")
  .replace(/\s+/gu, " ");
for (const r of marcadores.match(/«(.+?)»/gu) ?? []) {
  add(
    "marcadores do mapa",
    "src/lib/bairro/planta.ts:rótulo",
    r.replace(/^«|»$/gu, ""),
    "sem número"
  );
}
for (const l of bloco(notas, "### Placas e letreiros desenhados no mapa")) {
  for (const p of l.match(/«(.+?)»/gu) ?? []) {
    const texto = p.replace(/^«|»$/gu, "");
    for (const parte of texto.split(" · ")) {
      add(
        "letreiros desenhados",
        "src/lib/bairro/planta.ts:letreiro",
        parte,
        "sem número"
      );
    }
  }
}
for (const l of bloco(notas, "### As sete cartas de personagem")) {
  const m = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/u.exec(l);
  if (!m) continue;
  const quem = m[1].trim();
  add("cartas · nome", `messages/pt.json:bairro.elenco.cartas.*.nome`, quem, "sem número");
  add("cartas · papel", `messages/pt.json:bairro.elenco.cartas.*.papel`, m[2], "sem número");
  add("cartas · perfil", `messages/pt.json:bairro.elenco.cartas.*.perfil`, m[3], "sem número");
  add("cartas · aprende", `messages/pt.json:bairro.elenco.cartas.*.aprende`, m[4], temNumero(m[4]) ? `⚠️ número escrito na frase: ${temNumero(m[4])}` : "sem número");
}
for (const l of bloco(notas, "### Controlos")) {
  for (const c of l.match(/«(.+?)»/gu) ?? []) {
    add("controlos da home", "messages/pt.json:bairro.*", c.replace(/^«|»$/gu, ""), "sem número");
  }
}
for (const l of bloco(notas, "### Cabeçalho e introdução da home")) {
  const m = /^\|\s*([^|]+?)\s*\|\s*«(.+)»\s*\|?/u.exec(l);
  if (m && !/^Onde$/u.test(m[1])) {
    add(`home · ${m[1]}`, "messages/pt.json:bairro.*", m[2], temNumero(m[2]) ? `⚠️ número escrito na frase: ${temNumero(m[2])}` : "sem número");
  }
}

// AUDITORIA §2.2 — as três propostas de alteração (não aplicadas).
const auditoria = readFileSync(`${RAIZ}docs/AUDITORIA-CENAS-V5.md`, "utf8");
for (const l of bloco(auditoria, "### 2.2 Propostas de copy")) {
  const m = /^\*\*(P\d)\s*·\s*(.+?)\*\*/u.exec(l);
  if (!m) continue;
  add(
    `proposta de alteração (${m[1]})`,
    "docs/AUDITORIA-CENAS-V5.md §2.2",
    m[2].replace(/\*\*$/u, ""),
    "proposta — não aplicada; a copy é do dono"
  );
}

/* ——————————————————————————— escrita ——————————————————————————— */

const grupos = [...new Set(linhas.map((l) => l.grupo))];

/**
 * A linha de cabeçalho e a de separação, repetidas em CADA grupo.
 * Uma tabela interrompida por um parágrafo (`**grupo**`) é uma tabela
 * nova para quem a lê: sem cabeçalho, «Onde» e «Fonte do número» ficam
 * sem nome, e a coluna da direita — a que o dono escreve — deixa de se
 * ver. Repetir o cabeçalho é o que mantém cada grupo legível sozinho,
 * em qualquer visualizador.
 */
const CAB_TABELA =
  "| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |\n" +
  "|---|---|---|---|---|\n";

const cab =
  `# REVISÃO DE COPY V5 — o que o dono tem de aprovar antes do lançamento

> **Uma tabela só.** Todas as frases que o site mostra e que ainda não
> foram aprovadas pelo dono, extraídas por \`node scripts/_revisao-copy.mjs\`
> das fontes de verdade (\`cenas/textos.ts\`, \`textos-p2b.ts\`,
> \`textos-p2c.ts\`, \`messages/pt.json\`, \`docs/NOTAS-V5.md\` §Textos
> PROPOSTA e \`docs/AUDITORIA-CENAS-V5.md\` §2.2). **Não está escrita à
> mão** — se o texto mudar no código, corre-se o script e a tabela muda
> com ele (\`--check\` diz se está desactualizada, sem escrever).
>
> **Como ler.** «Onde» é \`ficheiro:chave\`. «Texto tal como está no site»
> é a frase com os parâmetros já virados em \`{parametro}\` — o número que
> lá entra em produção é o que o componente lhe passa, já formatado.
> ⚠️ **número escrito à mão**: há um número dentro da frase, à mão, sem
> fonte no código — é o risco da Regra nº1 e o ponto que mais merece
> atenção nesta revisão. A coluna da direita é para o dono: escreve
> «aprovado» ou o texto novo.
>
> Nada entra sem a coluna da direita preenchida (P4 do
> \`docs/PACK-V5-PRODUCAO.md\` §P4.4).

${CAB_TABELA}`;

let n = 0;
const corpo = grupos
  .map((g) => {
    const dentro = linhas.filter((l) => l.grupo === g);
    return (
      `\n**${g}** (${dentro.length})\n\n` +
      CAB_TABELA +
      dentro
        .map((l) => {
          n += 1;
          return `| ${n} | \`${l.onde}\` | ${l.texto} | ${l.fonte} |  |`;
        })
        .join("\n")
    );
  })
  .join("");

const fecho = `

---

**Total: ${n} frases.** As marcadas com ⚠️ têm um número escrito à mão
dentro do texto — se a lei, a série ou a portaria mudar, a frase mente em
silêncio. As que têm \`{parametro}\` recebem o valor do servidor e
mostram a fonte no rodapé da cena; as restantes são palavras.

_(Regenerar: \`node scripts/_revisao-copy.mjs\`. Verificar sem escrever:
\`node scripts/_revisao-copy.mjs --check\`.)_
`;

const saida = cab + corpo + fecho;

if (process.argv.includes("--check")) {
  const atual = readFileSync(DESTINO, "utf8");
  if (atual === saida) {
    console.log("ok: docs/REVISAO-COPY-V5.md está em dia com o código.");
    process.exit(0);
  }
  console.error(
    "FALHA: docs/REVISAO-COPY-V5.md está desatualizado.\n" +
      "Corre: node scripts/_revisao-copy.mjs"
  );
  process.exit(1);
}

writeFileSync(DESTINO, saida);
console.log(`docs/REVISAO-COPY-V5.md: ${n} frases, ${grupos.length} grupos.`);