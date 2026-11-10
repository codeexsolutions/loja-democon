import { mountCanvas } from './fundo-canvas.mjs';
let threeModule;
function mount(host){
 let dead=false,stopCanvas=mountCanvas(host),stopThree;
 const layer=document.createElement('div');layer.className='absolute inset-0';host.appendChild(layer);
 const observer=new MutationObserver(()=>{
  if(layer.dataset.estado==='pronto'){layer.style.visibility='visible';stopCanvas?.();stopCanvas=undefined;host.dataset.estado='pronto';}
  else if(layer.dataset.estado==='estatico'&&!stopCanvas){layer.style.visibility='hidden';stopCanvas=mountCanvas(host);}
 });
 observer.observe(layer,{attributes:true,attributeFilter:['data-estado']});
 threeModule??=import('./fundo-three.mjs').catch(()=>null);
 threeModule.then(module=>{if(!dead&&module)stopThree=module.mount(layer);});
 return()=>{dead=true;observer.disconnect();stopCanvas?.();stopThree?.();layer.remove();delete host.dataset.estado;};
}
window.democonThree={mount};
window.dispatchEvent(new Event('democon:three-ready'));
