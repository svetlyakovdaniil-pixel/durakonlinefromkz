import { useEffect, useRef } from 'react';

interface OniMaskAvatarProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const BASE_IMAGE_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/oni_mask_obsidian-8U38h2ctQyLXMQ3LasAjNh.webp';

export function OniMaskAvatar({ size = 64, className = '', style }: OniMaskAvatarProps) {
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

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2;

    // ── Fire particle system ─────────────────────────────────────────────
    interface FireParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      hue: number; // 0-40 for red-orange-gold
    }

    const fireParticles: FireParticle[] = [];

    function spawnFire(baseX: number, baseY: number, count = 1) {
      for (let i = 0; i < count; i++) {
        fireParticles.push({
          x: baseX + (Math.random() - 0.5) * size * 0.18,
          y: baseY,
          vx: (Math.random() - 0.5) * 0.7,
          vy: -(0.8 + Math.random() * 1.2),
          size: (size * 0.025) + Math.random() * (size * 0.03),
          life: 0,
          maxLife: 30 + Math.random() * 40,
          hue: Math.random() * 40, // red to gold
        });
      }
    }

    // Pre-seed
    for (let i = 0; i < 20; i++) {
      spawnFire(cx - size * 0.22, cy * 0.3);
      spawnFire(cx + size * 0.22, cy * 0.3);
      const p = fireParticles[fireParticles.length - 1];
      p.life = Math.floor(Math.random() * p.maxLife);
    }

    // ── Ember sparks ─────────────────────────────────────────────────────
    interface Ember {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      life: number; maxLife: number;
    }

    const embers: Ember[] = [];

    function spawnEmber() {
      const angle = Math.random() * Math.PI * 2;
      const dist = R * (0.3 + Math.random() * 0.5);
      embers.push({
        x: cx + Math.cos(angle) * dist * 0.5,
        y: cy + Math.sin(angle) * dist * 0.5,
        vx: Math.cos(angle) * (0.5 + Math.random() * 1.0),
        vy: Math.sin(angle) * (0.5 + Math.random() * 1.0) - 0.5,
        size: 0.8 + Math.random() * 1.5,
        life: 0,
        maxLife: 40 + Math.random() * 50,
      });
    }

    for (let i = 0; i < 10; i++) {
      spawnEmber();
      embers[embers.length - 1].life = Math.floor(Math.random() * 30);
    }

    let frame = 0;

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const t = timestamp * 0.001;
      frame++;

      ctx.clearRect(0, 0, size, size);

      // ── 1. Black background ───────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.restore();

      // ── 2. Deep red radial glow (hellfire ambience) ───────────────────
      const hellPulse = 0.65 + 0.35 * Math.sin(t * 1.1);
      const hellGrad = ctx.createRadialGradient(cx, cy * 1.1, 0, cx, cy, R * 1.05);
      hellGrad.addColorStop(0, `rgba(120,0,0,${0.30 * hellPulse})`);
      hellGrad.addColorStop(0.45, `rgba(80,0,0,${0.20 * hellPulse})`);
      hellGrad.addColorStop(1, 'rgba(0,0,0,0.0)');
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = hellGrad;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // ── 3. Draw mask image (multiply blend to keep black bg) ──────────
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        // Draw black rect first, then image with multiply to kill white bg
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(imgRef.current, size * 0.04, size * 0.02, size * 0.92, size * 0.96);
        ctx.restore();
      }

      // ── 4. Eye glow pulses ────────────────────────────────────────────
      // Left eye approx position
      const eyeOffsetX = size * 0.155;
      const eyeOffsetY = size * 0.38;
      const eyePulse = 0.5 + 0.5 * Math.sin(t * 2.3);
      const eyeR = size * 0.055;

      for (const [ex, ey] of [
        [cx - eyeOffsetX, eyeOffsetY],
        [cx + eyeOffsetX, eyeOffsetY],
      ]) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalCompositeOperation = 'screen';
        const eyeGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeR * 2.5);
        eyeGrad.addColorStop(0, `rgba(255,60,0,${0.55 + 0.35 * eyePulse})`);
        eyeGrad.addColorStop(0.4, `rgba(200,0,0,${0.30 * eyePulse})`);
        eyeGrad.addColorStop(1, 'rgba(100,0,0,0.0)');
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── 5. Horn tip fire ──────────────────────────────────────────────
      const hornL = { x: cx - size * 0.22, y: size * 0.08 };
      const hornR = { x: cx + size * 0.22, y: size * 0.08 };

      if (frame % 2 === 0) {
        spawnFire(hornL.x, hornL.y + size * 0.04);
        spawnFire(hornR.x, hornR.y + size * 0.04);
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';

      for (let i = fireParticles.length - 1; i >= 0; i--) {
        const p = fireParticles[i];
        p.x += p.vx + Math.sin(t * 3 + i * 0.7) * 0.3;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life++;
        if (p.life >= p.maxLife) { fireParticles.splice(i, 1); continue; }
        const progress = p.life / p.maxLife;
        const alpha = (1 - progress) * 0.85;
        const curSize = p.size * (1 - progress * 0.6);
        // Color: start gold, fade to red, then dark
        const r = 255;
        const g = Math.floor(180 * (1 - progress) + p.hue * 2);
        const b = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, curSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }
      ctx.restore();

      // ── 6. Embers ─────────────────────────────────────────────────────
      if (frame % 6 === 0 && embers.length < 20) spawnEmber();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.vy += 0.02; // slight gravity
        e.life++;
        if (e.life >= e.maxLife || e.x < 0 || e.x > size || e.y < 0 || e.y > size) {
          embers.splice(i, 1); continue;
        }
        const progress = e.life / e.maxLife;
        const alpha = (1 - progress) * 0.9;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.floor(100 * (1 - progress))},0,${alpha})`;
        ctx.fill();
      }
      ctx.restore();

      // ── 7. Outer fire rim ─────────────────────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rimPulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.7));
      const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      rimGrad.addColorStop(0, 'rgba(150,0,0,0.0)');
      rimGrad.addColorStop(0.5, `rgba(180,20,0,${0.15 * rimPulse})`);
      rimGrad.addColorStop(1, `rgba(255,60,0,${0.35 * rimPulse})`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
      ctx.restore();

      // ── 8. Glowing border ring ────────────────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const borderPulse = 0.5 + 0.5 * Math.sin(t * 2.0);
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
      // Gradient stroke: gold to red
      const strokeGrad = ctx.createLinearGradient(0, 0, size, size);
      strokeGrad.addColorStop(0, `rgba(212,175,55,${0.7 + 0.3 * borderPulse})`);
      strokeGrad.addColorStop(0.5, `rgba(200,0,0,${0.8 + 0.2 * borderPulse})`);
      strokeGrad.addColorStop(1, `rgba(212,175,55,${0.7 + 0.3 * borderPulse})`);
      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = size * 0.032;
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
