import { state } from '../state.js';
import { t } from '../ui/messages.js';
import { clamp, drawFrame } from '../utils.js';
import { BASE_W, BASE_H, SPRITE, SIZES } from '../config.js';
import { renderHUD } from '../ui/hud.js';
import { drawSnowField, drawCamp, drawCampPopups } from './camp.js';

function drawPlayer(ctx, player) {
  const size = SPRITE.SIZE;
  const dx = Math.floor(player.x - size / 2);
  const dy = Math.floor(player.y - size / 2);
  const anim = player.anim;

  if (!anim?.image) {
    ctx.save();
    ctx.fillStyle = '#17213a';
    ctx.fillRect(dx + 8, dy + 4, 16, 25);
    ctx.fillStyle = '#f2e8d2';
    ctx.fillRect(dx + 7, dy + 2, 18, 7);
    ctx.fillStyle = '#77a5c6';
    ctx.fillRect(dx + 9, dy + 10, 14, 13);
    ctx.restore();
    return;
  }

  drawFrame(ctx, anim.image, anim.frame | 0, anim.grid, dx, dy, size);
}

function drawTreeShadows(ctx, trees) {
  ctx.fillStyle = 'rgba(23,33,58,0.22)';
  for (const tree of trees) {
    if (tree.hp <= 0) continue;
    ctx.fillRect(Math.round(tree.x - 17), Math.round(tree.y - 3), 34, 8);
  }
}

function drawTrees(ctx, trees) {
  for (const tree of trees) {
    const alive = tree.hp > 0;
    const image = alive ? state.sprites.objects.treeAlive : state.sprites.objects.treeStump;
    if (image) {
      const size = alive ? SIZES.TREE_ALIVE : SIZES.TREE_STUMP;
      const dx = Math.floor(tree.x - size.w / 2);
      const dy = Math.floor(tree.y - size.h);
      ctx.drawImage(image, dx, dy, size.w, size.h);
      continue;
    }

    if (alive) {
      ctx.fillStyle = '#425e51';
      ctx.fillRect(tree.x - 3, tree.y - 17, 6, 18);
      ctx.fillStyle = '#3b7b66';
      ctx.fillRect(tree.x - 13, tree.y - 34, 26, 22);
      ctx.fillStyle = '#78a58a';
      ctx.fillRect(tree.x - 9, tree.y - 30, 12, 5);
    } else {
      ctx.fillStyle = '#724b2f';
      ctx.fillRect(tree.x - 7, tree.y - 8, 14, 9);
      ctx.fillStyle = '#c28c55';
      ctx.fillRect(tree.x - 5, tree.y - 7, 10, 3);
    }
  }
}

function drawFire(ctx, fire, now) {
  ctx.save();
  ctx.translate(Math.round(fire.x), Math.round(fire.y));

  ctx.fillStyle = 'rgba(23,33,58,0.24)';
  ctx.fillRect(-24, 12, 48, 8);
  ctx.fillStyle = '#68452f';
  ctx.save();
  ctx.rotate(0.35);
  ctx.fillRect(-20, 6, 40, 8);
  ctx.restore();
  ctx.save();
  ctx.rotate(-0.35);
  ctx.fillRect(-20, 6, 40, 8);
  ctx.restore();

  if (fire.heat > 0) {
    const bob = Math.round(Math.sin(now / 90) * 2);
    ctx.fillStyle = '#d75832';
    ctx.fillRect(-11, -13 + bob, 22, 25);
    ctx.fillStyle = '#f09a39';
    ctx.fillRect(-7, -22 - bob, 14, 29);
    ctx.fillStyle = '#ffe36d';
    ctx.fillRect(-3, -13 + bob, 7, 17);
  } else {
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(-8, -4, 16, 10);
  }

  ctx.restore();
}

