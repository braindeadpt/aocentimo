import { test, expect, type APIRequestContext } from "@playwright/test";
import { GLOSSARIO } from "../src/content/glossario";
import { SITE_URL } from "../src/lib/site";

/**
 * P4 · SEO — o `<head>` de todas as rotas, o sitemap e o cartão de
 * partilha.
 *
 * O que este spec vigia, e porque cada uma das coisas falha em silêncio
 * se ninguém olhar:
 *
 *   1. **Título único por rota.** Duas rotas com o mesmo título é a
 *      forma mais barata de o site inteiro descer nos resultados.
 *   2. **Descrição entre 50 e 160 caracteres.** Abaixo de 50 o crawler
 *      completa à sua maneira; acima de 160 corta a meio de uma frase.
 *      A excepção são as páginas do glossário, cuja descrição é a
 *      definição do termo — 22 dos 23 termos passam dos 160 caracteres
 *      e truncá-los a meio da frase seria pior para quem lê do que uma
 *      descrição longa e verdadeira (ver `metaDeTermo`).
 *   3. **Canonical absoluto e igual à rota.** Com `metadataBase` mal
 *      posto, o Next escreve `http://localhost:3000/salario` e o
 *      sitemap aponta para o mesmo sítio — duas cópias do site.
 *   4. **`og:image` absoluto que responde 200.** O `opengraph-image.tsx`
 *      que havia emitia `/opengraph-image?hash` — sem extensão, servido
 *      como octet-stream. As metas eramBonitas e a imagem não existia
 *      para nenhum crawler. Daí a rede ser parte do teste.
 *   5. **O sitemap tem as 15 rotas e os 23 termos, e cada URL existe.**
 *   6. **As âncoras da cena partilham o cartão do site** — `/#banco` é
 *      o mesmo documento que `/`, e por isso o mesmo `canonical` e a
 *      mesma imagem. Nenhuma rota nova por cena.
 */

/** As catorze rotas de conteúdo mais a home — a lista do AGENTS. */
const ROTAS = [
  "/",
  "/salario",
  "/irs",
  "/impostos",
  "/poupanca",
  "/credito",
  "/casa",
  "/inflacao",
  "/precos",
  "/trabalho",
  "/dados",
  "/aprender",
  "/metodologia",
  "/estilo",
  "/sobre",
] as const;

const DESC_MIN = 50;
const DESC_MAX = 160;
/** O tecto do dono para o cartão, e o mesmo que o gerador mede. */
const CARTAO_MAX = 250 * 1024;
const CARTAO = "/og-bairro.png";

/** As cenas da home — âncoras, não rotas. */
const ANCORAS = ["banco", "fabrica", "financas", "correios", "bomba"] as const;

/** Uma descrição só de texto, com as entidades do HTML já desescapadas. */
function desescapar(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

interface Cabeca {
  title?: string;
  canonical?: string;
  metas: Map<string, string>;
}

/** Lê o `<head>` do HTML servido — sem browser, sem JS, como o crawler. */
function lerCabeca(html: string): Cabeca {
  const metas = new Map<string, string>();
  for (const tag of html.match(/<meta\s[^>]*>/g) ?? []) {
    const chave = tag.match(/\b(?:property|name)="([^"]+)"/)?.[1];
    const conteudo = tag.match(/\bcontent="([^"]*)"/)?.[1];
    if (chave && conteudo !== undefined) metas.set(chave, desescapar(conteudo));
  }
  const canonical = html
    .match(/<link[^>]*\brel="canonical"[^>]*>/)?.[0]
    ?.match(/\bhref="([^"]+)"/)?.[1];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  return { title, canonical, metas };
}

async function htmlDe(request: APIRequestContext, caminho: string) {
  const r = await request.get(caminho);
  expect(r.status(), `${caminho} respondeu ${r.status()}`).toBe(200);
  return lerCabeca(await r.text());
}

