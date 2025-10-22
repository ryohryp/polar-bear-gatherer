// math helpers
export function clamp(v, mi, ma){ return v<mi?mi: v>ma?ma: v; }
export function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }

// internal image cache (src -> Image)
const _imageCache = new Map();
let _warned = new Set();

// load image with caching; resolves to Image, rejects on error
export async function loadImage(src){
  if(_imageCache.has(src)) return _imageCache.get(src);
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>{ _imageCache.set(src, img); resolve(img); };
    img.onerror = (e)=>{
      if(!_warned.has(src)){
        _warned.add(src);
        console.warn(`[PBG] image load failed: ${src}`);
      }
      reject(e);
    };
    img.src = src;
  });
}

// compute frame rect on a grid sheet
export function getFrameRect(index, gridCols, gridRows, size){
  const col = index % gridCols;
  const row = Math.floor(index / gridCols) % gridRows;
  const sx = col * size;
  const sy = row * size;
  return { sx, sy, sw: size, sh: size };
}

// draw single frame at destination
export function drawFrame(ctx, img, frameIndex, grid, dx, dy, size){
  const { sx, sy, sw, sh } = getFrameRect(frameIndex, grid.cols, grid.rows, size);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, size, size);
}
