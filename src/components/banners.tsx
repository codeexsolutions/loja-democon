"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Banner } from "@/lib/tipos";

// Banners cadastrados no painel, de ponta a ponta. Texto à esquerda, imagem à direita em vinheta.
export function Banners({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 7000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const atual = banners[i % banners.length];

  const conteudo = (
    <div className="grid h-full items-center gap-6 px-4 sm:px-8 md:grid-cols-2 lg:px-12">
      <div className="space-y-3 py-10">
        {atual.titulo && <h2 className="titulo text-4xl sm:text-5xl">{atual.titulo}</h2>}
        {atual.subtitulo && <p className="max-w-md text-lg text-suave">{atual.subtitulo}</p>}
        {atual.link && <span className="btn mt-3 w-fit">Ver coleção</span>}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={atual.imagem_url} alt="" className="mx-auto hidden aspect-[16/10] h-[38svh] w-auto rounded-3xl object-cover ring-1 ring-white/10 md:block" />
    </div>
  );

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques da loja" className="relative w-full border-y border-white/[0.07] bg-noite/70">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={atual.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="min-h-[46svh]"
        >
          {atual.link ? (
            <Link href={atual.link} className="block h-full" aria-label={atual.titulo ?? "Ver destaque"}>
              {conteudo}
            </Link>
          ) : (
            conteudo
          )}
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-4 flex gap-2 sm:left-8 lg:left-12">
          {banners.map((b, k) => (
            <button
              key={b.id}
              onClick={() => setI(k)}
              aria-label={`Ir para o destaque ${k + 1}`}
              aria-current={k === i % banners.length}
              className={`h-1.5 rounded-full transition-all ${k === i % banners.length ? "w-9 bg-lima" : "w-3 bg-white/25 hover:bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
