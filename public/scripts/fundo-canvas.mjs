// Pixel-art layers are pre-rasterized; the scenery only redraws while interacting.
const WORLDS=new Set(['santuario','cidade','floresta','espaco','deserto']);
const W=1600,H=4200,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function mountCanvas(host){
 const canvas=document.createElement('canvas'),fx=document.createElement('canvas');
 const base=canvas.getContext('2d',{alpha:false}),ctx=fx.getContext('2d');if(!base||!ctx)return()=>{};
 for(const c of [canvas,fx]){c.setAttribute('aria-hidden','true');c.style.position='absolute';c.style.inset='0';host.appendChild(c);}
 let dead=false,frame=0,last=0,time=0,images=[],request=0,name='',w=1,h=1,viewH=900,scale=1,maxScroll=1,progress=0,mx=0,my=0,px=0,py=0,dirty=true;
 const stars=Array.from({length:48},(_,i)=>({x:Math.random()*W,y:Math.random()*1350,phase:Math.random()*6.28,size:i%8?2:4}));
 function measure(){maxScroll=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);wake();}
 function fit(){w=Math.max(1,host.clientWidth);h=Math.max(1,host.clientHeight);const density=Math.min(1,(w<768?480:1100)/w);for(const c of [canvas,fx]){c.width=Math.round(w*density);c.height=Math.round(h*density);c.style.width=w+'px';c.style.height=h+'px';}const worldW=w<768?Math.max(800,1600*w/900):1600;viewH=Math.min(H-300,worldW*h/w);scale=h/viewH;measure();progress=0;dirty=true;wake();}
 function transform(context){const d=canvas.width/w;context.setTransform(d,0,0,d,0,0);context.translate(w/2,0);context.scale(scale,scale);context.translate(-px*12,-py*5);context.imageSmoothingEnabled=false;}
 function background(offset){
  base.setTransform(1,0,0,1,0,0);base.fillStyle='#08070c';base.fillRect(0,0,canvas.width,canvas.height);transform(base);
  images.forEach((img,i)=>base.drawImage(img,-W*.55+px*(i/4)*28,-H*.05-offset-(progress-.5)*(i/4)*120,W*1.1,H*1.1));
 }
 function atmosphere(offset){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,fx.width,fx.height);transform(ctx);
  for(const s of stars){const y=s.y-offset;if(y<-10||y>viewH)continue;ctx.globalAlpha=.2+.5*Math.pow(.5+.5*Math.sin(time*.6+s.phase),2);ctx.fillStyle='#dbe5f4';ctx.fillRect(s.x-W/2,y,s.size,s.size);}
  ctx.globalAlpha=1;
  // Only one environment-specific detail, kept in its physical location.
  if(name==='floresta'){
   for(let i=0;i<9;i++){const y=2150+((time*65+i*130)%1200)-offset;if(y<0||y>viewH)continue;ctx.globalAlpha=.35;ctx.fillStyle='#a3d2d0';ctx.fillRect(270+(i%4)*21,y,2,12);}
  }else if(name==='cidade'){
   const t=(time*.015)%1,x=-100+1800*t,y=1900*(1-t)**2+4300*t*(1-t)+1770*t*t-offset;
   if(y>-50&&y<viewH+50){ctx.fillStyle='#7794a8';ctx.fillRect(x-W/2,y-25,110,22);ctx.fillStyle='#e4bd90';for(let i=0;i<7;i++)ctx.fillRect(x-W/2+7+i*14,y-20,7,7);}
  }else if(name==='santuario'){
   for(const [x,y] of [[140,1320],[1300,1740],[1180,2940]])if(y-offset>0&&y-offset<viewH){ctx.fillStyle='#e1af7c';ctx.globalAlpha=.4+Math.sin(time*1.1+x)*.12;ctx.fillRect(x-800,y-offset,6,9);}
  }
  ctx.globalAlpha=1;
 }
 function draw(stamp){
  frame=0;if(dead||document.hidden)return;
  if(last&&stamp-last<1000/24){wake();return;}
  const dt=Math.min((stamp-last)/1000||.042,.08);last=stamp;time+=dt;
  const target=0,old=progress,oldX=px,oldY=py;
  progress+=(target-progress)*(1-Math.exp(-7*dt));px+=(mx-px)*(1-Math.exp(-5*dt));py+=(my-py)*(1-Math.exp(-5*dt));
  const moving=Math.abs(target-progress)>.00002||Math.abs(mx-px)+Math.abs(my-py)>.002;
  const changed=Math.abs(progress-old)>.000002||Math.abs(px-oldX)+Math.abs(py-oldY)>.0002;
  const offset=progress*(H-viewH);
  if(images.length&&(dirty||changed)){background(offset);dirty=false;}
  atmosphere(offset);
  const ambient=offset<1400||(name==='floresta'&&offset<3400&&offset+viewH>2100)||(name==='cidade'&&offset<2200&&offset+viewH>1700)||(name==='santuario'&&offset<3000);
  if(moving||ambient)wake();
 }
 function wake(){if(!dead&&!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
 async function load(){
  const next=WORLDS.has(document.documentElement.dataset.dmcFundo)?document.documentElement.dataset.dmcFundo:'santuario';if(next===name)return;name=next;const version=++request;
  try{const nextImages=await Promise.all(['ceu','astro','distante','meio','frente'].map(layer=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='/arte/mundo-'+next+'-'+layer+(w<768?'-mobile':'')+'.webp';})));if(dead||version!==request)return;images=nextImages;dirty=true;host.dataset.estado='pronto';wake();}catch{if(version===request)name='';}
 }
 function pointer(){} // fundo fixo: não acompanha o mouse
 function reset(){mx=my=0;wake();}
 function visibility(){last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{dirty=true;wake();}}
 const resize=new ResizeObserver(fit);resize.observe(host);const pageResize=new ResizeObserver(measure);pageResize.observe(document.body);
 const observer=new MutationObserver(load);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-dmc-fundo']});
 window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('scroll',wake,{passive:true});window.addEventListener('blur',reset);document.documentElement.addEventListener('pointerleave',reset);document.addEventListener('visibilitychange',visibility);
 fit();load();wake();
 return()=>{dead=true;request++;cancelAnimationFrame(frame);resize.disconnect();pageResize.disconnect();observer.disconnect();window.removeEventListener('pointermove',pointer);window.removeEventListener('scroll',wake);window.removeEventListener('blur',reset);document.documentElement.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',visibility);images=[];canvas.remove();fx.remove();};
}
