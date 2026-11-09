import type { Produto } from "./tipos";

export const estoqueTotal = (p: Produto) => p.variacoes.reduce((s, v) => s + v.estoque, 0);

// Selo do produto: esgotado, destaque da loja ou últimas unidades.
export type Selo = { rotulo: string; cor: string } | null;
export function seloDe(p: Produto): Selo {
  const total = estoqueTotal(p);
  if (total === 0) return { rotulo: "Esgotado", cor: "var(--color-cinza)" };
  if (p.destaque) return { rotulo: "Destaque", cor: "var(--color-lima)" };
  if (total <= 6) return { rotulo: "Últimas unidades", cor: "var(--color-ambar)" };
  return null;
}

// Cada coleção (categoria) ganha um par de cores de aquarela. Categorias novas, criadas
// pelo lojista no painel, recebem um par fixo calculado a partir do nome.
const PARES: [string, string][] = [
  ["#ffc94d", "#c4ff4d"],
  ["#ff4057", "#8b5cf6"],
  ["#8b5cf6", "#3ee6f0"],
  ["#ff5fa8", "#ffc94d"],
  ["#3ee6f0", "#c4ff4d"],
  ["#c4ff4d", "#ff5fa8"],
];
const CONHECIDAS: Record<string, number> = { shonen: 0, dark: 1, "games & herois": 2, "street tokyo": 3 };

export function coresDaColecao(categoria: string | null): [string, string] {
  const chave = semAcento(categoria ?? "");
  if (chave in CONHECIDAS) return PARES[CONHECIDAS[chave]];
  let h = 0;
  for (const c of chave) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PARES[h % PARES.length];
}

export type Colecao = { nome: string; total: number; capas: string[]; cores: [string, string] };

// Catálogos da loja: um por categoria, com contagem e até 3 fotos de capa.
export function colecoes(produtos: Produto[]): Colecao[] {
  const mapa = new Map<string, Produto[]>();
  for (const p of produtos) {
    if (!p.categoria) continue;
    mapa.set(p.categoria, [...(mapa.get(p.categoria) ?? []), p]);
  }
  return [...mapa.entries()]
    .map(([nome, lista]) => ({
      nome,
      total: lista.length,
      capas: lista.map((p) => p.imagem_url).filter((u): u is string => !!u).slice(0, 3),
      cores: coresDaColecao(nome),
    }))
    .sort((a, b) => b.total - a.total);
}

// Modelos reconhecidos nas etiquetas do produto (ex: "jersey", "oversized").
export const MODELOS = ["jersey", "camiseta", "oversized", "camisa", "moletom", "regata"] as const;
export const modeloDe = (p: Produto) => MODELOS.find((m) => p.tags.includes(m)) ?? null;

const ORDEM_TAMANHOS = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EGG"];
export function ordenarTamanhos(lista: string[]) {
  return [...new Set(lista)].sort((a, b) => {
    const ia = ORDEM_TAMANHOS.indexOf(a.toUpperCase());
    const ib = ORDEM_TAMANHOS.indexOf(b.toUpperCase());
    if (ia === -1 && ib === -1) return a.localeCompare(b, "pt-BR", { numeric: true });
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export const semAcento = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const linkCatalogo = (categoria?: string) =>
  categoria ? `/catalogo?categoria=${encodeURIComponent(categoria)}` : "/catalogo";
