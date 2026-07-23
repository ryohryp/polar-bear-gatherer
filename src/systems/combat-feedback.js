import { state } from '../state.js';
import { clamp } from '../utils.js';

const NORMAL_HIT_STOP_FRAMES = 3;
const SPEAR_HIT_STOP_FRAMES = 4;
const NORMAL_KNOCKBACK = 3.6;
const SPEAR_KNOCKBACK = 5.4;
const KNOCKBACK_DAMPING = 0.62;
const KNOCKBACK_EPSILON = 0.08;
const NORMAL_FLASH_LIFE = 0.12;
const SPEAR_FLASH_LIFE = 0.16;
const NORMAL_DAMAGE_TEXT_LIFE = 0.68;
const SPEAR_DAMAGE_TEXT_LIFE = 0.78;

let observedGameState = state.game;

function resetFeedbackState() {
  state.combatFeedback = {
    hitStopFrames: 0,
  };

  if (state.bear) {
    state.bear.knockbackVX = 0;
    state.bear.knockbackVY = 0;
  }
}

function ensureFeedbackState() {
  if (observedGameState !== state.game) {
    observedGameState = state.game;
    resetFeedbackState();
  }

  if (!state.combatFeedback) {
    resetFeedbackState();
  }

  const bear = state.bear;
  if (bear) {
    if (!Number.isFinite(bear.knockbackVX)) bear.knockbackVX = 0;
    if (!Number.isFinite(bear.knockbackVY)) bear.knockbackVY = 0;
  }
}

function spawnBearHitVisuals({ damage, hasSpear }) {
  const { bear, particles } = state;
  if (!bear || !particles) return;

  particles.spawn('bearFlash', bear.x, bear.y, {
    life: hasSpear ? SPEAR_FLASH_LIFE : NORMAL_FLASH_LIFE,
    color: hasSpear ? '#fff8d0' : '#ffffff',
    vx: 0,
    vy: 0,
    hasSpear,
  });

  if (!Number.isFinite(damage) || damage <= 0) return;

  particles.spawn('damageText', bear.x + (Math.random() - 0.5) * 8, bear.y - 30, {
    life: hasSpear ? SPEAR_DAMAGE_TEXT_LIFE : NORMAL_DAMAGE_TEXT_LIFE,
    color: hasSpear ? '#ffe36d' : '#fff2c7',
    outlineColor: '#17213a',
    text: `-${Math.round(damage)}`,
    fontSize: hasSpear ? 20 : 18,
    vx: (Math.random() - 0.5) * 8,
    vy: hasSpear ? -38 : -32,
    hasSpear,
  });
}

export function triggerBearHitFeedback({ damage = 0, hasSpear = false } = {}) {
  ensureFeedbackState();

  const { player, bear } = state;
  if (!player || !bear) return;

  const dx = bear.x - player.x;
  const dy = bear.y - player.y;
  const distance = Math.hypot(dx, dy) || 1;
  const impulse = hasSpear ? SPEAR_KNOCKBACK : NORMAL_KNOCKBACK;

  bear.knockbackVX = dx / distance * impulse;
  bear.knockbackVY = dy / distance * impulse;
  state.combatFeedback.hitStopFrames = Math.max(
    state.combatFeedback.hitStopFrames,
    hasSpear ? SPEAR_HIT_STOP_FRAMES : NORMAL_HIT_STOP_FRAMES,
  );

  spawnBearHitVisuals({ damage, hasSpear });
}

export function consumeHitStopFrame() {
  ensureFeedbackState();

  if (state.combatFeedback.hitStopFrames <= 0) return false;
  state.combatFeedback.hitStopFrames -= 1;
  return true;
}

export function updateBearKnockback() {
  ensureFeedbackState();

  const { bear, world } = state;
  if (!bear?.alive) {
    if (bear) {
      bear.knockbackVX = 0;
      bear.knockbackVY = 0;
    }
    return false;
  }

  const speed = Math.hypot(bear.knockbackVX, bear.knockbackVY);
  if (speed < KNOCKBACK_EPSILON) {
    bear.knockbackVX = 0;
    bear.knockbackVY = 0;
    return false;
  }

  bear.x = clamp(bear.x + bear.knockbackVX, bear.r, world.w - bear.r);
  bear.y = clamp(bear.y + bear.knockbackVY, bear.r, world.h - bear.r);
  bear.knockbackVX *= KNOCKBACK_DAMPING;
  bear.knockbackVY *= KNOCKBACK_DAMPING;
  return true;
}
