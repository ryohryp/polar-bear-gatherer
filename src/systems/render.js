import { state } from '../state.js';
import { t } from '../ui/messages.js';
import { clamp, drawFrame } from '../utils.js';
import { BASE_W, BASE_H, SPRITE } from '../config.js';
import { renderHUD } from '../ui/hud.js';
// src/systems/render.js
import { SPRITES } from '../config.js';
import { SIZES } from '../config.js';

const playerSprite = {
  img: new Image(),
  ready: false,
  frameW: 0,
  frameH: 0
};
playerSprite.img.onload = () => {
  const cfg = SPRITES.player;
  // 画像実寸から自動算出（512x512 / 4x4 想定）
  playerSprite.frameW = Math.floor(playerSprite.img.width / cfg.cols);
  playerSprite.frameH = Math.floor(playerSprite.img.height / cfg.rows);
  playerSprite.ready = true;
  console.info('[sprite] player loaded',
    playerSprite.img.width, 'x', playerSprite.img.height,
    '=> cell', playerSprite.frameW, 'x', playerSprite.frameH);
};
playerSprite.img.src = SPRITES.player.src;

// --- 方向スプライト: 4x4/16スタイルシートに対応 ---
// 1-4: 下, 5-6: 右下, 7-10: 右, 11-12: 右上, 13-16: 上
// 左・左上・左下は右系の水平反転で対応
// dir: 0=下, 1=右下, 2=右, 3=上, 4=左, 5=左下 (現状6方向)
const FRAMES = {
  down: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 3, r: 0 }],     // 1..4
  rightdown: [{ c: 0, r: 1 }, { c: 1, r: 1 }],                             // 5..6
  right: [{ c: 2, r: 1 }, { c: 3, r: 1 }, { c: 0, r: 2 }, { c: 1, r: 2 }],       // 7..10
  rightup: [{ c: 2, r: 2 }, { c: 3, r: 2 }],                             // 11..12（未使用）
  up: [{ c: 0, r: 3 }, { c: 1, r: 3 }, { c: 2, r: 3 }, { c: 3, r: 3 }],       // 13..16
};

function getAnimForDir(dir) {
  const d = ((dir | 0) % 6 + 6) % 6; // 0..5
  switch (d) {
    case 0: return { frames: FRAMES.down, flip: false };
    case 1: return { frames: FRAMES.rightdown, flip: false };
    case 2: return { frames: FRAMES.right, flip: false };
    case 3: return { frames: FRAMES.up, flip: false };
    case 4: return { frames: FRAMES.right, flip: true }; // 左 = 右の反転
    case 5: return { frames: FRAMES.rightdown, flip: true }; // 左下 = 右下の反転
    default: return { frames: FRAMES.down, flip: false };
  }
}

// New sprite-based player renderer (32x32 sheets)
function drawPlayerNew(ctx, player) {
  const size = SPRITE.SIZE;
  const dx = Math.floor(player.x - size / 2);
  const dy = Math.floor(player.y - size / 2);
  const anim = player.anim;
  if (!anim || !anim.image) {
    ctx.save();
    ctx.fillStyle = '#223';
    ctx.fillRect(dx, dy, size, size);
    ctx.strokeStyle = '#889';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + size, dy + size); ctx.moveTo(dx + size, dy); ctx.lineTo(dx, dy + size); ctx.stroke();
    ctx.restore();
    return;
  }
  drawFrame(ctx, anim.image, anim.frame | 0, anim.grid, dx, dy, size);
}

