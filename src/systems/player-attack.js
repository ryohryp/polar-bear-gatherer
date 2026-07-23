import {
  ANIM,
  IDLE_SHEETS,
  PLAYER_STATE,
  PLAYER_WEAPON,
  SPRITE,
} from '../config.js';
import { state } from '../state.js';

const attackSheetCache = new Map();

const DIRECTION_VECTOR = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function directionToTarget(player, target, fallback = 'down') {
  if (!target) return fallback;

  const dx = target.x - player.x;
  const dy = target.y - player.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right';
  }

  return dy < 0 ? 'up' : 'down';
}

function drawSlash(ctx, dir, cellX, cellY, strong) {
  const points = {
    right: [[35, 14], [40, 16], [44, 19], [46, 23], [44, 27], [40, 31]],
    left: [[13, 14], [8, 16], [4, 19], [2, 23], [4, 27], [8, 31]],
    down: [[13, 34], [16, 39], [20, 43], [24, 45], [28, 43], [32, 39], [35, 34]],
    up: [[13, 14], [16, 9], [20, 5], [24, 3], [28, 5], [32, 9], [35, 14]],
  }[dir];

  ctx.fillStyle = '#b9d7ee';
  for (const [x, y] of points) {
    ctx.fillRect(cellX + x, cellY + y, 2, 2);
  }

  ctx.fillStyle = '#dff5ff';
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index];
    ctx.fillRect(cellX + x, cellY + y, 1, 1);

    if (strong) {
      const offsetX = dir === 'up' || dir === 'down' ? 1 : 0;
      const offsetY = dir === 'left' || dir === 'right' ? 1 : 0;
      ctx.fillRect(cellX + x + offsetX, cellY + y + offsetY, 1, 1);
    }
  }
}

function drawSpearThrust(ctx, dir, cellX, cellY, extended) {
  const reach = extended ? 20 : 15;
  const outline = '#10182b';
  const shaft = '#7d3b20';
  const tip = '#f7f2de';

  ctx.lineCap = 'butt';

  if (dir === 'right' || dir === 'left') {
    const sign = dir === 'right' ? 1 : -1;
    const startX = dir === 'right' ? 26 : 22;
    const endX = startX + sign * reach;
    const tipX = endX + sign * 3;
    const y = 25;

    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cellX + startX, cellY + y);
    ctx.lineTo(cellX + endX, cellY + y);
    ctx.stroke();

    ctx.strokeStyle = shaft;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cellX + startX, cellY + y);
    ctx.lineTo(cellX + endX, cellY + y);
    ctx.stroke();

    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(cellX + tipX, cellY + y);
    ctx.lineTo(cellX + endX, cellY + y - 2);
    ctx.lineTo(cellX + endX, cellY + y + 2);
    ctx.closePath();
    ctx.fill();
    return;
  }

  const sign = dir === 'down' ? 1 : -1;
  const startY = dir === 'down' ? 27 : 21;
  const endY = startY + sign * reach;
  const tipY = endY + sign * 3;
  const x = 24;

  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cellX + x, cellY + startY);
  ctx.lineTo(cellX + x, cellY + endY);
  ctx.stroke();

  ctx.strokeStyle = shaft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cellX + x, cellY + startY);
  ctx.lineTo(cellX + x, cellY + endY);
  ctx.stroke();

  ctx.fillStyle = tip;
  ctx.beginPath();
  ctx.moveTo(cellX + x, cellY + tipY);
  ctx.lineTo(cellX + x - 2, cellY + endY);
  ctx.lineTo(cellX + x + 2, cellY + endY);
  ctx.closePath();
  ctx.fill();
}

function createAttackSheet(source, dir, hasSpear) {
  const size = SPRITE.SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const vector = DIRECTION_VECTOR[dir] || DIRECTION_VECTOR.down;
  const offsets = [
    { x: 0, y: 0 },
    { x: -vector.x, y: -vector.y },
    { x: vector.x * 2, y: vector.y * 2 },
    { x: vector.x, y: vector.y },
  ];

  for (let frame = 0; frame < 4; frame += 1) {
    const sourceX = (frame % 2) * size;
    const sourceY = Math.floor(frame / 2) * size;
    const cellX = (frame % 2) * size;
    const cellY = Math.floor(frame / 2) * size;
    const offset = offsets[frame];

    ctx.drawImage(
      source,
      sourceX,
      sourceY,
      size,
      size,
      cellX + offset.x,
      cellY + offset.y,
      size,
      size,
    );

    if (frame === 1) {
      if (hasSpear) drawSpearThrust(ctx, dir, cellX, cellY, false);
      else drawSlash(ctx, dir, cellX, cellY, false);
    } else if (frame === 2) {
      if (hasSpear) {
        drawSpearThrust(ctx, dir, cellX, cellY, true);
        drawSlash(ctx, dir, cellX, cellY, false);
      } else {
        drawSlash(ctx, dir, cellX, cellY, true);
      }
    }
  }

  return canvas;
}

export function applyDirectionalAttackSprite() {
  const player = state.player;
  const anim = player?.anim;
  if (!anim || anim.state !== PLAYER_STATE.ATTACK) return;

  const hasSpear = anim.weapon === PLAYER_WEAPON.SPEAR;
  const weaponKey = hasSpear ? 'spear' : 'none';
  const dir = directionToTarget(player, state.bear, anim.dir);
  const sourcePath = IDLE_SHEETS[weaponKey]?.[dir] || IDLE_SHEETS[weaponKey]?.down;
  const source = sourcePath ? state.assets?.images?.[sourcePath] : null;

  anim.dir = dir;
  if (!source) return;

  const cacheKey = `${weaponKey}:${dir}`;
  let sheet = attackSheetCache.get(cacheKey);
  if (!sheet) {
    sheet = createAttackSheet(source, dir, hasSpear);
    attackSheetCache.set(cacheKey, sheet);
  }

  const config = hasSpear ? ANIM.spearAttack : ANIM.attack;
  anim.image = sheet;
  anim.fps = config.fps;
  anim.loop = config.loop;
  anim.grid = config.grid;
}
