// Cenários em pixel art estilo anime (céus em degradê pontilhado, nuvens fofas com borda de luz,
// silhuetas com contorno iluminado). O fundo do site é fixo, então cada cena é composta para a
// faixa visível do topo: ~y 38–202 no desktop e até ~y 350 no celular (em células de 5 unidades).
// Uso (dentro de loja/): node scripts/gerar-mundos-anime.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const GW = 320, GH = 840, OUT = "public/arte"; // 1600 x 4200 unidades do mundo / 5
mkdirSync(OUT, { recursive: true });

const cache = new Map();
const C = (h) => Array.isArray(h) ? h : cache.get(h) ?? (cache.set(h, [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))), cache.get(h));
const mix = (a, b, t) => C(a).map((v, i) => Math.round(v + (C(b)[i] - v) * t));
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;
let seed = 1;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

class Camada {
  constructor() { this.d = new Uint8ClampedArray(GW * GH * 4); }
  px(x, y, cor, a = 1) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= GW || y >= GH || a <= 0) return;
    const c = C(cor), i = (y * GW + x) * 4, d = this.d, da = d[i + 3] / 255, oa = a + da * (1 - a);
    for (let k = 0; k < 3; k++) d[i + k] = (c[k] * a + d[i + k] * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  }
  apagar(x, y) { if (x >= 0 && y >= 0 && x < GW && y < GH) this.d[(y * GW + x) * 4 + 3] = 0; }
}

// Tons com pontilhado ordenado: t em 0..1 escolhe entre n cores sem degradê liso.
const tom = (cores, t, x, y) => { const q = clamp(t, 0, 1) * (cores.length - 1), k = Math.floor(q); return cores[Math.min(cores.length - 1, k + ((q - k) > bayer(x, y) ? 1 : 0))]; };

