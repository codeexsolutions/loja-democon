import { useMemo, useSyncExternalStore } from "react";
import { enviarEvento } from "./api";
import { assinarArmazenamento, gravarBruto, lerBruto } from "./armazenamento";
import type { Produto } from "./tipos";

// "Cache" de gosto do visitante: um id anônimo e pesos por etiqueta de estilo e categoria,
// guardados no navegador. Não há cadastro nem dado pessoal. Quem transforma esses pesos em
// recomendações é a loja-api.
const CHAVE = "loja:perfil:v1";

export type Perfil = { visitor: string; pesos: Record<string, number> };
export type TipoEvento = "ver" | "carrinho" | "finalizou" | "busca";
type Alvo = Pick<Produto, "id" | "tags" | "categoria">;

const PESO_EVENTO: Record<TipoEvento, number> = { ver: 1, carrinho: 3, finalizou: 5, busca: 1 };

function converter(bruto: string | null): Perfil | null {
  try {
    const p = bruto ? (JSON.parse(bruto) as Perfil) : null;
    return p?.visitor && p.pesos ? p : null;
  } catch {
    return null;
  }
}

function lerPerfil(): Perfil {
  const existente = converter(lerBruto(CHAVE));
  if (existente) return existente;
  const novo: Perfil = { visitor: crypto.randomUUID(), pesos: {} };
  gravarBruto(CHAVE, JSON.stringify(novo));
  return novo;
}

// Registra o que o visitante fez: atualiza o gosto guardado no navegador e avisa a loja-api.
export function registrar(tipo: TipoEvento, produto?: Alvo, termo?: string) {
  const p = lerPerfil();
  const peso = PESO_EVENTO[tipo];
  if (produto) {
    for (const tag of produto.tags) p.pesos[`t:${tag}`] = (p.pesos[`t:${tag}`] ?? 0) + peso;
    if (produto.categoria) {
      const k = `c:${produto.categoria.toLowerCase()}`;
      p.pesos[k] = (p.pesos[k] ?? 0) + peso;
    }
  }
  gravarBruto(CHAVE, JSON.stringify(p));
  enviarEvento({ visitor_id: p.visitor, tipo, produto_id: produto?.id, termo });
}

// Pesos de gosto atuais; atualiza sozinho quando o visitante interage (e vazio no servidor).
export function usePesos(): Record<string, number> {
  const bruto = useSyncExternalStore(assinarArmazenamento, () => lerBruto(CHAVE), () => null);
  return useMemo(() => converter(bruto)?.pesos ?? {}, [bruto]);
}
