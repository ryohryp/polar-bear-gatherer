import { state } from '../state.js';
import { log, showBearHP, setBearHP } from '../ui/hud.js';
import { t } from '../ui/messages.js';
import { clamp, dist } from '../utils.js';

export function craftSpear(){
  const { inv, player, bear, ui } = state;
  if (inv.wood>=10 && !player.hasSpear){
    inv.wood -= 10; player.hasSpear = true; player.atk = 22; log(t('craft.ok'));
    bear.aggro = true; showBearHP(true);
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
  log(auto ? t('fire.add.auto') : t('fire.add'));
  return true;
}

function findNearestTree(maxDist){
  const { trees, player } = state;
  let target=null, dmin=maxDist;
  for(const t of trees){
    if(t.hp>0){
      const d = dist(t, player);
      if(d<dmin){ dmin=d; target=t; }
    }
  }
  return target;
}

export function tryChopNearestTree(source='manual'){
  const { player, drops } = state;
  const target = findNearestTree(32);
  if(!target) return false;
  const dmg = player.hasSpear? 18:10;
  target.hp = Math.max(0, target.hp - dmg);
  if(target.hp>0){
    log(source==='auto' ? t('chop.progress.auto') : t('chop.progress'));
  } else {
    drops.push({x:target.x, y:target.y, type:'log'});
    log(source==='auto' ? t('chop.down.auto') : t('chop.down'));
  }
  return true;
}

export function tryAttackBear(){
  const { bear, player, drops, ui } = state;
  if (bear.alive && dist(player,bear)<34 && player.atkCD<=0){
    const dmg = player.atk; bear.hp -= dmg; player.atkCD=18;
    setBearHP(bear.hp/150);
    log(t('attack.hit', { dmg }));
    if (bear.hp<=0){
      bear.alive=false; drops.push({x:bear.x,y:bear.y,type:'meat'});
      log(t('bear.kill')); showBearHP(false);
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
      if(drops[i].type==='log') inv.wood++;
      else inv.meat++;
      drops.splice(i,1);
      picked = true;
    }
  }
  if(picked){ log(source==='auto' ? 'アイテムを拾った（自動）' : 'アイテムを拾った'); return true; }
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
  log(`${step.toUpperCase()} Lv.${station.level} に強化！`);
  return true;
}

export function applyOrderPenalty(amount = 0){
  const dmg = Math.max(2, Math.round(amount * 0.5));
  state.player.hp = clamp(state.player.hp - dmg, 0, 100);
  log(`注文遅延で士気低下 -${dmg}`);
}
