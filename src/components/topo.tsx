"use client";

import Link from "next/link";
import { Marca } from "./marca";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Search, ShoppingBag } from "lucide-react";
import { useCarrinho } from "@/lib/carrinho";
import { useLoja } from "@/lib/loja";

const LINKS = [
  { href: "/", rotulo: "Início" },
  { href: "/catalogo", rotulo: "Catálogo" },
  { href: "/#para-voce", rotulo: "Produtos" },
  { href: "/catalogo?ordem=menor", rotulo: "Ofertas" },
];

// Navbar fixa: alta e transparente no topo; ao rolar, colapsa numa barra fina e sólida.
export function Topo() {
  return <Suspense fallback={<div className="fixed inset-x-0 top-0 z-40 h-[60px] bg-noite/95" />}><TopoConteudo /></Suspense>;
}

function TopoConteudo() {
  const { quantidade, setAberto } = useCarrinho();
  const { nome } = useLoja();
  const pathname = usePathname();
  const search = useSearchParams();
  const { scrollY } = useScroll();
  const [rolou, setRolou] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setRolou(y > 40));
  // No catálogo a página não rola (só a grade), então a barra fica sempre fina.
  const colapsada = rolou || pathname.startsWith("/catalogo");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${
        colapsada ? "vidro-barra border-white/[0.14]" : "border-transparent bg-transparent"
      }`}
    >
      <motion.div
        initial={false}
        animate={{ height: colapsada ? 60 : 84 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="flex w-full items-center gap-6 px-4 sm:px-8 lg:px-12"
      >
        <Link href="/" className="shrink-0" aria-label={`${nome}, início`}><Marca nome={nome} compacta={pathname !== "/" || rolou} /></Link>

        <LayoutGroup id="navegacao-loja">
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const ofertas = search.get("ordem") === "menor";
            const ativo = l.href === "/" ? pathname === "/"
              : l.href === "/catalogo?ordem=menor" ? pathname === "/catalogo" && ofertas
              : l.href === "/catalogo" && ((pathname === "/catalogo" && !ofertas) || pathname.startsWith("/produto"));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={ativo ? "page" : undefined}
                className={`relative isolate rounded-full px-4 py-2 text-sm transition-colors ${
                  ativo ? "text-texto" : "text-suave hover:text-texto"
                }`}
              >
                {ativo && <motion.span layoutId="aba-ativa" className="pointer-events-none absolute inset-0 -z-10 rounded-full border border-white/10 bg-white/10" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                {l.rotulo}
              </Link>
            );
          })}
        </nav>
        </LayoutGroup>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            href="/catalogo"
            aria-label="Buscar no catálogo"
            className="rounded-full p-2.5 text-suave hover:bg-white/10 hover:text-texto"
          >
            <Search size={20} />
          </Link>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
            onClick={() => setAberto(true)}
            className="relative rounded-full p-2.5 text-texto hover:bg-white/10"
            aria-label={`Abrir carrinho, ${quantidade} ${quantidade === 1 ? "item" : "itens"}`}
          >
            <ShoppingBag size={21} />
            <AnimatePresence mode="popLayout">
            {quantidade > 0 && (
              <motion.span key={quantidade} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-lima px-1 text-[11px] text-noite">
                {quantidade}
              </motion.span>
            )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </header>
  );
}
