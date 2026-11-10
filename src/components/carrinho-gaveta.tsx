"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCarrinho } from "@/lib/carrinho";
import { coresDaColecao } from "@/lib/catalogo";
import { useLoja } from "@/lib/loja";
import { registrar } from "@/lib/perfil";
import { brl } from "@/lib/tipos";

export function CarrinhoGaveta() {
  const { itens, aberto, setAberto, mudarQtd, limpar, total, quantidade } = useCarrinho();
  const loja = useLoja();
  const whatsapp = (loja.whatsapp ?? "").replace(/\D/g, "");
  const [nome, setNome] = useState("");
  const [obs, setObs] = useState("");

  // Esc fecha; a página de trás não rola com o carrinho aberto.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", aoTeclar);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = antes;
    };
  }, [aberto, setAberto]);

  function finalizar() {
    // Código curto para a equipe localizar o pedido na conversa.
    const codigo = Math.random().toString(36).slice(2, 7).toUpperCase();
    const linhas = itens.map((i) => `• ${i.qtd}x ${i.nome} (${i.tamanho}, ${i.cor}) - ${brl(i.preco * i.qtd)}`);
    const texto = [
      `Olá! Quero fazer um pedido na ${loja.nome}:`,
      "",
      ...linhas,
      "",
      `Total: ${brl(total)}`,
      nome.trim() ? `Nome: ${nome.trim()}` : "",
      obs.trim() ? `Observações: ${obs.trim()}` : "",
      "",
      `Pedido site #${codigo}`,
    ]
      .filter((l, idx, arr) => !(l === "" && arr[idx - 1] === ""))
      .join("\n");

    for (const i of itens) registrar("finalizou", { id: i.produtoId, tags: i.tags, categoria: i.categoria });
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          key="fundo"
          className="fixed inset-0 z-50 flex justify-end bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAberto(false)}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho"
            className="flex h-full w-full max-w-md flex-col border-l border-white/[0.07] bg-painel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="titulo text-2xl leading-none">Carrinho</h2>
                <span className="text-xs text-suave">
                  {quantidade} {quantidade === 1 ? "item" : "itens"}
                </span>
              </div>
              <button aria-label="Fechar carrinho" onClick={() => setAberto(false)} className="rounded-full p-2 hover:bg-white/10">
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {itens.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <ShoppingBag size={40} className="text-suave" />
                  <p className="titulo text-xl">Seu carrinho está vazio</p>
                  <p className="text-sm text-suave">Escolha uma peça e ela aparece aqui.</p>
                  <Link href="/catalogo" onClick={() => setAberto(false)} className="btn mt-2">
                    Ver catálogo
                  </Link>
                </div>
              )}
              <AnimatePresence initial={false}>
                {itens.map((i) => {
                  const [c1, c2] = coresDaColecao(i.categoria);
                  return (
                    <motion.div
                      key={i.variacaoId}
                      layout
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                      className="flex gap-3 rounded-2xl bg-painel-2 p-2"
                    >
                      <div
                        className="foto-produto h-24 w-20 shrink-0 overflow-hidden rounded-xl"
                        style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}
                      >
                        {i.imagem && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.imagem} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col py-1">
                        <Link
                          href={`/produto/${i.produtoId}`}
                          onClick={() => setAberto(false)}
                          className="line-clamp-1 text-sm hover:text-lima"
                        >
                          {i.nome}
                        </Link>
                        <div className="mt-0.5 text-xs text-suave">
                          Tamanho {i.tamanho} · {i.cor}
                        </div>
                        <div className="mt-auto flex items-center gap-1.5">
                          <button
                            className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                            aria-label={`Diminuir ${i.nome}`}
                            onClick={() => mudarQtd(i.variacaoId, i.qtd - 1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-sm">{i.qtd}</span>
                          <button
                            className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                            aria-label={`Aumentar ${i.nome}`}
                            onClick={() => mudarQtd(i.variacaoId, i.qtd + 1)}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            className="ml-auto p-1 text-suave hover:text-vermelho"
                            aria-label={`Remover ${i.nome}`}
                            onClick={() => mudarQtd(i.variacaoId, 0)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <div className="titulo shrink-0 py-1 pr-1 text-sm">{brl(i.preco * i.qtd)}</div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {itens.length > 0 && (
              <footer className="space-y-3 border-t border-white/[0.07] p-5">
                <input
                  className="w-full rounded-xl border border-white/10 bg-painel-2 px-3 py-2.5 text-sm outline-none placeholder:text-cinza focus:border-lima"
                  placeholder="Seu nome (opcional)"
                  aria-label="Seu nome (opcional)"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-painel-2 px-3 py-2.5 text-sm outline-none placeholder:text-cinza focus:border-lima"
                  placeholder="Observações (opcional)"
                  aria-label="Observações (opcional)"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
                <div className="flex items-center justify-between py-1">
                  <span className="text-suave">Total</span>
                  <span className="titulo text-2xl">{brl(total)}</span>
                </div>
                <button
                  onClick={finalizar}
                  disabled={!whatsapp}
                  className="btn w-full"
                  style={{ "--cor": "#25d366" } as React.CSSProperties}
                >
                  Finalizar no WhatsApp
                </button>
                {!whatsapp && (
                  <p className="text-center text-xs text-ambar">Esta loja ainda não configurou o WhatsApp para receber pedidos.</p>
                )}
                <button onClick={limpar} className="w-full text-center text-xs text-suave hover:text-vermelho">
                  Esvaziar carrinho
                </button>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
