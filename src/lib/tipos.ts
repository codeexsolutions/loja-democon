export type LojaInfo = {
  slug: string;
  nome: string;
  whatsapp: string | null;
};

export type Variacao = {
  id: string;
  tamanho: string;
  cor: string;
  estoque: number;
};

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  preco: number;
  imagem_url: string | null;
  tags: string[];
  destaque: boolean;
  variacoes: Variacao[];
};

export type Banner = {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  imagem_url: string;
  link: string | null;
};

export type ItemCarrinho = {
  variacaoId: string;
  produtoId: string;
  nome: string;
  tamanho: string;
  cor: string;
  preco: number;
  qtd: number;
  imagem: string | null;
  tags: string[];
  categoria: string | null;
};

export const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
