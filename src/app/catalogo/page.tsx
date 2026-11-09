import type { Metadata } from "next";
import { buscarVitrine } from "@/lib/servidor";
import { Catalogo, type Filtros } from "@/components/catalogo";

export const metadata: Metadata = { title: "Catálogo" };

const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const v = await buscarVitrine();
  if (v.estado !== "ok") return null;
  const sp = await searchParams;

  const iniciais: Filtros = {
    categoria: um(sp.categoria),
    q: um(sp.q).slice(0, 80),
    modelo: um(sp.modelo),
    tamanhos: um(sp.tam).split(",").filter(Boolean),
    ordem: (["relevancia", "menor", "maior", "az"] as const).find((o) => o === um(sp.ordem)) ?? "relevancia",
  };

  return <Catalogo produtos={v.produtos} iniciais={iniciais} />;
}
