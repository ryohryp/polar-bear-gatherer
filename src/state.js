import { WORLD } from './config.js';
import { t } from './ui/messages.js';

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
  moveTarget: { active:false, x:0, y:0 }, // 互換残置（未使用化）
  dragState: { active:false, started:false, startX:0, startY:0 }, // 互換残置（未使用化）
  stick: {
    active: false,
    originX: 0, originY: 0,
    curX: 0, curY: 0,
    dirX: 0, dirY: 0,
  },

  // カメラ・ワールド
  world: { ...WORLD },
  cam: { x:0, y:0 },

  // エンティティ
  player: { x:200, y:400, r:12, sp:2.0, hp:100, cold:100, hasSpear:false, atk:10, atkCD:0 },
  fire:   { x:220, y:420, r:18, heat:70, embers:0 },
  inv:    { wood:0, meat:0 },

  trees: [],
  bear:  { x:1600, y:900, r:18, hp:150, alive:true, aggro:false, inv:0 },
  drops: [],
  snow: [],

  // 自動系クールダウン
  autoChopCooldown: 0,
  autoFeedCooldown: 0,

  // ゲーム状態
  gameOver: false,
};

export function initState({ canvas, ctx, ui }){
  state.canvas = canvas;
  state.ctx = ctx;
  state.ui = ui;

  // キー
  document.addEventListener('keydown', e=>{ state.keys.add(e.key); });
  document.addEventListener('keyup',   e=>{ state.keys.delete(e.key); });

  // ツリー
  state.trees.length = 0;
  for(let i=0;i<45;i++){
    state.trees.push({ x: 300+ Math.random()*1600, y: 200+Math.random()*1000, hp: 30});
  }

  // 雪
  state.snow = Array.from({length:120},()=>({
    x: Math.random()*state.world.w,
    y: Math.random()*state.world.h,
    r: 1.2+Math.random()*1.4,
    drift: 0.4+Math.random()*0.6,
    speed: 0.6+Math.random()*0.8
  }));

  log(t('tips.drag'));
}

export function restart(){
  const { player, inv, trees, bear, drops, fire, ui } = state;
  player.x=200; player.y=400; player.hp=100; player.cold=100; player.hasSpear=false; player.atk=10; player.atkCD=0;
  inv.wood=0; inv.meat=0; ui.bearHud.style.display='none';
  trees.forEach(t=>t.hp = Math.random()<0.5? 30:20);
  bear.x=1600; bear.y=900; bear.hp=150; bear.alive=true; bear.aggro=false; bear.inv=0;
  drops.length=0;
  fire.heat = 70; fire.embers = 0;
  state.gameOver = false;
  log('再開！');
}

// NOTE: 互換維持用（呼び出し元は ui/hud.js の log に置換済み）
export function log(msg){
  if(state.ui?.log) state.ui.log.textContent = msg;
}
