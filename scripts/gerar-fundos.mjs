import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
const out = process.argv[2] || "public/arte";
mkdirSync(out, { recursive: true });
let seed = 23;
const rnd = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
const rect = (x,y,w,h,c,o=1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" opacity="${o}"/>`;
const stars = (c="#cceaff",n=80) => Array.from({length:n},()=>rect(Math.floor(rnd()*160)*10,Math.floor(rnd()*55)*10,4,4,c,.3+rnd()*.6)).join("");
const mountain = (base,amp,c,phase=0) => { let p=`M0 900V${base}`; for(let x=0;x<=1600;x+=20)p+=`H${x}V${Math.round((base+Math.sin(x/170+phase)*amp+Math.sin(x/73)*amp*.3)/10)*10}`; return `<path d="${p}H1600V900Z" fill="${c}"/>`; };
const tree=(x,y,h,c)=>rect(x-10,y-h*.7,20,h*.7,c)+`<path d="M${x} ${y-h}l-${h*.32} ${h*.65}h${h*.64}Z" fill="${c}"/>`;
const wrap=content=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice"><g shape-rendering="crispEdges">${content}</g></svg>`;
function scene(name,top,bottom,parts){
  const sky=`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#sky)"/>`;
  parts.ceu=sky+(parts.ceu||"");
  for(const layer of ['ceu','astro','distante','meio','frente'])writeFileSync(join(out,`fundo-${name}-${layer}.svg`),wrap(parts[layer]||""));
  writeFileSync(join(out,`fundo-${name}.svg`),wrap(['ceu','astro','distante','meio','frente'].map(k=>parts[k]||"").join("")));
}
function buildings(color,windows){let b="";for(let x=-40;x<1660;x+=100){const h=120+Math.floor(rnd()*27)*10,y=760-h;b+=rect(x,y,90,h,color);if(windows){b+=rect(x+40,y-30,4,30,'#81bbd9');for(let yy=y+20;yy<750;yy+=26)for(let xx=x+10;xx<x+80;xx+=20)if(rnd()>.42)b+=rect(xx,yy,8,12,rnd()>.5?'#53b7bc':'#b15c9d',.7);}}return b;}
let river=rect(0,760,1600,140,'#080e24');for(let i=0;i<80;i++)river+=rect(Math.floor(rnd()*160)*10,770+rnd()*130,10+rnd()*80,3,i%2?'#506a9e':'#884075',.4);
scene('cidade','#090e2c','#452348',{ceu:stars(),astro:'<circle cx="1220" cy="180" r="86" fill="#ad83e8" opacity=".65"/>',distante:buildings('#30234c',false),meio:buildings('#121b36',true),frente:river});
let treesBack="",treesFront="";for(let x=-100;x<1700;x+=100)treesBack+=tree(x,800,200+rnd()*130,'#123338');for(let x=-100;x<1700;x+=160)treesFront+=tree(x,920,260+rnd()*110,'#071820');
scene('floresta','#081e32','#244c50',{ceu:stars('#c5efe4'),astro:'<circle cx="350" cy="220" r="95" fill="#c2ead7" opacity=".8"/>',distante:mountain(500,80,'#21414c',1)+mountain(620,60,'#142f3c',2),meio:treesBack,frente:treesFront});
let planet='<ellipse cx="1090" cy="250" rx="255" ry="48" transform="rotate(-24 1090 250)" fill="none" stroke="#899ed0" stroke-width="18" opacity=".6"/><circle cx="1090" cy="250" r="125" fill="#5c65a5"/>';
for(let i=0;i<8;i++)planet+=rect(1000-i*7,160+i*26,150+i*9,8,i%2?'#8390c1':'#424f91',.6);
scene('espaco','#07091d','#292343',{ceu:stars('#c4ccff',140),astro:planet,distante:mountain(670,65,'#28213d',2),meio:mountain(770,45,'#1b172e',1),frente:mountain(860,25,'#110e24',4)});
let sun='<circle cx="1110" cy="290" r="150" fill="#d88b60"/>';for(let y=200;y<450;y+=30)sun+=rect(940,y,340,7,'#46283a',.6);
let cacti=mountain(850,30,'#211d30',4);for(let x=100;x<1500;x+=390)cacti+=rect(x,630,10,85,'#211d30')+rect(x-20,650,20,8,'#211d30')+rect(x-20,630,8,25,'#211d30');
scene('deserto','#2c2138','#95604f',{ceu:stars('#ffd3a6',25),astro:sun,distante:mountain(580,60,'#68404b',.5),meio:mountain(720,75,'#412b3b',2),frente:cacti});
let floor=rect(0,640,1600,260,'#100f24');for(let x=-1000;x<2600;x+=180)floor+=`<path d="M800 640L${x} 900" stroke="#514375" fill="none"/>`;for(let y=660,step=16;y<900;y+=step,step*=1.35)floor+=rect(0,y,1600,2,'#514375',.8);
scene('arcade','#101329','#352445',{ceu:stars('#b6b4fa'),astro:'',distante:mountain(560,45,'#201d39'),meio:'<path d="M580 650V190H1020V650" fill="none" stroke="#6b5d9d" stroke-width="28"/><path d="M610 650V220H990V650" fill="#171529" stroke="#b07bba" stroke-width="5"/>',frente:floor});
const torii=rect(1120,420,22,290,'#d45462')+rect(1350,420,22,290,'#d45462')+rect(1080,400,330,22,'#d45462')+rect(1100,455,290,14,'#d45462')+rect(1090,385,310,14,'#7d394f');
scene('santuario','#140d2b','#49305c',{ceu:stars('#e6cbff'),astro:'<circle cx="380" cy="200" r="76" fill="#eacdc6"/>',distante:mountain(530,70,'#3c2d57',1),meio:mountain(720,45,'#28203d',2)+torii,frente:mountain(850,20,'#130f22')+tree(80,920,390,'#130f22')+tree(1540,920,330,'#130f22')});
const icon=readFileSync('src/app/icon.svg','utf8');const icons=join(out,'../marca');mkdirSync(icons,{recursive:true});for(const [name,color,bg] of [['laranja','#ff8a32','#08070c'],['branco','#f5f3ef','#08070c'],['preto','#f0ede6','#101010']])writeFileSync(join(icons,'icon-'+name+'.svg'),icon.replaceAll('#c4ff4d',color).replaceAll('#08070c',bg));