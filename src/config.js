export const BASE_W = 960;
export const BASE_H = 540;

export const FIXED_DT = 1/60;
export const MAX_STEPS = 5;

export const WORLD = { w: 2000, h: 1400 };

// 入力まわり
export const DRAG_THRESHOLD = 12; // px（画面座標）
// === バーチャルスティック ===
export const STICK = {
  DEADZONE: 10,     // px（起点からの半径。これ未満は無視）
  MAX_RADIUS: 72,   // px（これ以上は正規化して1.0扱い）
};

// src/config.js
export const SPRITES = {
  player: {
    src: './assets/img/player_sprite.png',
    cols: 6,   // 横6方向
    rows: 1    // 縦1行（384x96 → 1セル 64x96 になる）
  }
};
