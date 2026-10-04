import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Archivo, Caveat } from "next/font/google";
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

// font-display: optional (4B-03) — com swap, a troca tardia de fonte
// reembrulhava o texto (a frase serifada de /casa media CLS 0,115).
// As fontes são pré-carregadas: chegam dentro da janela pequena do
// optional quase sempre; quando não chegam, fica o fallback métrico —
// nunca há reflow de texto a meio do paint.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "optional",
});
// Caveat — a mão que escreve (P0, contrato visual V5). Só entra em vigor
// dentro de [data-pele="v5"] (ver globals.css); carregada na V5, não vale
// para as rotas V4. display: optional pela mesma razão das outras (4B-03).
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-mao",
  display: "optional",
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
document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("[data-theme-toggle]"):null;if(!b)return;var root=document.documentElement;var next=root.dataset.theme==="dark"?"light":"dark";if(!matchMedia("(prefers-reduced-motion: reduce)").matches){root.setAttribute("data-theme-anim","");setTimeout(function(){root.removeAttribute("data-theme-anim")},400);}root.dataset.theme=next;try{localStorage.setItem("aocentimo-theme",next);}catch(x){}});})()`;

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
      className={`${archivo.variable} ${caveat.variable}`}
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
