import { state } from '../state.js';
import { clamp } from '../utils.js';

export const CAMP_STATIONS = {
  gather: {
    x: 345,
    y: 405,
    w: 82,
    h: 58,
    label: '木材置場',
    short: '採集',
    color: '#6aa7c8',
    popup: '+1 木材',
  },
  craft: {
    x: 500,
    y: 350,
    w: 94,
    h: 66,
    label: '槍工房',
    short: '加工',
    color: '#79a75a',
    popup: '槍 完成!',
  },
  trap: {
    x: 665,
    y: 405,
    w: 82,
    h: 62,
    label: '見張り台',
    short: '納品',
    color: '#c58b4b',
    popup: '防衛 +1',
  },
};

const WORKER_COLORS = {
  gather: '#72b9d8',
  craft: '#94c869',
  trap: '#e1aa5c',
};

function addPopup(text, x, y, color = '#fff4a8', life = 1.25) {
  state.camp.popups.push({ text, x, y, color, life, maxLife: life });
}

export function announceCampEvent(event) {
  if (!event) return;

  if (event.type === 'orderDone') {
    addPopup(`報酬 +${event.reward}G`, state.camp.center.x, state.camp.center.y - 86, '#ffe169', 1.6);
    state.cam.shake = Math.max(state.cam.shake || 0, 3);
  } else if (event.type === 'orderFail') {
    addPopup('注文失敗…', state.camp.center.x, state.camp.center.y - 86, '#ff8c87', 1.5);
  }
}

export function updateCampVisuals(dt, now = performance.now()) {
  const events = state.game?.visualEvents || [];
  while (events.length) {
    const event = events.shift();
    const def = CAMP_STATIONS[event.step];
    if (!def) continue;

    if (event.type === 'stationStart') {
      state.camp.pulses[event.step] = Math.max(state.camp.pulses[event.step] || 0, 0.25);
    } else if (event.type === 'stationComplete') {
      addPopup(def.popup, def.x, def.y - def.h - 12, '#fff0a5');
      state.camp.pulses[event.step] = 1;
      state.cam.shake = Math.max(state.cam.shake || 0, 1.2);
    }
  }

  for (const key of Object.keys(state.camp.pulses)) {
    state.camp.pulses[key] = Math.max(0, state.camp.pulses[key] - dt * 2.8);
  }

  for (const popup of state.camp.popups) {
    popup.life -= dt;
    popup.y -= dt * 18;
  }
  state.camp.popups = state.camp.popups.filter(popup => popup.life > 0);

  void now;
}

export function drawSnowField(ctx, cam, world) {
  const tile = 32;
  const startX = Math.floor(cam.x / tile) * tile - tile;
  const startY = Math.floor(cam.y / tile) * tile - tile;
  const endX = Math.min(world.w, cam.x + 960 + tile);
  const endY = Math.min(world.h, cam.y + 540 + tile);

  ctx.fillStyle = '#dfeaf1';
  ctx.fillRect(startX, startY, endX - startX, endY - startY);

  for (let y = startY; y < endY; y += tile) {
    for (let x = startX; x < endX; x += tile) {
      const parity = ((x / tile) + (y / tile)) & 1;
      ctx.fillStyle = parity ? '#d8e6ee' : '#e4eef3';
      ctx.fillRect(x, y, tile, tile);
      ctx.fillStyle = parity ? '#cfdee7' : '#d8e5ec';
      ctx.fillRect(x + 4, y + 5, 3, 2);
      ctx.fillRect(x + 23, y + 20, 2, 2);
    }
  }
}

function drawPathTile(ctx, x, y) {
  ctx.fillStyle = '#b8c5c7';
  ctx.fillRect(x - 14, y - 10, 28, 20);
  ctx.fillStyle = '#cbd5d5';
  ctx.fillRect(x - 11, y - 7, 22, 14);
  ctx.fillStyle = '#a9b7ba';
  ctx.fillRect(x - 8, y + 5, 6, 2);
  ctx.fillRect(x + 4, y - 5, 5, 2);
}

export function drawCampGround(ctx) {
  ctx.save();

  for (let x = 365; x <= 635; x += 26) drawPathTile(ctx, x, 430);
  for (let y = 375; y <= 500; y += 24) drawPathTile(ctx, 500, y);
  for (let x = 500; x <= 660; x += 26) drawPathTile(ctx, x, 430);

  ctx.strokeStyle = '#6e8291';
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(285, 295, 440, 250);
  ctx.setLineDash([]);

  for (let x = 292; x <= 716; x += 36) {
    ctx.fillStyle = '#5f7180';
    ctx.fillRect(x, 291, 5, 16);
    ctx.fillRect(x, 535, 5, 16);
  }

  ctx.restore();
}

function drawRoof(ctx, x, y, w, color) {
  ctx.fillStyle = '#273b5f';
  ctx.fillRect(x - w / 2 - 4, y - 7, w + 8, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y - 12, w, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x - w / 2 + 5, y - 9, Math.max(12, w * 0.35), 3);
}

