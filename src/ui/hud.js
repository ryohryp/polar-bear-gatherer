import { state } from '../state.js';
import { t } from './messages.js';
import { PLAYER_ICON } from '../config.js';
import { loadImage } from '../utils.js';

const hud = { iconImage: null, _loading: false };

async function ensureIconLoaded() {
  if (hud.iconImage) return hud.iconImage;
  const preloaded = state.assets?.images?.[PLAYER_ICON];
  if (preloaded) {
    hud.iconImage = preloaded;
    return hud.iconImage;
  }
  if (hud._loading) return null;

  try {
    hud._loading = true;
    hud.iconImage = await loadImage(PLAYER_ICON);
  } catch (_) {
    // プレイヤーアイコンがなくてもゲームは継続する。
  } finally {
    hud._loading = false;
  }
  return hud.iconImage;
}

export function updateHud() {
  const { ui, player, fire, inv } = state;
  if (!ui) return;

  ensureIconLoaded();

  if (ui.hp) ui.hp.style.width = `${player.hp}%`;
  if (ui.tmp) ui.tmp.style.width = `${player.cold}%`;
  if (ui.fire) ui.fire.style.width = `${fire.heat}%`;

  if (ui.inv) {
    const weapon = player.hasSpear ? '槍を装備中' : '槍まで木材10';
    ui.inv.innerHTML = `手持ち木材 ${inv.wood}<br>肉 ${inv.meat}<br>${weapon}`;
  }
}

export function showBearHP(visible) {
  const element = state.ui?.bearHud;
  if (!element) return;
  element.style.display = visible ? 'block' : 'none';
}

export function setBearHP(rate) {
  const bar = state.ui?.bear;
  if (!bar) return;
  const percentage = Math.max(0, Math.min(1, rate)) * 100;
  bar.style.width = `${percentage}%`;
}

export function renderHUD(ctx) {
  const image = hud.iconImage || state.assets?.images?.[PLAYER_ICON] || null;
  if (!image) return;

  ctx.save();
  ctx.translate(state.screen.offsetX, state.screen.offsetY);
  ctx.scale(state.screen.scale, state.screen.scale);
  ctx.fillStyle = '#17213a';
  ctx.fillRect(13, 61, 54, 54);
  ctx.fillStyle = '#fff2c7';
  ctx.fillRect(16, 64, 48, 48);
  ctx.drawImage(image, 16, 64, 48, 48);
  ctx.restore();
}

let logTimer = null;

export function log(msg, { holdMs = 3000 } = {}) {
  const element = state.ui?.log;
  if (!element) return;

  element.textContent = msg;
  element.style.opacity = '1';
  if (logTimer) clearTimeout(logTimer);
  if (state.gameOver) return;
  logTimer = setTimeout(() => { element.style.opacity = '0'; }, holdMs);
}

export function showGameOver(show) {
  const element = document.getElementById('gameOver');
  if (!element) return;

  element.style.display = show ? 'flex' : 'none';
  element.style.pointerEvents = show ? 'auto' : 'none';
  if (state.ui?.btnRestart) state.ui.btnRestart.disabled = !show;
  if (show && state.ui?.log) state.ui.log.style.opacity = '1';
}

void t;
