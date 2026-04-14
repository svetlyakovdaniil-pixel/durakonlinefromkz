import { useEffect, useRef } from 'react';
import { registerAvatarDraw } from '@/lib/avatarRafManager';

interface AmaterasuAvatarProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const BASE_IMAGE_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amaterasu_ruby-Uxg7HYRBpY2EuX7FcdsGRE.webp';

export function AmaterasuAvatar({ size = 64, className = '', style }: AmaterasuAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI / Retina support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Load base image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = BASE_IMAGE_URL;
    imgRef.current = img;

    // Particle system for golden sparks
    interface Spark {
      angle: number;
      radius: number;
      speed: number;
      size: number;
      alpha: number;
      alphaSpeed: number;
      color: string;
      life: number;
      maxLife: number;
    }

    const sparks: Spark[] = [];
    const SPARK_COLORS = ['#FFD700', '#FFA500', '#FF6B00', '#FFEC8B', '#FF4500'];

    function spawnSpark() {
      const angle = Math.random() * Math.PI * 2;
      const radius = (size * 0.28) + Math.random() * (size * 0.18);
      sparks.push({
        angle,
        radius,
        speed: (Math.random() - 0.5) * 0.015,
        size: 1.2 + Math.random() * 2.2,
        alpha: 0.7 + Math.random() * 0.3,
        alphaSpeed: 0.008 + Math.random() * 0.012,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        life: 0,
        maxLife: 60 + Math.random() * 80,
      });
    }

    // Pre-spawn some sparks
    for (let i = 0; i < 18; i++) spawnSpark();

    // Ray configuration — 12 rays radiating from center-top
    const RAY_COUNT = 12;
    const rays = Array.from({ length: RAY_COUNT }, (_, i) => ({
      baseAngle: (i / RAY_COUNT) * Math.PI * 2,
      phaseOffset: Math.random() * Math.PI * 2,
      widthFactor: 0.04 + Math.random() * 0.04,
      lengthFactor: 0.42 + Math.random() * 0.12,
    }));

    // Ribbon particles (floating red/white wisps)
    interface Wisp {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }
    const wisps: Wisp[] = [];

    function spawnWisp() {
      const cx = size / 2;
      const cy = size * 0.62;
      const angle = Math.PI * 0.8 + Math.random() * Math.PI * 0.4;
      const speed = 0.3 + Math.random() * 0.5;
      wisps.push({
        x: cx + (Math.random() - 0.5) * size * 0.3,
        y: cy + (Math.random() - 0.5) * size * 0.15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4,
        alpha: 0.5 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#cc2200' : '#ffffff',
        life: 0,
        maxLife: 50 + Math.random() * 60,
      });
    }
    for (let i = 0; i < 8; i++) spawnWisp();

    let frame = 0;

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const t = timestamp * 0.001;
      timeRef.current = t;
      frame++;

      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const R = size / 2;

      // ── 1. Outer glow corona ─────────────────────────────────────────────
      const glowPulse = 0.75 + 0.25 * Math.sin(t * 1.8);
      const coronaGrad = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 1.05);
      coronaGrad.addColorStop(0, `rgba(255,140,0,${0.0})`);
      coronaGrad.addColorStop(0.55, `rgba(255,100,0,${0.18 * glowPulse})`);
      coronaGrad.addColorStop(0.8, `rgba(200,60,0,${0.28 * glowPulse})`);
      coronaGrad.addColorStop(1, `rgba(120,20,0,0.0)`);
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── 2. Rotating sun rays (screen blend) ─────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rayRotation = t * 0.18; // slow rotation
      rays.forEach((ray) => {
        const angle = ray.baseAngle + rayRotation;
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.2 + ray.phaseOffset);
        const halfW = ray.widthFactor * Math.PI;
        const len = R * ray.lengthFactor * pulse;

        const x1 = cx + Math.cos(angle - halfW) * len;
        const y1 = cy + Math.sin(angle - halfW) * len;
        const x2 = cx + Math.cos(angle + halfW) * len;
        const y2 = cy + Math.sin(angle + halfW) * len;

        const rayGrad = ctx.createLinearGradient(cx, cy, x1, y1);
        rayGrad.addColorStop(0, `rgba(255,200,50,${0.55 * pulse})`);
        rayGrad.addColorStop(0.5, `rgba(255,140,0,${0.3 * pulse})`);
        rayGrad.addColorStop(1, `rgba(255,80,0,0.0)`);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fillStyle = rayGrad;
        ctx.fill();
      });
      ctx.restore();

      // ── 3. Draw base image (clipped to circle) ───────────────────────────
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(imgRef.current, 0, 0, size, size);
        ctx.restore();
      }

      // ── 4. Wisps (ribbon fragments) ──────────────────────────────────────
      if (frame % 4 === 0 && wisps.length < 20) spawnWisp();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i];
        w.x += w.vx;
        w.y += w.vy;
        w.life++;
        const progress = w.life / w.maxLife;
        const alpha = w.alpha * (1 - progress) * Math.sin(progress * Math.PI);
        if (w.life >= w.maxLife) { wisps.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = w.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
        // Parse hex color for rgba
        if (w.color.startsWith('#')) {
          const r = parseInt(w.color.slice(1, 3), 16);
          const g = parseInt(w.color.slice(3, 5), 16);
          const b = parseInt(w.color.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        }
        ctx.fill();
      }
      ctx.restore();

      // ── 5. Golden sparks ─────────────────────────────────────────────────
      if (frame % 3 === 0 && sparks.length < 30) spawnSpark();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.angle += s.speed;
        s.life++;
        const progress = s.life / s.maxLife;
        const alpha = s.alpha * Math.sin(progress * Math.PI);
        if (s.life >= s.maxLife) { sparks.splice(i, 1); continue; }
        const sx = cx + Math.cos(s.angle) * s.radius;
        const sy = cy + Math.sin(s.angle) * s.radius;
        const r = parseInt(s.color.slice(1, 3), 16);
        const g = parseInt(s.color.slice(3, 5), 16);
        const b = parseInt(s.color.slice(5, 7), 16);
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
        // Tiny cross sparkle
        if (s.size > 2.5) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.6})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx - s.size * 1.5, sy);
          ctx.lineTo(sx + s.size * 1.5, sy);
          ctx.moveTo(sx, sy - s.size * 1.5);
          ctx.lineTo(sx, sy + s.size * 1.5);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ── 6. Inner rim glow ────────────────────────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rimPulse = 0.6 + 0.4 * Math.sin(t * 2.3 + 1.0);
      const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
      rimGrad.addColorStop(0, 'rgba(255,160,0,0.0)');
      rimGrad.addColorStop(0.7, `rgba(255,120,0,${0.22 * rimPulse})`);
      rimGrad.addColorStop(1, `rgba(255,60,0,${0.35 * rimPulse})`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
      ctx.restore();

      // ── 7. Vignette circle border ────────────────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,140,0,${0.5 + 0.3 * Math.sin(t * 1.5)})`;
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
      ctx.restore();

    }

    let cleanupRaf: (() => void) | null = null;

    function startLoop() {
      cleanupRaf = registerAvatarDraw(draw);
    }

    if (img.complete) {
      startLoop();
    } else {
      img.onload = startLoop;
    }

    return () => {
      if (cleanupRaf) cleanupRaf();
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ borderRadius: '50%', display: 'block', width: size, height: size, ...style }}
    />
  );
}
