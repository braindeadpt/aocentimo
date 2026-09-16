import type { Metadata } from "next";
import { Archivo, Source_Serif_4, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className={`${archivo.variable} ${serif.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
