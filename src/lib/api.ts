import type { Produto } from "./tipos";

// Chamadas feitas no navegador. Vão para /api/... deste mesmo site, que repassa
// para a API do SaaS já com a loja certa (descoberta pelo endereço acessado).

export async function recomendar(pesos: Record<string, number>, excluir: string[]): Promise<Produto[]> {
  try {
    const r = await fetch("/api/recomendacoes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pesos, excluir: excluir.slice(0, 50) }),
    });
    return r.ok ? ((await r.json()).produtos as Produto[]) : [];
  } catch {
    return [];
  }
}

export async function parecidosDe(id: string): Promise<Produto[]> {
  try {
    const r = await fetch(`/api/produtos/${id}/parecidos`);
    return r.ok ? ((await r.json()).produtos as Produto[]) : [];
  } catch {
    return [];
  }
}

export function enviarEvento(evento: {
  visitor_id: string;
  tipo: "ver" | "carrinho" | "finalizou" | "busca";
  produto_id?: string;
  termo?: string;
}) {
  // Falha aqui nunca pode atrapalhar a compra.
  void fetch("/api/eventos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(evento),
    keepalive: true,
  }).catch(() => {});
}