function drawDrops(ctx, drops, now) {
  const bob = Math.round(Math.sin(now / 140) * 2);
  for (const drop of drops) {
    let image = null;
    let size = SIZES.WOOD;
    if (drop.type === 'wood') image = state.sprites.objects.woodDrop;
    else if (drop.type === 'meat') {
      image = state.sprites.objects.meatDrop;
      size = SIZES.MEAT;
    }

    if (image) {
      ctx.drawImage(
        image,
        Math.floor(drop.x - size.w / 2),
        Math.floor(drop.y - size.h / 2 + bob),
        size.w,
        size.h,
      );
    } else {
      ctx.fillStyle = drop.type === 'wood' ? '#9c643c' : '#d85c67';
      ctx.fillRect(drop.x - 6, drop.y - 6 + bob, 12, 12);
    }
  }
}

function drawBear(ctx, bear, now) {
  if (!bear.alive) return;

  const bob = Math.round(Math.sin(now / 160) * 2);
  ctx.save();
  ctx.translate(Math.round(bear.x), Math.round(bear.y + bob));

  ctx.fillStyle = 'rgba(23,33,58,0.28)';
  ctx.fillRect(-24, 18, 48, 8);
  ctx.fillStyle = '#9eabc2';
  ctx.fillRect(-22, -12, 44, 33);
  ctx.fillStyle = '#eef4f6';
  ctx.fillRect(-18, -18, 36, 35);
  ctx.fillRect(-15, 13, 10, 12);
  ctx.fillRect(5, 13, 10, 12);
  ctx.fillRect(-21, -20, 10, 10);
  ctx.fillRect(11, -20, 10, 10);
  ctx.fillStyle = '#d8e5ea';
  ctx.fillRect(-10, -8, 20, 14);
  ctx.fillStyle = '#17213a';
  ctx.fillRect(-9, -10, 4, 4);
  ctx.fillRect(5, -10, 4, 4);
  ctx.fillRect(-3, -2, 6, 4);

  if (bear.aggro) {
    ctx.fillStyle = '#d64f4f';
    ctx.fillRect(-12, -27, 7, 4);
    ctx.fillRect(5, -27, 7, 4);
  }

  ctx.restore();
}

function drawGoalPanel(ctx) {
  const { player, bear, game } = state;
  let line1 = '';
  let line2 = '';

  if (!player.hasSpear) {
    line1 = t('goal.craft');
    line2 = '住人の生産ラインも手伝ってくれる';
  } else if (bear.alive) {
    line1 = t('goal.kill');
    line2 = t('goal.safe');
  } else {
    line1 = t('goal.clear');
    line2 = `注文達成 ${game.completedOrders}件`;
  }

  ctx.save();
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  const width = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 30;
  const x = BASE_W / 2 - width / 2;
  const y = 14;
  ctx.fillStyle = '#17213a';
  ctx.fillRect(Math.round(x - 3), y - 3, Math.round(width + 6), 48);
  ctx.fillStyle = '#fff2c7';
  ctx.fillRect(Math.round(x), y, Math.round(width), 42);
  ctx.fillStyle = '#17213a';
  ctx.fillText(line1, BASE_W / 2, y + 16);
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#5f5037';
  ctx.fillText(line2, BASE_W / 2, y + 33);
  ctx.restore();
}

function drawOrdersHud(now) {
  const { ctx, screen, game } = state;
  if (!game.orders?.length) return;

  ctx.save();
  ctx.translate(screen.offsetX, screen.offsetY);
  ctx.scale(screen.scale, screen.scale);

  let y = 82;
  const x = 14;
  const width = 210;
  const height = 58;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';

  for (const order of game.orders) {
    const panelColor = order.status === 'fail'
      ? '#eaa29a'
      : order.status === 'done'
        ? '#a8d59c'
        : '#fff2c7';

    ctx.fillStyle = '#17213a';
    ctx.fillRect(x - 3, y - 3, width + 6, height + 6);
    ctx.fillStyle = panelColor;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#17213a';
    ctx.fillText(`依頼 #${order.id}  槍 ${order.progress}/${order.need.spear}`, x + 10, y + 17);

    const reward = order.need.spear * game.orderConfig.rewardPerSpear;
    ctx.fillText(`報酬 ${reward}G`, x + 10, y + 34);

    const barX = x + 10;
    const barY = y + 43;
    const barW = width - 20;
    ctx.fillStyle = '#17213a';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, 9);
    ctx.fillStyle = '#c5b78d';
    ctx.fillRect(barX, barY, barW, 5);

    let ratio = 0;
    if (order.status === 'active') {
      ratio = clamp((order.expiresAt - now) / order.duration, 0, 1);
      ctx.fillStyle = ratio < 0.3 ? '#d95f57' : '#e6a64d';
    } else if (order.status === 'done') {
      ratio = 1;
      ctx.fillStyle = '#5fa85e';
    }
    ctx.fillRect(barX, barY, Math.round(barW * ratio), 5);
    y += height + 10;
  }

  ctx.restore();
}

