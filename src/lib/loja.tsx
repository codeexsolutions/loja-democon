"use client";

import { createContext, useContext } from "react";
import type { LojaInfo } from "./tipos";

// Dados públicos da loja que está sendo acessada (nome, WhatsApp), vindos do servidor.
const Contexto = createContext<LojaInfo>({ slug: "", nome: "Loja", whatsapp: null });

export function LojaProvider({ loja, children }: { loja: LojaInfo; children: React.ReactNode }) {
  return <Contexto.Provider value={loja}>{children}</Contexto.Provider>;
}

export const useLoja = () => useContext(Contexto);
