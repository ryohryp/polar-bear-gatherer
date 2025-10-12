import { DRAG_THRESHOLD, BASE_W, BASE_H } from '../config.js';
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

function startMoveTo(x,y){ state.moveTarget.active=true; state.moveTarget.x=x; state.moveTarget.y=y; }
function stopMove(){ state.moveTarget.active=false; }

export function attachPointer(){
  const cvs = state.canvas;

  // Touch
  cvs.addEventListener('touchstart', e => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const t = e.touches[0];
    state.dragState.active = true;
    state.dragState.started = false;
    state.dragState.startX = t.clientX;
    state.dragState.startY = t.clientY;
  }, { passive:false });

  cvs.addEventListener('touchmove', e => {
    if (!state.dragState.active) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - state.dragState.startX;
    const dy = t.clientY - state.dragState.startY;
    const moved = Math.hypot(dx, dy);
    if (!state.dragState.started && moved > DRAG_THRESHOLD) state.dragState.started = true;
    if (state.dragState.started) {
      const p = toWorldCoords(t.clientX, t.clientY);
      startMoveTo(p.x, p.y);
    }
  }, { passive:false });

  cvs.addEventListener('touchend',   () => { state.dragState.active=false; state.dragState.started=false; stopMove(); }, { passive:true });
  cvs.addEventListener('touchcancel',() => { state.dragState.active=false; state.dragState.started=false; stopMove(); }, { passive:true });

  // Mouse
  cvs.addEventListener('mousedown', e => {
    state.dragState.active = true;
    state.dragState.started = false;
    state.dragState.startX = e.clientX;
    state.dragState.startY = e.clientY;
  });
  cvs.addEventListener('mousemove', e => {
    if (!state.dragState.active) return;
    const dx = e.clientX - state.dragState.startX;
    const dy = e.clientY - state.dragState.startY;
    const moved = Math.hypot(dx, dy);
    if (!state.dragState.started && moved > DRAG_THRESHOLD) state.dragState.started = true;
    if (state.dragState.started) {
      const p = toWorldCoords(e.clientX, e.clientY);
      startMoveTo(p.x, p.y);
    }
  });
  document.addEventListener('mouseup', () => { state.dragState.active=false; state.dragState.started=false; stopMove(); });

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
