import { state } from '../state.js';
import { log } from '../ui/hud.js';
import { pushInput } from './line.js';
import { playSfx } from './audio.js';

function getGame(rootState){
  return (rootState && rootState.game) || state.game;
}

export function maybeSpawnOrders(rootState = state, now = performance.now()){
  const game = getGame(rootState);
  if(!game?.flags?.modeOrderRush) return null;

  const activeCount = game.orders.reduce((acc, order)=> acc + (order.status === 'active' ? 1 : 0), 0);
  if(activeCount >= game.orderConfig.maxConcurrent) return null;

  const needSpear = 1 + Math.floor(game.difficulty / 2);
  const order = {
    id: game.nextOrderId++,
    need: { spear: needSpear },
    progress: 0,
    status: 'active',
    createdAt: now,
    expiresAt: now + game.orderConfig.baseExpireMs,
    clearAt: 0,
    duration: game.orderConfig.baseExpireMs,
  };
  game.orders.push(order);

  const trap = game.stations?.trap;
  if(trap){
    const inFlightTrap = trap.queue + (trap.busyUntil > now ? 1 : 0);
    const available = game.deliveredSpear + game.inventory.spear + inFlightTrap;
    const shortage = Math.max(0, needSpear - available);
    if(shortage > 0){
      pushInput('trap', shortage, rootState);
    }
  }

  log(`注文 #${order.id}: 槍 ${order.need.spear}本`, { holdMs: 1500 });
  return order;
}

export function tickOrders(dt, rootState = state, now = performance.now()){
  const game = getGame(rootState);
  if(!game?.flags?.modeOrderRush) return;

  for(const order of game.orders){
    if(order.status !== 'active') continue;

    if(now >= order.expiresAt){
      order.status = 'fail';
      order.clearAt = now + 1800;
      game.events.push({ type:'orderFail', orderId: order.id, penalty: game.orderConfig.penaltyFail });
      log(`注文 #${order.id} 失敗…`, { holdMs: 1800 });
      playSfx('ng');
      continue;
    }

    const remaining = order.need.spear - order.progress;
    if(remaining > 0 && game.deliveredSpear > 0){
      const take = Math.min(remaining, game.deliveredSpear);
      order.progress += take;
      game.deliveredSpear -= take;
    }

    if(order.progress >= order.need.spear){
      order.status = 'done';
      order.clearAt = now + 1600;
      const reward = order.need.spear * game.orderConfig.rewardPerSpear;
      game.coins += reward;
      game.completedOrders++;
      game.events.push({
        type:'orderDone',
        orderId: order.id,
        reward,
        spears: order.need.spear,
      });
      log(`注文 #${order.id} 完了！ +${reward}c`, { holdMs: 2000 });
      playSfx('ok');
    }
  }

  if(game.orders.length){
    game.orders = game.orders.filter(order => {
      if(order.status === 'active') return true;
      return now < (order.clearAt || 0);
    });
  }
}

export function raiseDifficulty(rootState = state){
  const game = getGame(rootState);
  if(!game?.flags?.modeOrderRush) return;

  if(game.time < game.nextDifficultyAt) return;
  game.difficulty++;
  game.nextDifficultyAt = game.time + 30 + Math.random()*15;
  if(game.orderConfig.maxConcurrent < 3){
    game.orderConfig.maxConcurrent++;
  }
  log(`難易度アップ: Lv.${game.difficulty}`, { holdMs: 2000 });
}
