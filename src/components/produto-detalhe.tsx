"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Plus, ShoppingBag, X, ZoomIn } from "lucide-react";
import { parecidosDe } from "@/lib/api";
import { useCarrinho } from "@/lib/carrinho";
import { coresDaColecao, estoqueTotal, ordenarTamanhos, seloDe } from "@/lib/catalogo";
import { registrar } from "@/lib/perfil";
import { brl, type Produto } from "@/lib/tipos";
import { galeriaDe, universoDe } from "@/lib/universos";
import { GradeProdutos } from "./card-produto";
import { Secao } from "./secao";
import { suave } from "./movimento";

export function ProdutoDetalhe({ produto, relacionados = [] }: { produto: Produto; relacionados?: Produto[] }) {
  const { adicionar, setAberto } = useCarrinho();
  const [c1, c2] = coresDaColecao(produto.categoria);
  const selo = seloDe(produto);
  const esgotado = estoqueTotal(produto) === 0;
  // Fotos do ensaio da coleção (frente, costas, cena...), quando o produto tiver.
  const galeria = useMemo(() => galeriaDe(produto, universoDe(produto)), [produto]);
  const [foto, setFoto] = useState(0);
  const imagem = galeria[foto]?.src ?? produto.imagem_url;

  const cores = useMemo(() => [...new Set(produto.variacoes.map((v) => v.cor))], [produto]);
  const [cor, setCor] = useState(cores[0] ?? "");
  const tamanhos = useMemo(
    () => ordenarTamanhos(produto.variacoes.filter((v) => v.cor === cor).map((v) => v.tamanho)),
    [produto, cor],
  );
  const [tamanho, setTamanho] = useState("");
  const escolhida = produto.variacoes.find((v) => v.cor === cor && v.tamanho === tamanho);
  const [adicionado, setAdicionado] = useState(false);
  const [zoom, setZoom] = useState(false);
  const reduzir = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progresso = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [parecidos, setParecidos] = useState<Produto[]>(relacionados);

  useEffect(() => {
    registrar("ver", produto);
    let vivo = true;
    parecidosDe(produto.id).then((lista) => { if (vivo && lista.length) setParecidos(lista); });
    return () => {
      vivo = false;
    };
  }, [produto]);

  useEffect(() => {
    if (!zoom) return;
    const fechar = (event: KeyboardEvent) => { if (event.key === "Escape") setZoom(false); };
    document.addEventListener("keydown", fechar);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fechar); document.body.style.overflow = anterior; };
  }, [zoom]);
  function adicionarAoCarrinho(abrir: boolean) {
    if (!escolhida || escolhida.estoque <= 0) return;
    adicionar(
      {
        variacaoId: escolhida.id,
        produtoId: produto.id,
        nome: produto.nome,
        tamanho: escolhida.tamanho,
        cor: escolhida.cor,
        preco: produto.preco,
        imagem: produto.imagem_url,
        tags: produto.tags,
        categoria: produto.categoria,
      },
      escolhida.estoque,
    );
    registrar("carrinho", produto);
    if (abrir) setAberto(true);
    else {
      setAdicionado(true);
      setTimeout(() => setAdicionado(false), 1800);
    }
  }

  return (
    <>
      <motion.div aria-hidden="true" className="peca-progresso" style={{ scaleX: reduzir ? scrollYProgress : progresso }} />
      <section className="peca-experiencia" style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}>
        <motion.div className="peca-palco" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {imagem && (
            <div aria-hidden="true" className="peca-fundo-imagem">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagem} alt="" />
            </div>
          )}
          <div aria-hidden="true" className="peca-vidro" />
          <div className="peca-palco-topo">
            <span className="peca-micro"><PixelEstrela /> {produto.categoria || "Seleção da loja"}</span>
            {selo && <span className="peca-etiqueta" style={{ background: selo.cor }}>{selo.rotulo}</span>}
          </div>
          <div aria-hidden="true" className="peca-pixels"><PixelEstrela /><PixelEstrela /><PixelEstrela /></div>
          {imagem ? (
            <motion.button type="button" className="peca-imagem" onClick={() => setZoom(true)} aria-label={"Ampliar foto de " + produto.nome} whileHover={reduzir ? {} : { scale: 1.035, rotate: -2 }} whileTap={{ scale: 0.99 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={imagem} src={imagem} alt={produto.nome + (galeria[foto] ? " — " + galeria[foto].rotulo : "")} className={esgotado ? "grayscale opacity-60" : ""} />
            </motion.button>
          ) : <div className="peca-sem-foto">{produto.nome}</div>}
          <div className="peca-palco-base">
            {galeria.length > 1 ? (
              <div className="peca-miniaturas" role="group" aria-label="Fotos do produto">
                {galeria.map((g, k) => (
                  <button key={g.src} type="button" aria-pressed={k === foto} aria-label={g.rotulo} title={g.rotulo} onClick={() => setFoto(k)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : <span className="peca-micro">Feita para o seu universo.</span>}
            {imagem && <button type="button" onClick={() => setZoom(true)} className="peca-ampliar"><ZoomIn size={16} /> Ampliar foto</button>}
          </div>
        </motion.div>
        <motion.div className="peca-info" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: suave }}>
          <h1 className="titulo peca-nome">{produto.nome}</h1>
          {produto.tags.length > 0 && <div className="peca-tags">{produto.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>}
          <div className="peca-preco"><span className="titulo">{brl(produto.preco)}</span><span>por peça</span></div>
          {produto.descricao && <p className="peca-descricao">{produto.descricao}</p>}
          <div className="peca-configuracao">
            <div className="peca-config-titulo"><span className="peca-micro"><PixelEstrela /> Monte o seu look</span><span aria-hidden="true">01 / 02</span></div>
            {cores.length > 0 && <fieldset>
              <legend>Cor <span className="text-suave">/ {cor}</span></legend>
              <div className="peca-opcoes">{cores.map(c => <motion.button type="button" key={c} aria-pressed={c === cor} onClick={() => { setCor(c); setTamanho(""); }} whileTap={{ scale: 0.96 }} className="peca-cor">{c}{c === cor && <Check size={14} />}</motion.button>)}</div>
            </fieldset>}
            <fieldset>
              <legend>Escolha seu tamanho <span className="text-suave">/ {tamanho || "selecione abaixo"}</span></legend>
              <div className="peca-opcoes">{tamanhos.map(t => {
                const variacao = produto.variacoes.find(v => v.cor === cor && v.tamanho === t)!;
                return <motion.button type="button" key={t} disabled={variacao.estoque <= 0} aria-pressed={tamanho === t} aria-label={variacao.estoque <= 0 ? t + ", esgotado" : "Tamanho " + t} onClick={() => setTamanho(t)} whileHover={reduzir || variacao.estoque <= 0 ? {} : { y: -3 }} whileTap={{ scale: 0.94 }} className="peca-tamanho">{t}{tamanho === t && <span className="peca-check"><Check size={10} /></span>}</motion.button>;
              })}</div>
              <p className="peca-estoque" aria-live="polite">{!tamanhos.length ? "Sem tamanhos disponíveis no momento." : escolhida ? escolhida.estoque <= 0 ? "Esgotado neste tamanho." : escolhida.estoque <= 3 ? "Últimas " + escolhida.estoque + " neste tamanho." : "Tamanho disponível. Pronto para adicionar." : "Selecione um tamanho para continuar."}</p>
            </fieldset>
          </div>
          <div className="peca-acoes">
            <motion.button type="button" onClick={() => adicionarAoCarrinho(true)} disabled={!escolhida || escolhida.estoque <= 0} whileHover={reduzir ? {} : { y: -2 }} whileTap={{ scale: 0.98 }} className="peca-comprar"><span><ShoppingBag size={19} />{esgotado ? "Peça esgotada" : "Quero essa peça"}</span><ArrowUpRight size={22} /></motion.button>
            <motion.button type="button" onClick={() => adicionarAoCarrinho(false)} disabled={!escolhida || escolhida.estoque <= 0} whileTap={{ scale: 0.98 }} className="peca-adicionar"><Plus size={16} /> Adicionar ao carrinho</motion.button>
          </div>
          <AnimatePresence>{adicionado && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-lima" role="status"><Check size={16} /> Adicionado! <button onClick={() => setAberto(true)} className="underline">Ver carrinho</button></motion.div>}</AnimatePresence>
          <div className="peca-entrega"><span className="peca-micro"><PixelEstrela /> Direto com a loja</span><p>Finalize pelo WhatsApp. Pagamento e entrega são combinados na conversa.</p></div>
        </motion.div>
      </section>
      {parecidos.length > 0 && <Secao rotulo="Complete o look" titulo="No mesmo universo"><GradeProdutos produtos={parecidos} /></Secao>}
      <AnimatePresence>{zoom && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="peca-zoom" onClick={() => setZoom(false)}>
        <div role="dialog" aria-modal="true" aria-label={"Foto ampliada: " + produto.nome} className="peca-zoom-conteudo" onClick={event => event.stopPropagation()}>
          <div aria-hidden="true" className="peca-fundo-imagem">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagem!} alt="" />
          </div>
          <div aria-hidden="true" className="peca-vidro" />
          <button autoFocus type="button" aria-label="Fechar foto ampliada" onClick={() => setZoom(false)} className="peca-zoom-fechar" onKeyDown={event => { if (event.key === "Tab") { event.preventDefault(); event.currentTarget.focus(); } }}><X size={24} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="peca-zoom-foto"><img src={imagem!} alt={produto.nome} /></div>
        </div>
      </motion.div>}</AnimatePresence>
    </>
  );
}

function PixelEstrela() {
  return <svg aria-hidden="true" viewBox="0 0 11 11" width="15" height="15" fill="currentColor" shapeRendering="crispEdges" className="shrink-0"><path d="M4 0h3v3h1v1h3v3H8v1H7v3H4V8H3V7H0V4h3V3h1z" /></svg>;
}