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

function drawBearCollapse(ctx, particle) {
  const progress = 1 - particle.life / particle.maxLife;
  const impactProgress = Math.min(1, progress / 0.18);
  const collapseProgress = Math.max(0, Math.min(1, (progress - 0.18) / 0.82));
  const eased = 1 - Math.pow(1 - collapseProgress, 3);
  const impactScale = 1 + Math.sin(impactProgress * Math.PI) * 0.09;
  const scaleX = impactScale * (1 + eased * 0.2);
  const scaleY = impactScale * Math.max(0.18, 1 - eased * 0.78);
  const yOffset = eased * 18;
  const rotation = (particle.fallDirection || 1) * eased * 0.16;
  const alpha = progress < 0.68
    ? 1
    : Math.max(0, 1 - (progress - 0.68) / 0.32);

  ctx.save();
  ctx.translate(Math.round(particle.x), Math.round(particle.y));
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#17213a';
  ctx.scale(1 + eased * 0.35, Math.max(0.35, 1 - eased * 0.5));
  ctx.fillRect(-24, 18, 48, 8);
  ctx.restore();

  ctx.save();
  ctx.translate(Math.round(particle.x), Math.round(particle.y + yOffset));
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);
  ctx.globalAlpha = alpha;

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

  ctx.fillStyle = '#5f6b80';
  ctx.fillRect(-10, -10, 7, 2);
  ctx.fillRect(-8, -12, 2, 6);
  ctx.fillRect(3, -10, 7, 2);
  ctx.fillRect(6, -12, 2, 6);
  ctx.fillRect(-3, -2, 6, 3);

  ctx.globalAlpha = alpha * (0.35 + impactProgress * 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-18, -19, 36, 2);
  ctx.restore();
}

function drawPlayerFlash(ctx, particle) {
  ctx.save();
  ctx.translate(Math.round(particle.x), Math.round(particle.y));
  ctx.globalAlpha = particle.alpha;
  ctx.fillStyle = particle.color;

  // 48pxプレイヤーに重なる、輪郭を強調した赤い被弾シルエット
  ctx.fillRect(-11, -22, 22, 10);
  ctx.fillRect(-9, -15, 18, 24);
  ctx.fillRect(-14, -12, 5, 18);
  ctx.fillRect(9, -12, 5, 18);
  ctx.fillRect(-8, 8, 6, 10);
  ctx.fillRect(2, 8, 6, 10);

  ctx.globalAlpha = particle.alpha * 0.65;
  ctx.fillStyle = '#fff2c7';
  ctx.fillRect(-7, -19, 14, 3);
  ctx.fillRect(-4, -9, 8, 9);

  if (particle.severe) {
    ctx.globalAlpha = particle.alpha * 0.72;
    ctx.fillStyle = '#ffccd0';
    ctx.fillRect(-18, -17, 4, 4);
    ctx.fillRect(14, -12, 4, 4);
    ctx.fillRect(-17, 9, 3, 3);
    ctx.fillRect(15, 7, 3, 3);
  }

  ctx.restore();
}

function drawDamageText(ctx, particle) {
  const progress = 1 - particle.life / particle.maxLife;
  const settleProgress = Math.min(1, progress / 0.28);
  const easeOut = 1 - Math.pow(1 - settleProgress, 3);
  const startScale = particle.hasSpear ? 1.65 : 1.5;
  const scale = startScale - (startScale - 1) * easeOut;

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

  // type: snow | ember | spark | smoke | text | bearFlash | bearCollapse | playerFlash | damageText
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
      } else if (p.type === 'playerFlash') {
        const progress = 1 - p.life / p.maxLife;
        const pulse = 0.45 + Math.abs(Math.cos(progress * Math.PI * 4)) * 0.55;
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
      } else if (particle.type === 'bearCollapse') {
        drawBearCollapse(ctx, particle);
      } else if (particle.type === 'playerFlash') {
        drawPlayerFlash(ctx, particle);
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
