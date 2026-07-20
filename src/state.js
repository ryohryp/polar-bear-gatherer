import { WORLD, PLAYER_STATE, PLAYER_WEAPON, ANIM } from './config.js';
import { t } from './ui/messages.js';
import { ParticleSystem } from './systems/particles.js';
import { LightingSystem } from './systems/lighting.js';

function createInputState() {
  return {
    drag: {
      active: false,
      pointerId: null,
      moved: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      dirX: 0,
      dirY: 0,
    },
  };
}

function createGameState() {
  return {
    coins: 0,
    time: 0,
    difficulty: 1,
    orders: [],
    completedOrders: 0,
    deliveredSpear: 0,
    inventory: {
      wood: 0,
      spear: 0,
    },
    stations: {
      gather: { level: 1, busyUntil: 0, queue: 0, baseMs: 1600, workStart: 0, workDuration: 0 },
      craft: { level: 1, busyUntil: 0, queue: 0, baseMs: 2000, workStart: 0, workDuration: 0 },
      trap: { level: 1, busyUntil: 0, queue: 0, baseMs: 1400, workStart: 0, workDuration: 0 },
    },
    orderConfig: {
      maxConcurrent: 1,
      baseExpireMs: 12000,
      rewardPerSpear: 3,
      penaltyFail: 10,
    },
    flags: {
      modeOrderRush: true,
    },
    nextOrderId: 1,
    nextDifficultyAt: 35,
    orderCheckTimer: 0,
    events: [],
    visualEvents: [],
  };
}

function createCampState() {
  return {
    center: { x: 500, y: 420 },
    popups: [],
    pulses: {
      gather: 0,
      craft: 0,
      trap: 0,
    },
  };
}

function createTrees() {
  const trees = [];
  const cx = 500;
  const cy = 420;

  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.18;
    const radius = 250 + Math.random() * 170;
    trees.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      hp: 30,
    });
  }

  for (let i = trees.length; i < 45; i++) {
    trees.push({
      x: 260 + Math.random() * 1500,
      y: 180 + Math.random() * 1040,
      hp: 30,
    });
  }

  return trees;
}

function createSnow() {
  return Array.from({ length: 120 }, () => ({
    x: Math.random() * WORLD.w,
    y: Math.random() * WORLD.h,
    r: 1.2 + Math.random() * 1.4,
    drift: 0.4 + Math.random() * 0.6,
    speed: 0.6 + Math.random() * 0.8,
  }));
}

export const state = {
  canvas: null,
  ctx: null,
  ui: null,
  screen: {
    width: 0,
    height: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    dpr: 1,
  },

  keys: new Set(),
  moveTarget: { active: false, x: 0, y: 0 },
  dragState: { active: false, started: false, startX: 0, startY: 0 },
  input: createInputState(),

  world: { ...WORLD },
  cam: { x: 0, y: 0, shake: 0 },

  player: {
    x: 500,
    y: 515,
    r: 12,
    sp: 2.0,
    hp: 100,
    cold: 100,
    hasSpear: false,
    atk: 10,
    atkCD: 0,
    moving: false,
    anim: {
      state: PLAYER_STATE.IDLE,
      weapon: PLAYER_WEAPON.NONE,
      dir: 'up',
      frame: 0,
      timer: 0,
      fps: 10,
      loop: true,
      grid: { cols: 4, rows: 3 },
      image: null,
      sheetKey: 'idle',
    },
  },
  fire: { x: 500, y: 440, r: 18, heat: 70, embers: 0 },
  inv: { wood: 0, meat: 0 },

  assets: { images: {} },
  images: {},
  sprites: {
    objects: {
      treeAlive: null,
      treeStump: null,
      woodDrop: null,
      meatDrop: null,
    },
  },

  trees: [],
  bear: { x: 1600, y: 900, r: 22, hp: 150, alive: true, aggro: false, inv: 0 },
  drops: [],
  snow: [],

  autoChopCooldown: 0,
  autoFeedCooldown: 0,

  gameOver: false,
  game: createGameState(),
  camp: createCampState(),

  particles: new ParticleSystem(),
  lighting: new LightingSystem(),
};

function resetPlayer() {
  const player = state.player;
  player.x = 500;
  player.y = 515;
  player.hp = 100;
  player.cold = 100;
  player.hasSpear = false;
  player.atk = 10;
  player.atkCD = 0;
  player.moving = false;

  if (player.anim) {
    player.anim.state = PLAYER_STATE.IDLE;
    player.anim.weapon = PLAYER_WEAPON.NONE;
    player.anim.dir = 'up';
    player.anim.frame = 0;
    player.anim.timer = 0;
    player.anim.fps = 10;
    player.anim.loop = true;
    player.anim.grid = { cols: 4, rows: 3 };
    player.anim.sheetKey = 'idle';
    player.anim.image = state.assets?.images?.[ANIM.idle.sheet] ?? null;
  }
}

function resetWorld() {
  resetPlayer();

  Object.assign(state.fire, { x: 500, y: 440, r: 18, heat: 70, embers: 0 });
  Object.assign(state.inv, { wood: 0, meat: 0 });
  Object.assign(state.bear, { x: 1600, y: 900, r: 22, hp: 150, alive: true, aggro: false, inv: 0 });

  state.trees = createTrees();
  state.drops = [];
  state.snow = createSnow();
  state.autoChopCooldown = 0;
  state.autoFeedCooldown = 0;
  state.gameOver = false;
  state.keys.clear();
  state.game = createGameState();
  state.camp = createCampState();
  state.cam.x = 0;
  state.cam.y = 0;
  state.cam.shake = 0;
  state.particles = new ParticleSystem();
  state.lighting = new LightingSystem();

  if (state.ui?.bearHud) state.ui.bearHud.style.display = 'none';
  if (state.ui?.bear) state.ui.bear.style.width = '100%';
  if (state.input?.drag) Object.assign(state.input.drag, createInputState().drag);
}

export function initState({ canvas, ctx, ui }) {
  state.canvas = canvas;
  state.ctx = ctx;
  state.ui = ui;
  resetWorld();

  document.addEventListener('keydown', e => { state.keys.add(e.key); });
  document.addEventListener('keyup', e => { state.keys.delete(e.key); });

  log(t('tips.drag'));
}

export function restart() {
  resetWorld();
  log('キャンプを再建しました。まずは木材を集めよう！');
}

export function log(msg) {
  if (state.ui?.log) state.ui.log.textContent = msg;
}
