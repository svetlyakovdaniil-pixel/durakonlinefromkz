import { useRef, useEffect } from "react";
import { scheduleAnimation, cancelAnimation } from "@/lib/animationScheduler";

interface SkyEagleAvatarProps {
  size?: number;
  className?: string;
}

/**
 * Animated avatar: golden eagle flying across a deep blue sky,
 * leaving a shimmering golden trail behind it.
 * Rendered entirely on Canvas for smooth 60fps animation.
 */
export function SkyEagleAvatar({ size = 48, className = "" }: SkyEagleAvatarProps) {
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

    const R = S / 2; // radius
    const cx = R;
    const cy = R;

    // Trail particles
    type Particle = {
      x: number;
      y: number;
      alpha: number;
      radius: number;
      life: number;
      maxLife: number;
    };
    const particles: Particle[] = [];

    let t = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / 60;

    function drawBackground() {
      if (!ctx) return;
      // Deep blue sky gradient
      const bg = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, R);
      bg.addColorStop(0, "#1a3a6e");
      bg.addColorStop(0.6, "#0d1f42");
      bg.addColorStop(1, "#060e20");

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, S, S);
      ctx.restore();
    }

    function drawStars() {
      if (!ctx) return;
      // Static small stars
      const starPositions = [
        [0.15, 0.12], [0.82, 0.08], [0.65, 0.18], [0.3, 0.22],
        [0.9, 0.3], [0.05, 0.4], [0.75, 0.42], [0.45, 0.08],
        [0.55, 0.35], [0.2, 0.55], [0.88, 0.55],
      ];
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      starPositions.forEach(([sx, sy]) => {
        const starAlpha = 0.4 + 0.3 * Math.sin(t * 0.03 + sx * 10);
        ctx.beginPath();
        ctx.arc(sx * S, sy * S, 0.8 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,240,180,${starAlpha})`;
        ctx.fill();
      });
      ctx.restore();
    }

    function spawnParticles(ex: number, ey: number) {
      // Spawn 2-3 trail particles at eagle's position
      for (let i = 0; i < 2; i++) {
        const maxLife = 18 + Math.random() * 12;
        particles.push({
          x: ex + (Math.random() - 0.5) * S * 0.04,
          y: ey + (Math.random() - 0.5) * S * 0.04,
          alpha: 0.85,
          radius: (1.5 + Math.random() * 2) * dpr,
          life: 0,
          maxLife,
        });
      }
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.alpha = 0.85 * (1 - p.life / p.maxLife);
        p.x -= 0.6 * dpr; // drift left (trail behind eagle)
        p.y += (Math.random() - 0.5) * 0.3 * dpr;
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
    }

    function drawParticles() {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      particles.forEach((p) => {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(255,215,0,${p.alpha})`);
        grad.addColorStop(0.5, `rgba(255,165,0,${p.alpha * 0.6})`);
        grad.addColorStop(1, `rgba(255,100,0,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });
      ctx.restore();
    }

    /**
     * Draw a stylized eagle using canvas paths.
     * The eagle is centered at (ex, ey), scaled by `sc`, and can be flipped.
     */
    function drawEagle(ex: number, ey: number, sc: number, wingPhase: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.scale(sc, sc);

      // Wing flap: oscillate wing tips
      const wFlap = Math.sin(wingPhase) * 0.35;

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 9 * dpr, 5 * dpr, 0, 0, Math.PI * 2);
      const bodyGrad = ctx.createLinearGradient(-9 * dpr, -5 * dpr, 9 * dpr, 5 * dpr);
      bodyGrad.addColorStop(0, "#ffd700");
      bodyGrad.addColorStop(0.5, "#ffb300");
      bodyGrad.addColorStop(1, "#cc8800");
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Left wing (upper)
      ctx.beginPath();
      ctx.moveTo(-3 * dpr, -2 * dpr);
      ctx.quadraticCurveTo(
        -20 * dpr, (-18 + wFlap * 20) * dpr,
        -30 * dpr, (-10 + wFlap * 25) * dpr
      );
      ctx.quadraticCurveTo(-20 * dpr, -4 * dpr, -3 * dpr, 2 * dpr);
      ctx.closePath();
      const wingGrad = ctx.createLinearGradient(-30 * dpr, -18 * dpr, 0, 0);
      wingGrad.addColorStop(0, "#e6a800");
      wingGrad.addColorStop(0.5, "#ffd700");
      wingGrad.addColorStop(1, "#ffcc00");
      ctx.fillStyle = wingGrad;
      ctx.fill();

      // Right wing (lower, mirrored)
      ctx.beginPath();
      ctx.moveTo(-3 * dpr, 2 * dpr);
      ctx.quadraticCurveTo(
        -20 * dpr, (10 - wFlap * 15) * dpr,
        -28 * dpr, (6 - wFlap * 18) * dpr
      );
      ctx.quadraticCurveTo(-18 * dpr, 5 * dpr, -3 * dpr, 4 * dpr);
      ctx.closePath();
      ctx.fillStyle = "#cc8800";
      ctx.fill();

      // Tail feathers
      ctx.beginPath();
      ctx.moveTo(7 * dpr, -2 * dpr);
      ctx.lineTo(18 * dpr, -5 * dpr);
      ctx.lineTo(16 * dpr, 0);
      ctx.lineTo(18 * dpr, 5 * dpr);
      ctx.lineTo(7 * dpr, 2 * dpr);
      ctx.closePath();
      ctx.fillStyle = "#e6a800";
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(-7 * dpr, -3 * dpr, 5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8dc";
      ctx.fill();

      // Eye
      ctx.beginPath();
      ctx.arc(-9 * dpr, -4 * dpr, 1.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = "#1a0000";
      ctx.fill();

      // Beak
      ctx.beginPath();
      ctx.moveTo(-12 * dpr, -3 * dpr);
      ctx.lineTo(-17 * dpr, -1 * dpr);
      ctx.lineTo(-13 * dpr, 0);
      ctx.closePath();
      ctx.fillStyle = "#ff9900";
      ctx.fill();

      // Golden shimmer overlay
      const shimmer = ctx.createLinearGradient(-30 * dpr, -18 * dpr, 18 * dpr, 5 * dpr);
      const shimmerPos = ((t * 0.02) % 1);
      shimmer.addColorStop(Math.max(0, shimmerPos - 0.15), "rgba(255,255,200,0)");
      shimmer.addColorStop(shimmerPos, "rgba(255,255,200,0.25)");
      shimmer.addColorStop(Math.min(1, shimmerPos + 0.15), "rgba(255,255,200,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = shimmer;
      ctx.beginPath();
      ctx.ellipse(0, 0, 30 * dpr, 20 * dpr, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      ctx.restore();
    }

    function drawBorder() {
      if (!ctx) return;
      // Animated golden border
      const borderAlpha = 0.7 + 0.3 * Math.sin(t * 0.05);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 1.5 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,215,0,${borderAlpha})`;
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

      // Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      drawBackground();
      drawStars();

      // Eagle position: figure-8 / looping path across the avatar
      const loopT = t * 0.022;
      const ex = cx + Math.sin(loopT) * R * 0.52;
      const ey = cy + Math.sin(loopT * 2) * R * 0.28;

      spawnParticles(ex, ey);
      updateParticles();
      drawParticles();

      const wingPhase = t * 0.18;
      const sc = 0.85 + 0.08 * Math.sin(t * 0.04); // subtle size pulse
      drawEagle(ex, ey, sc, wingPhase);

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
