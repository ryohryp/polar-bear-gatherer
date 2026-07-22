import { state } from '../state.js';
import { PLAYER_STATE, PLAYER_WEAPON, ANIM, WALK_ANIM, WALK_SHEETS } from '../config.js';
import { log, updateHud, showGameOver } from '../ui/hud.js';
import { t } from '../ui/messages.js';
import { clamp, dist } from '../utils.js';
import {
  craftSpear,
  tryAttackBear,
  tryChopNearestTree,
  pickupDrops,
  feedFire,
  applyOrderPenalty,
  applyOrderBattleImpact,
} from './actions.js';
import { tickLine } from './line.js';
import { maybeSpawnOrders, tickOrders, raiseDifficulty } from './orders.js';
<<<<<<< HEAD
import { announceCampEvent, updateCampVisuals } from './camp.js';
=======
import { playSfx } from './audio.js';
>>>>>>> origin/main

export function updateFrame(dt) {
  const { keys, player, world, fire, bear, input, game } = state;
  const nowMs = performance.now();

<<<<<<< HEAD
=======
  // === GameOver時はゲームロジックを停止し、死亡アニメだけ進める ===
>>>>>>> origin/main
  if (state.gameOver) {
    updatePlayerAnim(player, 0, 0);
    state.particles.update(dt);
    updateHud();
    updateCampVisuals(dt, nowMs);
    return;
  }

  game.time += dt;

<<<<<<< HEAD
=======
  // 移動
>>>>>>> origin/main
  const up = keys.has('w') || keys.has('ArrowUp');
  const dn = keys.has('s') || keys.has('ArrowDown');
  const lt = keys.has('a') || keys.has('ArrowLeft');
  const rt = keys.has('d') || keys.has('ArrowRight');
  const sp = player.sp;

  let vx = 0;
  let vy = 0;
  const drag = input?.drag;
  if (drag?.active && drag.moved) {
    vx = drag.dirX * sp;
    vy = drag.dirY * sp;
  } else {
    if (up) vy -= sp;
    if (dn) vy += sp;
    if (lt) vx -= sp;
    if (rt) vx += sp;
  }

<<<<<<< HEAD
  player.moving = vx !== 0 || vy !== 0;
=======
  player.moving = (vx !== 0 || vy !== 0);
>>>>>>> origin/main
  updatePlayerDir(player, vx, vy);
  player.x = clamp(player.x + vx, 0, world.w);
  player.y = clamp(player.y + vy, 0, world.h);
  updatePlayerAnim(player, vx, vy);

  if (state.autoChopCooldown > 0) state.autoChopCooldown--;
  if (state.autoFeedCooldown > 0) state.autoFeedCooldown--;

  const distToFire = dist(player, fire);
  const nearFire = distToFire < 60 && fire.heat > 0;
  player.cold += nearFire
    ? 0.25 + fire.heat * 0.004
    : -(0.04 + (100 - fire.heat) * 0.0006);
  player.cold = clamp(player.cold, 0, 100);
  if (nearFire && player.hp < 100) player.hp += 0.06;
  player.hp = clamp(player.hp, 0, 100);

  fire.heat = clamp(fire.heat - 0.018, 0, 100);
  if (fire.embers > 0) fire.embers--;

  if (bear.alive && player.atkCD <= 0 && dist(player, bear) < 34) {
    tryAttackBear();
  }

  if (state.autoChopCooldown <= 0) {
    if (tryChopNearestTree('auto')) {
      state.autoChopCooldown = player.hasSpear ? 18 : 24;
      state.cam.shake = Math.max(state.cam.shake || 0, 0.8);
    }
  }

  pickupDrops('auto');

  const needsFuel = fire.heat < 70 || fire.embers < 10;
  if (state.autoFeedCooldown <= 0 && distToFire < 50 && needsFuel) {
    if (feedFire(true)) state.autoFeedCooldown = 120;
  }

  if (game.flags.modeOrderRush) {
    tickLine(dt, state, nowMs);
    tickOrders(dt, state, nowMs);
    game.orderCheckTimer += dt;

    while (game.orderCheckTimer >= 1) {
      maybeSpawnOrders(state, nowMs);
      raiseDifficulty(state);
      game.orderCheckTimer -= 1;
    }

    if (game.events.length) {
<<<<<<< HEAD
      for (const event of game.events) {
        if (event.type === 'orderFail') {
          applyOrderPenalty(event.penalty);
=======
      for (const evt of game.events) {
        if (evt.type === 'orderFail') {
          applyOrderPenalty(evt.penalty);
        } else if (evt.type === 'orderDone') {
          applyOrderBattleImpact({ reward:evt.reward, spears:evt.spears });
>>>>>>> origin/main
        }
        announceCampEvent(event);
      }
      game.events.length = 0;
    }
  }

  updateCampVisuals(dt, nowMs);

  if (bear.alive && bear.aggro) {
    const dx = player.x - bear.x;
    const dy = player.y - bear.y;
<<<<<<< HEAD
    const distance = Math.hypot(dx, dy);
    const speed = 1.1 + (player.hasSpear ? 0.2 : 0);

    if (distance > 1) {
      bear.x += dx / distance * speed;
      bear.y += dy / distance * speed;
    }

    if (distance < 26 && bear.inv <= 0) {
      player.hp -= 8;
      bear.inv = 35;
      state.cam.shake = Math.max(state.cam.shake || 0, 5);
=======
    const d = Math.hypot(dx, dy);
    const speed = 1.1 + (player.hasSpear ? 0.2 : 0);
    if (d > 1) {
      bear.x += dx / d * speed;
      bear.y += dy / d * speed;
    }
    if (d < 26 && bear.inv <= 0) {
      player.hp -= 8;
      bear.inv = 35;
      state.cam.shake = Math.max(state.cam.shake || 0, 7);
      if(player.anim){
        player.anim.state = PLAYER_STATE.HURT;
        player.anim.frame = 0;
        player.anim.timer = 0;
      }
      for(let i=0;i<6;i++){
        state.particles.spawn('spark', player.x, player.y, {
          life:0.2 + Math.random()*0.15,
          color:'#ff8a96',
          size:1.5 + Math.random()*1.5,
          vx:(Math.random()-0.5)*90,
          vy:(Math.random()-0.5)*90,
        });
      }
      playSfx('hurt');
>>>>>>> origin/main
      log(t('bear.attack'));
    }
    if (bear.inv > 0) bear.inv--;
  }

  if (player.atkCD > 0) player.atkCD--;
  if (player.cold <= 0) player.hp -= 0.15;

  if (player.hp <= 0 && !state.gameOver) {
    player.hp = 0;
    state.gameOver = true;
<<<<<<< HEAD
    if (player.anim) player.anim.state = PLAYER_STATE.DEAD;
=======
    if(player.anim){
      player.anim.state = PLAYER_STATE.DEAD;
      player.anim.frame = 0;
      player.anim.timer = 0;
    }
    updatePlayerAnim(player, 0, 0);
    playSfx('ng');
>>>>>>> origin/main
    log(t('death'), { holdMs: 5000 });
    showGameOver(true);
    updateHud();
    return;
  }

  updateHud();
  const btnUpgrade = state.ui?.btnUpgradeCraft;
  if (btnUpgrade) {
    const station = game.stations.craft;
    const cost = 20 * station.level;
    btnUpgrade.textContent = `工房 Lv.${station.level + 1} (${cost}G)`;
    btnUpgrade.disabled = state.game.coins < cost;
  }

<<<<<<< HEAD
  if (state.keys.has('C') || state.keys.has('c')) {
    state.keys.delete('C');
    state.keys.delete('c');
=======
  // Cキーでクラフト
  if (state.keys.has('C')) {
    state.keys.delete('C');
>>>>>>> origin/main
    craftSpear();
  }

  state.particles.update(dt);

  const cam = state.cam;
  if (Math.random() < 0.3) {
    const sx = cam.x + Math.random() * 960;
    const sy = cam.y - 10;
    state.particles.spawn('snow', sx, sy, {
      life: 4,
      size: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 20,
      vy: 50 + Math.random() * 30,
    });
  }

  if (fire.heat > 0 && Math.random() < 0.15) {
    state.particles.spawn('ember', fire.x + (Math.random() - 0.5) * 10, fire.y - 5, {
      life: 1.5 + Math.random(),
      color: '#ff9b3d',
      size: 2 + Math.random(),
      vx: (Math.random() - 0.5) * 10,
      vy: -30 - Math.random() * 20,
    });
  }
}

export function updatePlayerDir(player, vx, vy) {
  if (vx === 0 && vy === 0) return;

  const angle = Math.atan2(vy, vx);
  const deg = (angle * 180 / Math.PI + 360) % 360;

<<<<<<< HEAD
=======
  // --- 6方向シート用に丸めた角度分割（旧スプライト互換） ---
>>>>>>> origin/main
  if (deg >= 330 || deg < 30) player.dir = 2;
  else if (deg < 90) player.dir = 1;
  else if (deg < 150) player.dir = 0;
  else if (deg < 210) player.dir = 5;
  else if (deg < 270) player.dir = 4;
  else player.dir = 3;
}

function selectSheet(player) {
  const anim = player.anim;
  const weaponKey = anim.weapon === PLAYER_WEAPON.SPEAR ? 'spear' : 'none';
  let cfg = null;
  let sheetKey = '';

  if (anim.state === PLAYER_STATE.DEAD) {
    cfg = ANIM.dead;
    sheetKey = 'dead';
  } else if (anim.state === PLAYER_STATE.HURT) {
    cfg = ANIM.hurt;
    sheetKey = 'hurt';
  } else if (anim.state === PLAYER_STATE.ATTACK) {
    cfg = weaponKey === 'spear' ? ANIM.spearAttack : ANIM.attack;
    sheetKey = weaponKey === 'spear' ? 'spearAttack' : 'attack';
  } else if (anim.state === PLAYER_STATE.COLD) {
    cfg = ANIM.cold;
    sheetKey = 'cold';
  } else if (anim.state === PLAYER_STATE.WALK) {
    const path = WALK_SHEETS[weaponKey][anim.dir] || WALK_SHEETS[weaponKey].down;
    cfg = { sheet: path, ...WALK_ANIM };
    sheetKey = `walk:${weaponKey}:${anim.dir}`;
  } else {
    cfg = weaponKey === 'spear' ? ANIM.spearIdle : ANIM.idle;
    sheetKey = weaponKey === 'spear' ? 'spearIdle' : 'idle';
  }

  const image = state.assets?.images?.[cfg.sheet] || null;
<<<<<<< HEAD
  return {
    image,
    frames: cfg.frames,
    fps: cfg.fps,
    loop: cfg.loop,
    grid: cfg.grid,
    sheetKey,
  };
=======
  return { image, frames:cfg.frames, fps:cfg.fps, loop:cfg.loop, grid:cfg.grid, sheetKey };
>>>>>>> origin/main
}

function quantize8Dir(vx, vy, prevDir) {
  const threshold = 0.1;
  const ax = Math.abs(vx);
  const ay = Math.abs(vy);
  if (ax < threshold && ay < threshold) return prevDir || 'down';

  const angle = Math.atan2(vy, vx);
  const deg = (angle * 180 / Math.PI + 360) % 360;
  if (deg >= 337.5 || deg < 22.5) return 'right';
  if (deg < 67.5) return 'downright';
  if (deg < 112.5) return 'down';
  if (deg < 157.5) return 'downleft';
  if (deg < 202.5) return 'left';
  if (deg < 247.5) return 'upleft';
  if (deg < 292.5) return 'up';
  return 'upright';
}

function nextAmbientState(player){
  if(player.hp <= 0) return PLAYER_STATE.DEAD;
  if(player.cold <= 20 && !player.moving) return PLAYER_STATE.COLD;
  return player.moving ? PLAYER_STATE.WALK : PLAYER_STATE.IDLE;
}

function updatePlayerAnim(player, vx, vy) {
  const anim = player.anim;
  if (!anim) return;

  anim.weapon = player.hasSpear ? PLAYER_WEAPON.SPEAR : PLAYER_WEAPON.NONE;
  anim.dir = quantize8Dir(vx, vy, anim.dir);

<<<<<<< HEAD
  if (![PLAYER_STATE.ATTACK, PLAYER_STATE.HURT, PLAYER_STATE.DEAD].includes(anim.state)) {
    if (player.cold < 18 && !player.moving) anim.state = PLAYER_STATE.COLD;
    else anim.state = player.moving ? PLAYER_STATE.WALK : PLAYER_STATE.IDLE;
=======
  if(player.hp <= 0){
    anim.state = PLAYER_STATE.DEAD;
  } else if(anim.state !== PLAYER_STATE.ATTACK && anim.state !== PLAYER_STATE.HURT){
    anim.state = nextAmbientState(player);
>>>>>>> origin/main
  }

  const beforeKey = anim.sheetKey;
  const chosen = selectSheet(player);
  anim.image = chosen.image;
  anim.fps = chosen.fps;
  anim.loop = chosen.loop;
  anim.grid = chosen.grid;
  anim.sheetKey = chosen.sheetKey;

<<<<<<< HEAD
  anim.timer += 1;
  const frameThreshold = Math.max(1, Math.floor(60 / (anim.fps || 1)));
  if (anim.timer >= frameThreshold) {
    anim.timer = 0;
    anim.frame += 1;
  }

  if (anim.loop) {
    anim.frame = chosen.frames > 0 ? anim.frame % chosen.frames : 0;
  } else {
    const last = Math.max(0, chosen.frames - 1);
    if (anim.frame >= last) {
      anim.frame = last;
      if (anim.state === PLAYER_STATE.ATTACK || anim.state === PLAYER_STATE.HURT) {
        anim.state = player.moving ? PLAYER_STATE.WALK : PLAYER_STATE.IDLE;
      }
    }
  }

  if (anim.sheetKey !== beforeKey) {
    anim.frame = 0;
    anim.timer = 0;
  }
=======
  if (anim.sheetKey !== beforeKey) {
    anim.frame = 0;
    anim.timer = 0;
  }

  const frames = chosen.frames;
  anim.timer += 1;
  const frameThreshold = Math.max(1, Math.floor(60 / (anim.fps || 1)));
  if (anim.timer >= frameThreshold) {
    anim.timer = 0;
    anim.frame += 1;
  }

  if (anim.loop) {
    anim.frame = frames > 0 ? anim.frame % frames : 0;
    return;
  }

  const last = Math.max(0, frames - 1);
  if (anim.frame >= last) {
    anim.frame = last;
    if (anim.state === PLAYER_STATE.ATTACK || anim.state === PLAYER_STATE.HURT) {
      anim.state = nextAmbientState(player);
      anim.frame = 0;
      anim.timer = 0;
    }
  }
>>>>>>> origin/main
}
