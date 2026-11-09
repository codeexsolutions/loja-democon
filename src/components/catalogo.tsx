"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { colecoes, modeloDe, ordenarTamanhos, semAcento } from "@/lib/catalogo";
import { registrar } from "@/lib/perfil";
import type { Produto } from "@/lib/tipos";
import { GradeProdutos } from "./card-produto";

export type Filtros = {
  categoria: string;
  q: string;
  modelo: string;
  tamanhos: string[];
  ordem: "relevancia" | "menor" | "maior" | "az";
};

const ORDENS: { valor: Filtros["ordem"]; rotulo: string }[] = [
  { valor: "relevancia", rotulo: "Destaques" },
  { valor: "menor", rotulo: "Menor preço" },
  { valor: "maior", rotulo: "Maior preço" },
  { valor: "az", rotulo: "A a Z" },
];

function paraUrl(f: Filtros) {
  const p = new URLSearchParams();
  if (f.categoria) p.set("categoria", f.categoria);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.modelo) p.set("modelo", f.modelo);
  if (f.tamanhos.length) p.set("tam", f.tamanhos.join(","));
  if (f.ordem !== "relevancia") p.set("ordem", f.ordem);
  const s = p.toString();
  return s ? `/catalogo?${s}` : "/catalogo";
}

