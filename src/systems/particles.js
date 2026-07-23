function drawBearFlash(ctx, particle) {
  ctx.save();
  ctx.translate(Math.round(particle.x), Math.round(particle.y));
  ctx.globalAlpha = particle.alpha;
  ctx.fillStyle = particle.color;

  ctx.fillRect(-22, -12, 44, 33);
  ctx.fillRect(-18, -18, 36, 35);
  ctx.fillRect(-15, 13, 10, 12);
  ctx.fillRect(5, 13, 10, 12);
  ctx.fillRect(-21, -20, 10, 10);
  ctx.fillRect(11, -20, 10, 10);
  ctx.fillRect(-10, -8, 20, 14);

  if (particle.hasSpear) {
    ctx.globalAlpha = particle.alpha * 0.55;
    ctx.fillStyle = '#dff5ff';
    ctx.fillRect(-25, -23, 50, 2);
    ctx.fillRect(-27, -19, 2, 38);
    ctx.fillRect(25, -19, 2, 38);
  }

  ctx.restore();
}

function drawDamageText(ctx, particle) {
  const progress = 1 - particle.life / particle.maxLife;
  const punchProgress = Math.min(1, progress / 0.18);
  const settleProgress = Math.min(1, Math.max(0, (progress - 0.18) / 0.24));
  const punchScale = 0.72 + Math.sin(punchProgress * Math.PI * 0.5) * 0.68;
  const scale = progress < 0.18
    ? punchScale
    : 1.4 - settleProgress * 0.4;

  ctx.save();
  ctx.translate(Math.round(particle.x), Math.round(particle.y));
  ctx.scale(scale, scale);
  ctx.globalAlpha = particle.alpha;
  ctx.font = `900 ${particle.fontSize || 18}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = particle.outlineColor || '#17213a';
  ctx.lineWidth = particle.hasSpear ? 5 : 4;
  ctx.strokeText(particle.text, 0, 0);
  ctx.fillStyle = particle.color;
  ctx.fillText(particle.text, 0, 0);

  if (particle.hasSpear) {
    ctx.globalAlpha = particle.alpha * 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(particle.text, -1, -1);
  }

  ctx.restore();
}

function drawStandardParticle(ctx, particle) {
  ctx.globalAlpha = particle.alpha;
  ctx.fillStyle = particle.color;

  if (particle.type === 'text') {
    ctx.font = 'bold 14px system-ui';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText(particle.text, particle.x, particle.y);
    ctx.fillText(particle.text, particle.x, particle.y);
    return;
  }

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // type: 'snow' | 'ember' | 'spark' | 'smoke' | 'text' | 'bearFlash' | 'damageText'
  spawn(type, x, y, options = {}) {
    const p = {
      type,
      x,
      y,
      vx: options.vx ?? (Math.random() - 0.5) * 20,
      vy: options.vy ?? (Math.random() - 0.5) * 20,
      life: options.life ?? 1.0,
      maxLife: options.life ?? 1.0,
      size: options.size ?? (Math.random() * 2 + 1),
      color: options.color || '#fff',
      text: options.text || '',
      alpha: 1.0,
      ...options,
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

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'snow') {
        p.vy = 20 + Math.random() * 10;
        p.vx += (Math.random() - 0.5) * 2;
        p.x += Math.sin(performance.now() / 500) * 0.5;
      } else if (p.type === 'ember') {
        p.vy -= 10 * dt;
        p.alpha = p.life / p.maxLife;
      } else if (p.type === 'spark') {
        p.vy += 100 * dt;
        p.alpha = p.life / p.maxLife;
      } else if (p.type === 'smoke') {
        p.vy -= 5 * dt;
        p.size += 5 * dt;
        p.alpha = (p.life / p.maxLife) * 0.5;
      } else if (p.type === 'text') {
        p.vy -= 20 * dt;
        p.alpha = Math.min(1, p.life * 2);
      } else if (p.type === 'bearFlash') {
        const progress = 1 - p.life / p.maxLife;
        const pulse = 0.55 + Math.abs(Math.cos(progress * Math.PI * 3)) * 0.45;
        p.alpha = Math.max(0, 1 - progress) * pulse;
      } else if (p.type === 'damageText') {
        const progress = 1 - p.life / p.maxLife;
        p.vy *= Math.pow(0.985, dt * 60);
        p.alpha = progress < 0.72
          ? 1
          : Math.max(0, 1 - (progress - 0.72) / 0.28);
      }
    }
  }

  render(ctx, cam) {
    ctx.save();

    for (const particle of this.particles) {
      if (particle.type === 'damageText') continue;

      if (particle.type === 'bearFlash') {
        drawBearFlash(ctx, particle);
      } else {
        drawStandardParticle(ctx, particle);
      }
    }

    for (const particle of this.particles) {
      if (particle.type === 'damageText') {
        drawDamageText(ctx, particle);
      }
    }

    ctx.restore();
    void cam;
  }
}
