import { state } from '../state.js';

const STEPS = ['gather', 'craft', 'trap'];

function getGame(rootState) {
  return (rootState && rootState.game) || state.game;
}

function emitVisual(rootState, type, step, now) {
  const game = getGame(rootState);
  if (!game.visualEvents) game.visualEvents = [];
  game.visualEvents.push({ type, step, at: now });
}

export function levelCoef(level = 1) {
  return 1 + 0.25 * Math.max(0, level - 1);
}

export function pushInput(step, amount = 1, rootState = state) {
  const game = getGame(rootState);
  if (!game?.stations?.[step]) return;
  const target = game.stations[step];
  target.queue = (target.queue || 0) + amount;
  if (step === 'trap') {
    pushInput('craft', amount, rootState);
  } else if (step === 'craft') {
    pushInput('gather', amount, rootState);
  }
}

export function tryStartStation(step, rootState = state, now = performance.now()) {
  const game = getGame(rootState);
  const station = game?.stations?.[step];
  if (!station || station.queue <= 0) return false;
  if (station.busyUntil && station.busyUntil > now) return false;

  const { inventory } = game;
  if (step === 'craft' && inventory.wood <= 0) return false;
  if (step === 'trap' && inventory.spear <= 0) return false;

  if (step === 'craft') inventory.wood--;
  if (step === 'trap') inventory.spear--;

  station.queue--;
  const duration = station.baseMs / levelCoef(station.level || 1);
  station.workDuration = duration;
  station.workStart = now;
  station.busyUntil = now + duration;
  emitVisual(rootState, 'stationStart', step, now);
  return true;
}

function finishJob(step, rootState, now) {
  const game = getGame(rootState);
  if (step === 'gather') {
    game.inventory.wood++;
  } else if (step === 'craft') {
    game.inventory.spear++;
  } else if (step === 'trap') {
    game.deliveredSpear = (game.deliveredSpear || 0) + 1;
  }
  emitVisual(rootState, 'stationComplete', step, now);
}

export function tickLine(dt, rootState = state, now = performance.now()) {
  const game = getGame(rootState);
  if (!game?.flags?.modeOrderRush) return;

  for (const step of STEPS) {
    const station = game.stations[step];
    if (station.busyUntil > 0 && now >= station.busyUntil) {
      finishJob(step, rootState, now);
      station.busyUntil = 0;
      station.workStart = 0;
      station.workDuration = 0;
    }
  }

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const step of STEPS) {
      const station = game.stations[step];
      if (station.busyUntil > now) continue;
      if (tryStartStation(step, rootState, now)) progressed = true;
    }
  }

  void dt;
}
