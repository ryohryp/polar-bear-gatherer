import { FIXED_DT, MAX_STEPS, BASE_W, BASE_H } from './src/config.js';
import { state, initState, restart } from './src/state.js';
import { attachPointer } from './src/input/pointer.js';
import { updateFrame } from './src/systems/update.js';
import { renderFrame } from './src/systems/render.js';
import { craftSpear } from './src/systems/actions.js';
import { showGameOver } from './src/ui/hud.js';

(() => {
  // Canvas / resize
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');
  function resize(){
    const safeTop = 0;
    const safeBottom = 0;
    const availH = Math.max(0, window.innerHeight - safeTop - safeBottom);
    const scaleH = availH / BASE_H;
    const scaleW = window.innerWidth / BASE_W;
    const scale = Math.min(scaleH, scaleW);
    const cssW = Math.floor(BASE_W * scale);
    const cssH = Math.floor(BASE_H * scale);
    cvs.style.width = cssW + 'px';
    cvs.style.height = cssH + 'px';
  }
  addEventListener('resize', resize); resize();

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
      dpad: document.getElementById('dpad'),
    }
  });

  // 入力（ドラッグのみ移動／長押し無効）
  attachPointer();

  // UIイベント
  state.ui.btnCraft.addEventListener('click', craftSpear);
  state.ui.btnCraft.addEventListener('touchstart', e=>{ e.preventDefault(); craftSpear(); }, {passive:false});

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
