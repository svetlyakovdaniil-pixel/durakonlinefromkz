import React, { useEffect, useRef } from 'react';

interface NuclearMushroomAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NuclearMushroomAvatar v2 — cinematic nuclear explosion avatar.
 *
 * Technique: Canvas 2D animation loop — no CSS keyframes, fully procedural.
 *
 * Effects:
 *  - Shockwave ring: expands from ground zero, fades with motion blur
 *  - Ground dust: wide elliptical cloud that billows outward
 *  - Stem column: animated turbulent smoke rising from ground
 *  - Mushroom cap: organic pulsing fire cloud with turbulence
 *  - Inner fireball: white-hot core with rapid flicker
 *  - Ember particles: dozens of glowing embers drifting upward
 *  - Radiation halo: slow-breathing outer glow around the cap
 *  - Heat distortion: subtle shimmer on the stem
 */
export function NuclearMushroomAvatar({ size = 48, className = '' }: NuclearMushroomAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const imgUrl =
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/nuclear_mushroom_avatar-XqWr3xsdoLrkX3ZZrjUQTm.webp';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = size;
    const H = size;
    canvas.width = W;
    canvas.height = H;

    // Pre-load the base image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgUrl;
    imgRef.current = img;

    // ── Particle system ──────────────────────────────────────────────
    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      r: number;
      type: 'ember' | 'ash' | 'spark';
    }

    const particles: Particle[] = [];

    function spawnEmber() {
      // Embers spawn around the cap (top 40% of image)
      const angle = Math.random() * Math.PI * 2;
      const dist = (0.15 + Math.random() * 0.18) * W;
      const cx = W * 0.5 + Math.cos(angle) * dist * 0.6;
      const cy = H * 0.28 + Math.sin(angle) * dist * 0.35;
      particles.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.3 + Math.random() * 0.7),
        life: 1,
        maxLife: 60 + Math.random() * 80,
        r: 0.8 + Math.random() * 1.6,
        type: 'ember',
      });
    }

    function spawnAsh() {
      // Ash spawns from the base dust cloud
      const x = W * (0.2 + Math.random() * 0.6);
      const y = H * (0.75 + Math.random() * 0.1);
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(0.1 + Math.random() * 0.3),
        life: 1,
        maxLife: 80 + Math.random() * 60,
        r: 1.0 + Math.random() * 2.0,
        type: 'ash',
      });
    }

    function spawnSpark() {
      // Bright sparks shoot from the inner fireball
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 1.2 + Math.random() * 2.0;
      particles.push({
        x: W * 0.5 + (Math.random() - 0.5) * W * 0.12,
        y: H * 0.22,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 25 + Math.random() * 20,
        r: 0.6 + Math.random() * 1.0,
        type: 'spark',
      });
    }

    // ── Shockwave state ───────────────────────────────────────────────
    interface Wave { r: number; opacity: number; }
    const waves: Wave[] = [];
    let nextWave = 0;

    // ── Noise helper (simple 1D pseudo-noise) ─────────────────────────
    function noise(x: number): number {
      const i = Math.floor(x);
      const f = x - i;
      const u = f * f * (3 - 2 * f);
      const a = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const b = Math.sin((i + 1) * 127.1 + 311.7) * 43758.5453;
      return (a - Math.floor(a)) * (1 - u) + (b - Math.floor(b)) * u;
    }

    // ── Main render loop ──────────────────────────────────────────────
    function draw(ts: number) {
      if (!ctx) return;
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000; // seconds

      ctx.clearRect(0, 0, W, H);

      // Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
      ctx.clip();

      // ── Draw base image ──
      if (imgRef.current?.complete) {
        ctx.drawImage(imgRef.current, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, W, H);
      }

      // ── Ground dust billow ──
      // Two overlapping ellipses that slowly expand and fade
      const dustPhase = (t * 0.35) % 1;
      const dustScale = 0.6 + dustPhase * 0.8;
      const dustAlpha = Math.max(0, 0.55 - dustPhase * 0.55);
      ctx.save();
      ctx.globalAlpha = dustAlpha;
      ctx.globalCompositeOperation = 'screen';
      const dustGrad = ctx.createRadialGradient(
        W * 0.5, H * 0.82, 0,
        W * 0.5, H * 0.82, W * 0.52 * dustScale,
      );
      dustGrad.addColorStop(0, 'rgba(200,100,20,0.7)');
      dustGrad.addColorStop(0.4, 'rgba(140,60,10,0.4)');
      dustGrad.addColorStop(1, 'rgba(80,30,5,0)');
      ctx.fillStyle = dustGrad;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.82, W * 0.52 * dustScale, H * 0.10 * dustScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Shockwave rings ──
      if (t > nextWave) {
        waves.push({ r: W * 0.06, opacity: 0.9 });
        nextWave = t + 2.2 + Math.random() * 0.8;
      }
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        w.r += W * 0.012;
        w.opacity -= 0.018;
        if (w.opacity <= 0) { waves.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = w.opacity;
        ctx.strokeStyle = `rgba(255,180,60,${w.opacity})`;
        ctx.lineWidth = Math.max(0.5, 2.5 * (1 - w.r / (W * 0.6)));
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 0.82, w.r, w.r * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── Organic cap glow — turbulent, breathing ──
      const capBreath = 0.5 + 0.5 * Math.sin(t * 1.8);
      const capFlicker = 0.7 + 0.3 * noise(t * 7.3);
      const capAlpha = (0.35 + 0.30 * capBreath) * capFlicker;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = capAlpha;
      const capGrad = ctx.createRadialGradient(
        W * 0.5, H * 0.30, 0,
        W * 0.5, H * 0.30, W * 0.42,
      );
      capGrad.addColorStop(0, 'rgba(255,240,180,0.9)');
      capGrad.addColorStop(0.25, 'rgba(255,160,30,0.7)');
      capGrad.addColorStop(0.55, 'rgba(220,60,5,0.4)');
      capGrad.addColorStop(1, 'rgba(100,10,0,0)');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.30, W * 0.42, H * 0.30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Inner fireball — rapid organic flicker ──
      const fbFlicker = 0.6 + 0.4 * noise(t * 14.1);
      const fbPulse = 0.5 + 0.5 * Math.sin(t * 4.2 + 1.1);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = (0.55 + 0.35 * fbPulse) * fbFlicker;
      const fbGrad = ctx.createRadialGradient(
        W * 0.5, H * 0.24, 0,
        W * 0.5, H * 0.24, W * 0.20,
      );
      fbGrad.addColorStop(0, 'rgba(255,255,230,1.0)');
      fbGrad.addColorStop(0.3, 'rgba(255,220,100,0.8)');
      fbGrad.addColorStop(0.65, 'rgba(255,100,10,0.4)');
      fbGrad.addColorStop(1, 'rgba(200,30,0,0)');
      ctx.fillStyle = fbGrad;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.24, W * 0.20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Stem heat shimmer ──
      const shimmer = 0.08 + 0.10 * noise(t * 3.5);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = shimmer;
      const stemGrad = ctx.createLinearGradient(W * 0.38, H * 0.45, W * 0.62, H * 0.80);
      stemGrad.addColorStop(0, 'rgba(255,140,20,0.6)');
      stemGrad.addColorStop(0.5, 'rgba(200,80,10,0.3)');
      stemGrad.addColorStop(1, 'rgba(100,30,0,0)');
      ctx.fillStyle = stemGrad;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.625, W * 0.12, H * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Spawn particles ──
      if (Math.random() < 0.35) spawnEmber();
      if (Math.random() < 0.25) spawnAsh();
      if (Math.random() < 0.12) spawnSpark();

      // ── Draw & update particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / p.maxLife;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        const alpha = p.life * (p.life < 0.3 ? p.life / 0.3 : 1);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        if (p.type === 'ember') {
          // Glowing ember — orange-red with soft halo
          ctx.globalAlpha = alpha * 0.9;
          const eg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
          eg.addColorStop(0, 'rgba(255,220,80,1)');
          eg.addColorStop(0.4, 'rgba(255,100,10,0.6)');
          eg.addColorStop(1, 'rgba(200,30,0,0)');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'ash') {
          // Ash — dark brownish, larger, slow
          ctx.globalAlpha = alpha * 0.4;
          ctx.fillStyle = `rgba(120,60,20,0.6)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Spark — tiny bright white-yellow streak
          ctx.globalAlpha = alpha * 0.95;
          ctx.strokeStyle = 'rgba(255,255,180,0.9)';
          ctx.lineWidth = p.r * 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── Outer radiation halo ──
      const haloBreath = 0.5 + 0.5 * Math.sin(t * 0.9 + 0.5);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.12 + 0.10 * haloBreath;
      const haloGrad = ctx.createRadialGradient(W * 0.5, H * 0.38, W * 0.28, W * 0.5, H * 0.38, W * 0.52);
      haloGrad.addColorStop(0, 'rgba(255,120,20,0)');
      haloGrad.addColorStop(0.6, 'rgba(255,80,10,0.35)');
      haloGrad.addColorStop(1, 'rgba(180,30,0,0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.38, W * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Vignette ──
      ctx.save();
      const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.3, W * 0.5, H * 0.5, W * 0.52);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.restore(); // end clip

      rafRef.current = requestAnimationFrame(draw);
    }

    // Start loop once image is ready (or immediately if cached)
    if (img.complete) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      img.onload = () => { rafRef.current = requestAnimationFrame(draw); };
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}
