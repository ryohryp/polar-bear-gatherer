import { state } from '../state.js';
import { log, updateHud, showGameOver } from '../ui/hud.js';
import { t } from '../ui/messages.js';
import { clamp, dist } from '../utils.js';
import { craftSpear, tryAttackBear, tryChopNearestTree, pickupDrops, feedFire } from './actions.js';

export function updateFrame(dt){
  const { keys, stick, player, world, fire, bear, inv } = state;

  // === GameOver時は停止（HUD更新のみ） ===
  if (state.gameOver){
    updateHud();
    return;
  }
  // 移動
  const up = keys.has('w')||keys.has('ArrowUp');
  const dn = keys.has('s')||keys.has('ArrowDown');
  const lt = keys.has('a')||keys.has('ArrowLeft');
  const rt = keys.has('d')||keys.has('ArrowRight');
  const sp = player.sp;

  let vx=0, vy=0;
  if (stick.active && (stick.dirX !== 0 || stick.dirY !== 0)){
    vx = stick.dirX * sp;
    vy = stick.dirY * sp;
  } else {
    if(up) vy -= sp;
    if(dn) vy += sp;
    if(lt) vx -= sp;
    if(rt) vx += sp;
  }
  player.x = clamp(player.x + vx, 0, world.w);
  player.y = clamp(player.y + vy, 0, world.h);

  if(state.autoChopCooldown>0) state.autoChopCooldown--;
  if(state.autoFeedCooldown>0) state.autoFeedCooldown--;

  // 温度/HP/焚き火
  const distToFire = dist(player, fire);
  const nearFire = distToFire<60 && fire.heat>0;
  player.cold += nearFire? 0.25 + fire.heat*0.004 : -(0.04 + (100-fire.heat)*0.0006);
  player.cold = clamp(player.cold, 0, 100);
  if(nearFire && player.hp<100) player.hp += 0.06;
  player.hp = clamp(player.hp, 0, 100);

  fire.heat = clamp(fire.heat - 0.018, 0, 100);
  if(fire.embers>0) fire.embers--;

  // 自動攻撃（近接）
  if(bear.alive && player.atkCD<=0 && dist(player,bear)<34){
    tryAttackBear();
  }

  // 自動伐採
  if(state.autoChopCooldown<=0){
    if(tryChopNearestTree('auto')) state.autoChopCooldown = player.hasSpear? 18 : 24;
  }

  // 自動拾得
  pickupDrops('auto');

  // 自動くべ
  const needsFuel = fire.heat<70 || fire.embers<10;
  if(state.autoFeedCooldown<=0 && distToFire<50 && needsFuel){
    if(feedFire(true)) state.autoFeedCooldown = 120;
  }

  // Bear AI
  if(bear.alive && bear.aggro){
    const dx = player.x - bear.x; const dy = player.y - bear.y; const d = Math.hypot(dx,dy);
    const speed = 1.1 + (player.hasSpear? 0.2:0);
    if(d>1){ bear.x += dx/d*speed; bear.y += dy/d*speed; }
    if(d<26 && bear.inv<=0){ player.hp -= 8; bear.inv=35; log(t('bear.attack')); }
    if(bear.inv>0) bear.inv--;
  }

  if(player.atkCD>0) player.atkCD--;
  if(player.cold<=0){ player.hp -= 0.15; }
  if(player.hp<=0 && !state.gameOver){
    player.hp = 0;
    state.gameOver = true;
    log(t('death'), { holdMs: 5000 });
    showGameOver(true);
    updateHud();
    return;
  }

  // UI
  updateHud();
  
  // Cキーでクラフト
  if(state.keys.has('C')){ state.keys.delete('C'); craftSpear(); }

  // 雪アニメ
  for(const flake of state.snow){
    flake.y += flake.speed;
    flake.x += Math.sin(flake.y*0.04)*flake.drift;
    if(flake.y>state.world.h){ flake.y = -20; flake.x = Math.random()*state.world.w; }
    if(flake.x<0) flake.x += state.world.w; else if(flake.x>state.world.w) flake.x -= state.world.w;
  }
}
