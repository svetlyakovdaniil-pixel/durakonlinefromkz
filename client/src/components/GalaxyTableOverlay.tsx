import React, { useEffect, useRef } from 'react';

/**
 * GalaxyTableOverlay — реалистичная Canvas-анимация звёзд для стола Галактика.
 *
 * Использует requestAnimationFrame + Canvas 2D для:
 * - Реалистичного мерцания (sinusoidal opacity + size variation)
 * - Shooting stars (падающие звёзды с хвостом)
 * - Разных цветов звёзд (белые, голубые, жёлтые, розовые)
 * - Эффекта diffraction spike (крестообразного блика) для ярких звёзд
 * - Плавного parallax drift (медленное движение)
 */

interface StarData {
  x: number;
  y: number;
  baseR: number;
  color: string;
  phase: number;
  speed: number;
  brightness: number;
  spike: boolean;
  driftX: number;
  driftY: number;
  cx: number;
  cy: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  maxLife: number;
  age: number;
  length: number;
  opacity: number;
}

const STAR_COLORS = [
  '#ffffff',
  '#e8f0ff',
  '#b8d4ff',
  '#ffd6a0',
  '#ffc8e8',
  '#c8b4ff',
  '#a0e8ff',
];

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildStars(count: number, W: number, H: number): StarData[] {
  const rng = seededRng(137);
  return Array.from({ length: count }, () => {
    const xFrac = rng();
    const yFrac = rng();
    const baseR = rng() * 2.0 + 0.4;
    const bright = rng() * 0.7 + 0.3;
    return {
      x: xFrac,
      y: yFrac,
      baseR,
      color: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
      phase: rng() * Math.PI * 2,
      speed: rng() * 0.8 + 0.3,
      brightness: bright,
      spike: baseR > 1.6 && rng() > 0.5,
      driftX: (rng() - 0.5) * 2,
      driftY: (rng() - 0.5) * 1,
      cx: xFrac * W,
      cy: yFrac * H,
    };
  });
}

function spawnShootingStar(W: number, H: number): ShootingStar {
  const x = Math.random() * W * 0.8 + W * 0.1;
  const y = Math.random() * H * 0.3;
  const angle = (Math.random() * 30 + 20) * (Math.PI / 180);
  const speed = 300 + Math.random() * 400;
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    maxLife: 0.6 + Math.random() * 0.8,
    age: 0,
    length: 80 + Math.random() * 120,
    opacity: 0,
  };
}

interface Props {
  enabled?: boolean;
}

const GalaxyTableOverlay: React.FC<Props> = ({ enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<StarData[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const nextShootingRef = useRef<number>(4 + Math.random() * 6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      starsRef.current = buildStars(200, canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const render = (timestamp: number) => {
      const dt = lastTimeRef.current
        ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
        : 0.016;
      lastTimeRef.current = timestamp;
      const t = timestamp / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!enabled) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const W = canvas.width;
      const H = canvas.height;

      // ── Stars ──
      for (const star of starsRef.current) {
        star.cx += star.driftX * dt;
        star.cy += star.driftY * dt;
        if (star.cx < -5) star.cx = W + 5;
        if (star.cx > W + 5) star.cx = -5;
        if (star.cy < -5) star.cy = H + 5;
        if (star.cy > H + 5) star.cy = -5;

        const twinkle = 0.5 + 0.5 * Math.sin(t * star.speed * Math.PI * 2 + star.phase);
        const opacity = star.brightness * (0.3 + 0.7 * twinkle);
        const r = star.baseR * (0.7 + 0.3 * twinkle);

        ctx.save();

        // Glow halo
        if (star.baseR > 1.2) {
          const grad = ctx.createRadialGradient(star.cx, star.cy, 0, star.cx, star.cy, r * 4);
          grad.addColorStop(0, star.color);
          grad.addColorStop(1, 'transparent');
          ctx.globalAlpha = opacity * 0.25;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(star.cx, star.cy, r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core
        ctx.globalAlpha = opacity;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.cx, star.cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Diffraction spikes
        if (star.spike && twinkle > 0.6) {
          const spikeLen = r * 5 * twinkle;
          const spikeOpacity = opacity * 0.5 * (twinkle - 0.6) / 0.4;
          ctx.globalAlpha = spikeOpacity;
          ctx.lineWidth = 0.5;

          const gradH = ctx.createLinearGradient(star.cx - spikeLen, star.cy, star.cx + spikeLen, star.cy);
          gradH.addColorStop(0, 'transparent');
          gradH.addColorStop(0.5, star.color);
          gradH.addColorStop(1, 'transparent');
          ctx.strokeStyle = gradH;
          ctx.beginPath();
          ctx.moveTo(star.cx - spikeLen, star.cy);
          ctx.lineTo(star.cx + spikeLen, star.cy);
          ctx.stroke();

          const gradV = ctx.createLinearGradient(star.cx, star.cy - spikeLen, star.cx, star.cy + spikeLen);
          gradV.addColorStop(0, 'transparent');
          gradV.addColorStop(0.5, star.color);
          gradV.addColorStop(1, 'transparent');
          ctx.strokeStyle = gradV;
          ctx.beginPath();
          ctx.moveTo(star.cx, star.cy - spikeLen);
          ctx.lineTo(star.cx, star.cy + spikeLen);
          ctx.stroke();
        }

        ctx.restore();
      }

      // ── Shooting stars ──
      nextShootingRef.current -= dt;
      if (nextShootingRef.current <= 0) {
        shootingStarsRef.current.push(spawnShootingStar(W, H));
        nextShootingRef.current = 5 + Math.random() * 10;
      }

      shootingStarsRef.current = shootingStarsRef.current.filter(ss => ss.age < ss.maxLife);

      for (const ss of shootingStarsRef.current) {
        ss.age += dt;
        ss.x += ss.vx * dt;
        ss.y += ss.vy * dt;

        const progress = ss.age / ss.maxLife;
        ss.opacity = progress < 0.2
          ? progress / 0.2
          : progress > 0.7
            ? 1 - (progress - 0.7) / 0.3
            : 1;

        const mag = Math.hypot(ss.vx, ss.vy);
        const tailX = ss.x - (ss.vx / mag) * ss.length;
        const tailY = ss.y - (ss.vy / mag) * ss.length;

        ctx.save();
        ctx.globalAlpha = ss.opacity * 0.9;
        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.7, 'rgba(200,220,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        ctx.globalAlpha = ss.opacity;
        const headGrad = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 4);
        headGrad.addColorStop(0, 'white');
        headGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export default GalaxyTableOverlay;