/** O que toda a rota tem de cumprir, sem olhar para o texto. */
async function conferirRedeEHead(
  request: APIRequestContext,
  rota: string,
  head: Cabeca,
  descricao: string
) {
  expect(head.canonical, `${rota} sem canonical`).toBe(
    rota === "/" ? SITE_URL : `${SITE_URL}${rota}`
  );
  expect(head.metas.get("og:locale"), `${rota} sem og:locale`).toBe("pt_PT");
  expect(head.metas.get("twitter:card"), `${rota} sem cartão do Twitter`).toBe(
    "summary_large_image"
  );
  // o og:title tem de bater certo com o separador, senão o que se lê no
  // feed não é o que está no separador
  expect(head.metas.get("og:title"), `${rota} sem og:title`).toBe(head.title);
  expect(head.metas.get("og:description"), `${rota} sem og:description`).toBe(
    descricao
  );

  const imagem = head.metas.get("og:image");
  expect(imagem, `${rota} sem og:image`).toBeTruthy();
  expect(
    imagem,
    `${rota}: o og:image tem de ser absoluto (${imagem})`
  ).toBe(`${SITE_URL}${CARTAO}`);
  // e a prova de que existe: o 200 vem do servidor, não do HTML. Pede-se
  // pelo caminho local — o URL da meta foi conferido acima e é o mesmo
  // ficheiro no site publicado; ir buscar a origin real daqui seria
  // medir o site antigo em produção, não o build.
  const resposta = await request.get(new URL(imagem as string).pathname);
  expect(resposta.status(), `${rota}: ${imagem} respondeu ${resposta.status()}`).toBe(200);
  expect(resposta.headers()["content-type"], "o cartão não é image/png").toBe(
    "image/png"
  );
}

