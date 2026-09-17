import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Archivo, Source_Serif_4, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Ticker } from "@/components/Ticker";

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
  variable: "--font-serif",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bruto.pt"),
  title: {
    default: "BRUTO — literacia financeira para Portugal",
    template: "%s · BRUTO",
  },
  description:
    "Simuladores e dados de literacia financeira para Portugal — salário líquido, IRS, crédito habitação, poupança e inflação. Cada número com fonte e data.",
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
};

/** Resolve o tema antes da primeira pintura: localStorage → preferência do SO.
 *  E liga o toggle por delegação de eventos em vanilla JS — funciona mesmo
 *  numa página que nunca hidratou (React morto, cache velha). O React só
 *  sincroniza o rótulo do botão via MutationObserver no data-theme. */
const themeInit = `(function(){try{var r=document.documentElement;var t=localStorage.getItem("bruto-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";r.dataset.theme=t;}catch(e){}
document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("[data-theme-toggle]"):null;if(!b)return;var root=document.documentElement;var next=root.dataset.theme==="dark"?"light":"dark";if(!matchMedia("(prefers-reduced-motion: reduce)").matches){root.setAttribute("data-theme-anim","");setTimeout(function(){root.removeAttribute("data-theme-anim")},400);}root.dataset.theme=next;try{localStorage.setItem("bruto-theme",next);}catch(x){}});})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${grotesk.variable} ${serif.variable} ${spaceMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <Ticker />
        <main className="flex-1">
          {/* cross-fade de página nas navegações — nav é lateral,
              sem deslizes direcionais falsos */}
          <ViewTransition>{children}</ViewTransition>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
