import { state } from '../state.js';

const SLOW_MO_DELAY_STEPS = 4;
const SLOW_MO_STEPS = 28;
const COLLAPSE_LIFE = 0.9;

let observedGameState = state.game;

function resetDefeatState() {
  state.bearDefeat = {
    active: false,
    delaySteps: 0,
    slowMoSteps: 0,
    phase: 0,
  };
}

function ensureDefeatState() {
  if (observedGameState !== state.game) {
    observedGameState = state.game;
    resetDefeatState();
  }

  if (!state.bearDefeat) resetDefeatState();
}

function spawnFinaleParticles(bear) {
  const particles = state.particles;
  if (!particles) return;

  particles.spawn('bearCollapse', bear.x, bear.y, {
    life: COLLAPSE_LIFE,
    vx: 0,
    vy: 0,
    fallDirection: bear.x >= state.player.x ? 1 : -1,
  });

  for (let i = 0; i < 16; i++) {
    const angle = Math.PI * 2 * i / 16 + Math.random() * 0.18;
    const speed = 50 + Math.random() * 90;
    particles.spawn('spark', bear.x, bear.y - 4, {
      life: 0.32 + Math.random() * 0.35,
      color: i % 3 === 0 ? '#ffe36d' : '#dff5ff',
      size: 1.5 + Math.random() * 2.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 22,
    });
  }

  for (let i = 0; i < 5; i++) {
    particles.spawn('smoke', bear.x + (Math.random() - 0.5) * 26, bear.y + 10, {
      life: 0.55 + Math.random() * 0.3,
      color: '#d8e5ea',
      size: 5 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 18,
      vy: -8 - Math.random() * 10,
    });
  }

  particles.spawn('damageText', bear.x, bear.y - 38, {
    life: 1.05,
    color: '#ffe36d',
    outlineColor: '#17213a',
    text: '撃破!',
    fontSize: 23,
    vx: 0,
    vy: -24,
    hasSpear: true,
  });
}

export function triggerBearDefeatFinale() {
  ensureDefeatState();

  const bear = state.bear;
  if (!bear || state.bearDefeat.active) return;

  state.bearDefeat = {
    active: true,
    delaySteps: SLOW_MO_DELAY_STEPS,
    slowMoSteps: SLOW_MO_STEPS,
    phase: 0,
  };

  state.cam.shake = Math.max(state.cam.shake || 0, 11);
  spawnFinaleParticles(bear);
}

export function shouldSkipBearDefeatSlowMoStep() {
  ensureDefeatState();

  const finale = state.bearDefeat;
  if (!finale.active) return false;

  if (finale.delaySteps > 0) {
    finale.delaySteps -= 1;
    return false;
  }

  if (finale.slowMoSteps <= 0) {
    finale.active = false;
    return false;
  }

  finale.slowMoSteps -= 1;
  finale.phase = finale.phase === 0 ? 1 : 0;
  return finale.phase === 1;
}
