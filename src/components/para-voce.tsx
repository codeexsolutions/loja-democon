"use client";

import { useEffect, useMemo, useState } from "react";
import { recomendar } from "@/lib/api";
import { useCarrinho } from "@/lib/carrinho";
import { usePesos } from "@/lib/perfil";
import type { Produto } from "@/lib/tipos";
import { GradeProdutos } from "./card-produto";
import { Secao } from "./secao";

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
    <Secao id="para-voce" titulo="Para você" link={{ href: "/catalogo", texto: "Ver tudo" }}>
      <GradeProdutos produtos={produtos.slice(0, 12)} />
    </Secao>
  );
}