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
  };
}

function resetPlayer(player){
  Object.assign(player, {
    x: 200,
    y: 400,
    r: 12,
    sp: 2.0,
    hp: 100,
    cold: 100,
    hasSpear: false,
    atk: 10,
    atkCD: 0,
    moving: false,
    dir: 4,
  });

  if(player.anim){
    Object.assign(player.anim, {
      state: PLAYER_STATE.IDLE,
      weapon: PLAYER_WEAPON.NONE,
      dir: 'left',
      frame: 0,
      timer: 0,
      fps: ANIM.idle.fps,
      loop: ANIM.idle.loop,
      grid: { ...ANIM.idle.grid },
      image: state.assets?.images?.[ANIM.idle.sheet] ?? null,
      sheetKey: 'idle',
    });
  }
}

function populateTrees(){
  state.trees.length = 0;
  for(let i = 0; i < 45; i++){
    state.trees.push({
      x: 300 + Math.random() * 1600,
      y: 200 + Math.random() * 1000,
      hp: 30,
    });
  }
}

function populateSnow(){
  state.snow = Array.from({ length: 120 }, () => ({
    x: Math.random() * state.world.w,
    y: Math.random() * state.world.h,
    r: 1.2 + Math.random() * 1.4,
    drift: 0.4 + Math.random() * 0.6,
    speed: 0.6 + Math.random() * 0.8,
  }));
}

export const state = {
  // DOM / UI
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

  // 入力（キーボード / ドラッグターゲット）
  keys: new Set(),
  moveTarget: { active: false, x: 0, y: 0 }, // 互換残置（未使用化）
  dragState: { active: false, started: false, startX: 0, startY: 0 }, // 互換残置（未使用化）
  input: createInputState(),

  // カメラ・ワールド
  world: { ...WORLD },
  cam: { x: 0, y: 0, shake: 0 },

  // エンティティ
  player: {
    x: 200, y: 400, r: 12, sp: 2.0, hp: 100, cold: 100, hasSpear: false, atk: 10, atkCD: 0,
    moving: false,
    dir: 4,
    // sprite anim state (initialized lazily; images loaded in main)
    anim: {
      state: PLAYER_STATE.IDLE,
      weapon: PLAYER_WEAPON.NONE,
      dir: 'left',
      frame: 0,
      timer: 0,
      fps: 10,
      loop: true,
      grid: { cols: 4, rows: 3 },
      image: null,
      sheetKey: 'idle',
    },
  },
  fire: { x: 220, y: 420, r: 18, heat: 70, embers: 0 },
  inv: { wood: 0, meat: 0 },

  // Images and sprite handles
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
  bear: { x: 1600, y: 900, r: 18, hp: 150, maxHp: 150, alive: true, aggro: false, inv: 0 },
  drops: [],
  snow: [],

  // 自動系クールダウン
  autoChopCooldown: 0,
  autoFeedCooldown: 0,

  // ゲーム状態
  gameOver: false,
  game: createGameState(),

  // Visual Effects
  particles: new ParticleSystem(),
  lighting: new LightingSystem(),
};

export function initState({ canvas, ctx, ui }) {
  state.canvas = canvas;
  state.ctx = ctx;
  state.ui = ui;

  // キー
  document.addEventListener('keydown', e => { state.keys.add(e.key); });
  document.addEventListener('keyup', e => { state.keys.delete(e.key); });

  restart();
}

export function restart() {
  state.gameOver = false;
  state.keys.clear();
  const freshInput = createInputState();
  if(state.input?.drag){
    Object.assign(state.input.drag, freshInput.drag);
  } else {
    state.input = freshInput;
  }
  state.moveTarget.active = false;
  state.dragState.active = false;
  state.dragState.started = false;

  state.cam.x = 0;
  state.cam.y = 0;
  state.cam.shake = 0;

  resetPlayer(state.player);
  Object.assign(state.fire, { x: 220, y: 420, r: 18, heat: 70, embers: 0 });
  Object.assign(state.inv, { wood: 0, meat: 0 });
  Object.assign(state.bear, {
    x: 1600,
    y: 900,
    r: 18,
    hp: 150,
    maxHp: 150,
    alive: true,
    aggro: false,
    inv: 0,
  });

  state.drops.length = 0;
  populateTrees();
  populateSnow();
  state.autoChopCooldown = 0;
  state.autoFeedCooldown = 0;
  state.game = createGameState();

  if(state.particles?.particles) state.particles.particles.length = 0;
  state.lighting?.reset?.();

  if(state.ui?.bear) state.ui.bear.style.width = '100%';
  if(state.ui?.bearHud) state.ui.bearHud.style.display = 'none';
  if(state.ui?.btnRestart) state.ui.btnRestart.disabled = true;

  log(t('tips.drag'));
}

// NOTE: 互換維持用（呼び出し元は ui/hud.js の log に置換済み）
export function log(msg) {
  if (state.ui?.log) state.ui.log.textContent = msg;
}
