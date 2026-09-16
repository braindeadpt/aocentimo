import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bruto.pt";
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
    "/aprender",
    "/metodologia",
    "/sobre",
  ];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