function amostra(stops, t) {
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]; return mix(c0, c1, (t - t0) / (t1 - t0)); }
  return C(stops.at(-1)[1]);
}
function ceu(cam, stops, yFim, bandas = 18) {
  const cores = Array.from({ length: bandas }, (_, i) => amostra(stops, i / (bandas - 1)));
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) cam.px(x, y, tom(cores, Math.min(1, y / yFim), x, y));
}
function brilho(cam, x, y, cor, r = 2) {
  cam.px(x, y, cor);
  for (let k = 1; k <= r; k++) { const a = 1 - k / (r + 1); cam.px(x + k, y, cor, a); cam.px(x - k, y, cor, a); cam.px(x, y + k, cor, a); cam.px(x, y - k, cor, a); }
}
function estrelas(cam, n, yMax, cores = ["#ffffff", "#d6e4ff", "#ffe2f1"]) {
  for (let i = 0; i < n; i++) { const y = rnd() * yMax; cam.px(rnd() * GW, y, cores[i % cores.length], 0.3 + rnd() * 0.7 * (1 - (y / yMax) * 0.6)); }
  for (let i = 0; i < Math.round(n / 35); i++) brilho(cam, Math.round(rnd() * GW), Math.round(rnd() * yMax * 0.8), "#ffffff", rnd() > 0.5 ? 2 : 1);
}
function halo(cam, cx, cy, r0, r1, cor, forca = 0.5) {
  for (let y = Math.floor(cy - r1); y <= cy + r1; y++) for (let x = Math.floor(cx - r1); x <= cx + r1; x++) {
    const d = Math.hypot(x - cx, y - cy); if (d < r0 || d > r1) continue;
    const a = forca * (1 - (d - r0) / (r1 - r0)) ** 1.6, q = a * 4, nivel = Math.floor(q) + ((q % 1) > bayer(x, y) ? 1 : 0);
    if (nivel > 0) cam.px(x, y, cor, Math.min(1, nivel / 4));
  }
}
function disco(cam, cx, cy, r, claro, escuro, luz = [-0.6, -0.6]) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const nx = (x - cx) / r, ny = (y - cy) / r, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
    const l = -(nx * luz[0] + ny * luz[1]) * 0.55 + Math.sqrt(1 - d2) * 0.6;
    cam.px(x, y, tom([escuro, mix(escuro, claro, 0.5), claro], l, x, y));
  }
}
function crateras(cam, cx, cy, r, cor, n) {
  for (let i = 0; i < n; i++) { const a = rnd() * 6.28, d = rnd() * r * 0.65, rr = 1 + rnd() * r * 0.18, x0 = cx + Math.cos(a) * d, y0 = cy + Math.sin(a) * d;
    for (let y = Math.floor(y0 - rr); y <= y0 + rr; y++) for (let x = Math.floor(x0 - rr); x <= x0 + rr; x++) if (Math.hypot(x - x0, y - y0) <= rr) cam.px(x, y, cor, 0.35); }
}
// Nuvem cúmulo: bolhas sombreadas pela própria normal, base achatada, borda de luz do lado do sol.
function nuvem(cam, cx, cy, larg, alt, pal, luz = [-0.5, -0.8]) {
  const n = Math.max(4, Math.round(larg / 7)), bolhas = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1), h = Math.sin(t * Math.PI); bolhas.push([cx - larg / 2 + t * larg, cy - h * alt * 0.25, alt * (0.22 + h * 0.3 + rnd() * 0.12)]); }
  for (let i = 0; i < n * 0.6; i++) { const t = 0.18 + rnd() * 0.64, h = Math.sin(t * Math.PI); bolhas.push([cx - larg / 2 + t * larg, cy - alt * (0.35 + rnd() * 0.35) * h, alt * (0.2 + rnd() * 0.22) * (0.6 + h * 0.5)]); }
  bolhas.sort((a, b) => a[1] - a[2] - (b[1] - b[2]));
  const base = cy + alt * 0.18, L = Math.hypot(...luz), lx = luz[0] / L, ly = luz[1] / L;
  for (const [bx, by, r] of bolhas) for (let y = Math.floor(by - r); y <= Math.min(base, by + r); y++) for (let x = Math.floor(bx - r); x <= bx + r; x++) {
    const nx = (x - bx) / r, ny = (y - by) / r, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
    let l = (nx * lx + ny * ly) * 0.75 + Math.sqrt(1 - d2) * 0.25;
    if (y > base - 2) l -= 0.5;
    cam.px(x, y, tom(pal, (l + 0.35) / 1.25, x, y));
  }
}
// Silhueta: preenche onde mask é verdadeira e acende a borda superior (contorno de luz de anime).
function silhueta(cam, mask, cor, borda, { x0 = 0, x1 = GW, y0 = 0, y1 = GH, borda2 } = {}) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (mask(x, y)) {
    if (borda && !mask(x, y - 1)) cam.px(x, y, borda);
    else if (borda2 && !mask(x, y - 2)) cam.px(x, y, borda2);
    else cam.px(x, y, cor);
  }
}
const ruido = (x, f, a, fase = 0) => Math.sin(x / f + fase) * a + Math.sin(x / (f * 0.37) + fase * 2.3) * a * 0.3;
const serra = (cam, fn, cor, borda, o) => silhueta(cam, (x, y) => y >= Math.round(fn(x)), cor, borda, o);
function retangulo(cam, x, y, w, h, cor, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cam.px(x + i, y + j, cor, a); }
function linha(cam, x0, y0, x1, y1, cor, a = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) cam.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, cor, a);
}
function fio(cam, x0, y0, x1, y1, curva, cor) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { const t = (x - x0) / (x1 - x0); cam.px(x, y0 + (y1 - y0) * t + curva * 4 * t * (1 - t), cor); }
}
function poste(cam, x, yTopo, cor, borda) {
  retangulo(cam, x, yTopo, 2, GH - yTopo, cor); cam.px(x, yTopo, borda);
  retangulo(cam, x - 7, yTopo + 4, 16, 1, cor); retangulo(cam, x - 5, yTopo + 9, 12, 1, cor);
  for (const dx of [-6, -2, 3, 7]) cam.px(x + dx, yTopo + 3, cor);
}
function predios(cam, xIni, xFim, topoMin, topoMax, larg, cor, borda, janelas = [], dens = 0.25) {
  let x = xIni;
  while (x < xFim) {
    const w = larg[0] + Math.floor(rnd() * (larg[1] - larg[0])), topo = topoMin + Math.floor(rnd() * (topoMax - topoMin));
    silhueta(cam, (i, j) => i >= x && i < x + w && j >= topo, cor, borda, { x0: x, x1: x + w, y0: topo });
    if (rnd() > 0.6) retangulo(cam, x + 2, topo - 2, Math.max(2, w - 5), 2, cor);
    if (janelas.length) for (let j = topo + 3; j < topo + 140; j += 3) for (let i = x + 2; i < x + w - 1; i += 2) if (rnd() < dens) cam.px(i, j, janelas[Math.floor(rnd() * janelas.length)], 0.55 + rnd() * 0.45);
    x += w + (rnd() > 0.7 ? 1 : 0);
  }
}
function casa(cam, x, base, w, h, cor, borda, luz) {
  const telhado = Math.round(w * 0.35);
  silhueta(cam, (i, j) => {
    if (j >= base - h && j < GH && i >= x && i < x + w) return true;
    const t = base - h - j; // telhado em duas águas com beiral
    return t >= 0 && t < telhado && i >= x - 2 + t && i < x + w + 2 - t;
  }, cor, borda);
  if (luz) for (let i = x + 2; i < x + w - 2; i += 4) if (rnd() > 0.35) { retangulo(cam, i, base - h + 3, 2, 2, luz); halo(cam, i + 1, base - h + 4, 1, 4, luz, 0.18); }
}
function torii(cam, x, base, h, cor, borda) {
  const w = Math.round(h * 1.1);
  retangulo(cam, x + 3, base - h + 4, 2, h - 4, cor); retangulo(cam, x + w - 5, base - h + 4, 2, h - 4, cor);
  retangulo(cam, x, base - h + 1, w, 2, cor); cam.px(x - 1, base - h, cor); cam.px(x + w, base - h, cor);
  for (let i = 0; i < w; i++) cam.px(x + i, base - h + 1, borda);
  retangulo(cam, x + 1, base - h + 6, w - 2, 1, cor); retangulo(cam, x + Math.floor(w / 2) - 1, base - h + 3, 2, 3, cor);
}
function pinheiro(cam, x, base, h, cor, borda) {
  silhueta(cam, (i, j) => {
    if (j > base || j < base - h) return false;
    const t = (j - (base - h)) / h, camada = (t * 4) % 1;
    return Math.abs(i - x) <= Math.max(0.5, (0.15 + t * 0.45 + camada * 0.2) * h * 0.35);
  }, cor, borda, { x0: x - h, x1: x + h, y0: base - h - 1, y1: base + 1 });
  retangulo(cam, x, base, 1, 4, cor);
}
function vagalumes(cam, n, y0, y1, cor) { for (let i = 0; i < n; i++) { const x = Math.round(rnd() * GW), y = Math.round(y0 + rnd() * (y1 - y0)); halo(cam, x, y, 0, 4, cor, 0.35); cam.px(x, y, "#fffbe0"); } }
function petalas(cam, n, y0, y1, cores) { for (let i = 0; i < n; i++) { const x = Math.round(rnd() * GW), y = Math.round(y0 + rnd() * (y1 - y0)), c = cores[i % cores.length]; cam.px(x, y, c); if (rnd() > 0.5) cam.px(x + 1, y + (rnd() > 0.5 ? 1 : 0), c, 0.7); } }
function chao(cam, y, cor) { retangulo(cam, 0, y, GW, GH - y, cor); }

