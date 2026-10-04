import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { m } from "@/lib/messages";
import { SITE_URL } from "@/lib/site";

/**
 * SEO — o bloco de metadados de cada rota, num sítio só.
 *
 * Três decisões que vêm do facto de o site ser 100 % estático
 * (`output: "export"`, servido pelo GitHub Pages):
 *
 * 1. **O cartão de partilha é um ficheiro em `public/`, não uma rota
 *    de metadata.** O `opengraph-image.tsx` que havia emitia
 *    `/opengraph-image?222b691790b2fa33` — uma rota sem extensão. O
 *    GitHub Pages serve-a como `application/octet-stream` e nenhum
 *    crawler de partilha a abria. `public/og-bairro.png` é servido como
 *    `image/png` e abre em qualquer lado. O ficheiro é gerado por
 *    `scripts/_og-bairro.mjs` (Playwright sobre o `out/`, tema «Dia»,
 *    com os treze marcadores à vista) e versionado no repo.
 *
 * 2. **A mesma imagem em todas as rotas — inclusive nas âncoras da cena.**
 *    `/#banco` é o mesmo documento que `/`: o `canonical` é o da home e
 *    não há rota nova para a cena. Um cartão por cena seria uma imagem
 *    por URL, e o mapa não muda de figura quando o_hash muda.
 *
 * 3. **O texto vive em `messages/pt.json`, nunca no componente.** Cada
 *    `page.tsx` deixa de escrever a sua própria `description` e passa a
 *    chamar `metaDeRota("/salario")`.
 */

/** O caminho do cartão dentro de `public/`. */
export const IMAGEM_OG = m.seo.imagem;

/** O mesmo caminho, absoluto — o que os crawlers exigem. */
export function urlOg(): string {
  return new URL(IMAGEM_OG, SITE_URL).toString();
}

/** O título absoluto de uma rota, como sai no `<title>`. */
export function tituloAbsoluto(titulo: string): string {
  return `${titulo} · ${m.brand.name}`;
}

/**
 * O bloco comum: canonical, Open Graph e Twitter.
 *
 * `og:title` e `twitter:title` NÃO são escritos aqui de propósito — o
 * Next herda-os do `title`, já com o template do layout aplicado. Assim
 * o que o crawler lê é sempre o mesmo texto que está no separador, sem
 * duas fontes para divergirem.
 */
function bloco(canonical: string, titulo: string, descricao: string): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical, types: ALT_FEED },
    openGraph: {
      type: "website",
      locale: "pt_PT",
      siteName: m.seo.card,
      // a home é a única sem barra final — é assim que o canonical dela
      // já sai no build, e og:url tem de bater certo com ele
      url: `${SITE_URL}${canonical === "/" ? "" : canonical}`,
      images: [
        { url: urlOg(), width: 1200, height: 630, alt: m.seo.altImagem },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [urlOg()],
    },
  };
}

/** O texto de uma rota, como está em `messages/pt.json`. */
type CopyRota = { titulo: string; descricao: string };

function copyDe(rota: string): CopyRota {
  const chave = rota.replace(/^\//, "");
  const copy = (m.seo.rotas as Record<string, CopyRota | undefined>)[chave];
  // falhar alto, não em silêncio: uma rota sem copy de SEO sai no site
  // com a descrição da home, e ninguém dá por isso até um crawler
  if (!copy) throw new Error(`messages/pt.json: falta a copy de SEO de ${rota}`);
  return copy;
}

/**
 * Metadados de uma rota de conteúdo.
 *
 * @param rota o caminho, com barra inicial — `/salario`, `/aprender`.
 */
export function metaDeRota(rota: string): Metadata {
  const { titulo, descricao } = copyDe(rota);
  return bloco(rota, titulo, descricao);
}

/**
 * Metadados de um termo do glossário.
 *
 * O texto vem do próprio termo (`content/glossario.ts`), não de
 * `pt.json`: já existe, escrito uma vez, e a definição é o texto certo
 * para a página. O título compõe-se com o mesmo separador das rotas.
 *
 * A definição não cabe na janela de 50–160 caracteres que a casa usa
 * nas catorze rotas — 22 dos 23 termos passam dos 160. Truncar a meio
 * de uma frase para respeitar um número seria pior para quem lê do que
 * uma descrição longa e verdadeira; o limite vale para as rotas com
 * copy escrita para o efeito (ver `e2e/seo.spec.ts`).
 */
export function metaDeTermo(
  slug: string,
  termo: string,
  definicao: string
): Metadata {
  return bloco(`/aprender/${slug}`, `${termo} — glossário`, definicao);
}

/** Um degrau do caminho de migalhas. */
export type Traco = { nome: string; rota: string };

/**
 * O caminho de migalhas de uma rota, derivado do próprio caminho.
 *
 * Os nomes dos degraus saem de `m.nav`, que já rotula cada secção em
 * PT-PT — nada de escrever «Salário» outra vez aqui. O degrau que não
 * é uma secção (o termo do glossário) entra em `folha`, porque nome é
 * conteúdo: muda com o glossário, não com o site.
 *
 * Falha alto num segmento sem rótulo: uma migalha sem nome é pior do
 * que nenhuma, e o sintoma (uma secção nova sem «Voltar ao bairro»
 * actualizado) é invisível até um crawler publicar um «ListItem» vazio.
 */
export function tracosDe(rota: string, folha?: Traco): Traco[] {
  const tracos: Traco[] = [{ nome: m.brand.name, rota: "/" }];
  for (const seg of rota.split("/").filter(Boolean)) {
    const nome = (m.nav as Record<string, string | undefined>)[seg];
    if (nome) {
      tracos.push({ nome, rota: `/${seg}` });
    } else if (folha && folha.rota === rota) {
      tracos.push(folha);
    } else {
      throw new Error(`messages/pt.json: falta o rótulo de navegação de ${rota}`);
    }
  }
  return tracos;
}