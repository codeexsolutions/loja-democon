"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { assinarArmazenamento, gravarBruto, lerBruto } from "./armazenamento";
import type { ItemCarrinho } from "./tipos";

const CHAVE = "loja:carrinho:v1";

type Ctx = {
  itens: ItemCarrinho[];
  aberto: boolean;
  setAberto: (v: boolean) => void;
  adicionar: (item: Omit<ItemCarrinho, "qtd">, max: number) => void;
  mudarQtd: (variacaoId: string, qtd: number) => void;
  limpar: () => void;
  total: number;
  quantidade: number;
};

const CarrinhoCtx = createContext<Ctx | null>(null);

function converter(bruto: string | null): ItemCarrinho[] {
  try {
    return bruto ? (JSON.parse(bruto) as ItemCarrinho[]) : [];
  } catch {
    return [];
  }
}

// Sempre parte do que está guardado agora, para nunca trabalhar com cópia velha.
const atual = () => converter(lerBruto(CHAVE));
const gravar = (itens: ItemCarrinho[]) => gravarBruto(CHAVE, JSON.stringify(itens));

function adicionar(item: Omit<ItemCarrinho, "qtd">, max: number) {
  const itens = atual();
  const existente = itens.find((i) => i.variacaoId === item.variacaoId);
  gravar(
    existente
      ? itens.map((i) => (i.variacaoId === item.variacaoId ? { ...i, qtd: Math.min(i.qtd + 1, max) } : i))
      : [...itens, { ...item, qtd: 1 }],
  );
}

function mudarQtd(variacaoId: string, qtd: number) {
  const itens = atual();
  gravar(
    qtd <= 0
      ? itens.filter((i) => i.variacaoId !== variacaoId)
      : itens.map((i) => (i.variacaoId === variacaoId ? { ...i, qtd } : i)),
  );
}

const limpar = () => gravar([]);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  // No servidor o carrinho é vazio; no navegador vem do localStorage, sem diferença na hidratação.
  const bruto = useSyncExternalStore(assinarArmazenamento, () => lerBruto(CHAVE), () => null);
  const itens = useMemo(() => converter(bruto), [bruto]);

  const valor = useMemo<Ctx>(
    () => ({
      itens,
      aberto,
      setAberto,
      adicionar,
      mudarQtd,
      limpar,
      total: itens.reduce((s, i) => s + i.preco * i.qtd, 0),
      quantidade: itens.reduce((s, i) => s + i.qtd, 0),
    }),
    [itens, aberto],
  );

  return <CarrinhoCtx.Provider value={valor}>{children}</CarrinhoCtx.Provider>;
}

export function useCarrinho() {
  const c = useContext(CarrinhoCtx);
  if (!c) throw new Error("useCarrinho fora do CarrinhoProvider");
  return c;
}