function drawStation(ctx, key, now) {
  const def = CAMP_STATIONS[key];
  const station = state.game.stations[key];
  const pulse = state.camp.pulses[key] || 0;
  const scale = 1 + pulse * 0.07;
  const x = Math.round(def.x);
  const y = Math.round(def.y);
  const left = -def.w / 2;
  const top = -def.h;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(24,37,58,0.28)';
  ctx.fillRect(left + 5, -7, def.w, 10);

  ctx.fillStyle = '#283a56';
  ctx.fillRect(left - 3, top - 3, def.w + 6, def.h + 6);
  ctx.fillStyle = '#ead5a3';
  ctx.fillRect(left, top, def.w, def.h);
  ctx.fillStyle = '#fff0c8';
  ctx.fillRect(left + 5, top + 5, def.w - 10, def.h - 10);
  drawRoof(ctx, 0, top, def.w, def.color);

  if (key === 'gather') {
    ctx.fillStyle = '#8a5c35';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(left + 12 + i * 18, top + 22, 14, 8);
      ctx.fillStyle = '#c78a4d';
      ctx.fillRect(left + 14 + i * 18, top + 24, 10, 3);
      ctx.fillStyle = '#8a5c35';
    }
  } else if (key === 'craft') {
    ctx.fillStyle = '#59636b';
    ctx.fillRect(-24, top + 25, 48, 11);
    ctx.fillStyle = '#874e32';
    ctx.fillRect(-5, top + 12, 10, 27);
    const hammer = Math.sin(now / 110) > 0 ? -4 : 3;
    ctx.fillStyle = '#3a4653';
    ctx.fillRect(8, top + 13 + hammer, 18, 6);
    ctx.fillRect(20, top + 10 + hammer, 5, 18);
  } else {
    ctx.fillStyle = '#7c5737';
    ctx.fillRect(-25, top + 8, 7, 47);
    ctx.fillRect(18, top + 8, 7, 47);
    ctx.fillRect(-24, top + 13, 48, 7);
    ctx.fillStyle = '#f1d35d';
    ctx.fillRect(-2, top + 1, 4, 30);
    ctx.fillRect(2, top + 2, 17, 3);
  }

  ctx.fillStyle = '#17213a';
  ctx.fillRect(left + 4, 5, def.w - 8, 17);
  ctx.fillStyle = '#fff2c7';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${def.label} Lv.${station.level}`, 0, 17);

  const barW = def.w - 12;
  const barX = -barW / 2;
  const barY = 27;
  ctx.fillStyle = '#17213a';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, 9);
  ctx.fillStyle = '#c8b98e';
  ctx.fillRect(barX, barY, barW, 5);

  if (station.busyUntil > now && station.workDuration > 0) {
    const ratio = clamp(1 - (station.busyUntil - now) / station.workDuration, 0, 1);
    ctx.fillStyle = def.color;
    ctx.fillRect(barX, barY, Math.round(barW * ratio), 5);
  }

  ctx.fillStyle = '#17213a';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`待ち ${station.queue}`, 0, 46);

  ctx.restore();
}

function drawWorker(ctx, key, now) {
  const def = CAMP_STATIONS[key];
  const station = state.game.stations[key];
  const busy = station.busyUntil > now && station.workDuration > 0;
  const ratio = busy
    ? clamp(1 - (station.busyUntil - now) / station.workDuration, 0, 1)
    : 0;

  let x = def.x;
  let y = def.y + 34;
  if (key === 'gather') {
    x += busy ? -42 + Math.sin(ratio * Math.PI) * 32 : -34;
    y += busy ? Math.sin(ratio * Math.PI * 2) * 5 : 0;
  } else if (key === 'craft') {
    x += busy ? Math.sin(now / 90) * 4 : 31;
    y -= busy ? 8 : 0;
  } else {
    x += busy ? 42 - ratio * 70 : 34;
    y += busy ? Math.sin(ratio * Math.PI * 2) * 4 : 0;
  }

  const bob = busy ? Math.round(Math.sin(now / 90) * 2) : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));

  ctx.fillStyle = 'rgba(23,33,58,0.25)';
  ctx.fillRect(-8, 11, 16, 4);
  ctx.fillStyle = '#17213a';
  ctx.fillRect(-7, -13, 14, 22);
  ctx.fillStyle = '#f0c8a0';
  ctx.fillRect(-5, -11, 10, 8);
  ctx.fillStyle = WORKER_COLORS[key];
  ctx.fillRect(-6, -3, 12, 10);
  ctx.fillStyle = '#f5f0dd';
  ctx.fillRect(-7, -14, 14, 4);
  ctx.fillRect(-8, -10, 3, 7);
  ctx.fillRect(5, -10, 3, 7);
  ctx.fillStyle = '#3d506e';
  ctx.fillRect(-6, 7, 5, 6);
  ctx.fillRect(1, 7, 5, 6);

  if (busy && key === 'gather' && ratio > 0.45) {
    ctx.fillStyle = '#996239';
    ctx.fillRect(8, -1, 11, 6);
  } else if (busy && key === 'trap') {
    ctx.fillStyle = '#ead26d';
    ctx.fillRect(8, -10, 3, 21);
    ctx.fillRect(11, -10, 8, 2);
  }

  ctx.restore();
}

export function drawCamp(ctx, now) {
  drawCampGround(ctx);
  for (const key of Object.keys(CAMP_STATIONS)) drawStation(ctx, key, now);
  for (const key of Object.keys(CAMP_STATIONS)) drawWorker(ctx, key, now);
}

export function drawCampPopups(ctx) {
  ctx.save();
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';

  for (const popup of state.camp.popups) {
    const alpha = clamp(popup.life / Math.min(0.35, popup.maxLife), 0, 1);
    ctx.globalAlpha = alpha;
    const width = ctx.measureText(popup.text).width + 14;
    ctx.fillStyle = '#17213a';
    ctx.fillRect(Math.round(popup.x - width / 2 - 2), Math.round(popup.y - 14), Math.round(width + 4), 20);
    ctx.fillStyle = popup.color;
    ctx.fillRect(Math.round(popup.x - width / 2), Math.round(popup.y - 12), Math.round(width), 16);
    ctx.fillStyle = '#17213a';
    ctx.fillText(popup.text, Math.round(popup.x), Math.round(popup.y));
  }

  ctx.restore();
}
