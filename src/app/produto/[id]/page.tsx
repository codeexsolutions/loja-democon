import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarVitrine } from "@/lib/servidor";
import { linkCatalogo } from "@/lib/catalogo";
import { ProdutoDetalhe } from "@/components/produto-detalhe";

async function acharProduto(id: string) {
  const v = await buscarVitrine();
  if (v.estado !== "ok") return null;
  const produto = v.produtos.find((p) => p.id === id);
  return produto ? { produto, todos: v.produtos } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await acharProduto((await params).id);
  if (!r) return { title: "Item não encontrado" };
  return {
    title: r.produto.nome,
    description: r.produto.descricao ?? undefined,
    openGraph: r.produto.imagem_url ? { images: [r.produto.imagem_url] } : undefined,
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const r = await acharProduto((await params).id);
  if (!r) notFound();
  const { produto, todos } = r;
  const relacionados = todos.filter(p => p.id !== produto.id).sort((a, b) => Number(b.categoria === produto.categoria) - Number(a.categoria === produto.categoria)).slice(0, 6);

  return (
    <main className="pagina-produto w-full">
      <nav aria-label="Trilha" className="produto-trilha rotulo flex items-center gap-2 px-4 text-[10px] text-suave sm:px-8 lg:px-12">
        <Link href="/" className="hover:text-texto">Início</Link>
        <span>›</span>
        <Link href="/catalogo" className="hover:text-texto">Catálogo</Link>
        {produto.categoria && (
          <>
            <span>›</span>
            <Link href={linkCatalogo(produto.categoria)} className="hover:text-texto">
              {produto.categoria}
            </Link>
          </>
        )}
      </nav>

      <ProdutoDetalhe produto={produto} relacionados={relacionados} />

    </main>
  );
}
