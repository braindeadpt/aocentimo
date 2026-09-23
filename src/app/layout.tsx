import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Archivo, Source_Serif_4, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Ticker } from "@/components/Ticker";
import { PausaAmbiente } from "@/components/PausaAmbiente";
import { VooLimpeza } from "@/components/Voo";
import { ALT_FEED } from "@/lib/meta";
import { SITE_URL } from "@/lib/site";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: "400", // .lede é sempre regular — o variável trazia 200–900 por um parágrafo
  variable: "--font-serif",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AO CÊNTIMO — literacia financeira para Portugal",
    template: "%s · AO CÊNTIMO",
  },
  description:
    "Simuladores e dados de literacia financeira para Portugal — salário líquido, IRS, crédito habitação, poupança e inflação. Cada número com fonte e data.",
  alternates: {
    canonical: "/",
    types: ALT_FEED,
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "AO CÊNTIMO",
  },
};

export const viewport = {
  // o tema por omissão é escuro — a barra do browser acompanha
  themeColor: "#0d0b08",
};

/** Resolve o tema antes da primeira pintura: escolha guardada → escuro.
 *  ESCURO POR OMISSÃO: o instrumento é a cara do produto.
 *  prefers-color-scheme não distingue «sem preferência» de «claro» —
 *  light é o fallback universal dos browsers, não uma escolha. Tratar o
 *  sinal do SO como escolha escondia o escuro à maioria. Quem prefere
 *  claro usa o toggle (persistido, visível no topo).
 *  E liga o toggle por delegação de eventos em vanilla JS — funciona mesmo
 *  numa página que nunca hidratou (React morto, cache velha). O React só
 *  sincroniza o rótulo do botão via MutationObserver no data-theme.
 *  O `data-theme` é declarado no JSX (<html data-theme="dark">): a
 *  reconciliação remove atributos que o JSX não declara — sem ele, o tema
 *  escuro era apagado na hidratação e o site ficava claro depois de
 *  hidratar (M-16 fix). */
const themeInit = `(function(){try{var r=document.documentElement;var t=localStorage.getItem("aocentimo-theme");if(!t){t=localStorage.getItem("bruto-theme");if(t)localStorage.setItem("aocentimo-theme",t);}if(!t)t="dark";r.dataset.theme=t;}catch(e){r.dataset.theme="dark";}
document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("[data-theme-toggle]"):null;if(!b)return;var root=document.documentElement;var next=root.dataset.theme==="dark"?"light":"dark";if(!matchMedia("(prefers-reduced-motion: reduce)").matches){root.setAttribute("data-theme-anim","");setTimeout(function(){root.removeAttribute("data-theme-anim")},400);}root.dataset.theme=next;try{localStorage.setItem("aocentimo-theme",next);}catch(x){}});})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-PT"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-theme="dark"
      className={`${archivo.variable} ${grotesk.variable} ${serif.variable} ${spaceMono.variable}`}
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
