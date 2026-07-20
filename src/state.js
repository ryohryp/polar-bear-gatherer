import { WORLD, PLAYER_STATE, PLAYER_WEAPON } from './config.js';
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
  cam: { x: 0, y: 0 },

  // エンティティ
  player: {
    x: 200, y: 400, r: 12, sp: 2.0, hp: 100, cold: 100, hasSpear: false, atk: 10, atkCD: 0,
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
      sheetKey: 'idle'
    }
  },
  fire: { x: 220, y: 420, r: 18, heat: 70, embers: 0 },
  inv: { wood: 0, meat: 0 },

  // Images and sprite handles
  images: {},
  sprites: {
    objects: {
      treeAlive: null,
      treeStump: null,
      woodDrop: null,
      meatDrop: null,
    }
  },

  trees: [],
  bear: { x: 1600, y: 900, r: 18, hp: 150, alive: true, aggro: false, inv: 0 },
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
  state.game = createGameState();
  if (state.input?.drag) {
    Object.assign(state.input.drag, createInputState().drag);
  }

  // キー
  document.addEventListener('keydown', e => { state.keys.add(e.key); });
  document.addEventListener('keyup', e => { state.keys.delete(e.key); });

  // ツリー
  state.trees.length = 0;
  for (let i = 0; i < 45; i++) {
    state.trees.push({ x: 300 + Math.random() * 1600, y: 200 + Math.random() * 1000, hp: 30 });
  }

  // 雪
  state.snow = Array.from({ length: 120 }, () => ({
    x: Math.random() * state.world.w,
    y: Math.random() * state.world.h,
    r: 1.2 + Math.random() * 1.4,
    drift: 0.4 + Math.random() * 0.6,
    speed: 0.6 + Math.random() * 0.8
  }));

  log(t('tips.drag'));
}

export function restart() {
  const { player, inv, trees, bear, drops, fire, ui } = state;
  player.x = 200; player.y = 400; player.hp = 100; player.cold = 100; player.hasSpear = false; player.atk = 10; player.atkCD = 0;
  // reset anim
  if (player.anim) {
    player.anim.state = PLAYER_STATE.IDLE;
    player.anim.weapon = PLAYER_WEAPON.NONE;
    player.anim.dir = 'left';
    player.anim.frame = 0;
    player.anim.timer = 0;
    player.anim.fps = 10;
    player.anim.loop = true;
    player.anim.grid = { cols: 4, rows: 3 };
    player.anim.image = null;
    player.anim.sheetKey = 'idle';
  }
}

// NOTE: 互換維持用（呼び出し元は ui/hud.js の log に置換済み）
export function log(msg) {
  if (state.ui?.log) state.ui.log.textContent = msg;
}
