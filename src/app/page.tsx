import { buscarVitrine } from "@/lib/servidor";
import { Vinheta } from "@/components/vinheta";
import { Lookbook } from "@/components/lookbook";
import { universoDe } from "@/lib/universos";
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

  // Produtos com ensaio fotográfico ganham um capítulo no lookbook.
  // Um capítulo por coleção: o primeiro produto de cada universo.
  const vistos = new Set<string>();
  const comEnsaio = ordenados.flatMap((p) => {
    const universo = universoDe(p);
    if (!universo || vistos.has(universo.chave)) return [];
    vistos.add(universo.chave);
    return [{ produto: p, universo }];
  });

  return (
    <main>
      <Vinheta produtos={ordenados.slice(0, 8)} />
      <DivisoriaPixel />
      {comEnsaio.length > 0 && (
        <section id="lookbook" className="w-full scroll-mt-20 px-4 py-14 sm:px-8 lg:px-12">
          <Lookbook itens={comEnsaio} />
        </section>
      )}
      {comEnsaio.length > 0 && <DivisoriaPixel />}
      <ParaVoce destaques={ordenados} />
    </main>
  );
}