import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const out='public/arte', W=1600, H=4200;
mkdirSync(out,{recursive:true});
let seed=173;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const r=(x,y,w,h,c,o=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" opacity="${o}"/>`;
const path=(d,c,o=1,stroke='',sw=1)=>`<path d="${d}" fill="${c}" opacity="${o}"${stroke?` stroke="${stroke}" stroke-width="${sw}"`:''}/>`;
const circle=(x,y,rad,c,o=1)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${c}" opacity="${o}"/>`;
const stars=()=>Array.from({length:65},()=>{const x=random()*W,y=random()*1450,s=random()>.92?4:2;return r(x,y,s,s,'#dce7ff',.18+random()*.5);}).join('');
const ridge=(y,amp,c,phase=0)=>{let d=`M-100 ${H+100}V${y}`;for(let x=-100;x<=1700;x+=16)d+=`H${x}V${Math.round((y+Math.sin(x/185+phase)*amp+Math.sin(x/62+phase)*amp*.22)/8)*8}`;return path(d+`V${H+100}Z`,c);};

const shade=(hex,n)=>'#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+n)).toString(16).padStart(2,'0')).join('');
const block=(x,y,w,h,d,c)=>path('M'+x+' '+y+'l'+d+'-'+d+'h'+w+'l-'+d+' '+d+'Z',shade(c,24))+r(x,y,w,h,c)+path('M'+(x+w)+' '+y+'l'+d+'-'+d+'v'+h+'l-'+d+' '+d+'Z',shade(c,-20));
const pine=(x,y,h,c)=>{let s=block(x-9,y-h*.3,18,h*.3,12,shade(c,-4));for(let i=0;i<4;i++){const w=h*(.55-i*.12);s+=block(x-w/2,y-h*.42-i*h*.16,w,h*.15,h*.08,shade(c,i*5));}return s;};
const branch=(x,y,flip=1)=>'<g transform="translate('+x+' '+y+') scale('+flip+' 1)">'+block(0,-270,30,300,20,'#172734')+block(20,-210,110,28,18,'#1c2d38')+block(95,-310,100,70,30,'#27404b')+block(20,-365,120,80,32,'#304b52')+'</g>';
const moon=(x,y,size,c)=>{let s='';const radius=size*.75,step=12;for(let yy=-radius;yy<radius;yy+=step)for(let xx=-radius;xx<radius;xx+=step){const a=xx/radius,b=yy/radius;if(a*a+b*b>.96)continue;const z=Math.sqrt(1-a*a-b*b),light=(-a*.45-b*.4+z*.65);s+=r(Math.round((x+xx)/step)*step,Math.round((y+yy)/step)*step,step,step,shade(c,Math.round((light-.5)*65)));}return s;};
const cloud=(x,y,s,c)=>'<g transform="translate('+x+' '+y+') scale('+s+')" opacity=".45">'+block(0,30,220,16,18,c)+block(45,0,100,30,18,shade(c,4))+'</g>';
const torii=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+s+')">'+block(30,40,22,210,12,'#754255')+block(245,40,22,210,12,'#754255')+block(5,18,290,24,14,'#a45f72')+block(20,83,260,13,8,'#9a5967')+block(142,50,16,40,6,'#b89b78')+'</g>';
const building=(x,y,w,h,c,lit=false)=>{let s=block(x,y,w,h,24,c)+block(x+15,y-20,w-35,20,12,shade(c,4));if(lit)for(let yy=y+25;yy<y+h-15;yy+=52)for(let xx=x+14;xx<x+w-12;xx+=30)if(random()>.5)s+=r(xx,yy,7,12,random()>.55?'#e5b17e':'#61b8c4',.4);return s;};
const crystal=(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M0 0L25-90 55-120 78-45 60 15Z',c)}${path('M25-90L40 5 60 15 55-120Z','#d4ebff',.18)}</g>`;
const waterfall=(x,y,w,h)=>r(x,y,w,h,'#386c85',.5)+r(x+w*.2,y,w*.12,h,'#7ac5cc',.36)+r(x+w*.55,y,w*.05,h,'#c0e5db',.3)+Array.from({length:20},()=>r(x+random()*w,y+random()*h,2,15+random()*35,'#a1dcdd',.4)).join('');
const wrap=s=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="4200" viewBox="0 0 1600 4200"><g shape-rendering="crispEdges">${s}</g></svg>`;
function save(name,colors,layers){
 const sky=`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>${r(0,0,W,H,'url(#sky)')}${stars()}`;
 const parts={ceu:sky,...layers};
 for(const [key,value] of Object.entries(parts))writeFileSync(join(out,`mundo-${name}-${key}.svg`),wrap(value));
 writeFileSync(join(out,`mundo-${name}.svg`),wrap(Object.values(parts).join('')));
}
// Moon -> floating gates -> lantern stairs -> reflecting lake.
{
 const astro=moon(1230,300,170,'#e8ccc0')+cloud(60,470,2,'#6e557c')+cloud(970,850,1.5,'#6e557c');
 const distante=ridge(1250,150,'#302845',1)+ridge(1750,120,'#24243b',3);
 let meio=block(-60,1390,480,2300,85,'#3c354d')+torii(125,1135,.9)+block(1180,1760,500,2100,75,'#343247')+torii(1280,1550,.8);
 meio+=path('M690 4200C1200 3650 290 3320 670 2890S1200 2420 900 2090L960 2080C1300 2450 780 2770 760 2990S1350 3680 850 4200Z','#6b5265',.55);
 for(let i=0;i<16;i++){const t=i/15,y=2820+t*1300,x=665+Math.sin(t*Math.PI*2)*85+t*80;meio+=block(x-45,y,90+t*40,8,10,'#615366');}
 meio+=torii(1010,2690,1.3)+torii(170,3400,1.15)+path('M0 3830Q800 3710 1600 3900V4200H0Z','#203143');
 for(let i=0;i<65;i++)meio+=r(random()*1600,3860+random()*340,20+random()*90,2,'#a08eaa',.22);
 let frente=branch(-50,1200)+branch(1650,2200,-1)+pine(55,3700,700,'#101827')+pine(1560,4150,850,'#101827');
 for(let i=0;i<6;i++)frente+=r(i%2?1480:70,2450+i*220,8,65,'#574359')+r(i%2?1464:54,2428+i*220,40,32,'#d39769',.7);
 save('santuario',['#101126','#332541','#242239','#101c2e'],{astro,distante,meio,frente});
}
// Rooftops -> elevated railway -> neon alleys -> harbour.
{
 const astro=moon(1180,280,135,'#a6bddc')+cloud(0,660,2,'#3c4b74')+cloud(1100,940,1.7,'#4c4775');
 let distante='';for(let x=-50;x<1700;x+=95){const y=1050+random()*450;distante+=building(x,y,85,H-y,'#182c46');}
 let meio='';for(let x=-80;x<1700;x+=230){const y=1600+random()*600;meio+=building(x,y,160,H-y,'#162339',true);}
 meio+=path('M-100 1900Q800 2150 1700 1770L1700 1815Q800 2195-100 1945Z','#547082')+path('M-100 1940Q800 2190 1700 1810','none',1,'#182032',20);
 for(let x=160;x<1600;x+=380)meio+=r(x,2000,20,600,'#27374b');
 meio+=r(0,3630,1600,570,'#101e33');for(let i=0;i<140;i++)meio+=r(random()*1600,3670+random()*500,15+random()*120,2,random()>.5?'#72bec9':'#c07d99',.25);
 let frente=building(-70,2450,280,1330,'#0c182a',true)+building(1400,2260,280,1520,'#0c182a',true);
 frente+=r(110,2580,75,260,'#723a63')+r(122,2592,51,236,'#231e3b');for(let i=0;i<5;i++)frente+=r(136,2610+i*42,23,20,'#ee9dbd',.7);
 frente+=r(1440,2440,105,52,'#396d83')+r(1452,2452,81,5,'#9bd9e2')+path('M0 3190Q800 3370 1600 3030','none',.6,'#7793a6',3);
 for(let i=0;i<18;i++)frente+=circle(i*100,3190+Math.sin(i/5)*100,4,'#e6b68b',.75);
 save('cidade',['#080f26','#253b59','#202138','#0a172a'],{astro,distante,meio,frente});
}
// Canopy -> waterfall -> stone bridge -> luminous roots and pools.
{
 const astro=moon(1180,260,150,'#cae4d3')+cloud(100,610,1.8,'#38606d');
 const distante=ridge(1100,180,'#254455')+ridge(1720,110,'#1b3542',2);
 let meio='';for(let x=-100;x<1700;x+=180)meio+=pine(x,1820+random()*220,450+random()*300,'#173a40');
 meio+=block(-80,2180,610,1350,100,'#28434a')+block(1050,2130,600,1350,100,'#24404a')+waterfall(1050,2130,125,1310)+waterfall(1110,2240,160,1200);
 meio+=path('M360 2860Q800 2540 1250 2830L1250 2900Q800 2640 360 2930Z','#536164')+path('M0 3500Q600 3290 1600 3510V4200H0Z','#13313c');
 for(let i=0;i<100;i++)meio+=r(random()*1600,3480+random()*650,15+random()*90,2,'#70aaa4',.22);
 let frente=branch(-100,1400)+branch(1670,1700,-1)+path('M0 2200C300 2700 20 3500 370 4200H0Z','#0b222d')+path('M1600 2600C1260 2900 1590 3600 1230 4200H1600Z','#0b222d');
 for(let i=0;i<10;i++){const x=i%2?1330+random()*250:random()*250,y=3100+random()*1000;frente+=r(x,y,4,25,'#4b7376')+path(`M${x-15} ${y}Q${x+2} ${y-23} ${x+20} ${y}Z`,i%3?'#6fc6b3':'#a69ed9',.7);}
 save('floresta',['#0b1d30','#25434d','#16363d','#0b202d'],{astro,distante,meio,frente});
}
// Ringed planet -> orbital station -> atmosphere -> crystalline landing site.
{
 const astro=`<ellipse cx="1200" cy="430" rx="350" ry="85" fill="none" stroke="#aa9bbd" stroke-width="18" opacity=".5" transform="rotate(-25 1200 430)"/>`+moon(1200,430,250,'#817497')+circle(260,1250,70,'#8d969e',.7);
 const distante=path('M-100 2400Q800 1780 1700 2400V4200H-100Z','#262d48')+path('M-100 2530Q800 1950 1700 2530','none',.4,'#6e8aab',12)+ridge(3270,110,'#25253e',1);
 let meio=`<g transform="translate(270 1720) rotate(-18)"><ellipse rx="250" ry="75" fill="none" stroke="#697b90" stroke-width="16"/>${r(-95,-32,190,64,'#91a4ae')}${r(-65,-13,130,10,'#d0bd91')}${r(-300,-12,200,24,'#34506b')}${r(100,-12,200,24,'#34506b')}</g>`+ridge(3700,150,'#1b2034',3);
 for(let i=0;i<6;i++)meio+=crystal(random()*1600,3500+random()*700,.3+random()*1.3,'#4b6382');
 const frente=path('M0 3900L150 3720 330 3990 450 4200H0Z','#101729')+path('M1280 4200L1450 3820 1600 3690V4200Z','#101729')+crystal(110,4070,2,'#66749b')+crystal(1400,3960,1.8,'#486e89');
 save('espaco',['#080e25','#1e2241','#27344a','#11182e'],{astro,distante,meio,frente});
}
// Evening dunes -> abandoned observatory -> caravan path -> oasis.
{
 const astro=moon(1180,330,185,'#e2ae86')+cloud(60,680,2,'#8b6370')+cloud(1150,1120,1.4,'#8b6370');
 const distante=ridge(1430,140,'#71505c',1)+ridge(2130,170,'#513e50',2)+ridge(3000,150,'#382f43',4);
 let meio=block(100,1530,80,450,45,'#584656')+block(370,1530,80,450,45,'#584656')+block(100,1500,350,65,45,'#98717a')+block(1160,2420,45,520,30,'#85646a')+block(1380,2350,48,590,30,'#765964')+r(1130,2400,110,25,'#a8827e')+r(1350,2330,110,25,'#a8827e');
 meio+=path('M690 4200Q1220 3640 860 3160T1020 2450L1050 2450Q650 2850 930 3180T830 4200Z','#a77c78',.23)+path('M250 3810Q800 3590 1390 3830Q850 4140 250 3810Z','#25434d');
 for(let i=0;i<65;i++)meio+=r(400+random()*850,3800+random()*100,20+random()*70,2,'#87b3ae',.3);
 let frente=path('M0 3550Q250 3600 470 4200H0Z','#292536')+path('M1600 3450Q1370 3710 1200 4200H1600Z','#292536');
 for(const [x,y] of [[190,3760],[1420,3950]]){frente+=path(`M${x} ${y}q-45-220 15-390`,'none',1,'#1b2836',15);for(let i=0;i<6;i++)frente+=path(`M${x+15} ${y-390}q${(i-3)*65} -100 ${(i-3)*100} ${i%2?45:10}`,'none',1,'#283c43',18);}
 save('deserto',['#29243e','#805e70','#574253','#202639'],{astro,distante,meio,frente});
}
console.log('5 worlds generated: 1600 x 4200, 5 semantic layers each.');