export function Catalogo({ produtos, iniciais }: { produtos: Produto[]; iniciais: Filtros }) {
  const router = useRouter();
  const reduzir = useReducedMotion();
  const [f, setF] = useState<Filtros>(iniciais);
  const [painelAberto, setPainelAberto] = useState(false);
  const primeira = useRef(true);
  const iniciaisChave = JSON.stringify(iniciais);

  // Links de navega??o (como Ofertas) tamb?m atualizam um cat?logo j? aberto.
  useEffect(() => {
    setF(atual => JSON.stringify(atual) === iniciaisChave ? atual : JSON.parse(iniciaisChave) as Filtros);
  }, [iniciaisChave]);

  // Mantém os filtros no endereço (link compartilhável), sem rolar a página.
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const t = setTimeout(() => router.replace(paraUrl(f), { scroll: false }), 250);
    return () => clearTimeout(t);
  }, [f, router]);

  const listaColecoes = useMemo(() => colecoes(produtos), [produtos]);
  const modelos = useMemo(
    () => [...new Set(produtos.map(modeloDe).filter((m): m is NonNullable<typeof m> => !!m))],
    [produtos],
  );
  const tamanhos = useMemo(() => ordenarTamanhos(produtos.flatMap((p) => p.variacoes.map((v) => v.tamanho))), [produtos]);

  const resultado = useMemo(() => {
    const termo = semAcento(f.q.trim());
    const lista = produtos.filter((p) => {
      if (f.categoria && p.categoria !== f.categoria) return false;
      if (f.modelo && modeloDe(p) !== f.modelo) return false;
      if (f.tamanhos.length && !p.variacoes.some((v) => f.tamanhos.includes(v.tamanho) && v.estoque > 0)) return false;
      if (termo) {
        const alvo = semAcento([p.nome, p.categoria ?? "", p.descricao ?? "", ...p.tags].join(" "));
        if (!termo.split(/\s+/).every((t) => alvo.includes(t))) return false;
      }
      return true;
    });
    if (f.ordem === "menor") lista.sort((a, b) => a.preco - b.preco);
    if (f.ordem === "maior") lista.sort((a, b) => b.preco - a.preco);
    if (f.ordem === "az") lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return lista;
  }, [produtos, f]);

  const mudar = (parcial: Partial<Filtros>) => setF((atual) => ({ ...atual, ...parcial }));
  const ativos =
    (f.categoria ? 1 : 0) + (f.modelo ? 1 : 0) + f.tamanhos.length + (f.q.trim() ? 1 : 0);
  const limpar = () => setF({ categoria: "", q: "", modelo: "", tamanhos: [], ordem: f.ordem });

  const painel = (
    <div className="space-y-7">
      <Grupo titulo="Coleções">
        <Opcao ativo={!f.categoria} onClick={() => mudar({ categoria: "" })} contagem={produtos.length}>
          Todos
        </Opcao>
        {listaColecoes.map((m) => (
          <Opcao
            key={m.nome}
            ativo={f.categoria === m.nome}
            onClick={() => mudar({ categoria: f.categoria === m.nome ? "" : m.nome })}
            contagem={m.total}
            cor={m.cores[0]}
          >
            {m.nome}
          </Opcao>
        ))}
      </Grupo>

      {modelos.length > 1 && (
        <Grupo titulo="Modelo">
          <div className="flex flex-wrap gap-2">
            {modelos.map((m) => (
              <Chip key={m} ativo={f.modelo === m} onClick={() => mudar({ modelo: f.modelo === m ? "" : m })}>
                {m}
              </Chip>
            ))}
          </div>
        </Grupo>
      )}

      {tamanhos.length > 0 && (
        <Grupo titulo="Tamanho disponível">
          <div className="flex flex-wrap gap-2">
            {tamanhos.map((t) => {
              const ativo = f.tamanhos.includes(t);
              return (
                <Chip
                  key={t}
                  ativo={ativo}
                  quadrado
                  onClick={() => mudar({ tamanhos: ativo ? f.tamanhos.filter((x) => x !== t) : [...f.tamanhos, t] })}
                >
                  {t}
                </Chip>
              );
            })}
          </div>
        </Grupo>
      )}


      {ativos > 0 && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={limpar} className="rotulo text-suave underline-offset-4 hover:text-texto hover:underline">
          Limpar filtros ({ativos})
        </motion.button>
      )}
    </div>
  );

  return (
    // Ocupa exatamente a altura da tela: cabeçalho e filtros fixos, só a grade rola.
    <main className="catalogo-tela flex min-h-svh w-full flex-col px-4 pb-5 pt-[84px] sm:px-8 lg:px-12">
      <div className="catalogo-layout flex min-h-0 flex-1 flex-col">
        <div className="catalogo-cabecalho flex shrink-0 flex-wrap items-end justify-between gap-4 pb-5 pt-2">
          <div>
            <div className="rotulo mb-2 text-lima">Catálogo</div>
            <h1 className="titulo line-clamp-1 text-3xl sm:text-5xl">{f.categoria || "Todas as peças"}</h1>
            <p className="mt-2 text-suave" aria-live="polite">
              {resultado.length} {resultado.length === 1 ? "item encontrado" : "itens encontrados"}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="relative flex-1 sm:w-80 sm:flex-none">
              <span className="sr-only">Buscar</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suave" />
              <input
                type="search"
                value={f.q}
                onChange={(e) => mudar({ q: e.target.value })}
                onBlur={() => f.q.trim().length >= 3 && registrar("busca", undefined, f.q.trim().slice(0, 80))}
                placeholder="Buscar personagem, anime..."
                className="w-full rounded-full border border-white/10 bg-painel py-3 pl-9 pr-4 text-sm outline-none placeholder:text-cinza focus:border-lima"
              />
            </label>
            <label className="sr-only" htmlFor="ordem">
              Ordenar por
            </label>
            <select
              id="ordem"
              value={f.ordem}
              onChange={(e) => mudar({ ordem: e.target.value as Filtros["ordem"] })}
              className="rounded-full border border-white/10 bg-painel px-4 py-3 text-sm outline-none focus:border-lima"
            >
              {ORDENS.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={() => setPainelAberto(true)} className="btn-sec lg:hidden" aria-expanded={painelAberto}>
              <SlidersHorizontal size={16} /> Filtros{ativos > 0 && ` (${ativos})`}
            </motion.button>
          </div>
        </div>

        <div className="catalogo-conteudo grid min-h-0 flex-1 gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="catalogo-sidebar hidden min-h-0 lg:block">
            <div className="catalogo-sidebar-painel cartao p-5">{painel}</div>
          </aside>

          <div className="min-w-0 pb-10 pr-1">
            {resultado.length === 0 ? (
              <div className="cartao">
                <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
                  <h2 className="titulo text-2xl">Nenhum produto encontrado</h2>
                  <p className="text-suave">Tente outra coleção, tamanho ou termo de busca.</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={limpar} className="btn">
                    Limpar filtros
                  </motion.button>
                </div>
              </div>
            ) : (
              <GradeProdutos produtos={resultado} prioridade={4} />
            )}
          </div>
        </div>
      </div>

      {/* Filtros no celular */}
      <AnimatePresence>
      {painelAberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[3px] lg:hidden" onClick={() => setPainelAberto(false)}>
          <motion.div
            initial={{ x: reduzir ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduzir ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 330, damping: 34 }}
            aria-modal="true"
            role="dialog"
            aria-label="Filtros"
            className="vidro flex h-full w-full max-w-sm flex-col border-l-[3px] border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-[3px] border-linha px-5 py-4">
              <span className="titulo text-2xl">Filtros</span>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} aria-label="Fechar filtros" onClick={() => setPainelAberto(false)}>
                <X size={22} />
              </motion.button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{painel}</div>
            <div className="border-t-[3px] border-linha p-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={() => setPainelAberto(false)} className="btn w-full">
                Ver {resultado.length} {resultado.length === 1 ? "item" : "itens"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </main>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="rotulo mb-3 text-[10px] text-suave">{titulo}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Opcao({
  ativo,
  onClick,
  contagem,
  cor,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  contagem: number;
  cor?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={ativo}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
        ativo ? "bg-texto text-noite" : "hover:bg-painel-2"
      }`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cor ?? "var(--color-suave)" }} />
      <span className="flex-1 truncate">{children}</span>
      <span className={`rotulo text-[10px] ${ativo ? "text-noite/70" : "text-suave"}`}>{contagem}</span>
    </motion.button>
  );
}

function Chip({
  ativo,
  onClick,
  quadrado,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  quadrado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-full py-2 text-sm font-medium capitalize transition ${quadrado ? "min-w-11 px-3" : "px-4"} ${
        ativo ? "bg-lima text-noite" : "bg-painel-2 text-texto hover:bg-linha"
      }`}
    >
      {children}
    </motion.button>
  );
}
