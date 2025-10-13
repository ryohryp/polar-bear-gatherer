import { state } from '../state.js';
import { t } from '../ui/messages.js';
import { clamp } from '../utils.js';
import { BASE_W, BASE_H } from '../config.js';
// src/systems/render.js
import { SPRITES } from '../config.js';

const playerSprite = {
   img: new Image(),
   ready: false,
   frameW: 0,
   frameH: 0
 };
 playerSprite.img.onload = () => {
  const cfg = SPRITES.player;
  // 画像実寸から自動算出（384x96 → 64x96）
  playerSprite.frameW = Math.floor(playerSprite.img.width  / cfg.cols);
  playerSprite.frameH = Math.floor(playerSprite.img.height / cfg.rows);
  playerSprite.ready = true;
  console.info('[sprite] player loaded',
    playerSprite.img.width, 'x', playerSprite.img.height,
    '=> cell', playerSprite.frameW, 'x', playerSprite.frameH);
 };
 playerSprite.img.src = SPRITES.player.src;

// --- 方向マッピング（6方向シート対応）---
// 0:前, 1:左下, 2:右上, 3:後ろ, 4:右下, 5:右
const DIR_TO_CELL = [
  {c:0,r:0}, // 下（前）
  {c:4,r:0}, // 右下（右前）
  {c:5,r:0}, // 右
  {c:3,r:0}, // 上（後ろ）
  {c:1,r:0}, // 左
  {c:1,r:0}, // 左下（左前）
];

// dir範囲を6に丸める（7,8方向入力でも最も近い方向へ丸める）
function getCellForDir(dir){
  return DIR_TO_CELL[dir % DIR_TO_CELL.length] || DIR_TO_CELL[0];
}

export function drawPlayer(ctx, player) {
   if (!playerSprite.ready) return;
   const fw = playerSprite.frameW;
   const fh = playerSprite.frameH;
   const dir = Math.max(0, Math.min(7, player.dir|0));
   const cell = getCellForDir(dir);
   const sx = cell.c * fw;
   const sy = cell.r * fh;
   // まずはワールド→スクリーン変換無しで中央付近に確実表示
   const dx = Math.floor(player.x - fw/2);
   const dy = Math.floor(player.y - fh/2);
   ctx.drawImage(playerSprite.img, sx, sy, fw, fh, dx, dy, fw, fh);


  // もし見えない場合の切り分け用：スプライトシート全体を左上に小さく表示
  // （一時的な可視化。表示されたら削除OK）
  // removed debug: sheet preview at top-left
 }

export function renderFrame(alpha){
  const { ctx, cam, world, fire, trees, drops, bear, player, snow, screen, game } = state;
  const { width, height, scale, offsetX, offsetY } = screen;
  const frameNow = performance.now();

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
    const pulse = 1 + Math.sin(frameNow/160)*0.08;
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

  // player (use sprite instead of placeholder shapes)
  drawPlayer(ctx, player);

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
  if(game.flags.modeOrderRush){
    drawOrdersHud(frameNow);
    drawStationsHud(frameNow);
    drawInventoryHud();
  }
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

function drawOrdersHud(now){
  const { ctx, screen, game } = state;
  if(!game.orders || game.orders.length===0){
    return;
  }
  ctx.save();
  ctx.translate(screen.offsetX, screen.offsetY);
  ctx.scale(screen.scale, screen.scale);
  const width = 208;
  const height = 54;
  const gap = 10;
  let y = 112;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  for(const order of game.orders){
    ctx.fillStyle = order.status === 'fail'
      ? 'rgba(200,64,96,0.4)'
      : order.status === 'done'
        ? 'rgba(72,180,128,0.42)'
        : 'rgba(20,36,64,0.78)';
    ctx.fillRect(16, y, width, height);
    ctx.strokeStyle = 'rgba(86,122,196,0.65)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, y, width, height);

    ctx.fillStyle = '#e4edff';
    ctx.fillText(`#${order.id} 槍 ${order.progress}/${order.need.spear}`, 24, y + 18);
    const reward = order.need.spear * game.orderConfig.rewardPerSpear;
    ctx.fillText(`報酬 +${reward}c`, 24, y + 36);

    const barX = 24;
    const barY = y + height - 12;
    const barW = width - 16;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(barX, barY, barW, 6);
    let ratio = 0;
    if(order.status === 'active'){
      const remain = order.expiresAt - now;
      ratio = clamp(order.duration > 0 ? remain / order.duration : 0, 0, 1);
      ctx.fillStyle = '#ff9460';
    } else if(order.status === 'done'){
      ratio = 1;
      ctx.fillStyle = '#6df3a6';
    } else {
      ratio = 0;
      ctx.fillStyle = '#ff6384';
    }
    ctx.fillRect(barX, barY, barW * ratio, 6);

    y += height + gap;
  }
  ctx.restore();
}

function drawStationsHud(now){
  const { ctx, screen, game } = state;
  ctx.save();
  ctx.translate(screen.offsetX, screen.offsetY);
  ctx.scale(screen.scale, screen.scale);
  const stations = [
    { key:'gather', label:'GATHER', color:'#66c0ff' },
    { key:'craft', label:'CRAFT', color:'#7be27f' },
    { key:'trap', label:'TRAP', color:'#ffb366' },
  ];
  const boxW = 180;
  const boxH = 60;
  const gap = 14;
  const total = stations.length * boxW + (stations.length - 1) * gap;
  const startX = (BASE_W - total) / 2;
  const y = BASE_H - 82;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  stations.forEach((info, idx)=>{
    const st = game.stations[info.key];
    if(!st) return;
    const x = startX + idx * (boxW + gap);
    ctx.fillStyle = 'rgba(16,28,52,0.82)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = 'rgba(86,122,196,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.fillStyle = '#e0ecff';
    ctx.fillText(info.label, x + 12, y + 18);
    ctx.fillText(`Lv.${st.level}`, x + 12, y + 36);
    ctx.fillText(`待ち: ${st.queue}`, x + 12, y + 52);

    const barX = x + 90;
    const barY = y + boxH - 16;
    const barW = boxW - 102;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(barX, barY, barW, 8);
    if(st.busyUntil > now && st.workDuration > 0){
      const ratio = clamp(1 - (st.busyUntil - now) / st.workDuration, 0, 1);
      ctx.fillStyle = info.color;
      ctx.fillRect(barX, barY, barW * ratio, 8);
    }
  });
  ctx.restore();
}

function drawInventoryHud(){
  const { ctx, screen, game } = state;
  if(!game.inventory) return;
  ctx.save();
  ctx.translate(screen.offsetX, screen.offsetY);
  ctx.scale(screen.scale, screen.scale);
  const x = BASE_W - 16;
  let y = 112;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8f2ff';
  ctx.fillText(`Coins: ${game.coins}`, x, y);
  y += 18;
  ctx.fillText(`Wood: ${game.inventory.wood} / Spear: ${game.inventory.spear}`, x, y);
  ctx.restore();
}
