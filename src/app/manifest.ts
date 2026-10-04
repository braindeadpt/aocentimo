import type { MetadataRoute } from "next";
import { m } from "@/lib/messages";

export const dynamic = "force-static";

/**
 * O manifest da casa (P4 · SEO). Faltava: o site já tinha
 * `apple-icon.png`, `icon.svg` e `icon-512.png`, mas nada que dissesse
 * a um telemóvel como instalar o site nem com que cor abrir.
 *
 * O ícone de 512 px é o mesmo ficheiro que já vivia em `public/` — não
 * se cria um segundo desenho do mesmo azulejo, que depois divergem. E
 * o `og-bairro.png` NÃO entra como ícone: é o cartão de partilha, e
 * declará-lo instalável seria um mapa cortado num quadrado. O único
 * `maskable` é o símbolo, que aguenta ser cortado.
 *
 * O `start_url` e o `scope` são relativos de propósito: um caminho
 * absoluto partiria a instalação no dia em que o domínio mudar, e o
 * domínio vive num sítio só (`src/lib/site.ts` + `public/CNAME`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${m.brand.name} — ${m.brand.kicker}`,
    short_name: m.brand.name,
    description: m.meta.description,
    lang: "pt-PT",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // o papel do bairro no tema claro e a tinta da barra no escuro
    background_color: "#f2f1ea",
    theme_color: "#0d0b08",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}