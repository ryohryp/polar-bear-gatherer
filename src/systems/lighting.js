import { BASE_W, BASE_H } from '../config.js';

export class LightingSystem {
  constructor() {
    this.lights = [];
    this.ambientColor = 'rgba(12, 24, 45, 0.28)';
    this.canvas = document.createElement('canvas');
    this.canvas.width = BASE_W;
    this.canvas.height = BASE_H;
    this.ctx = this.canvas.getContext('2d');
  }

  reset() {
    this.lights = [];
  }

  addLight(x, y, radius, color, intensity = 1) {
    this.lights.push({ x, y, radius, color, intensity });
  }

  render(ctx, cam, screen) {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.ambientColor;
    this.ctx.fillRect(0, 0, BASE_W, BASE_H);
    this.ctx.globalCompositeOperation = 'destination-out';

    for (const light of this.lights) {
      const x = light.x - cam.x;
      const y = light.y - cam.y;
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, light.radius);
      gradient.addColorStop(0, `rgba(0,0,0,${light.intensity})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, light.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    ctx.save();
    ctx.setTransform(screen.scale, 0, 0, screen.scale, screen.offsetX, screen.offsetY);
    ctx.drawImage(this.canvas, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.setTransform(screen.scale, 0, 0, screen.scale, screen.offsetX, screen.offsetY);
    ctx.translate(-cam.x, -cam.y);
    ctx.globalCompositeOperation = 'lighter';

    for (const light of this.lights) {
      if (!light.color) continue;
      const gradient = ctx.createRadialGradient(
        light.x,
        light.y,
        0,
        light.x,
        light.y,
        light.radius * 0.8,
      );
      gradient.addColorStop(0, light.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
