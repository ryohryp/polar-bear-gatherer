import { state } from '../state.js';
import { t } from './messages.js';
import { PLAYER_ICON } from '../config.js';
import { loadImage } from '../utils.js';

// lazily loaded HUD icon
const hud = { iconImage: null, _loading: false };

async function ensureIconLoaded(){
  if(hud.iconImage) return hud.iconImage;
  // prefer preloaded image from state
  const pre = state.assets?.images?.[PLAYER_ICON];
  if(pre){ hud.iconImage = pre; return hud.iconImage; }
  if(hud._loading) return null;
  try {
    hud._loading = true;
    hud.iconImage = await loadImage(PLAYER_ICON);
  } catch(_) {
    // ignore
  } finally {
    hud._loading = false;
  }
  return hud.iconImage;
}

/** 各バーとインベントリのUIを更新 */
export function updateHud(){
  const { ui, player, fire, inv } = state;
  if (!ui) return;
  // kick icon load
  ensureIconLoaded();

  // bars
  if (ui.hp)   ui.hp.style.width   = player.hp + '%';
  if (ui.tmp)  ui.tmp.style.width  = player.cold + '%';
  if (ui.fire) ui.fire.style.width = fire.heat + '%';

  // inventory
  if (ui.inv){
    ui.inv.innerHTML = `木材: ${inv.wood} / 10で槍クラフト [C]<br>肉: ${inv.meat}<br>${t('inv.hint')}`;
  }
}

// ===== BEAR HP HUD =====
/** BEAR HPバーの表示/非表示 */
export function showBearHP(visible){
  const hud = state.ui?.bearHud;
  if (!hud) return;
  hud.style.display = visible ? 'block' : 'none';
}

/** BEAR HPの割合(0-1)でバー更新 */
export function setBearHP(rate){
  const bar = state.ui?.bear;
  if (!bar) return;
  const pct = Math.max(0, Math.min(1, rate)) * 100;
  bar.style.width = pct + '%';
}

// Render HUD overlays on canvas (icon etc.)
export function renderHUD(ctx){
  const img = hud.iconImage || state.assets?.images?.[PLAYER_ICON] || null;
  if(!img) return;
  const x = 16, y = 64; // avoid top-left bars area
  ctx.save();
  ctx.translate(state.screen.offsetX, state.screen.offsetY);
  ctx.scale(state.screen.scale, state.screen.scale);
  ctx.drawImage(img, x, y, 48, 48);
  ctx.restore();
}

// ===== Log with fade =====
let _logTimer = null;
/** ログ表示（3秒後にフェードアウト） */
export function log(msg, { holdMs = 3000 } = {}){
  const el = state.ui?.log;
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = '1';
  if (_logTimer) clearTimeout(_logTimer);
  // ゲームオーバー中はフェードさせない
  if (state.gameOver) return;
  _logTimer = setTimeout(()=>{ el.style.opacity = '0'; }, holdMs);
}

// ===== GameOver Overlay =====
export function showGameOver(show){
  const el = document.getElementById('gameOver');
  if(!el) return;
  el.style.display = show ? 'flex' : 'none';
  el.style.pointerEvents = show ? 'auto' : 'none';
  if(state.ui?.btnRestart){
    state.ui.btnRestart.disabled = !show;
  }
  // ゲームオーバー表示中はログを見えるようにしておく
  if (show && state.ui?.log) state.ui.log.style.opacity = '1';
}
