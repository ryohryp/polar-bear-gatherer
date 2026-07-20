export const BASE_W = 960;
export const BASE_H = 540;

export const FIXED_DT = 1/60;
export const MAX_STEPS = 5;

export const WORLD = { w: 2000, h: 1400 };

// 入力まわり

export const DRAG_THRESHOLD = 12; // px: 画面座標
// === バーチャルスティック ===
export const STICK = {
  DEADZONE: 10,     // px: 起点からの半径。これ未満は無視
  MAX_RADIUS: 72,   // px: これ以上は正規化して1.0扱い
};

// src/config.js
export const SPRITES = {
  player: {
    src: './assets/img/player_sprite.png',
    cols: 4,   // 512x512 / 4x4 スプライト
    rows: 4    // 全16スタイル
  }
};

// === Assets: Resource Objects ===
export const ASSETS = {
  objects: {
    // Use existing asset locations under assets/img/objects
    treeAlive: './assets/img/objects/tree_alive.png',
    treeStump: './assets/img/objects/tree_stump_cut.png',
    woodDrop:  './assets/img/objects/wood_drop.png',
    // Note: file name is meet_drop.png in repo; keep key as meatDrop
    meatDrop:  './assets/img/objects/meet_drop.png',
  }
};

// 推奨ピクセルサイズ（UIスケール変更時の等倍基準）
export const SIZES = {
  TREE_ALIVE: { w: 48, h: 64 },
  TREE_STUMP: { w: 48, h: 32 },
  WOOD:       { w: 16, h: 16 },
  MEAT:       { w: 16, h: 16 },
};

// === Player sprite integration ===
export const SPRITE = { SIZE: 32, ICON: 48 };
export const DIRS = [
  'up','down','left','right','upleft','upright','downleft','downright'
];
export const PLAYER_STATE = {
  IDLE:'idle', WALK:'walk', ATTACK:'attack', HURT:'hurt', DEAD:'dead', COLD:'cold'
};
export const PLAYER_WEAPON = { NONE:'none', SPEAR:'spear' };
export const ANIM = {
  idle:       { sheet:"./assets/img/player/player_idle_32x32.png",           frames:12, fps:10, loop:true,  grid:{cols:4, rows:3} },
  attack:     { sheet:"./assets/img/player/player_attack_32x32.png",         frames:12, fps:14, loop:false, grid:{cols:4, rows:3} },
  spearIdle:  { sheet:"./assets/img/player/player_spear_idle_32x32.png",     frames:12, fps:10, loop:true,  grid:{cols:4, rows:3} },
  spearAttack:{ sheet:"./assets/img/player/player_spear_attack_32x32.png",   frames:12, fps:14, loop:false, grid:{cols:4, rows:3} },
  hurt:       { sheet:"./assets/img/player/player_hurt_32x32.png",           frames:4,  fps:12, loop:false, grid:{cols:2, rows:2} },
  dead:       { sheet:"./assets/img/player/player_dead_32x32.png",           frames:4,  fps:10, loop:false, grid:{cols:2, rows:2} },
  cold:       { sheet:"./assets/img/player/player_cold_32x32.png",           frames:4,  fps:8,  loop:true,  grid:{cols:2, rows:2} },
};
export const WALK_SHEETS = {
  none: {
    up:"./assets/img/player/player_walk_up_32x32.png",
    down:"./assets/img/player/player_walk_down_32x32.png",
    left:"./assets/img/player/player_walk_left_32x32.png",
    right:"./assets/img/player/player_walk_right_32x32.png",
    upleft:"./assets/img/player/player_walk_upleft_32x32.png",
    upright:"./assets/img/player/player_walk_upright_32x32.png",
    downleft:"./assets/img/player/player_walk_downleft_32x32.png",
    downright:"./assets/img/player/player_walk_downright_32x32.png",
  },
  spear: {
    up:"./assets/img/player/player_spear_walk_up_32x32.png",
    down:"./assets/img/player/player_spear_walk_down_32x32.png",
    left:"./assets/img/player/player_spear_walk_left_32x32.png",
    right:"./assets/img/player/player_spear_walk_right_32x32.png",
    upleft:"./assets/img/player/player_spear_walk_upleft_32x32.png",
    upright:"./assets/img/player/player_spear_walk_upright_32x32.png",
    downleft:"./assets/img/player/player_spear_walk_downleft_32x32.png",
    downright:"./assets/img/player/player_spear_walk_downright_32x32.png",
  }
};
export const WALK_ANIM = { frames:4, fps:10, loop:true, grid:{cols:2, rows:2} };
export const PLAYER_ICON = "./assets/img/player/player_icon_48x48.png";
