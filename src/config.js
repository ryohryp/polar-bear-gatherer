export const BASE_W = 960;
export const BASE_H = 540;

export const FIXED_DT = 1 / 60;
export const MAX_STEPS = 5;

export const WORLD = { w: 2000, h: 1400 };

export const DRAG_THRESHOLD = 12;
export const STICK = { DEADZONE: 10, MAX_RADIUS: 72 };

const PLAYER_BLUE_BASE = './assets/img/player/player_blue_base.svg';
const PLAYER_BLUE_SPEAR = './assets/img/player/player_blue_spear.svg';

const PLAYER_BLUE_IDLE = {
  up: './assets/img/player/player_blue_idle_up.png',
  down: './assets/img/player/player_blue_idle_down.png',
  left: './assets/img/player/player_blue_idle_left.png',
  right: './assets/img/player/player_blue_idle_right.png',
};

const PLAYER_BLUE_SPEAR_IDLE = {
  up: './assets/img/player/player_blue_spear_idle_up.png',
  down: './assets/img/player/player_blue_spear_idle_down.png',
  left: './assets/img/player/player_blue_spear_idle_left.png',
  right: './assets/img/player/player_blue_spear_idle_right.png',
};

const PLAYER_BLUE_WALK = {
  up: './assets/img/player/player_blue_walk_up.png',
  down: './assets/img/player/player_blue_walk_down.png',
  left: './assets/img/player/player_blue_walk_left.png',
  right: './assets/img/player/player_blue_walk_right.png',
};

const PLAYER_BLUE_SPEAR_WALK = {
  up: './assets/img/player/player_blue_spear_walk_up.png',
  down: './assets/img/player/player_blue_spear_walk_down.png',
  left: './assets/img/player/player_blue_spear_walk_left.png',
  right: './assets/img/player/player_blue_spear_walk_right.png',
};

export const SPRITES = {
  player: { src: PLAYER_BLUE_IDLE.down, cols: 2, rows: 2 },
};

export const ASSETS = {
  objects: {
    treeAlive: './assets/img/objects/tree_alive.png',
    treeStump: './assets/img/objects/tree_stump_cut.png',
    woodDrop: './assets/img/objects/wood_drop.png',
    meatDrop: './assets/img/objects/meet_drop.png',
  },
};

export const SIZES = {
  TREE_ALIVE: { w: 48, h: 64 },
  TREE_STUMP: { w: 48, h: 32 },
  WOOD: { w: 16, h: 16 },
  MEAT: { w: 16, h: 16 },
};

export const SPRITE = { SIZE: 48, ICON: 48 };
export const DIRS = ['up', 'down', 'left', 'right', 'upleft', 'upright', 'downleft', 'downright'];

export const PLAYER_STATE = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  HURT: 'hurt',
  DEAD: 'dead',
  COLD: 'cold',
};

export const PLAYER_WEAPON = {
  NONE: 'none',
  SPEAR: 'spear',
};

const FOUR_FRAME_GRID = { cols: 2, rows: 2 };

export const IDLE_ANIM = {
  frames: 4,
  fps: 6,
  loop: true,
  grid: FOUR_FRAME_GRID,
};

export const WALK_ANIM = {
  frames: 4,
  fps: 10,
  loop: true,
  grid: FOUR_FRAME_GRID,
};

export const ANIM = {
  idle: {
    sheet: PLAYER_BLUE_IDLE.down,
    ...IDLE_ANIM,
  },
  attack: {
    sheet: PLAYER_BLUE_BASE,
    frames: 4,
    fps: 14,
    loop: false,
    grid: FOUR_FRAME_GRID,
  },
  spearIdle: {
    sheet: PLAYER_BLUE_SPEAR_IDLE.down,
    ...IDLE_ANIM,
  },
  spearAttack: {
    sheet: PLAYER_BLUE_SPEAR,
    frames: 4,
    fps: 14,
    loop: false,
    grid: FOUR_FRAME_GRID,
  },
  hurt: {
    sheet: PLAYER_BLUE_BASE,
    frames: 4,
    fps: 12,
    loop: false,
    grid: FOUR_FRAME_GRID,
  },
  dead: {
    sheet: PLAYER_BLUE_BASE,
    frames: 4,
    fps: 10,
    loop: false,
    grid: FOUR_FRAME_GRID,
  },
  cold: {
    sheet: PLAYER_BLUE_BASE,
    frames: 4,
    fps: 8,
    loop: true,
    grid: FOUR_FRAME_GRID,
  },
};

export const IDLE_SHEETS = {
  none: {
    up: PLAYER_BLUE_IDLE.up,
    down: PLAYER_BLUE_IDLE.down,
    left: PLAYER_BLUE_IDLE.left,
    right: PLAYER_BLUE_IDLE.right,
    upleft: PLAYER_BLUE_IDLE.left,
    upright: PLAYER_BLUE_IDLE.right,
    downleft: PLAYER_BLUE_IDLE.left,
    downright: PLAYER_BLUE_IDLE.right,
  },
  spear: {
    up: PLAYER_BLUE_SPEAR_IDLE.up,
    down: PLAYER_BLUE_SPEAR_IDLE.down,
    left: PLAYER_BLUE_SPEAR_IDLE.left,
    right: PLAYER_BLUE_SPEAR_IDLE.right,
    upleft: PLAYER_BLUE_SPEAR_IDLE.left,
    upright: PLAYER_BLUE_SPEAR_IDLE.right,
    downleft: PLAYER_BLUE_SPEAR_IDLE.left,
    downright: PLAYER_BLUE_SPEAR_IDLE.right,
  },
};

export const WALK_SHEETS = {
  none: {
    up: PLAYER_BLUE_WALK.up,
    down: PLAYER_BLUE_WALK.down,
    left: PLAYER_BLUE_WALK.left,
    right: PLAYER_BLUE_WALK.right,
    upleft: PLAYER_BLUE_WALK.left,
    upright: PLAYER_BLUE_WALK.right,
    downleft: PLAYER_BLUE_WALK.left,
    downright: PLAYER_BLUE_WALK.right,
  },
  spear: {
    up: PLAYER_BLUE_SPEAR_WALK.up,
    down: PLAYER_BLUE_SPEAR_WALK.down,
    left: PLAYER_BLUE_SPEAR_WALK.left,
    right: PLAYER_BLUE_SPEAR_WALK.right,
    upleft: PLAYER_BLUE_SPEAR_WALK.left,
    upright: PLAYER_BLUE_SPEAR_WALK.right,
    downleft: PLAYER_BLUE_SPEAR_WALK.left,
    downright: PLAYER_BLUE_SPEAR_WALK.right,
  },
};

export const PLAYER_ICON = './assets/img/player/player_blue_icon.svg';