test.describe("P4 · SEO", () => {
  test("as 15 rotas têm título único, descrição na medida e canonical absoluto", async ({
    request,
  }) => {
    const titulos = new Map<string, string>();
    for (const rota of ROTAS) {
      const head = await htmlDe(request, rota);
      const titulo = head.title;
      expect(titulo, `${rota} sem título`).toBeTruthy();
      expect(titulos.has(titulo as string), `${titulo} repetido`).toBe(false);
      titulos.set(titulo as string, rota);

      const descricao = head.metas.get("description");
      expect(descricao, `${rota} sem description`).toBeTruthy();
      expect(
        descricao?.length,
        `${rota}: a descrição tem ${descricao?.length} caracteres (${descricao})`
      ).toBeGreaterThanOrEqual(DESC_MIN);
      expect(
        descricao?.length,
        `${rota}: a descrição tem ${descricao?.length} caracteres (${descricao})`
      ).toBeLessThanOrEqual(DESC_MAX);

      await conferirRedeEHead(request, rota, head, descricao as string);
    }
    expect(titulos.size).toBe(ROTAS.length);
  });

  test("os 23 termos do glossário têm canonical e cartão próprios", async ({
    request,
  }) => {
    const titulos = new Set<string>();
    for (const termo of GLOSSARIO) {
      const rota = `/aprender/${termo.slug}`;
      const head = await htmlDe(request, rota);
      expect(head.title, `${rota} sem título`).toContain(termo.termo);
      expect(titulos.has(head.title as string), `${head.title} repetido`).toBe(
        false
      );
      titulos.add(head.title as string);
      // a descrição é a definição — não se mede o tamanho (ver o cabeçalho)
      expect(head.metas.get("description"), `${rota} sem description`).toBe(
        termo.definicao
      );
      expect(head.canonical, `${rota} sem canonical`).toBe(`${SITE_URL}${rota}`);
      expect(head.metas.get("og:image")).toBe(`${SITE_URL}${CARTAO}`);
    }
    expect(titulos.size).toBe(GLOSSARIO.length);
  });

  test("o cartão de partilha é um PNG de 1200×630 que cabe no tecto", async ({
    request,
  }) => {
    const r = await request.get(CARTAO);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toBe("image/png");
    const corpo = await r.body();
    expect(corpo.length, "o cartão passou do tecto de 250 KB").toBeLessThanOrEqual(
      CARTAO_MAX
    );
    // a assinatura do PNG — um HTML de fallback também daria 200
    expect(corpo.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    // IHDR: a largura e a altura estão nos bytes 16..24, big-endian
    expect(corpo.readUInt32BE(16)).toBe(1200);
    expect(corpo.readUInt32BE(20)).toBe(630);
  });

  test("o sitemap tem as 15 rotas e os 23 termos, e cada URL existe", async ({
    request,
  }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const caminhos = urls.map((u) => new URL(u).pathname);

    // o sitemap NÃO é a lista de âncoras: /#banco não é uma rota
    expect(caminhos.some((c) => c.includes("#"))).toBe(false);

    const esperadas = [...ROTAS, ...GLOSSARIO.map((t) => `/aprender/${t.slug}`)];
    for (const caminho of esperadas) {
      expect(caminhos, `${caminho} falta no sitemap`).toContain(caminho);
    }
    expect(caminhos.length, "o sitemap tem rotas a mais ou a menos").toBe(
      esperadas.length
    );

    // e cada uma existe mesmo — um sitemap com uma URL morta é pior
    // do que um sitemap curto, porque promete o que não há
    for (const caminho of esperadas) {
      const r = await request.get(caminho);
      expect(r.status(), `${caminho} no sitemap mas respondeu ${r.status()}`).toBe(
        200
      );
    }
  });

  test("o robots.txt aponta para o sitemap e o manifest responde", async ({
    request,
  }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/^User-Agent:\s*\*/m);
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.status()).toBe(200);
    const m = JSON.parse(await manifest.text());
    expect(m.name).toContain("AO CÊNTIMO");
    expect(m.lang).toBe("pt-PT");
    expect(m.start_url).toBe("/");
    expect(m.icons.length).toBeGreaterThan(0);
    for (const icone of m.icons) {
      expect((await request.get(icone.src)).status(), icone.src).toBe(200);
    }
  });

  test("as âncoras da cena partilham a imagem do site e não viram rotas", async ({
    request,
    page,
  }) => {
    const home = await htmlDe(request, "/");
    for (const ancora of ANCORAS) {
      // o servidor vê `/#banco` como `/` — o mesmo documento
      const comAncora = await htmlDe(request, `/#${ancora}`);
      expect(comAncora.canonical, `/#${ancora} não é a home`).toBe(SITE_URL);
      expect(comAncora.metas.get("og:image")).toBe(home.metas.get("og:image"));
      expect(comAncora.title).toBe(home.title);
    }
    // e a cena abre mesmo por âncora, sem rota nova
    await page.goto("/#banco");
    await expect(page.locator(".b-palco")).toBeVisible();
    await expect(page.locator(".b-cena, .cena-de-perto").first()).toBeVisible();
  });

  test("a home declara a Organization e o WebSite num só bloco", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    const blocos = [...html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    )];
    expect(blocos.length, "a home devia ter um só bloco de dados estruturados").toBe(
      1
    );
    const grafo = JSON.parse(blocos[0][1]);
    const nos = grafo["@graph"] ?? [grafo];
    const tipos = nos.map((n: { "@type": string }) => n["@type"]);
    expect(tipos).toContain("Organization");
    expect(tipos).toContain("WebSite");
    // e não há um WebSite duplicado — o defeito que a refactorização
    // da P4 veio arrumar
    expect(tipos.filter((t: string) => t === "WebSite")).toHaveLength(1);
    expect(tipos.filter((t: string) => t === "Organization")).toHaveLength(1);
  });

  test("as migalhas só existem onde há «Voltar ao bairro»", async ({
    request,
  }) => {
    const comMigalhas = ["/salario", "/casa", "/aprender"];
    const semMigalhas = ["/metodologia", "/sobre", "/estilo"];

    for (const rota of comMigalhas) {
      const html = await (await request.get(rota)).text();
      const tipos = [...html.matchAll(/"@type":"(BreadcrumbList)"/g)];
      expect(tipos.length, `${rota} devia ter migalhas`).toBe(1);
    }
    for (const rota of semMigalhas) {
      const html = await (await request.get(rota)).text();
      expect(
        html.includes('"@type":"BreadcrumbList"'),
        `${rota} não tem «Voltar ao bairro» e por isso não devia ter migalhas`
      ).toBe(false);
    }
  });
});