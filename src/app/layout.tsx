import type { Metadata } from "next";
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

/** Resolve o tema antes da primeira pintura: localStorage → preferência do SO. */
const themeInit = `(function(){try{var t=localStorage.getItem("bruto-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={`${archivo.variable} ${grotesk.variable} ${serif.variable} ${spaceMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <Ticker />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
