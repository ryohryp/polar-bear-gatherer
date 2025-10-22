import { state } from '../state.js';
import { SPRITE, DIRS, PLAYER_STATE, PLAYER_WEAPON, ANIM, WALK_ANIM, WALK_SHEETS } from '../config.js';
import { log, updateHud, showGameOver } from '../ui/hud.js';
import { t } from '../ui/messages.js';
import { clamp, dist } from '../utils.js';
import { craftSpear, tryAttackBear, tryChopNearestTree, pickupDrops, feedFire, applyOrderPenalty } from './actions.js';
import { tickLine } from './line.js';
import { maybeSpawnOrders, tickOrders, raiseDifficulty } from './orders.js';

export function updateFrame(dt){
  const { keys, player, world, fire, bear, inv, input, game } = state;
  const nowMs = performance.now();

  // === GameOver時は停止（HUD更新のみ） ===
  if (state.gameOver){
    updateHud();
    return;
  }
  game.time += dt;
  // 移動
  const up = keys.has('w')||keys.has('ArrowUp');
  const dn = keys.has('s')||keys.has('ArrowDown');
  const lt = keys.has('a')||keys.has('ArrowLeft');
  const rt = keys.has('d')||keys.has('ArrowRight');
  const sp = player.sp;

  let vx=0, vy=0;
  const drag = input?.drag;
  if (drag?.active && drag.moved){
    vx = drag.dirX * sp;
    vy = drag.dirY * sp;
  } else {
    if(up) vy -= sp;
    if(dn) vy += sp;
    if(lt) vx -= sp;
    if(rt) vx += sp;
  }
  // movement flag for animations
  player.moving = (vx !== 0 || vy !== 0);
  // update facing direction from current movement vector
  updatePlayerDir(player, vx, vy);
  player.x = clamp(player.x + vx, 0, world.w);
  player.y = clamp(player.y + vy, 0, world.h);

  // === Player anim: 8-dir quantize and sheet selection ===
  updatePlayerAnim(player, vx, vy);

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

  // Order rush systems
  if(game.flags.modeOrderRush){
    tickLine(dt, state, nowMs);
    tickOrders(dt, state, nowMs);
    game.orderCheckTimer += dt;
    while(game.orderCheckTimer >= 1){
      maybeSpawnOrders(state, nowMs);
      raiseDifficulty(state);
      game.orderCheckTimer -= 1;
    }
    if(game.events.length){
      for(const evt of game.events){
        if(evt.type === 'orderFail'){
          applyOrderPenalty(evt.penalty);
        } else if(evt.type === 'orderDone'){
          // TODO: 槍納品で白熊戦に影響を与えるフックを実装
        }
      }
      game.events.length = 0;
    }
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
  const btnUpgrade = state.ui?.btnUpgradeCraft;
  if(btnUpgrade){
    const station = game.stations.craft;
    const cost = 20 * station.level;
    btnUpgrade.textContent = `CRAFT LvUP (${cost}c)`;
    btnUpgrade.disabled = state.game.coins < cost;
  }

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

// src/systems/update.js
export function updatePlayerDir(player, vx, vy) {
  if (vx === 0 && vy === 0) return;

  const angle = Math.atan2(vy, vx);
  const deg = (angle * 180 / Math.PI + 360) % 360;

  // --- 6方向シート用に丸めた角度分割 ---
  if (deg >= 330 || deg < 30) player.dir = 2;          // 右
  else if (deg < 90) player.dir = 1;                   // 右下
  else if (deg < 150) player.dir = 0;                  // 下
  else if (deg < 210) player.dir = 5;                  // 左下
  else if (deg < 270) player.dir = 4;                  // 左
  else player.dir = 3;                                 // 上
}

// choose sheet and params based on player state
function selectSheet(player){
  const anim = player.anim;
  const weaponKey = anim.weapon === PLAYER_WEAPON.SPEAR ? 'spear' : 'none';
  // priority: DEAD > HURT > ATTACK > COLD > WALK > IDLE
  let cfg = null; let sheetKey = '';
  if(anim.state === PLAYER_STATE.DEAD){ cfg = ANIM.dead; sheetKey = 'dead'; }
  else if(anim.state === PLAYER_STATE.HURT){ cfg = ANIM.hurt; sheetKey = 'hurt'; }
  else if(anim.state === PLAYER_STATE.ATTACK){
    cfg = (weaponKey==='spear') ? ANIM.spearAttack : ANIM.attack; sheetKey = weaponKey==='spear'?'spearAttack':'attack';
  }
  else if(anim.state === PLAYER_STATE.COLD){ cfg = ANIM.cold; sheetKey = 'cold'; }
  else if(anim.state === PLAYER_STATE.WALK){
    const path = WALK_SHEETS[weaponKey][anim.dir] || WALK_SHEETS[weaponKey]['down'];
    cfg = { sheet: path, ...WALK_ANIM };
    sheetKey = `walk:${weaponKey}:${anim.dir}`;
  } else {
    cfg = (weaponKey==='spear') ? ANIM.spearIdle : ANIM.idle; sheetKey = weaponKey==='spear'?'spearIdle':'idle';
  }
  const image = state.assets?.images?.[cfg.sheet] || null;
  return { image, frames: cfg.frames, fps: cfg.fps, loop: cfg.loop, grid: cfg.grid, sheetKey };
}

function quantize8Dir(vx, vy, prevDir){
  const t = 0.1; // DEADZONE
  const ax = Math.abs(vx), ay = Math.abs(vy);
  if(ax < t && ay < t){ return prevDir || 'down'; }
  const ang = Math.atan2(vy, vx); // -PI..PI (x-right, y-down)
  const deg = (ang * 180 / Math.PI + 360) % 360;
  if(deg >= 337.5 || deg < 22.5) return 'right';
  if(deg < 67.5) return 'downright';
  if(deg < 112.5) return 'down';
  if(deg < 157.5) return 'downleft';
  if(deg < 202.5) return 'left';
  if(deg < 247.5) return 'upleft';
  if(deg < 292.5) return 'up';
  return 'upright';
}

function updatePlayerAnim(player, vx, vy){
  const anim = player.anim;
  if(!anim) return;
  // weapon sync
  anim.weapon = player.hasSpear ? PLAYER_WEAPON.SPEAR : PLAYER_WEAPON.NONE;
  // dir update (8-way)
  anim.dir = quantize8Dir(vx, vy, anim.dir);
  // walking state based on movement when not in high-priority states
  if(anim.state !== PLAYER_STATE.ATTACK && anim.state !== PLAYER_STATE.HURT && anim.state !== PLAYER_STATE.DEAD){
    anim.state = player.moving ? PLAYER_STATE.WALK : PLAYER_STATE.IDLE;
  }
  const beforeKey = anim.sheetKey;
  const chosen = selectSheet(player);
  anim.image = chosen.image; anim.fps = chosen.fps; anim.loop = chosen.loop; anim.grid = chosen.grid; anim.sheetKey = chosen.sheetKey;
  const frames = chosen.frames;
  // frame timer
  anim.timer += 1; // tick based
  const threshold = Math.max(1, Math.floor(60 / (anim.fps || 1)));
  if(anim.timer >= threshold){
    anim.timer = 0; anim.frame += 1;
  }
  if(anim.loop){
    anim.frame = frames>0 ? (anim.frame % frames) : 0;
  } else {
    const last = Math.max(0, frames-1);
    if(anim.frame >= last){
      anim.frame = last;
      // natural recovery after non-loop end
      if(anim.state === PLAYER_STATE.ATTACK){
        anim.state = player.moving ? PLAYER_STATE.WALK : PLAYER_STATE.IDLE;
      }
    }
  }
  // reset on sheet change
  if(anim.sheetKey !== beforeKey){
    anim.frame = 0; anim.timer = 0;
  }
}
