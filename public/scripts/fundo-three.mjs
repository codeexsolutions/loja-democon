import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const HEIGHT=4200, WIDTH=1600;
const LAYERS=[['ceu',-120],['astro',-60],['distante',0],['meio',70],['frente',140]];
const WORLDS=new Set(['santuario','cidade','floresta','espaco','deserto']);
const clamp=THREE.MathUtils.clamp;

export function mount(host){
 let disposed=false, frame=0, version=0, lastTime=0, elapsed=0, meshes=[], actors=[], particles=[], active='', scrollMax=1, progress=0, viewHeight=900;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});}catch{host.dataset.estado='estatico';return()=>{};}
 renderer.setPixelRatio(Math.min(1,1100/window.innerWidth));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor(0x08070c,0);
 renderer.domElement.setAttribute('aria-hidden','true');
 host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-800,800,450,-450,1,3000);
 camera.position.set(0,-450,1000);
 const mouse=new THREE.Vector2(), pointerPosition=new THREE.Vector2();
 const loader=new THREE.TextureLoader();
 const mobile=()=>window.innerWidth<768;
 function release(list){for(const object of list){scene.remove(object);object.geometry.dispose();object.material.map?.dispose();object.material.dispose();}}
 function measureDocument(){scrollMax=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);}
 function fit(){
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
  renderer.setSize(w,h,false);
  const worldWidth=mobile()?Math.max(800,1600*w/900):1600;
  viewHeight=Math.min(HEIGHT-300,worldWidth*h/w);
  const actualWidth=viewHeight*w/h;
  camera.left=-actualWidth/2;camera.right=actualWidth/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();
  measureDocument();progress=0;wake();
 }
 function makeParticles(name){
  // Separate star, atmospheric and water layers: no full-image crop or repeated tile.
  const palettes={santuario:['#e5dbff','#eab998'],cidade:['#d5e7ff','#85b9d8'],floresta:['#ddf0ec','#b4ddb0'],espaco:['#dde5ff','#9eaed8'],deserto:['#eadbda','#d9b391']};
  return [0,1].map(kind=>{
   const count=kind?(name==='floresta'?12:0):(mobile()?24:48), positions=[],phases=[];
   for(let i=0;i<count;i++){positions.push((Math.random()-.5)*WIDTH,-(kind?1000+Math.random()*3200:Math.random()*1500),kind?170:-40);phases.push(Math.random()*Math.PI*2);}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));
   const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms:{time:{value:0},color:{value:new THREE.Color(palettes[name][kind])},size:{value:(kind?3.0:2.3)*renderer.getPixelRatio()},kind:{value:kind}},vertexShader:`attribute float phase; uniform float time; uniform float size; uniform float kind; varying float alpha; void main(){vec3 p=position; p.x+=sin(time*.17+phase)*kind*20.; p.y+=sin(time*.25+phase*2.)*kind*14.; alpha=.25+.65*pow(.5+.5*sin(time*(kind>.5?1.1:.65)+phase),2.); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); gl_PointSize=size*(.7+alpha*.5);}`,fragmentShader:`uniform vec3 color; varying float alpha; void main(){vec2 p=abs(gl_PointCoord-.5); if(p.x+p.y>.5)discard; gl_FragColor=vec4(color,alpha);}`});
   const points=new THREE.Points(geometry,material);points.renderOrder=kind?9:2;scene.add(points);return points;
  });
 }
 function spriteTexture(name){
  const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d');
  if(name==='santuario'){
   ctx.fillStyle='#b77e63';ctx.fillRect(51,7,26,4);ctx.fillRect(51,45,26,4);ctx.fillStyle='#e7b282';ctx.fillRect(49,12,30,32);ctx.fillStyle='#f5d8a8';ctx.fillRect(58,14,12,27);ctx.fillStyle='#9b6a58';ctx.fillRect(63,49,2,10);
  }else if(name==='cidade'){
   ctx.fillStyle='#8ba4b5';ctx.fillRect(5,20,115,25);ctx.fillStyle='#354660';ctx.fillRect(12,23,102,14);ctx.fillStyle='#ebc29b';for(let i=0;i<8;i++)ctx.fillRect(15+i*13,26,8,7);ctx.fillStyle='#5c7487';ctx.fillRect(5,42,115,5);
  }else if(name==='espaco'){
   ctx.fillStyle='#91a8c1';ctx.beginPath();ctx.moveTo(110,32);ctx.lineTo(30,15);ctx.lineTo(42,32);ctx.lineTo(30,49);ctx.closePath();ctx.fill();ctx.fillStyle='#d8c9a9';ctx.fillRect(57,27,23,8);ctx.fillStyle='#739ac0';ctx.fillRect(16,29,26,6);
  }else if(name==='floresta'){
   ctx.fillStyle='#99c2bd';ctx.fillRect(58,10,3,32);ctx.fillRect(69,25,2,29);
  }else{
   ctx.strokeStyle='#b8a3a2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(43,32);ctx.quadraticCurveTo(51,19,64,32);ctx.quadraticCurveTo(77,19,85,32);ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;return texture;
 }
 function makeActors(name){
  const count={santuario:0,cidade:1,floresta:8,espaco:0,deserto:0}[name];
  return Array.from({length:count},(_,i)=>{
   const material=new THREE.MeshBasicMaterial({map:spriteTexture(name),transparent:true,depthWrite:false,depthTest:false,toneMapped:false,opacity:name==='floresta'?.42:.8});
   const object=new THREE.Mesh(new THREE.PlaneGeometry(128,64),material);
   const x=name==='floresta'?270+Math.random()*180:(Math.random()-.5)*1400;
   const y=name==='cidade'?-1995:name==='floresta'?-(2170+Math.random()*1200):-(500+Math.random()*3000);
   object.userData={x,y,phase:i*1.73,speed:.3+Math.random()*.7,name};object.position.set(x,y,170);object.renderOrder=8;
   const size=name==='cidade'?1.45:name==='floresta'?.6:name==='santuario'?.6:.7;object.scale.setScalar(size);scene.add(object);return object;
  });
 }
 const meteorGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-65,30,0),new THREE.Vector3(0,0,0)]);
 const meteor=new THREE.Line(meteorGeometry,new THREE.LineBasicMaterial({color:0xd4e1ef,transparent:true,opacity:0,depthTest:false,depthWrite:false}));meteor.renderOrder=3;scene.add(meteor);
 function draw(time){
  frame=0;if(disposed||document.hidden)return;
  const interval=1000/24;
  if(lastTime&&time-lastTime<interval){wake();return;}
  const dt=Math.min((time-lastTime)/1000||.033,.08);lastTime=time;elapsed+=dt;
  progress=0; // fundo fixo: não acompanha a rolagem
  pointerPosition.lerp(mouse,1-Math.exp(-3*dt));
  camera.position.set(pointerPosition.x*12,-viewHeight/2-progress*(HEIGHT-viewHeight)+pointerPosition.y*5,1000);
  camera.lookAt(pointerPosition.x*4,camera.position.y-pointerPosition.y*4,0);
  for(let i=0;i<meshes.length;i++){
   const depth=i/4;meshes[i].position.x=pointerPosition.x*depth*22;
   meshes[i].position.y=-HEIGHT/2+(progress-.5)*depth*120;
  }
  for(const p of particles)p.material.uniforms.time.value=elapsed;
  for(const a of actors){
   const {x,y,phase,speed,name}=a.userData;
   if(name==='cidade'){const t=(elapsed*.015)%1;a.position.x=-900+t*1800;a.position.y=-(1900*(1-t)**2+4300*t*(1-t)+1770*t*t)+25;}
   else if(name==='floresta'){a.position.y=-2130-((elapsed*100*speed+(-y-2130))%1280);a.position.x=x;}
   else if(name==='espaco'){a.position.x=((x+elapsed*17*speed+950)%1900)-950;a.position.y=y+Math.sin(elapsed*.22+phase)*18;}
   else if(name==='deserto'){a.position.x=((x+elapsed*10*speed+950)%1900)-950;a.position.y=y+Math.sin(elapsed*.7+phase)*6;a.scale.y=.7+Math.sin(elapsed*3+phase)*.12;}
   else{a.position.x=x+Math.sin(elapsed*.3+phase)*22;a.position.y=-300-((-y+elapsed*12*speed)%3500);a.rotation.z=Math.sin(elapsed*.5+phase)*.06;}
  }
  const shooting=0;meteor.material.opacity=shooting>14&&shooting<15.4?Math.sin((shooting-14)/1.4*Math.PI)*.7:0;
  if(meteor.material.opacity){meteor.position.set(-400+(shooting-14)*650,-180-(shooting-14)*270,30);}
  renderer.render(scene,camera);wake();
 }
 function wake(){if(!disposed&&!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
 function pointer(){} // fundo fixo: não acompanha o mouse
 function reset(){mouse.set(0,0);}
 function visible(){lastTime=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();}
 async function loadScene(){
  const name=WORLDS.has(document.documentElement.dataset.dmcFundo)?document.documentElement.dataset.dmcFundo:'santuario';
  if(active===name)return;active=name;const request=++version;
  const results=await Promise.allSettled(LAYERS.map(async([layer,z],i)=>{
   const texture=await loader.loadAsync('/arte/mundo-'+name+'-'+layer+(mobile()?'-mobile':'')+'.webp');
   texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.NearestFilter;texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(WIDTH,HEIGHT),new THREE.MeshBasicMaterial({map:texture,transparent:i!==0,depthWrite:false,depthTest:false,toneMapped:false}));
   mesh.scale.set(1.1,1.1,1);mesh.position.set(0,-HEIGHT/2,z);mesh.renderOrder=i;return mesh;
  }));
  const ready=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(disposed||request!==version||results.some(r=>r.status==='rejected')){release(ready);if(request===version)active='';return;}
  release(meshes);release(actors);release(particles);meshes=ready;meshes.forEach(m=>scene.add(m));particles=makeParticles(name);actors=makeActors(name);fit();host.dataset.estado='pronto';
 }
 function lost(e){e.preventDefault();cancelAnimationFrame(frame);frame=0;host.dataset.estado='estatico';}
 function restored(){active='';loadScene();}
 const resize=new ResizeObserver(fit);resize.observe(host);
 const pageResize=new ResizeObserver(measureDocument);pageResize.observe(document.body);
 const observer=new MutationObserver(loadScene);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-dmc-fundo']});
 window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('blur',reset);document.documentElement.addEventListener('pointerleave',reset);document.addEventListener('visibilitychange',visible);
 renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
 fit();loadScene();
 return()=>{disposed=true;version++;cancelAnimationFrame(frame);resize.disconnect();pageResize.disconnect();observer.disconnect();window.removeEventListener('pointermove',pointer);window.removeEventListener('blur',reset);document.documentElement.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',visible);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);release([...meshes,...actors,...particles,meteor]);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();delete host.dataset.estado;};
}