async function salvar(nome, camadas) {
  const junto = new Camada();
  for (const [chave, cam] of Object.entries(camadas)) {
    const raw = () => sharp(Buffer.from(cam.d.buffer), { raw: { width: GW, height: GH, channels: 4 } });
    await raw().resize(GW * 2, GH * 2, { kernel: "nearest" }).webp({ lossless: true }).toFile(`${OUT}/mundo-${nome}-${chave}.webp`);
    await raw().webp({ lossless: true }).toFile(`${OUT}/mundo-${nome}-${chave}-mobile.webp`);
    for (let i = 0; i < GW * GH; i++) { const a = cam.d[i * 4 + 3] / 255; if (a) junto.px(i % GW, Math.floor(i / GW), [cam.d[i * 4], cam.d[i * 4 + 1], cam.d[i * 4 + 2]], a); }
  }
  await sharp(Buffer.from(junto.d.buffer), { raw: { width: GW, height: GH, channels: 4 } }).resize(GW * 2, GH * 2, { kernel: "nearest" }).webp({ lossless: true }).toFile(`${OUT}/mundo-${nome}.webp`);
}

// ---------- Santuário: pôr do sol rosa, sol enorme, monte nevado, torii na colina, cerejeira ----------
{
  seed = 11;
  const c = new Camada(), a = new Camada(), d = new Camada(), m = new Camada(), f = new Camada();
  ceu(c, [[0, "#1a1640"], [0.3, "#3a2a6e"], [0.55, "#83407e"], [0.74, "#d85c78"], [0.88, "#ff9466"], [1, "#ffd28a"]], 176);
  estrelas(c, 90, 90);
  halo(a, 236, 150, 22, 78, "#ffb27a", 0.6); disco(a, 236, 150, 22, "#fff4d2", "#ffb071", [0, 0]);
  const pal = ["#6b3a7a", "#b5568a", "#ff8f8a", "#ffdcb8"];
  nuvem(a, 78, 86, 96, 28, pal, [0.8, -0.3]); nuvem(a, 190, 58, 76, 20, pal, [0.6, -0.5]); nuvem(a, 300, 104, 64, 18, pal, [-0.6, -0.4]); nuvem(a, 28, 138, 70, 14, pal, [0.8, -0.2]);
  // Monte nevado com cratera achatada e neve iluminada do lado do sol.
  const fuji = (x) => 104 + Math.max(0, Math.abs(x - 118) - 4) ** 1.18 * 0.55;
  serra(d, (x) => 158 + ruido(x, 40, 5, 1), "#4a3168", "#c86a8a");
  silhueta(d, (x, y) => y >= Math.round(fuji(x)), "#5b3a78", "#f0a0b0");
  for (let y = 100; y < 132; y++) for (let x = 60; x < 180; x++) {
    const linhaNeve = 118 + ruido(x, 5, 3, 2) + (Math.abs(x - 118) < 30 ? 4 : 0);
    if (y >= Math.round(fuji(x)) && y < linhaNeve) d.px(x, y, x > 118 ? (y === Math.round(fuji(x)) ? "#ffffff" : "#ffe3e8") : "#d9b4d6");
  }
  serra(m, (x) => x < 175 ? 999 : 162 + ((x - 262) / 62) ** 2 * 22, "#2a1a40", "#ff9a7a", { borda2: "#a3507a" });
  torii(m, 248, 163, 24, "#3a1630", "#ff7a6a");
  for (let i = 0; i < 9; i++) { const y = 170 + i * 6, x = 258 - i * 4; m.px(x, y, "#ffcf8a"); halo(m, x, y, 0, 3, "#ffb070", 0.3); }
  for (let x = 6; x < 170; x += 14 + Math.floor(rnd() * 8)) casa(m, x, 190 + Math.floor(rnd() * 4), 9 + Math.floor(rnd() * 6), 5, "#24163a", "#e47a8a", "#ffc87a");
  chao(m, 194, "#1d1430");
  // Cerejeira no canto: tronco escuro e copa rosa com luz vinda do sol à direita.
  for (let t = 0; t <= 1; t += 0.004) { const x = 4 + t * 34 + Math.sin(t * 5) * 4, y = 230 - t * 170; retangulo(f, x - 2 + t * 2, y, 5 - t * 3, 2, "#1a0f22"); }
  linha(f, 30, 92, 74, 70, "#1a0f22"); linha(f, 24, 110, 0, 96, "#1a0f22");
  const rosa = ["#6a2f5e", "#b84f84", "#f28db0", "#ffd9e8"];
  nuvem(f, 36, 74, 104, 40, rosa, [0.8, -0.4]); nuvem(f, 8, 110, 50, 22, rosa, [0.8, -0.3]); nuvem(f, 84, 64, 44, 16, rosa, [0.7, -0.6]);
  petalas(f, 220, 40, 330, ["#ffc1d9", "#f28db0", "#ffe4ee"]);
  serra(f, (x) => 197 + ruido(x, 9, 2, 3), "#120c20", "#3d2440");
  await salvar("santuario", { ceu: c, astro: a, distante: d, meio: m, frente: f });
}

