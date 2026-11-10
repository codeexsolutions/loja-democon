"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { coresDaColecao, estoqueTotal, ordenarTamanhos, seloDe } from "@/lib/catalogo";
import { brl, type Produto } from "@/lib/tipos";
import { suave } from "./movimento";

export function CardProduto({ p, prioridade = false }: { p: Produto; prioridade?: boolean }) {
  const [c1, c2] = coresDaColecao(p.categoria);
  const selo = seloDe(p);
  const esgotado = estoqueTotal(p) === 0;
  const tamanhos = ordenarTamanhos(p.variacoes.map((v) => v.tamanho));
  const comEstoque = new Set(p.variacoes.filter((v) => v.estoque > 0).map((v) => v.tamanho));

  return (
    <Link href={`/produto/${p.id}`} className="group card-produto">
      <div
        className="foto-produto relative aspect-[4/5] overflow-hidden"
        style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}
      >
        {p.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imagem_url}
            alt={p.nome}
            loading={prioridade ? "eager" : "lazy"}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${
              esgotado ? "opacity-60 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-black/20">
            {p.nome.charAt(0)}
          </div>
        )}
        {selo && (
          <span className="selo absolute left-3 top-3 text-noite" style={{ background: selo.cor }}>
            {selo.rotulo}
          </span>
        )}
      </div>

      <div className="card-produto-info space-y-1">
        {p.categoria && (
          <div className="rotulo text-[10px]" style={{ color: c1 }}>
            {p.categoria}
          </div>
        )}
        <h3 className="line-clamp-1 transition group-hover:text-lima">{p.nome}</h3>
        <div className="flex items-center justify-between gap-2">
          <span className="titulo text-lg">{brl(p.preco)}</span>
          {tamanhos.length > 0 && (
            <span
              className="text-xs text-suave"
              aria-label={`Tamanhos com estoque: ${[...comEstoque].join(", ") || "nenhum"}`}
            >
              {tamanhos.map((t, k) => (
                <span key={t} className={comEstoque.has(t) ? "" : "text-cinza/60 line-through"}>
                  {k > 0 && " · "}
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Grade com animação: cards entram ao aparecer na tela e se reorganizam quando o filtro muda.
export function GradeProdutos({ produtos, prioridade = 0 }: { produtos: Produto[]; prioridade?: number }) {
  return (
    <motion.div
      layout
      className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {produtos.map((p, i) => (
          <motion.div
            key={p.id}
            layout="position"
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: (i % 6) * 0.05, ease: suave }}
          >
            <CardProduto p={p} prioridade={i < prioridade} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
