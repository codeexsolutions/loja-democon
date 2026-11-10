import type { CSSProperties } from "react";
import { semAcento } from "./catalogo";

// Identidade visual de cada coleção desta vitrine: cor, fonte do título, kanji e as fotos
// do ensaio (pasta public/colecoes/<chave>). É design do site, não dado da API: um produto
// é ligado ao universo pelas etiquetas, categoria ou nome que o lojista cadastrou.

export type Fotos = { banner: string; bannerMobile: string; cena: string; retrato: string; frente: string; costas: string; casal: string; look: string };

export type Universo = {
  chave: string;
  nome: string;
  cor: string; // destaque (botões, rótulos)
  tinta: string; // texto sobre a cor de destaque
  fundo: string; // cor da noite da cena, para degradês
  fonte: "hq" | "gotica";
  kanji: string; // peito da camisa
  kanjiCostas: string;
  traducao: string;
  frase: string;
  detalhes: string[];
  fotos: Fotos;
};

const fotos = (chave: string): Fotos => {
  const f = (n: string) => `/colecoes/${chave}/${n}.jpg`;
  return { banner: f("banner"), bannerMobile: f("banner-mobile"), cena: f("cena"), retrato: f("retrato"), frente: f("frente"), costas: f("costas"), casal: f("casal"), look: f("look") };
};

export const UNIVERSOS: Universo[] = [
  {
    chave: "naruto",
    nome: "Naruto",
    cor: "#ff7a1a",
    tinta: "#1a0a00",
    fundo: "#1c0904",
    fonte: "hq",
    kanji: "忍者",
    kanjiCostas: "九尾",
    traducao: "Ninja · Nove caudas",
    frase: "Do pôr do sol de Konoha direto pro seu guarda-roupa.",
    detalhes: ["Naruto com Rasengan na frente", "Kyuubi de nove caudas nas costas", "Kanji 忍 nas duas mangas"],
    fotos: fotos("naruto"),
  },
  {
    chave: "one-piece",
    nome: "One Piece",
    cor: "#f9c22e",
    tinta: "#141006",
    fundo: "#081224",
    fonte: "hq",
    kanji: "海賊王",
    kanjiCostas: "海賊王",
    traducao: "Rei dos Piratas",
    frase: "Gear 5 desperto: o Deus Sol Nika em traço de mangá.",
    detalhes: ["Luffy Gear 5 socando na frente", "Nika de corpo inteiro no sol das costas", "Número 5 nas duas mangas"],
    fotos: fotos("one-piece"),
  },
  {
    chave: "berserk",
    nome: "Berserk",
    cor: "#e3202b",
    tinta: "#ffffff",
    fundo: "#07070b",
    fonte: "gotica",
    kanji: "狂戦士",
    kanjiCostas: "黒い剣士",
    traducao: "Guerreiro furioso",
    frase: "Tipografia black metal e o Espadachim Negro nas costas.",
    detalhes: ["Logo black metal com chamas", "Guts e a Dragonslayer nas costas", "Número 07 nas duas mangas"],
    fotos: fotos("berserk"),
  },
];

const CHAVES: [string, string][] = [
  ["naruto", "naruto"],
  ["one piece", "one-piece"],
  ["luffy", "one-piece"],
  ["berserk", "berserk"],
];

// Universo de um produto ou banner, procurando nas etiquetas, categoria, título e nome.
export function universoDe(alvo: { tags?: string[]; categoria?: string | null; nome?: string | null; titulo?: string | null }): Universo | null {
  const texto = semAcento([...(alvo.tags ?? []), alvo.categoria, alvo.nome, alvo.titulo].filter(Boolean).join(" "));
  const achado = CHAVES.find(([termo]) => texto.includes(termo));
  return achado ? UNIVERSOS.find((u) => u.chave === achado[1]) ?? null : null;
}

// Fotos do produto para a galeria: as do ensaio quando houver, senão só a foto cadastrada.
export function galeriaDe(p: { imagem_url: string | null }, u: Universo | null): { src: string; rotulo: string }[] {
  if (!u) return p.imagem_url ? [{ src: p.imagem_url, rotulo: "Foto" }] : [];
  return [
    { src: u.fotos.frente, rotulo: "Frente" },
    { src: u.fotos.costas, rotulo: "Costas" },
    { src: u.fotos.retrato, rotulo: "Cena" },
    { src: u.fotos.look, rotulo: "Look" },
    { src: u.fotos.casal, rotulo: "Ele & ela" },
  ];
}

// Variáveis CSS para pintar um trecho da página com as cores do universo.
export function estiloUniverso(u: Universo | null): CSSProperties | undefined {
  if (!u) return undefined;
  return {
    "--color-lima": u.cor,
    "--dmc-botao": u.cor,
    "--dmc-botao-texto": u.tinta,
    "--u-cor": u.cor,
    "--u-tinta": u.tinta,
    "--u-fundo": u.fundo,
  } as CSSProperties;
}
