"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { coresDaColecao } from "@/lib/catalogo";
import { brl, type Produto } from "@/lib/tipos";
import { suave } from "./movimento";


// Ângulo relativo à frente da tela, de -180 a 180 (0 = de frente).
const relativo = (base: number, angulo: number) => ((((base + angulo) % 360) + 540) % 360) - 180;

// Abertura da loja: camisas maiores num anel 3D, com navegação manual.
// A da frente fica nítida; as de trás ficam desfocadas e escuras (profundidade de campo).
// Dá para arrastar para girar, clicar numa camisa ou usar as setas.
export function Vinheta({ produtos }: { produtos: Produto[] }) {
  const lista = produtos.filter((p) => p.imagem_url);
  const n = lista.length;
  const passo = 360 / Math.max(n, 1);
  const reduzir = useReducedMotion();

  const angulo = useMotionValue(0);
  const [frente, setFrente] = useState(0);
  const [largura, setLargura] = useState(320);
  const [desktop, setDesktop] = useState(false);
  const [espacamento, setEspacamento] = useState(180);
  const arrastou = useRef(false);

  // Tamanho do card e raio do anel acompanham a tela.
  useEffect(() => {
    const medir = () => {
      const pc = window.innerWidth >= 900;
      const limiteAltura = Math.max(240, (window.innerHeight - 300) / 1.25);
      const tamanho = Math.round(pc ? Math.min(window.innerWidth * 0.30, limiteAltura) : Math.min(460, window.innerWidth * 0.78, limiteAltura));
      setDesktop(pc);
      setLargura(tamanho);
      setEspacamento((window.innerWidth * 0.94 - tamanho) / 4);
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  const raio = Math.round((largura / 2 / Math.tan(Math.PI / Math.max(n, 3))) * 1.12);


  useMotionValueEvent(angulo, "change", (a) => {
    const idx = (((Math.round(-a / passo) % n) + n) % n) || 0;
    setFrente((atual) => (atual === idx ? atual : idx));
  });


  function irPara(alvoAngulo: number) {
    if (reduzir) { angulo.set(alvoAngulo); return; }
    animate(angulo, alvoAngulo, { type: "spring", stiffness: 70, damping: 18 });
  }
  const trazer = (i: number) => irPara(angulo.get() + relativo(i * passo, angulo.get()) * -1);
  const girar = (sentido: 1 | -1) => irPara(Math.round(angulo.get() / passo) * passo - sentido * passo);

  if (n === 0) return null;
  const atual = lista[frente];
  const [c1] = coresDaColecao(atual.categoria);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Camisas em destaque"
      className="relative flex h-svh min-h-[600px] w-full flex-col overflow-hidden"
    >
      {/* Holofote na cor da coleção da frente */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        animate={{ background: `radial-gradient(ellipse 40% 45% at 50% 45%, ${c1}33 0%, transparent 70%)` }}
        transition={{ duration: 0.8 }}
      />

      {/* Palco 3D */}
      <motion.div
        className="relative flex flex-1 touch-pan-y select-none items-center justify-center pt-16"
        style={{ perspective: 1500 }}
        onPanStart={() => {
          arrastou.current = true;
          angulo.stop();
        }}
        onPan={(_, info) => angulo.set(angulo.get() + info.delta.x * 0.3)}
        onPanEnd={(_, info) => {
          const projetado = angulo.get() + info.velocity.x * 0.08;
          irPara(Math.round(projetado / passo) * passo);
          setTimeout(() => (arrastou.current = false), 0);
        }}
      >
        {/* Anel levemente inclinado, como uma vitrine vista um pouco de cima */}
        <div style={{ transformStyle: "preserve-3d", transform: desktop ? "none" : "rotateX(-7deg)" }}>
        <motion.div
          className="relative"
          style={{
            width: largura,
            height: largura * 1.25,
            transformStyle: "preserve-3d",
            z: desktop ? 0 : -raio,
            rotateY: desktop ? 0 : angulo,
          }}
        >
          {lista.map((p, i) => desktop ? (
            <PecaDesktop key={p.id} p={p} base={i * passo} passo={passo} angulo={angulo} espacamento={espacamento} naFrente={i === frente} onClick={() => { if (!arrastou.current) trazer(i); }} />
          ) : (
            <Peca
              key={p.id}
              p={p}
              base={i * passo}
              raio={raio}
              angulo={angulo}
              naFrente={i === frente}
              onClick={() => {
                if (!arrastou.current) trazer(i);
              }}
            />
          ))}
        </motion.div>
        </div>
      </motion.div>

      {/* Nome, preço e ações da camisa da frente */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 pb-8 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={atual.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: suave }}
            className="space-y-1"
            aria-live="polite"
          >
            {atual.categoria && (
              <div className="rotulo" style={{ color: c1 }}>
                {atual.categoria}
              </div>
            )}
            <h2 className="titulo text-3xl sm:text-5xl">{atual.nome}</h2>
            <div className="titulo text-2xl text-lima sm:text-3xl">{brl(atual.preco)}</div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <button
            onClick={() => girar(-1)}
            aria-label="Girar para a camisa anterior"
            className="rounded-full border border-white/15 p-3 text-suave transition hover:border-white/40 hover:text-texto"
          >
            <ChevronLeft size={20} />
          </button>
          <Link href={`/produto/${atual.id}`} className="btn">
            Ver produto
          </Link>
          <Link href="/catalogo" className="btn-sec">
            Ver catálogo
          </Link>
          <button
            onClick={() => girar(1)}
            aria-label="Girar para a próxima camisa"
            className="rounded-full border border-white/15 p-3 text-suave transition hover:border-white/40 hover:text-texto"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="text-xs text-suave/70">Arraste para girar</p>
      </div>

      {/* Vinheta: bordas da tela escuras e transição suave para o resto da página */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 vinheta-bordas"
      />
    </section>
  );
}

// Uma camisa no anel. Quanto mais longe da frente, mais desfocada, escura e transparente.
function Peca({
  p,
  base,
  raio,
  angulo,
  naFrente,
  onClick,
}: {
  p: Produto;
  base: number;
  raio: number;
  angulo: MotionValue<number>;
  naFrente: boolean;
  onClick: () => void;
}) {
  const [c1, c2] = coresDaColecao(p.categoria);
  const distancia = useTransform(angulo, (a) => Math.abs(relativo(base, a)) / 180); // 0 = frente, 1 = atrás
  // A da frente fica 100% nítida; o desfoque cresce a partir de ~20° de distância.
  const filtro = useTransform(distancia, (d) =>
    d < 0.1 ? "none" : `blur(${((d - 0.1) * 10).toFixed(1)}px) brightness(${(1 - d * 0.72).toFixed(2)})`,
  );
  // Ao passar para a metade de trás do anel, some até virar só um vulto.
  const opacidade = useTransform(distancia, (d) => (d < 0.4 ? 1 : d > 0.56 ? 0.12 : 1 - ((d - 0.4) / 0.16) * 0.88));

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={naFrente ? `${p.nome}, em destaque` : `Trazer ${p.nome} para a frente`}
      tabIndex={naFrente ? 0 : -1}
      className="absolute inset-0"
      style={{
        transform: `rotateY(${base}deg) translateZ(${raio}px)`,
        filter: filtro,
        opacity: opacidade,
      }}
    >
      <div
        className={`foto-produto h-full w-full overflow-hidden rounded-3xl ring-1 transition-shadow duration-500 ${
          naFrente ? "shadow-[0_30px_90px_-15px_rgb(0_0_0/0.95)] ring-white/25" : "ring-white/10"
        }`}
        style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imagem_url!} alt="" draggable={false} className="h-full w-full object-cover" />
      </div>
    </motion.button>
  );
}

// Cinco peças em profundidade no PC; o anel original fica no celular.
function PecaDesktop({ p, base, passo, angulo, espacamento, naFrente, onClick }: {
  p: Produto; base: number; passo: number; angulo: MotionValue<number>; espacamento: number; naFrente: boolean; onClick: () => void;
}) {
  const posicao = useTransform(angulo, a => relativo(base, a) / passo);
  const x = useTransform(posicao, valor => valor * espacamento);
  const y = useTransform(posicao, valor => Math.abs(valor) * 12);
  const z = useTransform(posicao, valor => -Math.abs(valor) * 65);
  const scale = useTransform(posicao, valor => Math.max(0.6, 1 - Math.abs(valor) * 0.13));
  const rotateY = useTransform(posicao, valor => -valor * 10);
  const opacity = useTransform(posicao, valor => Math.abs(valor) <= 2.1 ? 1 : Math.max(0, 1 - (Math.abs(valor) - 2.1) / 0.4));
  const zIndex = useTransform(posicao, valor => 100 - Math.round(Math.abs(valor) * 10));
  const visibilidade = useTransform(posicao, valor => Math.abs(valor) < 2.5 ? "visible" : "hidden");
  return (
    <motion.button type="button" className="absolute inset-0" onClick={onClick} tabIndex={naFrente ? 0 : -1} aria-label={naFrente ? p.nome + ", em destaque" : "Trazer " + p.nome + " para a frente"} style={{ x, y, z, scale, rotateY, opacity, zIndex, visibility: visibilidade }}>
      <div className={"h-full w-full overflow-hidden rounded-3xl ring-1 shadow-[0_20px_60px_-15px_#000000aa] " + (naFrente ? "ring-white/40" : "ring-white/20")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imagem_url!} alt="" draggable={false} className="h-full w-full object-cover" />
      </div>
    </motion.button>
  );
}