// ---------- Cidade: noite azul, lua grande, horizonte com luzes, postes e fios cortando o céu ----------
{
  seed = 23;
  const c = new Camada(), a = new Camada(), d = new Camada(), m = new Camada(), f = new Camada();
  ceu(c, [[0, "#060a22"], [0.35, "#101e4e"], [0.6, "#22357a"], [0.8, "#4b4f9c"], [0.92, "#9a6bb0"], [1, "#e08fb0"]], 186);
  estrelas(c, 150, 120);
  halo(a, 252, 72, 19, 66, "#9ec3ff", 0.5); disco(a, 252, 72, 19, "#f6f8ff", "#9fb2df", [-0.7, -0.4]); crateras(a, 252, 72, 19, "#7d90c4", 9);
  const pal = ["#1d2a63", "#33478c", "#7088c8", "#d2ddff"];
  nuvem(a, 92, 100, 120, 16, pal, [0.9, -0.4]); nuvem(a, 214, 126, 84, 12, pal, [0.6, -0.8]); nuvem(a, 300, 150, 60, 10, pal, [-0.3, -0.9]);
  predios(d, -4, GW, 140, 172, [6, 14], "#25306a", "#5b6fb8", ["#8fa8ff", "#c8d4ff"], 0.12);
  // Torre de rádio treliçada com luz vermelha no topo.
  for (let y = 92; y < 175; y++) { const w = Math.round((y - 92) * 0.12); d.px(196 - w, y, "#2a356f"); d.px(196 + w, y, "#2a356f"); if (y % 6 === 0) linha(d, 196 - w, y, 196 + w, y, "#2a356f"); }
  d.px(196, 90, "#ff5a6a"); halo(d, 196, 90, 0, 5, "#ff5a6a", 0.45);
  predios(m, -6, GW, 160, 184, [8, 18], "#151c45", "#3b4f9a", ["#ffd27a", "#7ff0ff", "#ffb4e6"], 0.22);
  retangulo(m, 120, 168, 12, 4, "#ff6fb8"); halo(m, 126, 170, 3, 12, "#ff6fb8", 0.35);
  retangulo(m, 236, 172, 4, 10, "#5ff2ff"); halo(m, 238, 177, 3, 10, "#5ff2ff", 0.3);
  for (let x = -4; x < GW; x += 18 + Math.floor(rnd() * 10)) casa(f, x, 196 + Math.floor(rnd() * 5), 12 + Math.floor(rnd() * 6), 6, "#0b0f2a", "#2c3a7a", "#ffcf7a");
  chao(f, 200, "#0b0f2a");
  poste(f, 44, 66, "#0b0f2a", "#3b4f9a"); poste(f, 236, 78, "#0b0f2a", "#3b4f9a");
  for (const [k, dy] of [[0, 4], [1, 4], [2, 9], [3, 9]]) {
    const xa = [-1, 4, 49, 47][k], xb = [229, 233, 241, 243][k];
    fio(f, -10, 60 + dy + k, 44 + (k % 2 ? 6 : -6), 66 + dy, 6, "#0b0f2a");
    fio(f, 44 + (k % 2 ? 6 : -6), 66 + dy, 236 + (k % 2 ? 6 : -6), 78 + dy, 14 + k * 2, "#0b0f2a");
    fio(f, 236 + (k % 2 ? 6 : -6), 78 + dy, 330, 70 + dy + k * 3, 8, "#0b0f2a");
    void xa; void xb;
  }
  await salvar("cidade", { ceu: c, astro: a, distante: d, meio: m, frente: f });
}

