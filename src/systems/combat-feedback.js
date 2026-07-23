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

const PLAYER_KNOCKBACK = 5.6;
const PLAYER_KNOCKBACK_DAMPING = 0.58;
const PLAYER_KNOCKBACK_EPSILON = 0.08;
const PLAYER_FLASH_LIFE = 0.16;
const PLAYER_SEVERE_FLASH_LIFE = 0.22;

let observedGameState = state.game;

function resetFeedbackState() {
  state.combatFeedback = {
    hitStopFrames: 0,
  };

  if (state.bear) {
    state.bear.knockbackVX = 0;
    state.bear.knockbackVY = 0;
  }

  if (state.player) {
    state.player.knockbackVX = 0;
    state.player.knockbackVY = 0;
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

  const player = state.player;
  if (player) {
    if (!Number.isFinite(player.knockbackVX)) player.knockbackVX = 0;
    if (!Number.isFinite(player.knockbackVY)) player.knockbackVY = 0;
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

function fallbackPlayerKnockbackVector(player) {
  const dir = player?.anim?.dir || 'down';
  if (dir.includes('left')) return { x: 1, y: 0 };
  if (dir.includes('right')) return { x: -1, y: 0 };
  if (dir.includes('up')) return { x: 0, y: 1 };
  return { x: 0, y: -1 };
}

function playerKnockbackVector(player, source) {
  if (!source || !Number.isFinite(source.x) || !Number.isFinite(source.y)) {
    return fallbackPlayerKnockbackVector(player);
  }

  const dx = player.x - source.x;
  const dy = player.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.001) return fallbackPlayerKnockbackVector(player);

  return {
    x: dx / distance,
    y: dy / distance,
  };
}

function spawnPlayerHurtVisual({ severe }) {
  const { player, particles } = state;
  if (!player || !particles) return;

  particles.spawn('playerFlash', player.x, player.y, {
    life: severe ? PLAYER_SEVERE_FLASH_LIFE : PLAYER_FLASH_LIFE,
    color: severe ? '#ff5f67' : '#ff8a96',
    vx: 0,
    vy: 0,
    severe,
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

export function triggerPlayerHurtFeedback({
  source = null,
  knockback = true,
  severe = false,
} = {}) {
  ensureFeedbackState();

  const player = state.player;
  if (!player) return;

  if (knockback) {
    const vector = playerKnockbackVector(player, source);
    player.knockbackVX = vector.x * PLAYER_KNOCKBACK;
    player.knockbackVY = vector.y * PLAYER_KNOCKBACK;
  }

  spawnPlayerHurtVisual({ severe });
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

export function updatePlayerKnockback() {
  ensureFeedbackState();

  const { player, world } = state;
  if (!player || player.hp <= 0) {
    if (player) {
      player.knockbackVX = 0;
      player.knockbackVY = 0;
    }
    return false;
  }

  const speed = Math.hypot(player.knockbackVX, player.knockbackVY);
  if (speed < PLAYER_KNOCKBACK_EPSILON) {
    player.knockbackVX = 0;
    player.knockbackVY = 0;
    return false;
  }

  player.x = clamp(player.x + player.knockbackVX, player.r, world.w - player.r);
  player.y = clamp(player.y + player.knockbackVY, player.r, world.h - player.r);
  player.knockbackVX *= PLAYER_KNOCKBACK_DAMPING;
  player.knockbackVY *= PLAYER_KNOCKBACK_DAMPING;
  return true;
}
