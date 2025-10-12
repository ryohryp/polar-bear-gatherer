export function clamp(v, mi, ma){ return v<mi?mi: v>ma?ma: v; }
export function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }
