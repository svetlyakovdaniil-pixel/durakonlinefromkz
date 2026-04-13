import { useRef, useEffect } from "react";
import { scheduleAnimation, cancelAnimation } from "@/lib/animationScheduler";

interface GoldenHordeAvatarProps {
  size?: number;
  className?: string;
}

/**
 * Animated avatar: Golden Horde cavalry charging across a steppe field.
 * Multiple riders on horses gallop from right to left in a parallax formation.
 * Background: golden steppe with dust clouds.
 * Rendered entirely on Canvas for smooth 60fps animation.
 */
export function GoldenHordeAvatar({ size = 48, className = "" }: GoldenHordeAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scheduleIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const S = size * dpr;
    canvas.width = S;
    canvas.height = S;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const R = S / 2;
    const cx = R;
    const cy = R;

    // Dust particles
    type Dust = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      radius: number;
      life: number;
      maxLife: number;
    };
    const dustParticles: Dust[] = [];

    // Each rider has its own x offset and phase
    // Riders are layered: back (smaller, darker) → front (larger, brighter)
    const RIDER_LAYERS = [
      { xOffset: S * 0.72, yBase: S * 0.60, scale: 0.52, speed: 1.1, phaseOffset: 0.0,  color: '#8b6914', shadowAlpha: 0.18 },
      { xOffset: S * 0.55, yBase: S * 0.63, scale: 0.60, speed: 1.3, phaseOffset: 1.2,  color: '#a07820', shadowAlpha: 0.22 },
      { xOffset: S * 0.38, yBase: S * 0.66, scale: 0.70, speed: 1.5, phaseOffset: 0.6,  color: '#c8960a', shadowAlpha: 0.28 },
      { xOffset: S * 0.20, yBase: S * 0.70, scale: 0.82, speed: 1.7, phaseOffset: 1.8,  color: '#e6a800', shadowAlpha: 0.35 },
    ];

    // Rider x positions (scroll left)
    const riderXPositions = RIDER_LAYERS.map(r => r.xOffset);

    let t = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / 60;

    function drawBackground() {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Sky gradient: deep blue → warm amber horizon
      const sky = ctx.createLinearGradient(0, 0, 0, S * 0.62);
      sky.addColorStop(0, "#0a0d1a");
      sky.addColorStop(0.4, "#1a1a3a");
      sky.addColorStop(0.75, "#3d2200");
      sky.addColorStop(1, "#7a3d00");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, S, S * 0.62);

      // Sun / horizon glow
      const sunGlow = ctx.createRadialGradient(cx, S * 0.58, 0, cx, S * 0.58, R * 0.7);
      sunGlow.addColorStop(0, "rgba(255,180,0,0.55)");
      sunGlow.addColorStop(0.3, "rgba(255,100,0,0.25)");
      sunGlow.addColorStop(0.7, "rgba(180,60,0,0.08)");
      sunGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, S, S * 0.62);

      // Ground: steppe
      const ground = ctx.createLinearGradient(0, S * 0.60, 0, S);
      ground.addColorStop(0, "#5a3200");
      ground.addColorStop(0.3, "#3d2000");
      ground.addColorStop(1, "#1a0d00");
      ctx.fillStyle = ground;
      ctx.fillRect(0, S * 0.60, S, S * 0.40);

      // Horizon line shimmer
      ctx.strokeStyle = "rgba(255,160,0,0.35)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, S * 0.615);
      ctx.lineTo(S, S * 0.615);
      ctx.stroke();

      ctx.restore();
    }

    function drawStars() {
      if (!ctx) return;
      const starPositions = [
        [0.1, 0.06], [0.78, 0.04], [0.5, 0.10], [0.28, 0.14],
        [0.88, 0.18], [0.04, 0.22], [0.65, 0.08], [0.42, 0.20],
      ];
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      starPositions.forEach(([sx, sy]) => {
        const alpha = 0.3 + 0.2 * Math.sin(t * 0.03 + sx * 15);
        ctx.beginPath();
        ctx.arc(sx * S, sy * S, 0.6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,230,160,${alpha})`;
        ctx.fill();
      });
      ctx.restore();
    }

    function spawnDust(x: number, y: number, layerScale: number) {
      if (Math.random() > 0.4) return;
      const maxLife = 20 + Math.random() * 15;
      dustParticles.push({
        x: x + (Math.random() - 0.3) * 12 * dpr * layerScale,
        y: y + (Math.random()) * 4 * dpr * layerScale,
        vx: -(0.3 + Math.random() * 0.5) * dpr * layerScale,
        vy: -(0.2 + Math.random() * 0.4) * dpr * layerScale,
        alpha: 0.35 + Math.random() * 0.2,
        radius: (3 + Math.random() * 5) * dpr * layerScale,
        life: 0,
        maxLife,
      });
    }

    function updateDust() {
      for (let i = dustParticles.length - 1; i >= 0; i--) {
        const p = dustParticles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02 * dpr; // slight gravity
        p.alpha *= 0.94;
        if (p.life >= p.maxLife || p.alpha < 0.01) dustParticles.splice(i, 1);
      }
    }

    function drawDust() {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      dustParticles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,140,50,${p.alpha})`;
        ctx.fill();
      });
      ctx.restore();
    }

    /**
     * Draw a single horse+rider.
     * (hx, hy) = center base of horse, sc = scale, color = main color
     * gallop = gallop phase (0..2π)
     */
    function drawHorseAndRider(hx: number, hy: number, sc: number, color: string, gallop: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(sc, sc);

      const d = dpr;

      // Gallop leg animation
      const legSwing = Math.sin(gallop) * 0.45;
      const bodyBob = Math.abs(Math.sin(gallop * 2)) * 1.5 * d;

      // ── Horse body ───────────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(0, -bodyBob);

      // Horse shadow
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(0, 8 * d, 18 * d, 3.5 * d, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.restore();

      // Horse body (ellipse)
      const horseBodyGrad = ctx.createLinearGradient(-18 * d, -8 * d, 18 * d, 8 * d);
      horseBodyGrad.addColorStop(0, color);
      horseBodyGrad.addColorStop(0.5, shiftColor(color, 30));
      horseBodyGrad.addColorStop(1, shiftColor(color, -20));
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 * d, 9 * d, -0.08, 0, Math.PI * 2);
      ctx.fillStyle = horseBodyGrad;
      ctx.fill();

      // Horse neck
      ctx.beginPath();
      ctx.moveTo(-10 * d, -6 * d);
      ctx.quadraticCurveTo(-16 * d, -16 * d, -14 * d, -22 * d);
      ctx.quadraticCurveTo(-12 * d, -16 * d, -6 * d, -8 * d);
      ctx.closePath();
      ctx.fillStyle = shiftColor(color, 10);
      ctx.fill();

      // Horse head
      ctx.beginPath();
      ctx.ellipse(-16 * d, -24 * d, 6 * d, 4.5 * d, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = shiftColor(color, 15);
      ctx.fill();

      // Muzzle
      ctx.beginPath();
      ctx.ellipse(-21 * d, -23 * d, 3.5 * d, 2.5 * d, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = shiftColor(color, 20);
      ctx.fill();

      // Nostril
      ctx.beginPath();
      ctx.arc(-23 * d, -22.5 * d, 0.8 * d, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();

      // Eye
      ctx.beginPath();
      ctx.arc(-14.5 * d, -26 * d, 1.2 * d, 0, Math.PI * 2);
      ctx.fillStyle = "#111";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-14 * d, -26.3 * d, 0.4 * d, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();

      // Mane
      ctx.strokeStyle = shiftColor(color, -30);
      ctx.lineWidth = 1.5 * d;
      for (let i = 0; i < 4; i++) {
        const mx = -10 * d - i * 1.5 * d;
        const my = -8 * d - i * 1.5 * d;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(mx - 3 * d, my - 5 * d, mx - 1 * d, my - 10 * d);
        ctx.stroke();
      }

      // Tail
      ctx.strokeStyle = shiftColor(color, -25);
      ctx.lineWidth = 2 * d;
      ctx.beginPath();
      ctx.moveTo(17 * d, -2 * d);
      ctx.quadraticCurveTo(24 * d + Math.sin(gallop * 0.7) * 4 * d, 4 * d, 22 * d + Math.sin(gallop * 0.7) * 6 * d, 12 * d);
      ctx.stroke();

      // ── Legs ─────────────────────────────────────────────────────────────────
      // Front legs
      drawLeg(ctx, -8 * d, 8 * d, legSwing * 0.8, d, color);
      drawLeg(ctx, -4 * d, 8 * d, -legSwing * 0.6, d, shiftColor(color, -10));

      // Back legs
      drawLeg(ctx, 8 * d, 8 * d, -legSwing * 0.9, d, shiftColor(color, -15));
      drawLeg(ctx, 12 * d, 8 * d, legSwing * 0.7, d, shiftColor(color, -20));

      ctx.restore(); // body bob

      // ── Rider ────────────────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(2 * d, -bodyBob - 9 * d);

      // Rider body (robe)
      const robeGrad = ctx.createLinearGradient(-5 * d, -14 * d, 5 * d, 2 * d);
      robeGrad.addColorStop(0, "#8b1a00");
      robeGrad.addColorStop(0.5, "#c42800");
      robeGrad.addColorStop(1, "#6b1000");
      ctx.beginPath();
      ctx.moveTo(-5 * d, -14 * d);
      ctx.lineTo(-6 * d, 2 * d);
      ctx.lineTo(6 * d, 2 * d);
      ctx.lineTo(5 * d, -14 * d);
      ctx.closePath();
      ctx.fillStyle = robeGrad;
      ctx.fill();

      // Gold trim
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 0.6 * d;
      ctx.beginPath();
      ctx.moveTo(-5 * d, -14 * d);
      ctx.lineTo(-6 * d, 2 * d);
      ctx.moveTo(5 * d, -14 * d);
      ctx.lineTo(6 * d, 2 * d);
      ctx.stroke();

      // Rider arm with lance/spear
      ctx.save();
      ctx.translate(-5 * d, -12 * d);
      ctx.rotate(-0.3 + Math.sin(gallop * 0.5) * 0.1);
      // Arm
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-4 * d, 8 * d);
      ctx.strokeStyle = "#8b1a00";
      ctx.lineWidth = 2.5 * d;
      ctx.stroke();
      // Lance shaft
      ctx.beginPath();
      ctx.moveTo(-4 * d, 8 * d);
      ctx.lineTo(-8 * d, 28 * d);
      ctx.strokeStyle = "#8b6914";
      ctx.lineWidth = 1.2 * d;
      ctx.stroke();
      // Lance tip
      ctx.beginPath();
      ctx.moveTo(-8.5 * d, 28 * d);
      ctx.lineTo(-7 * d, 35 * d);
      ctx.lineTo(-9.5 * d, 35 * d);
      ctx.closePath();
      ctx.fillStyle = "#e8e8e8";
      ctx.fill();
      // Banner on lance
      const bannerX = -8 * d;
      const bannerY = 20 * d;
      const bannerWave = Math.sin(t * 0.12 + gallop) * 3 * d;
      ctx.beginPath();
      ctx.moveTo(bannerX, bannerY);
      ctx.lineTo(bannerX - 8 * d + bannerWave, bannerY + 2 * d);
      ctx.lineTo(bannerX - 7 * d + bannerWave, bannerY + 6 * d);
      ctx.lineTo(bannerX, bannerY + 7 * d);
      ctx.closePath();
      ctx.fillStyle = "#ffd700";
      ctx.fill();
      ctx.restore();

      // Rider head
      ctx.beginPath();
      ctx.arc(0, -18 * d, 4.5 * d, 0, Math.PI * 2);
      ctx.fillStyle = "#c8956c";
      ctx.fill();

      // Helmet
      const helmGrad = ctx.createLinearGradient(-5 * d, -24 * d, 5 * d, -18 * d);
      helmGrad.addColorStop(0, "#ffd700");
      helmGrad.addColorStop(0.5, "#daa520");
      helmGrad.addColorStop(1, "#b8860b");
      ctx.beginPath();
      ctx.moveTo(-5 * d, -18 * d);
      ctx.lineTo(-4 * d, -24 * d);
      ctx.quadraticCurveTo(0, -27 * d, 4 * d, -24 * d);
      ctx.lineTo(5 * d, -18 * d);
      ctx.closePath();
      ctx.fillStyle = helmGrad;
      ctx.fill();
      // Helmet spike
      ctx.beginPath();
      ctx.moveTo(-1 * d, -26 * d);
      ctx.lineTo(1 * d, -26 * d);
      ctx.lineTo(0, -31 * d);
      ctx.closePath();
      ctx.fillStyle = "#ffd700";
      ctx.fill();

      ctx.restore(); // rider

      ctx.restore(); // horse+rider translate/scale
    }

    /** Draw a single horse leg */
    function drawLeg(
      lctx: CanvasRenderingContext2D,
      lx: number,
      ly: number,
      angle: number,
      d: number,
      color: string
    ) {
      lctx.save();
      lctx.translate(lx, ly);
      lctx.rotate(angle);
      // Upper leg
      lctx.beginPath();
      lctx.moveTo(0, 0);
      lctx.lineTo(0, 9 * d);
      lctx.strokeStyle = color;
      lctx.lineWidth = 2.5 * d;
      lctx.stroke();
      // Lower leg
      lctx.save();
      lctx.translate(0, 9 * d);
      lctx.rotate(-angle * 0.6);
      lctx.beginPath();
      lctx.moveTo(0, 0);
      lctx.lineTo(0, 8 * d);
      lctx.strokeStyle = shiftColor(color, -15);
      lctx.lineWidth = 2 * d;
      lctx.stroke();
      // Hoof
      lctx.beginPath();
      lctx.ellipse(0, 9 * d, 2 * d, 1.2 * d, 0, 0, Math.PI * 2);
      lctx.fillStyle = "#1a0d00";
      lctx.fill();
      lctx.restore();
      lctx.restore();
    }

    /** Lighten/darken a hex color by amount */
    function shiftColor(hex: string, amount: number): string {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
      const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
      return `rgb(${r},${g},${b})`;
    }

    function drawBorder() {
      if (!ctx) return;
      const alpha = 0.7 + 0.3 * Math.sin(t * 0.05);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 1.5 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,180,0,${alpha})`;
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();
      ctx.restore();
    }

    scheduleIdRef.current = scheduleAnimation(function frame(timestamp: number) {
      if (timestamp - lastFrameTime < frameInterval * 0.8) {
        return;
      }
      lastFrameTime = timestamp;
      t++;
      if (!ctx) return;

      // With alpha:false we fill background instead of clearRect
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, S, S);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      drawBackground();
      drawStars();

      // Update rider positions (scroll left, wrap around)
      for (let i = 0; i < RIDER_LAYERS.length; i++) {
        const layer = RIDER_LAYERS[i];
        riderXPositions[i] -= layer.speed * dpr;
        if (riderXPositions[i] < -S * 0.25) {
          riderXPositions[i] = S * 1.1;
        }
      }

      // Draw dust first (behind riders)
      updateDust();
      drawDust();

      // Draw riders back-to-front (already ordered back→front in RIDER_LAYERS)
      for (let i = 0; i < RIDER_LAYERS.length; i++) {
        const layer = RIDER_LAYERS[i];
        const rx = riderXPositions[i];
        const ry = layer.yBase;
        const gallop = t * 0.22 + layer.phaseOffset;

        // Spawn dust at hooves
        spawnDust(rx + 10 * dpr * layer.scale, ry, layer.scale);

        drawHorseAndRider(rx, ry, layer.scale, layer.color, gallop);
      }

      ctx.restore();
      drawBorder();

    });

    return () => {
      cancelAnimation(scheduleIdRef.current);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-full ${className}`}
      style={{ borderRadius: "50%", display: "block" }}
    />
  );
}
