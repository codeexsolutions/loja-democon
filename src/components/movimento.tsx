"use client";

import { MotionConfig, motion, type Variants } from "framer-motion";

// Curva "em degraus": o movimento anda em quadros, como um sprite de videogame.
export const emDegraus = (quadros: number) => (t: number) => Math.round(t * quadros) / quadros;
export const suave = [0.2, 0.8, 0.2, 1] as const;

// Respeita "reduzir movimento" do sistema em todas as animações do site.
export function Movimento({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 350, damping: 30 }}>{children}</MotionConfig>;
}

// Aparece ao entrar na tela (uma vez).
export function Revelar({
  children,
  atraso = 0,
  className,
}: {
  children: React.ReactNode;
  atraso?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: atraso, ease: suave }}
    >
      {children}
    </motion.div>
  );
}

const pai: Variants = { oculto: {}, visivel: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };
const filho: Variants = {
  oculto: { opacity: 0, y: 24 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.45, ease: emDegraus(5) } },
};

// Entrada em sequência (filhos com <EscalonarItem>).
export function Escalonar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={pai} initial="oculto" animate="visivel">
      {children}
    </motion.div>
  );
}

export function EscalonarItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={filho}>
      {children}
    </motion.div>
  );
}