export function drawPlayer(ctx, player) {
  if (!playerSprite.ready) return;
  const fw = playerSprite.frameW;
  const fh = playerSprite.frameH;
  const dir = Math.max(0, Math.min(7, player.dir | 0));
  const anim = getAnimForDir(dir);
  const frames = anim.frames;
  const isMoving = !!player.moving;
  const now = performance.now();
  const period = frames.length === 2 ? 180 : 120; // 2枚はやや遅め、4枚は標準
  const idx = isMoving ? (Math.floor(now / period) % frames.length) : 0;
  const frame = frames[idx];
  const sx = frame.c * fw;
  const sy = frame.r * fh;
  const dx = Math.floor(player.x - fw / 2);
  const dy = Math.floor(player.y - fh / 2);

  if (anim.flip) {
    ctx.save();
    ctx.translate(dx + fw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(playerSprite.img, sx, sy, fw, fh, 0, 0, fw, fh);
    ctx.restore();
  } else {
    ctx.drawImage(playerSprite.img, sx, sy, fw, fh, dx, dy, fw, fh);
  }
}

export function renderFrame(alpha) {
  const { ctx, cam, world, fire, trees, drops, bear, player, screen, game, particles, lighting } = state;
  const { width, height, scale, offsetX, offsetY } = screen;
  const frameNow = performance.now();

  // Update lighting
  lighting.reset();
  // Fire light
  if (fire.heat > 0) {
    const flicker = Math.sin(frameNow / 100) * 5 + Math.cos(frameNow / 230) * 5;
    lighting.addLight(fire.x, fire.y, 180 + flicker, 'rgba(255, 160, 60, 0.15)', 1.0);
    lighting.addLight(fire.x, fire.y, 80 + flicker * 0.5, 'rgba(255, 100, 20, 0.2)', 1.0);
  }
  // Player light (lantern/torch feel if needed, or just personal glow)
  lighting.addLight(player.x, player.y, 100, 'rgba(200, 220, 255, 0.05)', 0.8);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width || BASE_W, height || BASE_H);
  ctx.fillStyle = '#0e1730';
  ctx.fillRect(0, 0, width || BASE_W, height || BASE_H);

  // Screen shake (if implemented in state, otherwise 0)
  const shakeX = state.cam.shake ? (Math.random() - 0.5) * state.cam.shake : 0;
  const shakeY = state.cam.shake ? (Math.random() - 0.5) * state.cam.shake : 0;
  if (state.cam.shake > 0) state.cam.shake *= 0.9; // decay
  if (state.cam.shake < 0.5) state.cam.shake = 0;

  ctx.setTransform(scale, 0, 0, scale, offsetX + shakeX, offsetY + shakeY);
  ctx.clearRect(0, 0, BASE_W, BASE_H);

  // camera
  cam.x = clamp(player.x - BASE_W / 2, 0, world.w - BASE_W);
  cam.y = clamp(player.y - BASE_H / 2, 0, world.h - BASE_H);

  // bg
  ctx.fillStyle = '#0e1730';
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // tiles
  for (let x = 0; x < world.w; x += 80) {
    for (let y = 0; y < world.h; y += 80) {
      ctx.fillStyle = '#132149';
      ctx.fillRect(x, y, 78, 78);
    }
  }

  // Shadows
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  // Tree shadows
  for (const t of trees) {
    if (t.hp <= 0) continue; // stumps have small shadow?
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 5, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bear shadow
  if (bear.alive) {
    ctx.beginPath();
    ctx.ellipse(bear.x, bear.y + bear.r - 5, bear.r, bear.r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Player shadow
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();


  // fire
  ctx.fillStyle = fire.heat > 0 ? '#ff9b3d' : '#3a3a4a';
  ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r, 0, Math.PI * 2); ctx.fill();
  if (fire.heat > 0) {
    const pulse = 1 + Math.sin(frameNow / 160) * 0.08;
    ctx.fillStyle = '#ffc97a';
    ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r * 0.55 * pulse, 0, Math.PI * 2); ctx.fill();
    if (fire.embers > 0) {
      ctx.strokeStyle = 'rgba(255,219,120,0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r + fire.embers * 0.03, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // trees (image sprites; fallback to shapes if not ready)
  for (const t of trees) {
    const alive = t.hp > 0;
    const img = alive ? state.sprites.objects.treeAlive : state.sprites.objects.treeStump;
    if (img) {
      const size = alive ? SIZES.TREE_ALIVE : SIZES.TREE_STUMP;
      const dx = Math.floor(t.x - size.w / 2);
      const dy = Math.floor(t.y - size.h);
      ctx.drawImage(img, dx, dy, size.w, size.h);
    } else {
      if (!alive) {
        ctx.fillStyle = '#7b5b42';
        ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI * 2); ctx.fill(); // stump
      } else {
        ctx.fillStyle = '#2e8b57';
        ctx.beginPath(); ctx.moveTo(t.x, t.y - 12); ctx.lineTo(t.x - 10, t.y + 10); ctx.lineTo(t.x + 10, t.y + 10); ctx.closePath(); ctx.fill();
      }
    }
  }

  // drops (image sprites; fallback to circles)
  for (const d of drops) {
    let img = null, sz = SIZES.WOOD;
    if (d.type === 'wood') { img = state.sprites.objects.woodDrop; }
    else if (d.type === 'meat') { img = state.sprites.objects.meatDrop; sz = SIZES.MEAT; }
    if (img) {
      const dx = Math.floor(d.x - sz.w / 2);
      const dy = Math.floor(d.y - sz.h / 2);
      ctx.drawImage(img, dx, dy, sz.w, sz.h);
    } else {
      ctx.fillStyle = d.type === 'wood' ? '#c48b54' : '#ff647a';
      ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // bear
  if (bear.alive) {
    ctx.fillStyle = '#e6f1ff';
    ctx.beginPath(); ctx.arc(bear.x, bear.y, bear.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c6d4ff';
    ctx.beginPath(); ctx.arc(bear.x + 6, bear.y - 4, 4, 0, Math.PI * 2); ctx.fill();
  }

  // player (new sprite renderer)
  drawPlayerNew(ctx, player);

  // Particles
  particles.render(ctx, cam);

  ctx.restore();

  // Lighting overlay
  lighting.render(ctx, cam, screen);

  // goal text
  if (!player.hasSpear) {
    drawText(t('goal.craft'), BASE_W / 2, 60);
    drawText(t('goal.fire'), BASE_W / 2, 84);
  } else if (bear.alive) {
    drawText(t('goal.kill'), BASE_W / 2, 60);
    drawText(t('goal.safe'), BASE_W / 2, 84);
  } else {
    drawText(t('goal.clear'), BASE_W / 2, 60);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (game.flags.modeOrderRush) {
    drawOrdersHud(frameNow);
    drawStationsHud(frameNow);
    drawInventoryHud();
    renderHUD(ctx);
  }
}

function drawText(t, x, y) {
  const { ctx } = state;
  ctx.save();
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.fillText(t, x, y);
  ctx.restore();
}

function drawOrdersHud(now) {
  const { ctx, screen, game } = state;
  if (!game.orders || game.orders.length === 0) {
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
  for (const order of game.orders) {
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
    ctx.fillText(`#${order.id} 進捗 ${order.progress}/${order.need.spear}`, 24, y + 18);
    const reward = order.need.spear * game.orderConfig.rewardPerSpear;
    ctx.fillText(`報酬 +${reward}c`, 24, y + 36);

    const barX = 24;
    const barY = y + height - 12;
    const barW = width - 16;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(barX, barY, barW, 6);
    let ratio = 0;
    if (order.status === 'active') {
      const remain = order.expiresAt - now;
      ratio = clamp(order.duration > 0 ? remain / order.duration : 0, 0, 1);
      ctx.fillStyle = '#ff9460';
    } else if (order.status === 'done') {
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

function drawStationsHud(now) {
  const { ctx, screen, game } = state;
  ctx.save();
  ctx.translate(screen.offsetX, screen.offsetY);
  ctx.scale(screen.scale, screen.scale);
  const stations = [
    { key: 'gather', label: 'GATHER', color: '#66c0ff' },
    { key: 'craft', label: 'CRAFT', color: '#7be27f' },
    { key: 'trap', label: 'TRAP', color: '#ffb366' },
  ];
  const boxW = 180;
  const boxH = 60;
  const gap = 14;
  const total = stations.length * boxW + (stations.length - 1) * gap;
  const startX = (BASE_W - total) / 2;
  const y = BASE_H - 82;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  stations.forEach((info, idx) => {
    const st = game.stations[info.key];
    if (!st) return;
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
    if (st.busyUntil > now && st.workDuration > 0) {
      const ratio = clamp(1 - (st.busyUntil - now) / st.workDuration, 0, 1);
      ctx.fillStyle = info.color;
      ctx.fillRect(barX, barY, barW * ratio, 8);
    }
  });
  ctx.restore();
}

function drawInventoryHud() {
  const { ctx, screen, game } = state;
  if (!game.inventory) return;
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
