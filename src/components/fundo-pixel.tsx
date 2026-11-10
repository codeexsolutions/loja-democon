"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const TEMAS = ["laranja", "branco", "preto"] as const;
const FUNDOS = ["santuario", "cidade", "floresta", "espaco", "deserto"] as const;
let entrada: { tema: string; fundo: string } | undefined;

function escolher(opcoes: readonly string[], chave: string) {
  let anterior: string | null = null;
  try { anterior = localStorage.getItem(chave); } catch {}
  const candidatos = opcoes.filter(opcao => opcao !== anterior);
  const escolha = candidatos[Math.floor(Math.random() * candidatos.length)];
  try { localStorage.setItem(chave, escolha); } catch {}
  return escolha;
}

export function FundoPixel() {
  const naHome = usePathname() === "/";
  const reduzir = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const veu = useTransform(scrollY, [0, 900], [0.12, 0.30]);

  useEffect(() => {
    // Cor da interface e cenário são escolhas independentes, uma vez por entrada.
    entrada ??= { tema: escolher(TEMAS, "democon-ultimo-tema"), fundo: escolher(FUNDOS, "democon-ultimo-fundo") };
    document.documentElement.dataset.dmcTema = entrada.tema;
    document.documentElement.dataset.dmcFundo = entrada.fundo;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#08070c");
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach(icon => {
      icon.href = "/marca/icon-" + entrada!.tema + ".svg";
      icon.type = "image/svg+xml";
    });
  }, []);

  useEffect(() => {
    if (reduzir || !host.current) return;
    let desmontar: (() => void) | undefined;
    const iniciar = () => {
      if (!desmontar && host.current && window.democonThree) desmontar = window.democonThree.mount(host.current);
    };
    window.addEventListener("democon:three-ready", iniciar);
    if (window.democonThree) iniciar();
    else if (!document.querySelector('script[data-democon-three]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/scripts/fundo-cenario.mjs";
      script.dataset.democonThree = "true";
      document.head.appendChild(script);
    }
    return () => { window.removeEventListener("democon:three-ready", iniciar); desmontar?.(); };
  }, [reduzir]);

  return (
    <div aria-hidden className="fundo-interativo fixed inset-0 -z-10 overflow-hidden bg-noite">
      <div className="fundo-cena fundo-fallback absolute inset-0" />
      <div ref={host} className="fundo-three absolute inset-0" />
      <motion.div className="absolute inset-0 bg-noite" style={{ opacity: naHome ? veu : 0.38 }} />
      <div className="fundo-vinheta absolute inset-0" />
    </div>
  );
}

declare global {
  interface Window {
    democonThree?: { mount(host: HTMLElement): () => void };
  }
}