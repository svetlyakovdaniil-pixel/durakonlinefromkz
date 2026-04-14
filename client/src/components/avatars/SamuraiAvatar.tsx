import { useEffect, useRef } from 'react';

interface SamuraiAvatarProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const BASE_IMAGE_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/samurai_amber-hDio3ysifSWtxJiVhaAeGd.webp';

export function SamuraiAvatar({ size = 64, className = '', style }: SamuraiAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = BASE_IMAGE_URL;
    imgRef.current = img;

    // ── Sakura petal system ──────────────────────────────────────────────
    interface Petal {
      x: number;
      y: number;
      vx: number;
      vy: number;
      rot: number;
      rotSpeed: number;
      size: number;
      alpha: number;
      alphaSpeed: number;
      life: number;
      maxLife: number;
      wobble: number;
      wobbleSpeed: number;
    }

    const petals: Petal[] = [];

    function spawnPetal() {
      petals.push({
        x: Math.random() * size,
        y: -size * 0.05,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.4 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        size: (size * 0.025) + Math.random() * (size * 0.02),
        alpha: 0.6 + Math.random() * 0.35,
        alphaSpeed: 0.004 + Math.random() * 0.006,
        life: 0,
        maxLife: 90 + Math.random() * 80,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.04,
      });
    }

    // Pre-seed petals at random heights
    for (let i = 0; i < 12; i++) {
      spawnPetal();
      const p = petals[petals.length - 1];
      p.y = Math.random() * size;
      p.life = Math.floor(Math.random() * p.maxLife * 0.6);
    }

    // ── Embers / sparks (red) ────────────────────────────────────────────
    interface Ember {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
    }

    const embers: Ember[] = [];

    function spawnEmber() {
      const cx = size / 2;
      embers.push({
        x: cx + (Math.random() - 0.5) * size * 0.5,
        y: size * 0.85 + Math.random() * size * 0.1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.6 + Math.random() * 0.8),
        size: 1.0 + Math.random() * 1.8,
        alpha: 0.7 + Math.random() * 0.3,
        life: 0,
        maxLife: 50 + Math.random() * 60,
      });
    }

    for (let i = 0; i < 8; i++) {
      spawnEmber();
      embers[embers.length - 1].y = Math.random() * size;
      embers[embers.length - 1].life = Math.floor(Math.random() * 40);
    }

    let frame = 0;

    function drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, alpha: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      // Simple 5-petal flower shape
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        const cpAngle = angle + Math.PI / 5;
        const cpx = Math.cos(cpAngle) * size * 0.4;
        const cpy = Math.sin(cpAngle) * size * 0.4;
        if (i === 0) ctx.moveTo(cpx, cpy);
        ctx.quadraticCurveTo(px, py, cpx + Math.cos(cpAngle + Math.PI * 2 / 5) * size * 0.4, cpy + Math.sin(cpAngle + Math.PI * 2 / 5) * size * 0.4);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffb7c5';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,80,100,0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const t = timestamp * 0.001;
      frame++;

      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const R = size / 2;

      // ── 1. Outer red atmospheric glow ────────────────────────────────
      const atmPulse = 0.7 + 0.3 * Math.sin(t * 0.9);
      const atmGrad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.1);
      atmGrad.addColorStop(0, 'rgba(180,0,0,0.0)');
      atmGrad.addColorStop(0.6, `rgba(160,0,0,${0.15 * atmPulse})`);
      atmGrad.addColorStop(0.85, `rgba(100,0,0,${0.25 * atmPulse})`);
      atmGrad.addColorStop(1, 'rgba(60,0,0,0.0)');
      ctx.save();
      ctx.fillStyle = atmGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── 2. Pulsing white sun halo ─────────────────────────────────────
      const sunPulse = 0.82 + 0.18 * Math.sin(t * 1.4);
      const sunR = R * 0.42 * sunPulse;
      // Outer soft glow
      const sunGlow = ctx.createRadialGradient(cx, cy * 0.72, 0, cx, cy * 0.72, sunR * 1.6);
      sunGlow.addColorStop(0, `rgba(255,255,255,${0.18 * sunPulse})`);
      sunGlow.addColorStop(0.5, `rgba(255,240,200,${0.10 * sunPulse})`);
      sunGlow.addColorStop(1, 'rgba(255,200,100,0.0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(cx, cy * 0.72, sunR * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── 3. Draw base image (clipped to circle) ────────────────────────
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(imgRef.current, 0, 0, size, size);
        ctx.restore();
      }

      // ── 4. Sakura petals ──────────────────────────────────────────────
      if (frame % 5 === 0 && petals.length < 18) spawnPetal();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.4;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.life++;
        const progress = p.life / p.maxLife;
        const alpha = p.alpha * Math.sin(progress * Math.PI);
        if (p.life >= p.maxLife || p.y > size + 10) { petals.splice(i, 1); continue; }
        drawPetal(ctx, p.x, p.y, p.size, p.rot, alpha);
      }
      ctx.restore();

      // ── 5. Rising embers ──────────────────────────────────────────────
      if (frame % 4 === 0 && embers.length < 16) spawnEmber();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx + Math.sin(t * 2.0 + i) * 0.2;
        e.y += e.vy;
        e.life++;
        const progress = e.life / e.maxLife;
        const alpha = e.alpha * Math.sin(progress * Math.PI);
        if (e.life >= e.maxLife || e.y < -5) { embers.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,80,0,${alpha})`;
        ctx.fill();
      }
      ctx.restore();

      // ── 6. Red mist / fog at bottom ───────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      const mistPulse = 0.5 + 0.5 * Math.sin(t * 0.7 + 1.2);
      const mistGrad = ctx.createLinearGradient(0, size * 0.65, 0, size);
      mistGrad.addColorStop(0, 'rgba(120,0,0,0.0)');
      mistGrad.addColorStop(0.5, `rgba(100,0,0,${0.12 * mistPulse})`);
      mistGrad.addColorStop(1, `rgba(60,0,0,${0.22 * mistPulse})`);
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, size * 0.65, size, size * 0.35);
      ctx.restore();

      // ── 7. Rim glow ───────────────────────────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rimPulse = 0.55 + 0.45 * Math.sin(t * 1.8 + 0.5);
      const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.78, cx, cy, R);
      rimGrad.addColorStop(0, 'rgba(200,0,0,0.0)');
      rimGrad.addColorStop(0.6, `rgba(180,0,0,${0.18 * rimPulse})`);
      rimGrad.addColorStop(1, `rgba(255,40,0,${0.30 * rimPulse})`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
      ctx.restore();

      // ── 8. Border ring ────────────────────────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const borderPulse = 0.55 + 0.45 * Math.sin(t * 1.3);
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,20,0,${0.5 + 0.3 * borderPulse})`;
      ctx.lineWidth = size * 0.028;
      ctx.stroke();
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    if (img.complete) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      img.onload = () => { rafRef.current = requestAnimationFrame(draw); };
    }

    return () => { cancelAnimationFrame(rafRef.current); };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: '50%', display: 'block', ...style }}
    />
  );
}
