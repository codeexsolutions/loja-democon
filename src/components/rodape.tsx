"use client";

import Link from "next/link";
import { Marca } from "./marca";
import { usePathname } from "next/navigation";
import { useLoja } from "@/lib/loja";

export function Rodape() {
  const { nome, whatsapp } = useLoja();
  // O catálogo ocupa a tela inteira (100vh); lá não há rodapé.
  if (usePathname().startsWith("/catalogo")) return null;
  return (
    <footer className="mt-16 w-full border-t border-white/[0.07] px-4 pb-10 pt-12 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-suave">
        <Link href="/" aria-label={nome + ", início"}><Marca nome={nome} animada={false} /></Link>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-5">
          <Link href="/catalogo" className="hover:text-texto">
            Catálogo
          </Link>
          <Link href="/#para-voce" className="hover:text-texto">
            Produtos
          </Link>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="hover:text-texto">
              WhatsApp
            </a>
          )}
        </nav>
        <span>
          © {new Date().getFullYear()} {nome}
        </span>
      </div>
    </footer>
  );
}
