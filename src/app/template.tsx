"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

// A chave acompanha tamb?m a troca entre produtos. S? a p?gina anima;
// cabe?alho, carrinho e sess?o permanecem no layout persistente.
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduzir = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: reduzir ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduzir ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
