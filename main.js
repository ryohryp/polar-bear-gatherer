import { FIXED_DT, MAX_STEPS, BASE_W, BASE_H, ASSETS } from './src/config.js';
import { loadImage } from './src/utils.js';
import { ANIM, WALK_SHEETS, PLAYER_ICON } from './src/config.js';
import { state, initState, restart } from './src/state.js';
import { attachPointer } from './src/input/pointer.js';
import { updateFrame } from './src/systems/update.js';
import { renderFrame } from './src/systems/render.js';
import { craftSpear, buyUpgrade } from './src/systems/actions.js';
import { showGameOver } from './src/ui/hud.js';

async function loadResources(){
  try {
    state.sprites.objects.treeAlive = await loadImage(ASSETS.objects.treeAlive);
    state.sprites.objects.treeStump = await loadImage(ASSETS.objects.treeStump);
    state.sprites.objects.woodDrop  = await loadImage(ASSETS.objects.woodDrop);
    state.sprites.objects.meatDrop  = await loadImage(ASSETS.objects.meatDrop);
  } catch (e) {
    console.warn('Failed to load some resources:', e);
  }
}

(async () => {
  // Canvas / resize
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');
  function resize(){
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));

    if (cvs.width !== width || cvs.height !== height){
      cvs.width = width;
      cvs.height = height;
    }

    const rawScale = Math.min(width / BASE_W, height / BASE_H);
    const scale = rawScale > 0 ? rawScale : 1;
    const offsetX = width > 0 ? (width - BASE_W * scale) * 0.5 : 0;
    const offsetY = height > 0 ? (height - BASE_H * scale) * 0.5 : 0;

    state.screen.width = width;
    state.screen.height = height;
    state.screen.scale = scale;
    state.screen.offsetX = offsetX;
    state.screen.offsetY = offsetY;
    state.screen.dpr = dpr;

    cvs.style.width = cssWidth + 'px';
    cvs.style.height = cssHeight + 'px';
  }
  addEventListener('resize', resize); resize();

  // Preload resource object images before game init
  await loadResources();

  // 状態初期化（UI参照もここで採取）
  initState({
    canvas: cvs,
    ctx,
    ui: {
      hp: document.getElementById('hpFill'),
      tmp: document.getElementById('tmpFill'),
      fire: document.getElementById('fireFill'),
      bear: document.getElementById('bearFill'),
      bearHud: document.getElementById('bearHud'),
      inv: document.getElementById('inv'),
      log: document.getElementById('log'),
      btnCraft: document.getElementById('btnCraft'),
      btnUpgradeCraft: document.getElementById('btnUpgradeCraft'),
      btnRestart: document.getElementById('btnRestart'),
    }
  });

  // Prepare asset cache map
  state.assets = state.assets || {};
  state.assets.images = {};

  // Preload player-related sheets and icon
  try {
    const sheets = new Set([
      ANIM.idle.sheet,
      ANIM.attack.sheet,
      ANIM.spearIdle.sheet,
      ANIM.spearAttack.sheet,
      ANIM.hurt.sheet,
      ANIM.dead.sheet,
      ANIM.cold.sheet,
      WALK_SHEETS.none.up,
      WALK_SHEETS.none.down,
      WALK_SHEETS.none.left,
      WALK_SHEETS.none.right,
      WALK_SHEETS.none.upleft,
      WALK_SHEETS.none.upright,
      WALK_SHEETS.none.downleft,
      WALK_SHEETS.none.downright,
      WALK_SHEETS.spear.up,
      WALK_SHEETS.spear.down,
      WALK_SHEETS.spear.left,
      WALK_SHEETS.spear.right,
      WALK_SHEETS.spear.upleft,
      WALK_SHEETS.spear.upright,
      WALK_SHEETS.spear.downleft,
      WALK_SHEETS.spear.downright,
      PLAYER_ICON,
    ]);
    const list = Array.from(sheets);
    await Promise.all(list.map(src =>
      loadImage(src).then(img=>{ state.assets.images[src] = img; }).catch(()=>{})
    ));
  } catch (_) {
    // continue even if some fail
  }
  // Set initial player anim image (idle)
  if(state.player?.anim){
    state.player.anim.image = state.assets.images[ANIM.idle.sheet] ?? null;
  }
  console.info("[PBG] player assets loaded:", Object.keys(state.assets.images).length);

  // 入力（ドラッグのみ移動／長押し無効）
  attachPointer();

  // UIイベント
  state.ui.btnCraft.addEventListener('click', craftSpear);
  state.ui.btnCraft.addEventListener('touchstart', e=>{ e.preventDefault(); craftSpear(); }, {passive:false});

  if(state.ui.btnUpgradeCraft){
    const triggerUpgrade = ()=>{ buyUpgrade('craft'); };
    state.ui.btnUpgradeCraft.addEventListener('click', triggerUpgrade);
    state.ui.btnUpgradeCraft.addEventListener('touchstart', e=>{ e.preventDefault(); triggerUpgrade(); }, {passive:false});
  }

  if (state.ui.btnRestart){
    const triggerRestart = ()=>{
      if(!state.gameOver) return;
      showGameOver(false);
      restart();
    };
    state.ui.btnRestart.addEventListener('click', triggerRestart);
    state.ui.btnRestart.addEventListener('touchstart', e=>{ e.preventDefault(); triggerRestart(); }, {passive:false});
  }

  // 固定タイムステップループ
  (function(){
    let acc = 0, last = performance.now();
    function frame(now){
      let delta = (now - last) / 1000;
      if (delta > 0.25) delta = 0.25;
      last = now;
      acc += delta;
      let steps = 0;
      while (acc >= FIXED_DT && steps < MAX_STEPS){
        updateFrame(FIXED_DT);
        acc -= FIXED_DT; steps++;
      }
      renderFrame(acc / FIXED_DT);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  // 参照されるキー操作（Rで再開）だけここで束ねる
  document.addEventListener('keydown', (e)=>{
    if((e.key==='r'||e.key==='R') && state.player.hp<=0){
      showGameOver(false);
      restart();
    }
  });
})();