// ---------- Floresta: crepúsculo verde-água, lua crescente, montanhas com névoa, vaga-lumes ----------
{
  seed = 37;
  const c = new Camada(), a = new Camada(), d = new Camada(), m = new Camada(), f = new Camada();
  ceu(c, [[0, "#0a1830"], [0.35, "#14395a"], [0.6, "#226a7c"], [0.8, "#5aa59c"], [0.92, "#bfd9a8"], [1, "#ffe0a8"]], 170);
  estrelas(c, 80, 85);
  disco(a, 70, 66, 13, "#fff8de", "#f2d79a", [-0.8, 0]);
  for (let y = 44; y < 84; y++) for (let x = 60; x < 95; x++) if (Math.hypot(x - 76, y - 62) <= 12) a.apagar(x, y);
  halo(a, 70, 66, 13, 44, "#fff2c8", 0.4);
  const pal = ["#1e4a63", "#3b7c8a", "#a2d2ba", "#fff2c6"];
  nuvem(a, 222, 98, 128, 32, pal, [-0.2, 0.9]); nuvem(a, 58, 122, 76, 16, pal, [0.3, 0.9]); nuvem(a, 300, 60, 50, 12, pal, [-0.3, 0.8]);
  serra(d, (x) => 128 + ruido(x, 34, 12, 0.5), "#3a7a84", "#8cc9b4");
  for (let y = 138; y < 150; y++) for (let x = 0; x < GW; x++) if (bayer(x, y) < 0.35 * (1 - Math.abs(y - 144) / 6)) d.px(x, y, "#d9f0e0", 0.6);
  serra(d, (x) => 146 + ruido(x, 26, 10, 2.1), "#26596a", "#69a99a");
  serra(d, (x) => 160 + ruido(x, 20, 7, 4), "#1a4456", "#4f8f86");
  for (let y = 162; y < 172; y++) for (let x = 0; x < GW; x++) if (bayer(x, y) < 0.3 * (1 - Math.abs(y - 167) / 5)) d.px(x, y, "#cdeedd", 0.5);
  for (let x = -6; x < GW + 6; x += 5 + Math.floor(rnd() * 5)) pinheiro(m, x, 182 + Math.floor(rnd() * 6), 18 + Math.floor(rnd() * 26), "#0f2a36", "#4f9a8a");
  retangulo(m, 150, 180, 3, 8, "#0f2a36"); retangulo(m, 148, 178, 7, 2, "#0f2a36"); m.px(151, 182, "#ffd27a"); halo(m, 151, 182, 0, 6, "#ffcf7a", 0.4);
  chao(m, 188, "#0c222c");
  for (let t = 0; t <= 1; t += 0.005) retangulo(f, 300 + Math.sin(t * 4) * 3, 240 - t * 200, 8 - t * 4, 2, "#06141a");
  const folha = ["#07161d", "#0f2b33", "#235248", "#5a9a72"];
  nuvem(f, 300, 64, 90, 40, folha, [-0.9, 0.3]); nuvem(f, 318, 106, 40, 22, folha, [-0.9, 0.2]);
  silhueta(f, (x, y) => y >= 196 + Math.round(ruido(x, 7, 2)) || (y >= 186 && (x * 7) % 11 < 2 && y >= 186 + ((x * 13) % 9)), "#06141a", "#2f6a5a");
  vagalumes(f, 46, 110, 320, "#e8ff8a");
  await salvar("floresta", { ceu: c, astro: a, distante: d, meio: m, frente: f });
}

