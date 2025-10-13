import { DRAG_THRESHOLD } from '../config.js';
import { state } from '../state.js';

function toCanvasCoords(e){
  const rect = state.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function stopDrag(){
  const drag = state.input.drag;
  drag.active = false;
  drag.pointerId = null;
  drag.moved = false;
  drag.dirX = 0;
  drag.dirY = 0;
}

export function attachPointer(){
  const cvs = state.canvas;
  const drag = state.input.drag;
  const threshold = DRAG_THRESHOLD ?? 8;

  const handleDown = (e)=>{
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    const { x, y } = toCanvasCoords(e);
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.moved = false;
    drag.startX = drag.lastX = x;
    drag.startY = drag.lastY = y;
    drag.dirX = 0;
    drag.dirY = 0;
    if (cvs.setPointerCapture) cvs.setPointerCapture(e.pointerId);
  };

  const handleMove = (e)=>{
    if(!drag.active || drag.pointerId !== e.pointerId) return;
    const { x, y } = toCanvasCoords(e);
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if(!drag.moved && (dx*dx + dy*dy) >= threshold*threshold){
      drag.moved = true;
    }
    if(drag.moved){
      const len = Math.hypot(dx, dy) || 1;
      drag.dirX = dx / len;
      drag.dirY = dy / len;
    } else {
      drag.dirX = 0;
      drag.dirY = 0;
    }
    drag.lastX = x;
    drag.lastY = y;
  };

  const handleUp = (e)=>{
    if(drag.pointerId !== null && e.pointerId !== drag.pointerId) return;
    stopDrag();
    if (cvs.releasePointerCapture) cvs.releasePointerCapture(e.pointerId);
  };

  cvs.addEventListener('pointerdown', handleDown, { passive:true });
  window.addEventListener('pointermove', handleMove, { passive:true });
  window.addEventListener('pointerup', handleUp, { passive:true });
  window.addEventListener('pointercancel', handleUp, { passive:true });
  window.addEventListener('pointerout', handleUp, { passive:true });

  // C キー（クラフト）ショートカット
  document.addEventListener('keydown', e=>{
    if(e.key==='c'||e.key==='C'){ state.keys.add('C'); }
  });
  document.addEventListener('keyup', e=>{
    if(e.key==='c'||e.key==='C'){ state.keys.delete('C'); }
  });
}
