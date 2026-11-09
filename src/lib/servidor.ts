import { cache } from "react";
import { headers } from "next/headers";
import type { Banner, LojaInfo, Produto } from "./tipos";

// Endereço da API do SaaS. Só o servidor da vitrine fala com ela; o navegador usa /api/... deste site.
export const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000";

// Cada loja fica em <slug>.<DOMINIO_BASE>  (ex: blusas-da-ana.localhost:3001).
// No domínio "puro" (ou 127.0.0.1) mostra LOJA_PADRAO, se definida.
const DOMINIO_BASE = (process.env.DOMINIO_BASE ?? "localhost").toLowerCase();
const LOJA_PADRAO = process.env.LOJA_PADRAO ?? "";
const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export function slugDoHost(host: string | null): string | null {
  const nome = (host ?? "").toLowerCase().split(":")[0];
  if (nome.endsWith(`.${DOMINIO_BASE}`)) {
    const sub = nome.slice(0, -(DOMINIO_BASE.length + 1));
    return SLUG.test(sub) ? sub : null;
  }
  return LOJA_PADRAO || null;
}

export const slugAtual = cache(async () => slugDoHost((await headers()).get("host")));

export type Vitrine =
  | { estado: "ok"; loja: LojaInfo; banners: Banner[]; produtos: Produto[] }
  | { estado: "sem_loja" }
  | { estado: "erro" };

// Dados da vitrine da loja atual. O Next guarda a resposta por 60s (por loja).
export const buscarVitrine = cache(async (): Promise<Vitrine> => {
  const slug = await slugAtual();
  if (!slug) return { estado: "sem_loja" };
  try {
    const r = await fetch(`${API_URL}/api/vitrine/${slug}`, { next: { revalidate: 60 } });
    if (r.status === 404) return { estado: "sem_loja" };
    if (!r.ok) return { estado: "erro" };
    const j = (await r.json()) as { loja: LojaInfo; banners: Banner[]; produtos: Produto[] };
    return { estado: "ok", ...j };
  } catch {
    return { estado: "erro" };
  }
});
