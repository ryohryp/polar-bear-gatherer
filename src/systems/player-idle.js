import { IDLE_ANIM, IDLE_SHEETS, PLAYER_STATE, PLAYER_WEAPON } from '../config.js';
import { state } from '../state.js';
import { applyDirectionalAttackSprite } from './player-attack.js';
import {
  triggerPlayerHurtFeedback,
  updatePlayerKnockback,
  wasPlayerHurtFeedbackRecently,
} from './combat-feedback.js';

let observedGameState = state.game;
let previousAnimState = null;

function syncHurtFeedback(anim) {
  if (observedGameState !== state.game) {
    observedGameState = state.game;
    previousAnimState = null;
  }

  const enteredHurt = anim.state === PLAYER_STATE.HURT
    && previousAnimState !== PLAYER_STATE.HURT;

  if (enteredHurt && !wasPlayerHurtFeedbackRecently()) {
    triggerPlayerHurtFeedback({
      source: state.bear,
      knockback: true,
      severe: true,
    });
  }

  previousAnimState = anim.state;
}

export function applyDirectionalIdleSprite() {
  applyDirectionalAttackSprite();

  const anim = state.player?.anim;
  if (!anim) return;

  syncHurtFeedback(anim);
  updatePlayerKnockback();

  if (anim.state !== PLAYER_STATE.IDLE) return;

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
