import { IDLE_ANIM, IDLE_SHEETS, PLAYER_STATE, PLAYER_WEAPON } from '../config.js';
import { state } from '../state.js';

export function applyDirectionalIdleSprite() {
  const anim = state.player?.anim;
  if (!anim || anim.state !== PLAYER_STATE.IDLE) return;

  const weaponKey = anim.weapon === PLAYER_WEAPON.SPEAR ? 'spear' : 'none';
  const sheets = IDLE_SHEETS[weaponKey];
  const path = sheets?.[anim.dir] || sheets?.down;
  const image = path ? state.assets?.images?.[path] : null;

  if (!image) return;

  anim.image = image;
  anim.fps = IDLE_ANIM.fps;
  anim.loop = IDLE_ANIM.loop;
  anim.grid = IDLE_ANIM.grid;
}
