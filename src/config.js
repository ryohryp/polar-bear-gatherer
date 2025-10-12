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
