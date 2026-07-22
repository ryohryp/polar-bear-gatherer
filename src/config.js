export const BASE_W = 960;
export const BASE_H = 540;

export const FIXED_DT = 1/60;
export const MAX_STEPS = 5;

export const WORLD = { w: 2000, h: 1400 };

export const DRAG_THRESHOLD = 12;
export const STICK = { DEADZONE: 10, MAX_RADIUS: 72 };

const PLAYER_BLUE_BASE = './assets/img/player/player_blue_base.svg';
const PLAYER_BLUE_SPEAR = './assets/img/player/player_blue_spear.svg';

export const SPRITES = {
  player: { src: PLAYER_BLUE_BASE, cols: 2, rows: 2 },
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
export const DIRS = ['up','down','left','right','upleft','upright','downleft','downright'];
export const PLAYER_STATE = {
  IDLE:'idle', WALK:'walk', ATTACK:'attack', HURT:'hurt', DEAD:'dead', COLD:'cold',
};
export const PLAYER_WEAPON = { NONE:'none', SPEAR:'spear' };

export const ANIM = {
  idle: { sheet:PLAYER_BLUE_BASE, frames:4, fps:6, loop:true, grid:{cols:2, rows:2} },
  attack: { sheet:PLAYER_BLUE_BASE, frames:4, fps:14, loop:false, grid:{cols:2, rows:2} },
  spearIdle: { sheet:PLAYER_BLUE_SPEAR, frames:4, fps:6, loop:true, grid:{cols:2, rows:2} },
  spearAttack: { sheet:PLAYER_BLUE_SPEAR, frames:4, fps:14, loop:false, grid:{cols:2, rows:2} },
  hurt: { sheet:PLAYER_BLUE_BASE, frames:4, fps:12, loop:false, grid:{cols:2, rows:2} },
  dead: { sheet:PLAYER_BLUE_BASE, frames:4, fps:10, loop:false, grid:{cols:2, rows:2} },
  cold: { sheet:PLAYER_BLUE_BASE, frames:4, fps:8, loop:true, grid:{cols:2, rows:2} },
};

export const WALK_SHEETS = {
  none: {
    up:PLAYER_BLUE_BASE,
    down:PLAYER_BLUE_BASE,
    left:PLAYER_BLUE_BASE,
    right:PLAYER_BLUE_BASE,
    upleft:PLAYER_BLUE_BASE,
    upright:PLAYER_BLUE_BASE,
    downleft:PLAYER_BLUE_BASE,
    downright:PLAYER_BLUE_BASE,
  },
  spear: {
    up:PLAYER_BLUE_SPEAR,
    down:PLAYER_BLUE_SPEAR,
    left:PLAYER_BLUE_SPEAR,
    right:PLAYER_BLUE_SPEAR,
    upleft:PLAYER_BLUE_SPEAR,
    upright:PLAYER_BLUE_SPEAR,
    downleft:PLAYER_BLUE_SPEAR,
    downright:PLAYER_BLUE_SPEAR,
  },
};

export const WALK_ANIM = { frames:4, fps:10, loop:true, grid:{cols:2, rows:2} };
export const PLAYER_ICON = './assets/img/player/player_blue_icon.svg';
