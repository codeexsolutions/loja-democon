"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { recomendar } from "@/lib/api";
import { useCarrinho } from "@/lib/carrinho";
import { usePesos } from "@/lib/perfil";
import type { Produto } from "@/lib/tipos";
import { GradeProdutos } from "./card-produto";

// "Para você": aparece quando o navegador já aprendeu o gosto do visitante; senão mostra os destaques.
export function ParaVoce({ destaques }: { destaques: Produto[] }) {
  const pesos = usePesos();
  const { itens } = useCarrinho();
  const idsCarrinho = useMemo(() => [...new Set(itens.map((i) => i.produtoId))].sort().join(","), [itens]);
  const [recomendados, setRecomendados] = useState<Produto[]>([]);

  useEffect(() => {
    if (Object.keys(pesos).length === 0) return;
    let vivo = true;
    recomendar(pesos, idsCarrinho ? idsCarrinho.split(",") : []).then((lista) => vivo && setRecomendados(lista));
    return () => {
      vivo = false;
    };
  }, [pesos, idsCarrinho]);

  const produtos = recomendados.length ? recomendados : destaques;
  if (produtos.length === 0) return null;
  return (
    // Um bloco único de produtos, sem título, num painel de vidro de ponta a ponta.
    <section id="para-voce" aria-label="Produtos" className="w-full scroll-mt-20 px-4 py-14 sm:px-8 lg:px-12">
      <div>
        <GradeProdutos produtos={produtos.slice(0, 12)} />
        <div className="mt-8 flex justify-center">
          <Link href="/catalogo" className="btn">Ver catálogo completo</Link>
        </div>
      </div>
    </section>
  );
}