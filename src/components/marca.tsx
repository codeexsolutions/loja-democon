"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const LETRAS: Record<string, string[]> = {
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01111"],
  m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  n: ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
};

function LetrasPixel({ texto, className }: { texto: string; className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox={"0 0 " + (texto.length * 6 - 1) + " 7"} fill="currentColor" shapeRendering="crispEdges">
      {[...texto].flatMap((letra, i) => LETRAS[letra].flatMap((linha, y) => [...linha].map((pixel, x) => pixel === "1" ? (
        <rect key={i + "-" + x + "-" + y} className="marca-pixel" x={i * 6 + x} y={y} width="1" height="1" style={{ "--pixel-atraso": ((i * 6 + x) * 0.014 + y * 0.018) + "s" } as CSSProperties} />
      ) : null)))}
    </svg>
  );
}

export function Marca({ nome, animada = true, compacta = false }: { nome: string; animada?: boolean; compacta?: boolean }) {
  const reduzir = useReducedMotion();
  if (nome.toLowerCase() !== "democon") return <span className="titulo text-xl">{nome}</span>;
  return (
    <motion.span className={"marca-democon marca-unica" + (animada ? " marca-democon-animada" : "")} initial={false} animate={{ width: compacta ? 72 : 144 }} transition={{ duration: reduzir ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={compacta ? "dmc" : "democon"} aria-hidden="true" className="marca-troca" initial={{ opacity: reduzir ? 1 : 0, y: reduzir ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduzir ? 0 : 6 }} transition={{ duration: reduzir ? 0 : 0.16 }}>
          {compacta ? <span className="marca-emblema"><LetrasPixel texto="DMC" className="marca-sigla" /><span className="marca-centelha" /></span> : <LetrasPixel texto="DemoCon" className="marca-nome" />}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">DemoCon</span>
    </motion.span>
  );
}