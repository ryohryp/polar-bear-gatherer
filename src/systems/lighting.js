import { BASE_W, BASE_H } from '../config.js';

export class LightingSystem {
    constructor() {
        this.lights = [];
        this.ambientColor = 'rgba(10, 14, 32, 0.65)'; // Night time darkness
        // Offscreen canvas for lighting
        this.canvas = document.createElement('canvas');
        this.canvas.width = BASE_W;
        this.canvas.height = BASE_H;
        this.ctx = this.canvas.getContext('2d');
    }

    reset() {
        this.lights = [];
    }

    addLight(x, y, radius, color, intensity = 1.0) {
        this.lights.push({ x, y, radius, color, intensity });
    }

    render(ctx, cam, screen) {
        // Resize offscreen if needed (though BASE_W/H is constant usually)
        // Clear with ambient darkness
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.ambientColor;
        this.ctx.fillRect(0, 0, BASE_W, BASE_H);

        // Cut out lights
        this.ctx.globalCompositeOperation = 'destination-out';

        for (const light of this.lights) {
            const lx = light.x - cam.x;
            const ly = light.y - cam.y;

            // Simple radial gradient for soft light
            const g = this.ctx.createRadialGradient(lx, ly, 0, lx, ly, light.radius);
            g.addColorStop(0, `rgba(0, 0, 0, ${light.intensity})`);
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.arc(lx, ly, light.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Optional: Add colored tint for lights (e.g. warm fire glow)
        // We can do this by drawing the lights again with 'source-over' and 'lighter' blend mode
        // on the main canvas OR on this lighting canvas before drawing it to main.
        // Let's draw the darkness overlay onto the main canvas now.

        ctx.save();
        ctx.setTransform(screen.scale, 0, 0, screen.scale, screen.offsetX, screen.offsetY);
        ctx.drawImage(this.canvas, 0, 0);
        ctx.restore();

        // Draw colored glow (additive)
        ctx.save();
        ctx.setTransform(screen.scale, 0, 0, screen.scale, screen.offsetX, screen.offsetY);
        ctx.translate(-cam.x, -cam.y);
        ctx.globalCompositeOperation = 'lighter';
        for (const light of this.lights) {
            if (!light.color) continue;
            const g = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius * 0.8);
            g.addColorStop(0, light.color);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
