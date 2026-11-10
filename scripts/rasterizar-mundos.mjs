import sharp from 'sharp';
const worlds=['santuario','cidade','floresta','espaco','deserto'];
for(const world of worlds)for(const layer of ['ceu','astro','distante','meio','frente']){
 const base=`public/arte/mundo-${world}-${layer}`;
 await sharp(base+'.svg').resize(800,2100,{kernel:'nearest'}).webp({lossless:true}).toFile(base+'.webp');
 await sharp(base+'.svg').resize(480,1260,{kernel:'nearest'}).webp({lossless:true}).toFile(base+'-mobile.webp');
}
console.log('50 optimized pixel-art layers generated.');
