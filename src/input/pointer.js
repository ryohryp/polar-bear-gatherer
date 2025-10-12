import { BASE_W, BASE_H, STICK } from '../config.js';
import { state } from '../state.js';
import { clamp } from '../utils.js';

function toWorldCoords(clientX, clientY){
  const rect = state.canvas.getBoundingClientRect();
  const sx = (clientX - rect.left) * (BASE_W / rect.width);
  const sy = (clientY - rect.top) * (BASE_H / rect.height);
  return {
    x: clamp(sx + state.cam.x, 0, state.world.w),
    y: clamp(sy + state.cam.y, 0, state.world.h)
  };
}

function startStick(x, y){
  const s = state.stick;
  s.active = true;
  s.originX = s.curX = x;
  s.originY = s.curY = y;
  s.dirX = 0; s.dirY = 0;
}
function updateStick(x, y){
  const s = state.stick;
  if (!s.active) return;
  s.curX = x; s.curY = y;
  const dx = s.curX - s.originX;
  const dy = s.curY - s.originY;
  const len = Math.hypot(dx, dy);
  if (len <= STICK.DEADZONE){
    s.dirX = 0; s.dirY = 0;
    return;
  }
  const clampLen = Math.min(len, STICK.MAX_RADIUS);
  const nx = dx / (clampLen || 1);
  const ny = dy / (clampLen || 1);
  s.dirX = nx;
  s.dirY = ny;
}
function endStick(){
  const s = state.stick;
  s.active = false;
  s.dirX = 0; s.dirY = 0;
}

export function attachPointer(){
  const cvs = state.canvas;

  // Touch（タップ起点 → ドラッグ方向ベクトル）
  cvs.addEventListener('touchstart', e => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const t = e.touches[0];
    startStick(t.clientX, t.clientY);
  }, { passive:false });

  cvs.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    updateStick(t.clientX, t.clientY);
  }, { passive:false });

  cvs.addEventListener('touchend',   () => { endStick(); }, { passive:true });
  cvs.addEventListener('touchcancel',() => { endStick(); }, { passive:true });

  // Mouse（PCでも同様操作）
  cvs.addEventListener('mousedown', e => {
    startStick(e.clientX, e.clientY);
  });
  cvs.addEventListener('mousemove', e => {
    updateStick(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', () => { endStick(); });

  // D-Pad（PC/コントローラ用に維持）
  const dpad = state.ui.dpad;
  if(dpad){
    const applyDir = (dir, value)=>{
      if(dir==='up') state.touchDir.up = value;
      else if(dir==='down') state.touchDir.down = value;
      else if(dir==='left') state.touchDir.left = value;
      else if(dir==='right') state.touchDir.right = value;
    };
    dpad.querySelectorAll('button').forEach(btn=>{
      const dir = btn.dataset.dir; if(!dir) return;
      const start = e=>{ e.preventDefault(); applyDir(dir, true); };
      const end = ()=>applyDir(dir, false);
      btn.addEventListener('touchstart', start, {passive:false});
      btn.addEventListener('touchend', end);
      btn.addEventListener('touchcancel', end);
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    });
    document.addEventListener('mouseup',   ()=>{ state.touchDir.up=state.touchDir.down=state.touchDir.left=state.touchDir.right=false; });
    document.addEventListener('touchend',  ()=>{ state.touchDir.up=state.touchDir.down=state.touchDir.left=state.touchDir.right=false; });
    document.addEventListener('touchcancel',()=>{ state.touchDir.up=state.touchDir.down=state.touchDir.left=state.touchDir.right=false; });
  }

  // C キー（クラフト）ショートカット
  document.addEventListener('keydown', e=>{
    if(e.key==='c'||e.key==='C'){ state.keys.add('C'); }
  });
  document.addEventListener('keyup', e=>{
    if(e.key==='c'||e.key==='C'){ state.keys.delete('C'); }
  });
}