// ---------- Espaço: céu estrelado com via láctea, estrelas cadentes, planeta com anel, observatório ----------
{
  seed = 51;
  const c = new Camada(), a = new Camada(), d = new Camada(), m = new Camada(), f = new Camada();
  ceu(c, [[0, "#04040f"], [0.4, "#0b1034"], [0.7, "#1d1d5e"], [0.88, "#3d2d78"], [1, "#7a4a92"]], 184);
  // Via láctea na diagonal: brilho pontilhado, núcleo rosado, faixa de poeira escura e muitas estrelas.
  const dist = (x, y) => Math.abs((y - 210) + x * 0.62) / Math.hypot(1, 0.62);
  for (let y = 0; y < 230; y++) for (let x = 0; x < GW; x++) {
    const dd = dist(x, y); if (dd > 46) continue;
    const g = (1 - dd / 46) ** 2;
    if (bayer(x, y) < g * 0.55) c.px(x, y, dd < 14 ? "#d9a0e0" : "#7a62c8", 0.35 + g * 0.3);
    if (Math.abs(dd - 6 + ruido(x, 12, 4)) < 2 && bayer(x, y) < 0.5) c.px(x, y, "#120f30", 0.5);
  }
  for (let i = 0; i < 900; i++) { const x = rnd() * GW, y = rnd() * 230; if (dist(x, y) < 40 * rnd() + 6) c.px(x, y, rnd() > 0.7 ? "#ffe6f6" : "#ffffff", 0.4 + rnd() * 0.6); }
  estrelas(c, 260, 175);
  halo(a, 258, 70, 15, 40, "#c6a8ff", 0.35); disco(a, 258, 70, 15, "#e8d8ff", "#7a62b0", [-0.7, -0.3]);
  for (let t = 0; t < 6.283; t += 0.01) { const x = 258 + Math.cos(t) * 28, y = 70 + Math.sin(t) * 7; if (Math.sin(t) > 0 || Math.hypot(x - 258, y - 70) > 15) a.px(x, y, "#d8c4ff", 0.8); }
  disco(a, 52, 44, 6, "#fff1d8", "#c4a07a", [-0.6, -0.6]);
  for (const [x, y, n] of [[140, 40, 26], [70, 100, 18], [230, 130, 14]]) for (let i = 0; i < n; i++) a.px(x - i, y + i * 0.45, "#ffffff", 1 - i / n);
  serra(d, (x) => 174 + ruido(x, 40, 6, 1.2), "#141236", "#5a4aa0");
  serra(m, (x) => x > 120 ? 999 : 166 + ((x - 50) / 70) ** 2 * 20, "#0d0c28", "#7a6ad0");
  for (let t = 0; t <= 1; t += 0.01) retangulo(m, 60 + Math.sin(t * 3) * 2, 166 - t * 30, 3 - t, 1, "#0d0c28");
  linha(m, 61, 146, 52, 138, "#0d0c28"); linha(m, 62, 144, 72, 136, "#0d0c28");
  const copa = ["#0d0c28", "#1a1846", "#3a3480", "#8a7ae0"];
  nuvem(m, 61, 134, 36, 28, copa, [0.4, -0.9]); nuvem(m, 50, 140, 18, 12, copa, [0.4, -0.9]); nuvem(m, 73, 139, 18, 12, copa, [0.4, -0.9]);
  serra(m, (x) => x < 200 ? 999 : 170 + ((x - 268) / 60) ** 2 * 16, "#0d0c28", "#7a6ad0");
  for (let y = 152; y < 162; y++) for (let x = 254; x < 282; x++) if (Math.hypot(x - 268, (y - 162) * 1.3) <= 13) m.px(x, y, x < 266 ? "#2a2860" : "#1a1846");
  retangulo(m, 255, 162, 26, 8, "#16143c"); retangulo(m, 267, 152, 2, 9, "#ffd27a"); halo(m, 268, 157, 1, 8, "#ffd27a", 0.3);
  chao(m, 190, "#0a0920");
  serra(f, (x) => 196 + ruido(x, 6, 2, 0.4), "#08071a", "#3a3480");
  for (let x = 0; x < GW; x += 3) if (rnd() > 0.4) linha(f, x, 196, x + (rnd() - 0.5) * 3, 189 + rnd() * 4, "#08071a");
  await salvar("espaco", { ceu: c, astro: a, distante: d, meio: m, frente: f });
}

