import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://aocentimo.js.org";
  const routes = [
    "",
    "/salario",
    "/impostos",
    "/inflacao",
    "/credito",
    "/casa",
    "/irs",
    "/trabalho",
    "/poupanca",
    "/precos",
    "/dados",
    "/aprender",
    "/metodologia",
    "/sobre",
  ];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
