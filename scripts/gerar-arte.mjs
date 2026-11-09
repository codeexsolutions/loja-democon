// Gera cenas em "pixel art aquarelada" (SVG) para a vitrine.
// Uso (dentro de loja/): node scripts/gerar-arte.mjs public/arte
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const saida = process.argv[2];
mkdirSync(saida, { recursive: true });

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Junta pixels vizinhos da mesma linha num só retângulo (SVG menor).
function pixels(mapa, P, cor) {
  const out = [];
  for (const [y, xs] of mapa) {
    const ord = [...xs].sort((a, b) => a - b);
    let i = 0;
    while (i < ord.length) {
      let j = i;
      while (j + 1 < ord.length && ord[j + 1] === ord[j] + 1) j++;
      out.push(`<rect x="${ord[i] * P}" y="${y * P}" width="${(j - i + 1) * P}" height="${P}"/>`);
      i = j + 1;
    }
  }
  return `<g fill="${cor}" shape-rendering="crispEdges">${out.join("")}</g>`;
}

function novoMapa() {
  const m = new Map();
  return {
    m,
    p(x, y) {
      x = Math.round(x); y = Math.round(y);
      if (!m.has(y)) m.set(y, new Set());
      m.get(y).add(x);
    },
  };
}

function cena({ largura, altura, P = 10, seed, paleta, lua, marco, petalas }) {
  const W = largura / P, H = altura / P;
  const r = rng(seed);

  // --- Manchas de aquarela (depois pixelizadas)
  const manchas = paleta.manchas
    .map(([cx, cy, rx, ry, cor, op]) =>
      `<ellipse cx="${cx * largura}" cy="${cy * altura}" rx="${rx * largura}" ry="${ry * altura}" fill="${cor}" opacity="${op}"/>`)
    .join("");

  // --- Estrelas
  const est = novoMapa(), brilho = novoMapa();
  for (let k = 0; k < W * H * 0.011; k++) est.p(r() * W, r() * H * 0.62);
  for (let k = 0; k < 9; k++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H * 0.5);
    brilho.p(x, y); brilho.p(x - 1, y); brilho.p(x + 1, y); brilho.p(x, y - 1); brilho.p(x, y + 1);
  }

  // --- Lua / sol
  const astro = novoMapa(), cratera = novoMapa();
  const [lx, ly, lr] = [lua.x * W, lua.y * H, lua.r];
  for (let y = -lr; y <= lr; y++)
    for (let x = -lr; x <= lr; x++)
      if (x * x + y * y <= lr * lr + lr * 0.6) astro.p(lx + x, ly + y);
  if (lua.crateras)
    for (const [dx, dy] of [[-2, -2], [-3, -2], [2, 1], [3, 1], [2, 2], [-1, 3]]) cratera.p(lx + dx, ly + dy);

  // --- Montanhas (duas camadas)
  function serra(base, amp, freq, fase) {
    const m = novoMapa();
    for (let x = 0; x < W; x++) {
      const h = base
        + Math.sin(x * freq + fase) * amp
        + Math.sin(x * freq * 2.7 + fase * 1.3) * amp * 0.35
        + (r() - 0.5) * 1.2;
      for (let y = Math.max(0, Math.round(H - h)); y < H; y++) m.p(x, y);
    }
    return m;
  }
  const longe = serra(H * 0.42, H * 0.08, 0.07, seed % 7);
  const perto = serra(H * 0.24, H * 0.06, 0.11, (seed % 5) + 2);

  // --- Marco no horizonte
  const marcoM = novoMapa();
  const chao = (x) => {
    for (let y = 0; y < H; y++) if (perto.m.get(y)?.has(x)) return y;
    return H;
  };
  if (marco === "torii") {
    const cx = Math.round(W * 0.22), base = chao(cx) + 4, h = 17;
    for (let y = base - h; y < base; y++) for (const x of [cx - 7, cx - 6, cx + 6, cx + 7]) marcoM.p(x, y);
    for (let x = cx - 11; x <= cx + 11; x++) { marcoM.p(x, base - h - 1); marcoM.p(x, base - h - 2); }
    marcoM.p(cx - 12, base - h - 3); marcoM.p(cx + 12, base - h - 3);
    for (let x = cx - 9; x <= cx + 9; x++) marcoM.p(x, base - h + 3);
    marcoM.p(cx, base - h); marcoM.p(cx, base - h + 1); marcoM.p(cx, base - h + 2);
  } else if (marco === "castelo") {
    const cx = Math.round(W * 0.76), base = chao(cx) + 1;
    const torres = [[-9, 13], [-4, 20], [0, 26], [4, 18], [9, 12]];
    for (const [dx, h] of torres) {
      for (let y = base - h; y < base; y++) for (let x = cx + dx - 1; x <= cx + dx + 1; x++) marcoM.p(x, y);
      marcoM.p(cx + dx, base - h - 1); marcoM.p(cx + dx, base - h - 2);
    }
    for (let y = base - 8; y < base; y++) for (let x = cx - 10; x <= cx + 10; x++) marcoM.p(x, y);
  } else if (marco === "espada") {
    const cx = Math.round(W * 0.7), base = chao(cx) + 2;
    for (let y = base - 22; y < base; y++) { marcoM.p(cx, y); marcoM.p(cx + 1, y); }
    for (let x = cx - 4; x <= cx + 5; x++) marcoM.p(x, base - 22);
    for (let y = base - 27; y < base - 22; y++) { marcoM.p(cx, y); marcoM.p(cx + 1, y); }
    marcoM.p(cx, base - 28); marcoM.p(cx + 1, base - 28);
  }

  // --- Pétalas / vaga-lumes
  const pet = novoMapa();
  for (let k = 0; k < petalas; k++) {
    const x = r() * W, y = H * 0.25 + r() * H * 0.6;
    pet.p(x, y); if (r() > 0.5) pet.p(x + 1, y);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" preserveAspectRatio="xMidYMid slice">
<defs>
  <filter id="aquarela" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="${seed}" result="ruido"/>
    <feDisplacementMap in="SourceGraphic" in2="ruido" scale="${largura * 0.09}" xChannelSelector="R" yChannelSelector="G" result="borrado"/>
    <feGaussianBlur in="borrado" stdDeviation="${P * 1.4}"/>
  </filter>
  <filter id="pixel" x="0" y="0" width="100%" height="100%" primitiveUnits="userSpaceOnUse">
    <feFlood x="${P / 2 - 1}" y="${P / 2 - 1}" width="2" height="2"/>
    <feComposite width="${P}" height="${P}"/>
    <feTile result="grade"/>
    <feComposite in="SourceGraphic" in2="grade" operator="in"/>
    <feMorphology operator="dilate" radius="${P / 2}"/>
  </filter>
  <filter id="papel" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/>
  </filter>
</defs>
<rect width="100%" height="100%" fill="${paleta.fundo}"/>
<g filter="url(#pixel)"><g filter="url(#aquarela)">${manchas}</g></g>
${pixels(est.m, P, paleta.estrela)}
${pixels(brilho.m, P, paleta.brilho)}
<g filter="url(#pixel)"><circle cx="${lx * P}" cy="${ly * P}" r="${lr * P * 2.4}" fill="${lua.halo}" opacity="0.35" filter="url(#aquarela)"/></g>
${pixels(astro.m, P, lua.cor)}
${pixels(cratera.m, P, lua.sombra)}
${pixels(longe.m, P, paleta.longe)}
<g opacity="0.55" filter="url(#pixel)"><g filter="url(#aquarela)">${paleta.nevoa
      .map(([cy, cor]) => `<rect x="0" y="${cy * altura}" width="${largura}" height="${altura * 0.12}" fill="${cor}"/>`)
      .join("")}</g></g>
${pixels(marcoM.m, P, paleta.marco)}
${pixels(perto.m, P, paleta.perto)}
${pixels(pet.m, P, paleta.petala)}
<rect width="100%" height="100%" filter="url(#papel)"/>
</svg>`;
}

const cenas = {
  "cena-hero.svg": cena({
    largura: 1600, altura: 760, seed: 42, marco: "torii", petalas: 70,
    lua: { x: 0.8, y: 0.22, r: 6, cor: "#ffeec2", sombra: "#f3c97a", halo: "#ffd27a", crateras: true },
    paleta: {
      fundo: "#07050d", estrela: "#f6f1ff", brilho: "#9ff7ff", longe: "#2a1645", perto: "#0d0816",
      marco: "#d8263f", petala: "#ff8fc7",
      manchas: [
        [0.15, 0.25, 0.32, 0.3, "#7c3aed", 0.75], [0.55, 0.15, 0.35, 0.25, "#db2777", 0.55],
        [0.85, 0.35, 0.3, 0.3, "#0891b2", 0.6], [0.4, 0.55, 0.4, 0.2, "#4c1d95", 0.7],
        [0.75, 0.6, 0.25, 0.18, "#be185d", 0.45],
      ],
      nevoa: [[0.62, "#a855f7"], [0.7, "#ec4899"]],
    },
  }),
  "banner-shonen.svg": cena({
    largura: 1600, altura: 600, seed: 7, marco: "espada", petalas: 40,
    lua: { x: 0.2, y: 0.3, r: 7, cor: "#ffd166", sombra: "#ff9f1c", halo: "#ff7a1a", crateras: false },
    paleta: {
      fundo: "#0b0604", estrela: "#fff3d6", brilho: "#ffe066", longe: "#4a1d0c", perto: "#120805",
      marco: "#d9f99d", petala: "#bef264",
      manchas: [
        [0.2, 0.3, 0.35, 0.35, "#ea580c", 0.7], [0.6, 0.2, 0.35, 0.3, "#16a34a", 0.45],
        [0.9, 0.45, 0.3, 0.3, "#f59e0b", 0.55], [0.45, 0.6, 0.4, 0.2, "#7c2d12", 0.7],
      ],
      nevoa: [[0.6, "#f97316"], [0.7, "#84cc16"]],
    },
  }),
  "banner-dark.svg": cena({
    largura: 1600, altura: 600, seed: 99, marco: "castelo", petalas: 30,
    lua: { x: 0.25, y: 0.28, r: 7, cor: "#ff4d5e", sombra: "#b3001b", halo: "#ff1f3d", crateras: true },
    paleta: {
      fundo: "#060203", estrela: "#ffe4e6", brilho: "#ff8a9a", longe: "#2b0710", perto: "#0a0204",
      marco: "#1a0408", petala: "#ff3355",
      manchas: [
        [0.25, 0.3, 0.35, 0.35, "#9f1239", 0.75], [0.65, 0.2, 0.35, 0.3, "#581c87", 0.5],
        [0.9, 0.5, 0.3, 0.3, "#7f1d1d", 0.6], [0.5, 0.6, 0.45, 0.2, "#450a0a", 0.7],
      ],
      nevoa: [[0.58, "#be123c"], [0.7, "#6b21a8"]],
    },
  }),
};

for (const [nome, svg] of Object.entries(cenas)) {
  writeFileSync(join(saida, nome), svg);
  console.log(nome, (svg.length / 1024).toFixed(1) + " KB");
}
