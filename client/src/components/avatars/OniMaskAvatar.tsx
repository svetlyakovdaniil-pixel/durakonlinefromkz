import { useEffect, useRef } from 'react';
import { registerAvatarDraw } from '@/lib/avatarRafManager';
import { getAssetUrl } from '@/lib/assetUrl';

interface OniMaskAvatarProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// v3: transparent background, red-gold mask
const BASE_IMAGE_URL = getAssetUrl('/assets/static/oni_mask_obsidian_v3-hJ3tDNhcH7vPq6s95Cuzo4.webp');

export function OniMaskAvatar({ size = 64, className = '', style }: OniMaskAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2;

    // Preload image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = BASE_IMAGE_URL;
    imgRef.current = img;

    // ── Smoke particles ─────────────────────────────────────────────────────
    interface Smoke {
      x: number; y: number; r: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      alpha: number;
    }
    const smokes: Smoke[] = [];
    const MAX_SMOKES = 12;

    function spawnSmoke() {
      const angle = Math.random() * Math.PI * 2;
      const dist = R * (0.3 + Math.random() * 0.5);
      smokes.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        r: size * (0.04 + Math.random() * 0.06),
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.4 + Math.random() * 0.5),
        life: 0,
        maxLife: 80 + Math.floor(Math.random() * 60),
        alpha: 0,
      });
    }

    // Seed initial smokes
    for (let i = 0; i < MAX_SMOKES; i++) {
      spawnSmoke();
      smokes[smokes.length - 1].life = Math.floor(Math.random() * 80);
    }

    // ── Crack lightning segments ─────────────────────────────────────────────
    interface CrackSeg { x1: number; y1: number; x2: number; y2: number; }
    interface Crack {
      segs: CrackSeg[];
      life: number; maxLife: number; alpha: number;
    }
    const cracks: Crack[] = [];

    function buildCrack(startX: number, startY: number): CrackSeg[] {
      const segs: CrackSeg[] = [];
      let x = startX, y = startY;
      const steps = 4 + Math.floor(Math.random() * 4);
      const baseAngle = Math.atan2(cy - startY, cx - startX) + (Math.random() - 0.5) * 1.2;
      for (let i = 0; i < steps; i++) {
        const a = baseAngle + (Math.random() - 0.5) * 0.8;
        const len = size * (0.04 + Math.random() * 0.06);
        const nx = x + Math.cos(a) * len;
        const ny = y + Math.sin(a) * len;
        segs.push({ x1: x, y1: y, x2: nx, y2: ny });
        x = nx; y = ny;
      }
      return segs;
    }

    function spawnCrack() {
      const angle = Math.random() * Math.PI * 2;
      const startX = cx + Math.cos(angle) * R * 0.85;
      const startY = cy + Math.sin(angle) * R * 0.85;
      cracks.push({
        segs: buildCrack(startX, startY),
        life: 0,
        maxLife: 30 + Math.floor(Math.random() * 20),
        alpha: 1,
      });
    }

    let crackTimer = 0;

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const t = timestamp * 0.001;

      ctx.clearRect(0, 0, size, size);

      // ── 1. Black circular background ──────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.restore();

      // ── 2. Deep red radial glow (hell ambience) ───────────────────────────
      const hellPulse = 0.5 + 0.5 * Math.sin(t * 0.8);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      const hellGrad = ctx.createRadialGradient(cx, cy * 1.1, 0, cx, cy, R);
      hellGrad.addColorStop(0, `rgba(120,0,0,${0.0})`);
      hellGrad.addColorStop(0.5, `rgba(100,0,0,${0.15 + 0.1 * hellPulse})`);
      hellGrad.addColorStop(1, `rgba(60,0,0,${0.5 + 0.2 * hellPulse})`);
      ctx.fillStyle = hellGrad;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // ── 3. Smoke wisps ────────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      for (let i = smokes.length - 1; i >= 0; i--) {
        const s = smokes[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        s.r += 0.15;
        const progress = s.life / s.maxLife;
        s.alpha = progress < 0.3
          ? progress / 0.3 * 0.18
          : (1 - progress) * 0.18;

        if (s.life >= s.maxLife) {
          smokes.splice(i, 1);
          continue;
        }

        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        sg.addColorStop(0, `rgba(180,20,0,${s.alpha})`);
        sg.addColorStop(1, `rgba(80,0,0,0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();
      }

      // Spawn new smokes
      if (smokes.length < MAX_SMOKES && Math.random() < 0.15) {
        spawnSmoke();
      }
      ctx.restore();

      // ── 4. Mask image ─────────────────────────────────────────────────────
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        // Slight breathing scale
        const breathe = 1 + 0.012 * Math.sin(t * 1.2);
        const drawSize = size * breathe;
        const offset = (size - drawSize) / 2;
        ctx.drawImage(img, offset, offset, drawSize, drawSize);
        ctx.restore();
      }

      // ── 5. Glowing eyes overlay ───────────────────────────────────────────
      // Eye positions relative to mask (approximate for this art)
      const eyePulse = 0.6 + 0.4 * Math.sin(t * 3.5);
      const eyeY = cy - size * 0.06;
      const eyeLX = cx - size * 0.14;
      const eyeRX = cx + size * 0.14;
      const eyeR = size * 0.055;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      for (const ex of [eyeLX, eyeRX]) {
        // Outer glow
        const eg = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, eyeR * 2.5);
        eg.addColorStop(0, `rgba(255,80,0,${0.7 * eyePulse})`);
        eg.addColorStop(0.4, `rgba(220,30,0,${0.4 * eyePulse})`);
        eg.addColorStop(1, `rgba(150,0,0,0)`);
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = eg;
        ctx.fill();
      }
      ctx.restore();

      // ── 6. Crack lightning ────────────────────────────────────────────────
      crackTimer++;
      if (crackTimer > 90 + Math.random() * 60) {
        spawnCrack();
        if (Math.random() < 0.4) spawnCrack();
        crackTimer = 0;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      for (let i = cracks.length - 1; i >= 0; i--) {
        const c = cracks[i];
        c.life++;
        const progress = c.life / c.maxLife;
        c.alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        if (c.life >= c.maxLife) { cracks.splice(i, 1); continue; }

        ctx.globalAlpha = c.alpha * 0.85;
        ctx.strokeStyle = `rgba(255,120,0,1)`;
        ctx.lineWidth = size * 0.008;
        ctx.shadowColor = 'rgba(255,80,0,0.9)';
        ctx.shadowBlur = size * 0.04;
        ctx.beginPath();
        for (const seg of c.segs) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // ── 7. Glowing border ring ────────────────────────────────────────────
      ctx.save();
      const borderPulse = 0.5 + 0.5 * Math.sin(t * 1.8);
      ctx.beginPath();
      ctx.arc(cx, cy, R - size * 0.015, 0, Math.PI * 2);
      const strokeGrad = ctx.createLinearGradient(0, 0, size, size);
      strokeGrad.addColorStop(0, `rgba(212,175,55,${0.6 + 0.3 * borderPulse})`);
      strokeGrad.addColorStop(0.5, `rgba(200,0,0,${0.7 + 0.3 * borderPulse})`);
      strokeGrad.addColorStop(1, `rgba(212,175,55,${0.6 + 0.3 * borderPulse})`);
      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = size * 0.028;
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

    return () => { if (cleanupRaf) cleanupRaf(); };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ borderRadius: '50%', display: 'block', width: size, height: size, ...style }}
    />
  );
}
