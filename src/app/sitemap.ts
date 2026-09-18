import type { MetadataRoute } from "next";
import { loadFontes, loadDerivado } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { GLOSSARIO } from "@/content/glossario";

export const dynamic = "force-static";

/**
 * lastModified honesto: a data da última recolha das fontes que alimentam
 * a rota (o HTML só muda quando os dados mudam). Páginas puramente
 * editoriais — sem data real — omit o campo em vez de new Date().
 */
function ultimaRecolha(ids: string[]): Date | undefined {
  const fontes = loadFontes();
  const datas = ids
    .map((id) => fontes.find((f) => f.id === id)?.recolhidoEm)
    .filter((d): d is string => !!d)
    .sort();
  return datas.length ? new Date(datas[datas.length - 1]) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const fontes = loadFontes();
  const hicp = fontes.filter((f) => f.id.startsWith("hicp-pt-")).map((f) => f.id);
  const pmd = fontes.filter((f) => f.id.startsWith("pmd-")).map((f) => f.id);
  const euribor = fontes
    .filter((f) => f.id.startsWith("euribor-"))
    .map((f) => f.id);
  const taeg = fontes.filter((f) => f.id.startsWith("taeg-")).map((f) => f.id);

  const caBase = loadDerivado<{ meta?: { recolhidoEm?: string } }>("ca-base");
  const caBaseEm = caBase?.meta?.recolhidoEm;

  const rotas: { path: string; ids?: string[]; extra?: string[] }[] = [
    {
      path: "",
      ids: ["hicp-pt-cp00", "hicp-pt-cp01", "euribor-3m-mensal", "fiscal-smn", "fiscal-ca", ...pmd],
    },
    { path: "/salario", ids: ["fiscal-irs-2026", "fiscal-ss"] },
    { path: "/impostos", ids: ["fiscal-iva", "fiscal-isp"] },
    { path: "/inflacao", ids: hicp },
    { path: "/credito", ids: ["euribor-3m-mensal"] },
    { path: "/casa", ids: ["euribor-3m-mensal", "fiscal-imt-2026"] },
    {
      path: "/irs",
      ids: ["fiscal-irs-2026", "fiscal-retencao-2026", "fiscal-irs-jovem", "fiscal-deducoes-2026"],
    },
    { path: "/trabalho", ids: ["fiscal-desemprego", "fiscal-catb"] },
    {
      path: "/poupanca",
      ids: ["fiscal-ca", "fiscal-capitais", "fiscal-ppr", "fiscal-mais-valias"],
      extra: caBaseEm ? [caBaseEm] : [],
    },
    { path: "/precos", ids: [...pmd, "fiscal-isp", "fiscal-iva"] },
    {
      path: "/dados",
      ids: [...euribor, ...taeg, "fiscal-usura-2026", "fiscal-calendario-2026"],
      extra: caBaseEm ? [caBaseEm] : [],
    },
    // editoriais — sem data honesta, omitem lastModified
    { path: "/aprender" },
    // termos do glossário — derivados do conteúdo, nunca escritos à mão
    ...GLOSSARIO.map((t) => ({ path: `/aprender/${t.slug}` })),
    { path: "/metodologia" },
    { path: "/estilo" },
    { path: "/sobre" },
  ];

  return rotas.map((r) => {
    const data = ultimaRecolha(r.ids ?? []);
    const datas = [data?.toISOString(), ...(r.extra ?? [])]
      .filter((d): d is string => !!d)
      .sort();
    const lastModified = datas.length
      ? new Date(datas[datas.length - 1])
      : undefined;
    return {
      url: `${base}${r.path}`,
      ...(lastModified ? { lastModified } : {}),
    };
  });
}
