// Pinned module. Native browser modules also resolve Three's relative core import.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const PLANOS = [ ['ceu', -160], ['astro', -100], ['distante', -45], ['meio', 15], ['frente', 75] ];
const CENAS = new Set(['santuario','cidade','floresta','espaco','deserto','arcade']);

export function mount(host) {
  let disposed = false, frame = 0, version = 0, lastTime = 0;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch { host.dataset.estado = 'estatico'; return () => {}; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x08070c, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 1500);
  camera.position.set(0, 0, 600);
  const mouse = new THREE.Vector2();
  const loader = new THREE.TextureLoader();
  let meshes = [];
  let activeScene = '';
  function release(list) {
    for (const mesh of list) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
  }
  function fit() {
    const width = Math.max(1,host.clientWidth), height = Math.max(1,host.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    for (const mesh of meshes) {
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (600 - mesh.position.z);
      const planeHeight = Math.max(viewHeight, viewHeight * camera.aspect / (16 / 9)) * 1.16;
      mesh.scale.set(planeHeight * 16 / 9, planeHeight, 1);
    }
    wake();
  }
  function draw(time) {
    frame = 0;
    if (disposed || document.hidden) return;
    const dt = Math.min((time - lastTime) / 1000 || 0.016,0.05);
    lastTime = time;
    const tx = mouse.x * 24;
    const ty = -mouse.y * 14 + Math.min(window.scrollY,1800) * 0.009;
    camera.position.x = THREE.MathUtils.damp(camera.position.x,tx,5,dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y,ty,5,dt);
    camera.lookAt(0,0,-30);
    renderer.render(scene,camera);
    if (Math.abs(camera.position.x-tx)+Math.abs(camera.position.y-ty)>0.02) wake();
  }
  function wake() { if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(draw); }
  function pointer(event) {
    if(event.pointerType !== 'mouse') return;
    mouse.set(event.clientX/window.innerWidth*2-1,event.clientY/window.innerHeight*2-1);
    wake();
  }
  function reset() { mouse.set(0,0); wake(); }
  function visible() { lastTime = 0; wake(); }
  async function loadScene() {
    const name = CENAS.has(document.documentElement.dataset.dmcFundo) ? document.documentElement.dataset.dmcFundo : 'santuario';
    if (activeScene === name) return;
    activeScene = name;
    const request = ++version;
    const results = await Promise.allSettled(PLANOS.map(async ([layer,z],index) => {
      const texture = await loader.loadAsync('/arte/fundo-'+name+'-'+layer+'.svg');
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
      mesh.position.z = z;
      mesh.renderOrder = index;
      return mesh;
    }));
    const ready = results.filter(r=>r.status==='fulfilled').map(r=>r.value);
    if(disposed || request!==version || results.some(r=>r.status==='rejected')) { release(ready); return; }
    release(meshes); meshes = ready;
    meshes.forEach(mesh=>scene.add(mesh));
    fit();
    renderer.render(scene,camera);
    host.dataset.estado = 'pronto';
  }
  const resize = new ResizeObserver(fit); resize.observe(host);
  const observer = new MutationObserver(loadScene); observer.observe(document.documentElement,{ attributes: true, attributeFilter: ['data-dmc-fundo'] });
  window.addEventListener('pointermove',pointer,{passive:true});
  window.addEventListener('scroll',wake,{passive:true});
  window.addEventListener('blur',reset);
  document.documentElement.addEventListener('pointerleave',reset);
  document.addEventListener('visibilitychange',visible);
  renderer.domElement.addEventListener('webglcontextlost',()=>{ host.dataset.estado='estatico'; },{once:true});
  fit(); loadScene();
  return () => {
    disposed = true; version++; cancelAnimationFrame(frame);
    resize.disconnect(); observer.disconnect();
    window.removeEventListener('pointermove',pointer);
    window.removeEventListener('scroll',wake);
    window.removeEventListener('blur',reset);
    document.documentElement.removeEventListener('pointerleave',reset);
    document.removeEventListener('visibilitychange',visible);
    release(meshes); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    delete host.dataset.estado;
  };
}
window.democonThree = { mount };
window.dispatchEvent(new Event('democon:three-ready'));