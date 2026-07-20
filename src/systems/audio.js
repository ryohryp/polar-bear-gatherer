let audioContext = null;
let masterGain = null;
let unlocked = false;

const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;

function ensureContext(){
  if(!AudioContextCtor) return null;
  if(!audioContext){
    audioContext = new AudioContextCtor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

export function unlockAudio(){
  const ctx = ensureContext();
  if(!ctx) return false;
  unlocked = true;
  if(ctx.state === 'suspended'){
    ctx.resume().catch(()=>{});
  }
  return true;
}

export function installAudioUnlock(target = document){
  if(!target?.addEventListener || !AudioContextCtor) return;
  const unlock = ()=> unlockAudio();
  target.addEventListener('pointerdown', unlock, { once:true, capture:true });
  target.addEventListener('keydown', unlock, { once:true, capture:true });
}

function tone(freq, start, duration, options = {}){
  if(!audioContext || !masterGain) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const volume = options.volume ?? 0.22;
  const endFreq = Math.max(30, freq + (options.slide ?? 0));

  osc.type = options.type || 'square';
  osc.frequency.setValueAtTime(Math.max(30, freq), start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(start, duration, volume = 0.12){
  if(!audioContext || !masterGain) return;
  const length = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i = 0; i < length; i++){
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(start);
}

export function playSfx(name){
  if(!unlocked || !audioContext || audioContext.state === 'closed') return false;
  if(audioContext.state === 'suspended') audioContext.resume().catch(()=>{});

  const now = audioContext.currentTime + 0.005;
  switch(name){
    case 'chop':
      noise(now, 0.055, 0.12);
      tone(150, now, 0.07, { type:'square', volume:0.16, slide:-50 });
      break;
    case 'treeDown':
      noise(now, 0.13, 0.18);
      tone(110, now, 0.14, { type:'sawtooth', volume:0.16, slide:-55 });
      break;
    case 'pickup':
      tone(520, now, 0.06, { volume:0.13, slide:120 });
      tone(760, now + 0.045, 0.07, { volume:0.11, slide:80 });
      break;
    case 'craft':
      tone(330, now, 0.08, { volume:0.13, slide:70 });
      tone(495, now + 0.07, 0.08, { volume:0.13, slide:80 });
      tone(660, now + 0.14, 0.12, { volume:0.14, slide:120 });
      break;
    case 'fire':
      noise(now, 0.11, 0.08);
      tone(180, now, 0.09, { type:'triangle', volume:0.08, slide:50 });
      break;
    case 'hit':
      noise(now, 0.075, 0.18);
      tone(125, now, 0.09, { type:'square', volume:0.2, slide:-45 });
      break;
    case 'hurt':
      tone(220, now, 0.16, { type:'sawtooth', volume:0.18, slide:-120 });
      break;
    case 'kill':
      noise(now, 0.16, 0.2);
      tone(190, now, 0.12, { type:'square', volume:0.18, slide:-90 });
      tone(95, now + 0.1, 0.22, { type:'sawtooth', volume:0.15, slide:-50 });
      break;
    case 'upgrade':
    case 'ok':
      tone(440, now, 0.08, { volume:0.12, slide:50 });
      tone(660, now + 0.07, 0.09, { volume:0.13, slide:70 });
      tone(880, now + 0.14, 0.12, { volume:0.14, slide:90 });
      break;
    case 'ng':
      tone(260, now, 0.11, { type:'sawtooth', volume:0.15, slide:-60 });
      tone(170, now + 0.1, 0.15, { type:'square', volume:0.14, slide:-50 });
      break;
    case 'orderImpact':
      noise(now, 0.09, 0.2);
      tone(210, now, 0.08, { type:'square', volume:0.2, slide:-80 });
      tone(480, now + 0.035, 0.1, { volume:0.11, slide:180 });
      break;
    default:
      return false;
  }
  return true;
}
