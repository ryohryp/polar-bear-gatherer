import { state } from '../state.js';
import { t } from './messages.js';

/** 各バーとインベントリのUIを更新 */
export function updateHud(){
  const { ui, player, fire, inv } = state;
  if (!ui) return;

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
