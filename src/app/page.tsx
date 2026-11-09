import { buscarVitrine } from "@/lib/servidor";
import { Vinheta } from "@/components/vinheta";
import { ParaVoce } from "@/components/para-voce";
import { DivisoriaPixel } from "@/components/divisoria-pixel";

export default async function Home() {
  const v = await buscarVitrine();
  if (v.estado !== "ok") return null;
  const { loja, produtos } = v;
  const destaques = produtos.filter(p => p.destaque);
  const ordenados = [...destaques, ...produtos.filter(p => !p.destaque)];

  if (produtos.length === 0) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="titulo text-4xl">{loja.nome}</h1>
        <p className="text-suave">Novos produtos chegam em breve. Volte logo!</p>
      </main>
    );
  }

  return (
    <main>
      <Vinheta produtos={ordenados.slice(0, 8)} />
      <DivisoriaPixel />
      <ParaVoce destaques={ordenados} />
    </main>
  );
}