// ---------- Deserto → litoral no fim de tarde: nuvem de verão gigante, mar dourado, guard-rail ----------
{
  seed = 67;
  const c = new Camada(), a = new Camada(), d = new Camada(), m = new Camada(), f = new Camada();
  const HZ = 142;
  ceu(c, [[0, "#25358a"], [0.35, "#3f63c4"], [0.6, "#7aa5ea"], [0.8, "#f3c3a8"], [0.92, "#ffad7a"], [1, "#ff9060"]], HZ);
  estrelas(c, 24, 50);
  halo(a, 66, 132, 13, 70, "#ffc58a", 0.6); disco(a, 66, 132, 13, "#fff6d8", "#ffb070", [0, 0]);
  const pal = ["#6a6aa8", "#b39ac8", "#ffd0b0", "#fff6e2"];
  nuvem(a, 214, 108, 150, 34, pal, [-0.9, -0.2]); nuvem(a, 222, 72, 100, 34, pal, [-0.9, -0.3]); nuvem(a, 230, 42, 60, 24, pal, [-0.9, -0.4]);
  nuvem(a, 54, 62, 70, 18, pal, [-0.2, 0.9]); nuvem(a, 308, 128, 50, 12, pal, [-0.9, 0]);
  // Mar: linha do horizonte acesa, degradê para o fundo e reflexo do sol em traços horizontais.
  for (let y = HZ; y < GH; y++) for (let x = 0; x < GW; x++) d.px(x, y, y === HZ ? "#ffb88a" : tom(["#5a6fc0", "#3d5cb0", "#2d4690", "#1d2c66"], (y - HZ) / 70, x, y));
  for (let y = HZ + 1; y < 240; y++) { const w = 3 + (y - HZ) * 0.35; for (let k = 0; k < 2; k++) { const len = 2 + Math.floor(rnd() * w * 0.6), x = Math.round(66 + (rnd() - 0.5) * w * 2); if (rnd() < 0.8) retangulo(d, x, y, len, 1, rnd() > 0.4 ? "#ffd9a0" : "#ff9a6a", 0.9); } }
  for (let i = 0; i < 70; i++) d.px(rnd() * GW, HZ + 3 + rnd() * 60, "#cfe0ff", 0.5);
  serra(d, (x) => x < 168 || x > 236 ? 999 : HZ - 8 + ((x - 196) / 30) ** 2 * 8, "#6a5a96", "#ffc0a0", { y1: HZ + 1 });
  const morro = (x) => { const t = clamp((x - 196) / 110, 0, 1); return HZ + 4 - 24 * t * t * (3 - 2 * t) + ruido(x, 6, 1); };
  serra(m, (x) => x < 172 ? 999 : x < 196 ? HZ + 4 + (196 - x) * 3 : morro(x), "#2e2448", "#ffb38a", { borda2: "#8a5a80" });
  for (let x = 238; x < GW; x += 9 + Math.floor(rnd() * 5)) casa(m, x, Math.round(morro(x + 4)) + 1, 6 + Math.floor(rnd() * 3), 3, "#2e2448", "#ffc8a0", "#ffd88a");
  chao(f, 199, "#1c1630");
  for (let x = 0; x < GW; x += 18) { retangulo(f, x, 187, 2, 12, "#1a1530"); f.px(x, 187, "#ffb08a"); }
  retangulo(f, 0, 189, GW, 2, "#2a2242"); retangulo(f, 0, 189, GW, 1, "#ffb08a"); retangulo(f, 0, 194, GW, 1, "#2a2242");
  poste(f, 286, 74, "#1a1530", "#ffb08a");
  fio(f, -10, 92, 280, 78, 16, "#1a1530"); fio(f, -10, 98, 282, 87, 18, "#1a1530"); fio(f, 292, 78, 330, 84, 4, "#1a1530");
  silhueta(f, (x, y) => y >= 199 && y < 204 && (x * 5) % 7 < 3 && y >= 199 + ((x * 11) % 4), "#120e22", "#3a2a50");
  await salvar("deserto", { ceu: c, astro: a, distante: d, meio: m, frente: f });
}

console.log("5 cenários anime gerados: camadas webp (desktop 640x1680, celular 320x840) + composição.");
