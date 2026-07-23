import { state } from '../state.js';
import { PLAYER_STATE } from '../config.js';
import { log, showBearHP, setBearHP } from '../ui/hud.js';
import { t } from '../ui/messages.js';
import { clamp, dist } from '../utils.js';
import { playSfx } from './audio.js';
import { triggerBearHitFeedback } from './combat-feedback.js';

function bearHpRate(){
  const maxHp = state.bear.maxHp || 150;
  return maxHp > 0 ? state.bear.hp / maxHp : 0;
}

function defeatBear(messageKey = 'bear.kill'){
  const { bear, drops } = state;
  if(!bear.alive) return;
  bear.hp = 0;
  bear.alive = false;
  bear.aggro = false;
  drops.push({ x:bear.x, y:bear.y, type:'meat' });
  setBearHP(0);
  showBearHP(false);
  playSfx('kill');
  log(t(messageKey));
}

export function craftSpear(){
  const { inv, player, bear } = state;
  if (inv.wood>=10 && !player.hasSpear){
    inv.wood -= 10;
    player.hasSpear = true;
    player.atk = 22;
    bear.aggro = bear.alive;
    setBearHP(bearHpRate());
    showBearHP(bear.alive);
    playSfx('craft');
    log(t('craft.ok'));
  } else if (player.hasSpear){
    log(t('craft.done'));
  } else {
    log(t('craft.lack'));
  }
}

export function feedFire(auto=false){
  const { inv, player, fire } = state;
  if(inv.wood<=0){ if(!auto) log('木材が足りない…'); return false; }
  const near = dist(player, fire)<50;
  if(!near){ if(!auto) log(t('fire.needNear')); return false; }
  if(auto && fire.heat>92 && fire.embers>15) return false;
  inv.wood--;
  fire.heat = clamp(fire.heat + 18, 0, 100);
  fire.embers = 60;
  playSfx('fire');
  log(auto ? t('fire.add.auto') : t('fire.add'));
  return true;
}

function findNearestTree(maxDist){
  const { trees, player } = state;
  let target=null, dmin=maxDist;
  for(const tree of trees){
    if(tree.hp>0){
      const d = dist(tree, player);
      if(d<dmin){ dmin=d; target=tree; }
    }
  }
  return target;
}

export function tryChopNearestTree(source='manual'){
  const { player, drops, particles, cam } = state;
  const target = findNearestTree(32);
  if(!target) return false;
  const dmg = player.hasSpear? 18:10;
  target.hp = Math.max(0, target.hp - dmg);
  particles?.spawn('spark', target.x, target.y - 12, {
    life:0.22,
    size:2,
    color:'#ffd08a',
    vx:(Math.random() - 0.5) * 45,
    vy:-20 - Math.random() * 20,
  });
  if(target.hp>0){
    playSfx('chop');
    log(source==='auto' ? t('chop.progress.auto') : t('chop.progress'));
  } else {
    drops.push({x:target.x, y:target.y, type:'wood'});
    cam.shake = Math.max(cam.shake || 0, 3);
    playSfx('treeDown');
    log(source==='auto' ? t('chop.down.auto') : t('chop.down'));
  }
  return true;
}

export function tryAttackBear(){
  const { bear, player, particles, cam } = state;
  if (bear.alive && dist(player,bear)<34 && player.atkCD<=0){
    const dmg = player.atk;
    bear.hp = Math.max(0, bear.hp - dmg);
    player.atkCD=18;
    triggerBearHitFeedback({ hasSpear: player.hasSpear });
    setBearHP(bearHpRate());
    playSfx('hit');
    cam.shake = Math.max(cam.shake || 0, 5);
    for(let i=0;i<5;i++){
      particles?.spawn('spark', bear.x, bear.y, {
        life:0.2 + Math.random()*0.15,
        color:'#dff5ff',
        size:1.5 + Math.random()*1.5,
        vx:(Math.random()-0.5)*80,
        vy:(Math.random()-0.5)*80,
      });
    }
    log(t('attack.hit', { dmg }));
    if (bear.hp<=0){
      defeatBear();
    }
    // trigger attack animation
    if (player.anim && player.anim.state !== PLAYER_STATE.ATTACK){
      player.anim.state = PLAYER_STATE.ATTACK;
      player.anim.frame = 0;
      player.anim.timer = 0;
    }
    return true;
  }
  return false;
}

export function pickupDrops(source='manual'){
  const { drops, player, inv } = state;
  let picked=false;
  for(let i=drops.length-1;i>=0;i--){
    if(dist(drops[i],player)<28){
      if(drops[i].type==='wood') inv.wood++;
      else inv.meat++;
      drops.splice(i,1);
      picked = true;
    }
  }
  if(picked){
    playSfx('pickup');
    log(source==='auto' ? 'アイテムを拾った（自動）' : 'アイテムを拾った');
    return true;
  }
  return false;
}

export function buyUpgrade(step){
  const station = state.game?.stations?.[step];
  if(!station) return false;
  const cost = 20 * station.level;
  if(state.game.coins < cost){
    log(`コイン不足… (${cost}c必要)`);
    return false;
  }
  state.game.coins -= cost;
  station.level += 1;
  playSfx('upgrade');
  log(`${step.toUpperCase()} Lv.${station.level} に強化！`);
  return true;
}

export function applyOrderPenalty(amount = 0){
  const dmg = Math.max(2, Math.round(amount * 0.5));
  state.player.hp = clamp(state.player.hp - dmg, 0, 100);
  state.cam.shake = Math.max(state.cam.shake || 0, 5);
  if(state.player.anim){
    state.player.anim.state = PLAYER_STATE.HURT;
    state.player.anim.frame = 0;
    state.player.anim.timer = 0;
  }
  playSfx('hurt');
  log(`注文遅延で士気低下 -${dmg}`);
}

export function applyOrderBattleImpact({ reward = 0, spears = 1 } = {}){
  const { bear, player, particles, cam } = state;
  if(!bear.alive) return { damage:0, killed:false };

  const damage = clamp(5 + spears * 4 + Math.floor(reward / 3), 6, 18);
  const battleStarted = player.hasSpear || bear.aggro;
  const minimumHp = battleStarted ? 0 : 1;
  bear.hp = Math.max(minimumHp, bear.hp - damage);

  if(battleStarted){
    bear.aggro = true;
    showBearHP(true);
  }
  setBearHP(bearHpRate());
  cam.shake = Math.max(cam.shake || 0, 8);

  for(let i=0;i<10;i++){
    particles?.spawn('spark', bear.x, bear.y, {
      life:0.25 + Math.random()*0.25,
      color:i % 2 === 0 ? '#ffe38a' : '#dff5ff',
      size:1.5 + Math.random()*2,
      vx:(Math.random()-0.5)*120,
      vy:(Math.random()-0.5)*100,
    });
  }
  particles?.spawn('text', bear.x, bear.y - 26, {
    life:0.9,
    color:'#ffe38a',
    text:`-${damage}`,
    vx:0,
    vy:-18,
  });
  playSfx('orderImpact');

  if(bear.hp <= 0){
    defeatBear();
    return { damage, killed:true };
  }

  log(battleStarted
    ? `納品した槍が白熊に命中！ -${damage}`
    : `支援槍で白熊を弱体化！ -${damage}`,
  { holdMs:1800 });
  return { damage, killed:false };
}
