import type { Metadata } from "next";
import { ViewTransition } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Ticker } from "@/components/Ticker";
import { PausaAmbiente } from "@/components/PausaAmbiente";
import { VooLimpeza } from "@/components/Voo";
import { ALT_FEED } from "@/lib/meta";
import { m } from "@/lib/messages";
import { urlOg } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Subconjunto próprio em vez de next/font/google. O Google servia o
// Archivo variable com o eixo wdth inteiro (62%–125%) e o latin
// completo: 160,8 KB em todas as rotas, pagos por 1000+ glifos e por
// larguras que o site nunca usa. Aqui entram 223 glifos — os que o
// browser pinta, mais a folga do português — e as larguras que o CSS
// pede mesmo, medidas com scripts/_medir-uso-fonte.mjs.
//
// Várias chamadas, e não uma com vários `src`: o next/font/local junta
// vários src num @font-face só, e o que se quer é o contrário — uma
// família por largura, para o CSS escolher a largura pelo nome. O eixo
// wdth deixa de existir; escolher a largura passou a ser escolher a
// variável CSS.
//
// font-display: swap em todas as cinco faces, e não optional (que era
// o do 4B-03). optional tem uma janela de ~100 ms: a fonte que chega
// depois é descarregada e nunca usada, para a vida toda da página. Com
// o Google passava porque havia uma só face por família, pré-carregada.
// Aqui há cinco, e só uma cabe no preload sem pesar 80 KB em todas as
// rotas — o resultado medido era o título da home e os cabeçalhos de
// página pintados pelo fallback métrico, a 624,28 px contra os 713,77 px
// do ficheiro. A troca atrasada deixou de custar CLS porque os
// fallbacks medidos abaixo cobrem as métricas de cada face.
const archivo = localFont({
  src: [{ path: "./fonts/Archivo-base.woff2", weight: "400 900", style: "normal" }],
  variable: "--font-archivo",
  declarations: [{ prop: "font-family", value: "Archivo" }],
  display: "swap",
  fallback: ["Archivo Fallback", "Arial", "sans-serif"],
  adjustFontFallback: false,
  // Pré-carregam-se as duas faces do primeiro ecrã: a base (o corpo) e
  // a larga (os títulos, o número-herói). São as duas que, em swap,
  // trocariam a meio do primeiro paint se não chegassem antes — medido:
  // sem o preload da larga o CLS era 0,011 em /salario. A terceira
  // instância (116%) vive no módulo da home, onde só é usada. O Caveat
  // fica fora: está no rodapé das cenas, muito abaixo da dobra.
  preload: true,
});
// A instância larga é a mesma fonte com wdth fixo em 125 — a dos títulos
// e do número-herói.
const archivoLargo = localFont({
  src: [{ path: "./fonts/Archivo-larga.woff2", weight: "400 900", style: "normal" }],
  variable: "--font-archivo-largo",
  declarations: [{ prop: "font-family", value: "ArchivoLargo" }],
  display: "swap",
  fallback: ["ArchivoLargo Fallback", "Arial Black", "sans-serif"],
  adjustFontFallback: false,
  preload: true,
});
// Caveat — a mão que escreve (P0, contrato visual V5). Só entra em vigor
// dentro de [data-pele="v5"] (ver globals.css); carregada na V5, não vale
// para as rotas V4. Também em swap, pelo mesmo motivo das do Archivo: em
// optional a face que chega depois da janela é descartada, e as
// anotações à mão ficavam pelo fallback métrico.
const caveat = localFont({
  src: [
    { path: "./fonts/Caveat-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Caveat-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mao",
  declarations: [{ prop: "font-family", value: "Caveat" }],
  // O fallback de métricas do Caveat está no globals.css, medido: o
  // automático do next/font chama-lhe "caveat Fallback" (minúsculas) e
  // o contrato V5 só admite famílias que comecem por «Archivo» ou
  // «Caveat» — ver e2e/fontes-v4.spec.ts.
  adjustFontFallback: false,
  display: "swap",
  fallback: ["Caveat Fallback", "Comic Sans MS", "cursive"],
  preload: false,
});

/* O que a home tem em `<head>`, e que todas as rotas herdam. O texto vem
   de `messages/pt.json` — nenhuma string de SEO vive num componente. As
   rotas que precisam de canonical e og próprios usam `metaDeRota`
   (`@/lib/seo`) e não esta constante. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: m.meta.title,
    template: `%s · ${m.brand.name}`,
  },
  description: m.meta.description,
  alternates: {
    canonical: "/",
    types: ALT_FEED,
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: m.seo.card,
    url: SITE_URL,
    images: [{ url: urlOg(), width: 1200, height: 630, alt: m.seo.altImagem }],
  },
  twitter: {
    card: "summary_large_image",
    images: [urlOg()],
  },
};

export const viewport = {
  // o tema por omissão é escuro — a barra do browser acompanha
  themeColor: "#0d0b08",
};

/** Resolve o tema antes da primeira pintura: escolha guardada → escuro.
 *  ESCURO POR OMISSÃO: o instrumento é a cara do produto.
 *  prefers-color-scheme não distingue «sem preferência» de «claro» —
 *  O OMISSÃO é CLARO desde o veredicto do design sobre a P1: a home do
 *  bairro é uma página de papel e não tem tema — era estranho o site
 *  nascer escuro e a home clarear sozinha. Quem prefere escuro usa o
 *  toggle (persistido, visível no topo), e a preferência passa a valer
 *  em todo o site a partir da P3.
 *  E liga o toggle por delegação de eventos em vanilla JS — funciona mesmo
 *  numa página que nunca hidratou (React morto, cache velha). O React só
 *  sincroniza o rótulo do botão via MutationObserver no data-theme.
 *  O `data-theme` é declarado no JSX (<html data-theme="light">): a
 *  reconciliação remove atributos que o JSX não declara — sem ele, o tema
 *  escuro era apagado na hidratação e o site ficava claro depois de
 *  hidratar (M-16 fix). */
const themeInit = `(function(){try{var r=document.documentElement;var t=localStorage.getItem("aocentimo-theme");if(!t){t=localStorage.getItem("bruto-theme");if(t)localStorage.setItem("aocentimo-theme",t);}if(!t)t="light";r.dataset.theme=t;}catch(e){r.dataset.theme="light";}
document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("[data-theme-toggle]"):null;if(!b)return;var root=document.documentElement;var next=root.dataset.theme==="dark"?"light":"dark";if(!document.querySelector(".b5")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){root.setAttribute("data-theme-anim","");setTimeout(function(){root.removeAttribute("data-theme-anim")},400);}root.dataset.theme=next;try{localStorage.setItem("aocentimo-theme",next);}catch(x){}});})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-PT"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-theme="light"
      data-pele="v5"
      className={`${archivo.variable} ${archivoLargo.variable} ${caveat.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#conteudo" className="skip-link">
          Saltar para o conteúdo
        </a>
        <SiteHeader />
        {/* limpa o selo do voo da pergunta depois de cada navegação
            (1B-04 — corre no commit seguinte, já a transição capturada) */}
        <VooLimpeza />
        {/* o marquee só corre onde se vê — fora do ecrã ou com o
            separador escondido, o PausaAmbiente congela-o (1B-04) */}
        <PausaAmbiente>
          <Ticker />
        </PausaAmbiente>
        <main id="conteudo" tabIndex={-1} className="flex-1">
          {/* cross-fade de página nas navegações — nav é lateral,
              sem deslizes direcionais falsos */}
          <ViewTransition>{children}</ViewTransition>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
