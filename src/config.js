export const BASE_W = 960;
export const BASE_H = 540;

export const FIXED_DT = 1/60;
export const MAX_STEPS = 5;

export const WORLD = { w: 2000, h: 1400 };

export const DRAG_THRESHOLD = 12;
export const STICK = { DEADZONE: 10, MAX_RADIUS: 72 };

export const SPRITES = {
  player: { src: './assets/img/player_sprite.png', cols: 4, rows: 4 },
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

export const SPRITE = { SIZE: 32, ICON: 48 };
export const DIRS = ['up','down','left','right','upleft','upright','downleft','downright'];
export const PLAYER_STATE = {
  IDLE:'idle', WALK:'walk', ATTACK:'attack', HURT:'hurt', DEAD:'dead', COLD:'cold',
};
export const PLAYER_WEAPON = { NONE:'none', SPEAR:'spear' };

function playerSvg({ cols, rows, state = 'idle', spear = false, icon = false }) {
  const width = cols * 32;
  const height = rows * 32;
  const count = cols * rows;
  const frames = Array.from({ length: count }, (_, index) => {
    const x = (index % cols) * 32;
    const y = Math.floor(index / cols) * 32;
    const phase = index % 4;
    const bob = state === 'walk' ? (phase % 2) : state === 'idle' ? (phase === 1 ? 1 : 0) : 0;
    const legL = state === 'walk' ? (phase % 2 ? 2 : -1) : 0;
    const legR = state === 'walk' ? (phase % 2 ? -1 : 2) : 0;
    const hurt = state === 'hurt';
    const cold = state === 'cold';
    const dead = state === 'dead';
    const attack = state === 'attack';
    const bodyY = dead ? 20 : 10 + bob;
    const opacity = hurt && phase % 2 ? 0.55 : 1;
    const spearSvg = spear && !dead
      ? `<rect x="${attack ? 22 + phase : 21}" y="${attack ? 3 + phase : 5}" width="2" height="22" fill="#8a5a35" transform="rotate(${attack ? 28 + phase * 7 : 20} 22 16)"/><rect x="22" y="2" width="2" height="5" fill="#d9edf2" transform="rotate(${attack ? 28 + phase * 7 : 20} 22 16)"/>`
      : '';
    const coldMarks = cold ? `<path d="M5 7h3M4 11h4M25 7h3M25 11h4" stroke="#d9f4ff" stroke-width="1"/>` : '';
    return `<g transform="translate(${x} ${y})" opacity="${opacity}" shape-rendering="crispEdges">
      <ellipse cx="16" cy="28" rx="8" ry="2" fill="#081322" opacity=".45"/>
      ${dead ? `<g transform="rotate(90 16 18)">` : '<g>'}
      <rect x="10" y="${bodyY}" width="12" height="13" rx="2" fill="#c7a56a"/>
      <rect x="8" y="${bodyY + 2}" width="3" height="10" fill="#496579"/>
      <rect x="21" y="${bodyY + 2}" width="3" height="10" fill="#496579"/>
      <rect x="9" y="4" width="14" height="10" rx="4" fill="#d9edf2"/>
      <rect x="11" y="6" width="10" height="8" fill="#314b60"/>
      <rect x="13" y="8" width="6" height="5" fill="#c97b4f"/>
      <rect x="11" y="23" width="5" height="6" fill="#35536a" transform="translate(${legL} 0)"/>
      <rect x="17" y="23" width="5" height="6" fill="#35536a" transform="translate(${legR} 0)"/>
      <rect x="10" y="28" width="7" height="2" fill="#20384d" transform="translate(${legL} 0)"/>
      <rect x="17" y="28" width="7" height="2" fill="#20384d" transform="translate(${legR} 0)"/>
      ${spearSvg}${coldMarks}</g>
    </g>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${icon ? 48 : width}" height="${icon ? 48 : height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${frames}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PLAYER_IDLE = playerSvg({ cols:4, rows:3, state:'idle' });
const PLAYER_WALK = playerSvg({ cols:2, rows:2, state:'walk' });
const PLAYER_ATTACK = playerSvg({ cols:4, rows:3, state:'attack' });
const PLAYER_SPEAR_WALK = playerSvg({ cols:2, rows:2, state:'walk', spear:true });
const PLAYER_SPEAR_ATTACK = playerSvg({ cols:4, rows:3, state:'attack', spear:true });
const PLAYER_HURT = playerSvg({ cols:2, rows:2, state:'hurt' });
const PLAYER_DEAD = playerSvg({ cols:2, rows:2, state:'dead' });
const PLAYER_COLD = playerSvg({ cols:2, rows:2, state:'cold' });

export const ANIM = {
  idle: { sheet:PLAYER_IDLE, frames:12, fps:7, loop:true, grid:{cols:4, rows:3} },
  attack: { sheet:PLAYER_ATTACK, frames:12, fps:14, loop:false, grid:{cols:4, rows:3} },
  spearIdle: { sheet:PLAYER_SPEAR_WALK, frames:4, fps:5, loop:true, grid:{cols:2, rows:2} },
  spearAttack: { sheet:PLAYER_SPEAR_ATTACK, frames:12, fps:14, loop:false, grid:{cols:4, rows:3} },
  hurt: { sheet:PLAYER_HURT, frames:4, fps:12, loop:false, grid:{cols:2, rows:2} },
  dead: { sheet:PLAYER_DEAD, frames:4, fps:10, loop:false, grid:{cols:2, rows:2} },
  cold: { sheet:PLAYER_COLD, frames:4, fps:8, loop:true, grid:{cols:2, rows:2} },
};

export const WALK_SHEETS = {
  none: Object.fromEntries(DIRS.map(dir => [dir, PLAYER_WALK])),
  spear: Object.fromEntries(DIRS.map(dir => [dir, PLAYER_SPEAR_WALK])),
};
export const WALK_ANIM = { frames:4, fps:10, loop:true, grid:{cols:2, rows:2} };
export const PLAYER_ICON = playerSvg({ cols:1, rows:1, state:'idle', icon:true });
