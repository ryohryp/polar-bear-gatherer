import { drawFrame } from '../utils.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // type: 'snow' | 'ember' | 'spark' | 'smoke' | 'text'
  spawn(type, x, y, options = {}) {
    const p = {
      type,
      x,
      y,
      vx: options.vx || (Math.random() - 0.5) * 20,
      vy: options.vy || (Math.random() - 0.5) * 20,
      life: options.life || 1.0,
      maxLife: options.life || 1.0,
      size: options.size || (Math.random() * 2 + 1),
      color: options.color || '#fff',
      text: options.text || '',
      alpha: 1.0,
      ...options
    };
    this.particles.push(p);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics & Behavior
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'snow') {
        p.vy = 20 + Math.random() * 10; // Fall down
        p.vx += (Math.random() - 0.5) * 2; // Drift
        p.x += Math.sin(performance.now() / 500) * 0.5;
      } else if (p.type === 'ember') {
        p.vy -= 10 * dt; // Float up
        p.alpha = p.life / p.maxLife;
      } else if (p.type === 'spark') {
        p.vy += 100 * dt; // Gravity
        p.alpha = p.life / p.maxLife;
      } else if (p.type === 'smoke') {
        p.vy -= 5 * dt;
        p.size += 5 * dt;
        p.alpha = (p.life / p.maxLife) * 0.5;
      } else if (p.type === 'text') {
        p.vy -= 20 * dt; // Float up
        p.alpha = Math.min(1, p.life * 2);
      }
    }
  }

  render(ctx, cam) {
    ctx.save();
    for (const p of this.particles) {
      const sx = p.x - cam.x;
      const sy = p.y - cam.y;

      // Culling
      // if (sx < -50 || sx > ctx.canvas.width + 50 || sy < -50 || sy > ctx.canvas.height + 50) continue;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'text') {
        ctx.font = 'bold 14px system-ui';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