function drawInventoryHud() {
  const { ctx, screen, game } = state;
  if (!game.inventory) return;

  ctx.save();
  ctx.translate(screen.offsetX, screen.offsetY);
  ctx.scale(screen.scale, screen.scale);

  const width = 202;
  const x = BASE_W - width - 14;
  const y = 82;
  ctx.fillStyle = '#17213a';
  ctx.fillRect(x - 3, y - 3, width + 6, 47);
  ctx.fillStyle = '#fff2c7';
  ctx.fillRect(x, y, width, 41);
  ctx.fillStyle = '#17213a';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`資金 ${game.coins}G`, x + 10, y + 16);
  ctx.fillText(`倉庫  木材${game.inventory.wood}  槍${game.inventory.spear}`, x + 10, y + 33);
  ctx.restore();
}

export function renderFrame(alpha) {
  const {
    ctx,
    cam,
    world,
    fire,
    trees,
    drops,
    bear,
    player,
    screen,
    game,
    particles,
    lighting,
  } = state;
  const { width, height, scale, offsetX, offsetY } = screen;
  const now = performance.now();

  lighting.reset();
  if (fire.heat > 0) {
    const flicker = Math.sin(now / 100) * 5 + Math.cos(now / 230) * 5;
    lighting.addLight(fire.x, fire.y, 180 + flicker, 'rgba(255,160,60,0.17)', 1);
    lighting.addLight(fire.x, fire.y, 80 + flicker * 0.5, 'rgba(255,100,20,0.22)', 1);
  }
  lighting.addLight(player.x, player.y, 90, 'rgba(210,230,255,0.06)', 0.8);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width || BASE_W, height || BASE_H);
  ctx.fillStyle = '#0c1730';
  ctx.fillRect(0, 0, width || BASE_W, height || BASE_H);

  const shakeX = cam.shake ? Math.round((Math.random() - 0.5) * cam.shake) : 0;
  const shakeY = cam.shake ? Math.round((Math.random() - 0.5) * cam.shake) : 0;
  if (cam.shake > 0) cam.shake *= 0.88;
  if (cam.shake < 0.3) cam.shake = 0;

  ctx.setTransform(scale, 0, 0, scale, offsetX + shakeX, offsetY + shakeY);
  ctx.clearRect(0, 0, BASE_W, BASE_H);

  cam.x = clamp(player.x - BASE_W / 2, 0, world.w - BASE_W);
  cam.y = clamp(player.y - BASE_H / 2, 0, world.h - BASE_H);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  drawSnowField(ctx, cam, world);
  drawCamp(ctx, now);
  drawTreeShadows(ctx, trees);

  ctx.fillStyle = 'rgba(23,33,58,0.22)';
  ctx.fillRect(Math.round(player.x - 13), Math.round(player.y + 10), 26, 7);
  if (bear.alive) ctx.fillRect(Math.round(bear.x - 26), Math.round(bear.y + 17), 52, 9);

  drawFire(ctx, fire, now);
  drawTrees(ctx, trees);
  drawDrops(ctx, drops, now);
  drawBear(ctx, bear, now);
  drawPlayer(ctx, player);
  particles.render(ctx, cam);
  drawCampPopups(ctx);

  ctx.restore();

  lighting.render(ctx, cam, screen);

  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  drawGoalPanel(ctx);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (game.flags.modeOrderRush) {
    drawOrdersHud(now);
    drawInventoryHud();
    renderHUD(ctx);
  }

  void alpha;
}
