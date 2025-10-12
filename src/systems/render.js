import { state } from '../state.js';
import { t } from '../ui/messages.js';
import { clamp } from '../utils.js';
import { BASE_W, BASE_H } from '../config.js';

export function renderFrame(alpha){
  const { ctx, cam, world, fire, trees, drops, bear, player, snow, screen } = state;
  const { width, height, scale, offsetX, offsetY } = screen;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0, 0, width || BASE_W, height || BASE_H);
  ctx.fillStyle = '#0e1730';
  ctx.fillRect(0, 0, width || BASE_W, height || BASE_H);

  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  ctx.clearRect(0,0,BASE_W,BASE_H);

  // camera
  cam.x = clamp(player.x - BASE_W/2, 0, world.w-BASE_W);
  cam.y = clamp(player.y - BASE_H/2, 0, world.h-BASE_H);

  // bg
  ctx.fillStyle = '#0e1730';
  ctx.fillRect(0,0,BASE_W,BASE_H);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // tiles
  for(let x=0;x<world.w;x+=80){
    for(let y=0;y<world.h;y+=80){
      ctx.fillStyle = '#132149';
      ctx.fillRect(x,y,78,78);
    }
  }

  // snow backdrop
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  for(const flake of snow){
    const sx = flake.x - cam.x;
    const sy = flake.y - cam.y;
    if(sx<-20 || sx>BASE_W+20 || sy<-20 || sy>BASE_H+20) continue;
    ctx.beginPath(); ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // fire
  ctx.fillStyle = fire.heat>0? '#ff9b3d':'#3a3a4a';
  ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r, 0, Math.PI*2); ctx.fill();
  if(fire.heat>0){
    const pulse = 1 + Math.sin(performance.now()/160)*0.08;
    ctx.fillStyle = '#ffc97a';
    ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r*0.55*pulse, 0, Math.PI*2); ctx.fill();
    if(fire.embers>0){
      ctx.strokeStyle = 'rgba(255,219,120,0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r+fire.embers*0.03, 0, Math.PI*2); ctx.stroke();
    }
  }

  // trees
  for(const t of trees){
    if(t.hp<=0){
      ctx.fillStyle = '#7b5b42';
      ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI*2); ctx.fill(); // stump
    } else {
      ctx.fillStyle = '#2e8b57';
      ctx.beginPath(); ctx.moveTo(t.x, t.y-12); ctx.lineTo(t.x-10, t.y+10); ctx.lineTo(t.x+10, t.y+10); ctx.closePath(); ctx.fill();
    }
  }

  // drops
  for(const d of drops){
    ctx.fillStyle = d.type==='log'? '#c48b54':'#ff647a';
    ctx.beginPath(); ctx.arc(d.x,d.y,6,0,Math.PI*2); ctx.fill();
  }

  // bear
  if(bear.alive){
    ctx.fillStyle = '#e6f1ff';
    ctx.beginPath(); ctx.arc(bear.x, bear.y, bear.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c6d4ff';
    ctx.beginPath(); ctx.arc(bear.x+6, bear.y-4, 4, 0, Math.PI*2); ctx.fill();
  }

  // player
  ctx.fillStyle = player.hasSpear? '#8fe6ff':'#62b0ff';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1c2b53';
  ctx.beginPath(); ctx.arc(player.x-3, player.y-4, 2, 0, Math.PI*2); ctx.fill();
  if(player.hasSpear){
    ctx.strokeStyle = '#c9f7ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(player.x+10, player.y-2); ctx.lineTo(player.x+28, player.y-4); ctx.stroke();
  }

  ctx.restore();

  // goal text
  if(!player.hasSpear){
    drawText(t('goal.craft'), BASE_W/2, 60);
    drawText(t('goal.fire'),  BASE_W/2, 84);
  } else if(bear.alive){
    drawText(t('goal.kill'),  BASE_W/2, 60);
    drawText(t('goal.safe'),  BASE_W/2, 84);
  } else {
    drawText(t('goal.clear'), BASE_W/2, 60);
  }

  ctx.setTransform(1,0,0,1,0,0);
}

function drawText(t, x, y){
  const { ctx } = state;
  ctx.save();
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.fillText(t, x, y);
  ctx.restore();
}
