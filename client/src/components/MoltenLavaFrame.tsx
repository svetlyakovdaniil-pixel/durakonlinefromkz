import React, { useEffect, useRef } from 'react';

interface MoltenLavaFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * MoltenLavaFrame — Canvas 2D animated frame.
 * Season: Апокалипсис (Season 8) | Rank: Обсидиан
 *
 * Completely different from all other neon/orbit frames.
 * Technique: Canvas 2D drawn as an annular ring around the avatar.
 *
 * Effects:
 *  - Cracked obsidian base ring: dark, jagged, stone-like
 *  - Lava veins: glowing orange-red cracks that pulse and breathe
 *  - Molten drips: lava drops that form at crack intersections and fall
 *  - Heat shimmer: radial glow that pulses from deep red to bright orange
 *  - Ember sparks: tiny particles ejected from cracks, drift outward
 *  - Outer corona: slow dark-red atmospheric glow
 */
export function MoltenLavaFrame({
  size,
  children,
  active = true,
  className = '',
}: MoltenLavaFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = outerSize;
    const H = outerSize;
    canvas.width = W;
    canvas.height = H;

    const cx = W / 2;
    const cy = H / 2;
    const innerR = size / 2 + 2;          // inner edge of ring (just outside avatar)
    const outerR = size / 2 + padding;    // outer edge of ring

    // ── Noise helper ──────────────────────────────────────────────────
    function noise(x: number): number {
      const i = Math.floor(x);
      const f = x - i;
      const u = f * f * (3 - 2 * f);
      const a = (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;
      const b = (Math.sin((i + 1) * 127.1 + 311.7) * 43758.5453) % 1;
      return Math.abs(a) * (1 - u) + Math.abs(b) * u;
    }

    // ── Crack definition ─────────────────────────────────────────────
    // Each crack is a path along the ring at a given angle, with some
    // radial variation to look organic.
    interface Crack {
      startAngle: number;
      endAngle: number;
      points: { angle: number; r: number }[];
      phase: number;        // time offset for pulsing
      brightness: number;   // base brightness 0-1
    }

    const NUM_CRACKS = 9;
    const cracks: Crack[] = [];
    for (let i = 0; i < NUM_CRACKS; i++) {
      const startAngle = (i / NUM_CRACKS) * Math.PI * 2 + Math.random() * 0.3;
      const span = 0.35 + Math.random() * 0.55; // radians
      const endAngle = startAngle + span;
      const steps = 8 + Math.floor(Math.random() * 6);
      const points: { angle: number; r: number }[] = [];
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const angle = startAngle + t * (endAngle - startAngle);
        // Radial position oscillates between inner and outer edge
        const rNorm = 0.2 + 0.6 * noise(i * 3.7 + s * 1.3);
        const r = innerR + rNorm * (outerR - innerR);
        points.push({ angle, r });
      }
      cracks.push({
        startAngle,
        endAngle,
        points,
        phase: Math.random() * Math.PI * 2,
        brightness: 0.5 + Math.random() * 0.5,
      });
    }

    // ── Drip particle system ──────────────────────────────────────────
    interface Drip {
      angle: number;
      r: number;
      vr: number;        // radial velocity (outward)
      va: number;        // angular drift
      life: number;
      maxLife: number;
      radius: number;
    }
    const drips: Drip[] = [];

    function spawnDrip() {
      // Spawn from a random crack point
      const crack = cracks[Math.floor(Math.random() * cracks.length)];
      const pt = crack.points[Math.floor(Math.random() * crack.points.length)];
      drips.push({
        angle: pt.angle + (Math.random() - 0.5) * 0.15,
        r: pt.r,
        vr: 0.3 + Math.random() * 0.5,
        va: (Math.random() - 0.5) * 0.008,
        life: 1,
        maxLife: 40 + Math.random() * 50,
        radius: 1.5 + Math.random() * 2.5,
      });
    }

    // ── Ember particle system ─────────────────────────────────────────
    interface Ember {
      angle: number;
      r: number;
      vr: number;
      va: number;
      life: number;
      maxLife: number;
    }
    const embers: Ember[] = [];

    function spawnEmber() {
      const angle = Math.random() * Math.PI * 2;
      const r = innerR + Math.random() * (outerR - innerR);
      embers.push({
        angle,
        r,
        vr: 0.6 + Math.random() * 1.2,
        va: (Math.random() - 0.5) * 0.025,
        life: 1,
        maxLife: 20 + Math.random() * 30,
      });
    }

    // ── Draw ring background (dark obsidian stone) ────────────────────
    function drawObsidianRing(t: number) {
      // Base dark ring
      ctxRef.save();
      ctxRef.beginPath();
      ctxRef.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctxRef.arc(cx, cy, innerR, 0, Math.PI * 2, true);
      ctxRef.fillStyle = '#0a0505';
      ctxRef.fill();
      ctxRef.restore();

      // Stone texture: subtle angular facets via radial gradient segments
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * Math.PI * 2;
        const a1 = ((i + 1) / 16) * Math.PI * 2;
        const facetBright = 0.03 + 0.04 * noise(i * 2.1 + t * 0.05);
        ctxRef.save();
        ctxRef.beginPath();
        ctxRef.moveTo(cx + Math.cos(a0) * innerR, cy + Math.sin(a0) * innerR);
        ctxRef.arc(cx, cy, outerR, a0, a1);
        ctxRef.arc(cx, cy, innerR, a1, a0, true);
        ctxRef.closePath();
        ctxRef.fillStyle = `rgba(30,10,5,${facetBright})`;
        ctxRef.fill();
        ctxRef.restore();
      }
    }

    // ── Draw glowing lava cracks ──────────────────────────────────────
    function drawCracks(t: number) {
      for (const crack of cracks) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + crack.phase);
        const flicker = 0.7 + 0.3 * noise(t * 8.2 + crack.phase);
        const intensity = crack.brightness * pulse * flicker;

        if (crack.points.length < 2) continue;

        // Outer glow pass (wide, soft)
        ctxRef.save();
        ctxRef.beginPath();
        ctxRef.moveTo(
          cx + Math.cos(crack.points[0].angle) * crack.points[0].r,
          cy + Math.sin(crack.points[0].angle) * crack.points[0].r,
        );
        for (let i = 1; i < crack.points.length; i++) {
          ctxRef.lineTo(
            cx + Math.cos(crack.points[i].angle) * crack.points[i].r,
            cy + Math.sin(crack.points[i].angle) * crack.points[i].r,
          );
        }
        ctxRef.strokeStyle = `rgba(255,80,0,${0.25 * intensity})`;
        ctxRef.lineWidth = 5 + 3 * pulse;
        ctxRef.lineCap = 'round';
        ctxRef.lineJoin = 'round';
        ctxRef.shadowColor = `rgba(255,60,0,${0.6 * intensity})`;
        ctxRef.shadowBlur = 8;
        ctxRef.stroke();
        ctxRef.restore();

        // Inner bright core pass
        ctxRef.save();
        ctxRef.beginPath();
        ctxRef.moveTo(
          cx + Math.cos(crack.points[0].angle) * crack.points[0].r,
          cy + Math.sin(crack.points[0].angle) * crack.points[0].r,
        );
        for (let i = 1; i < crack.points.length; i++) {
          ctxRef.lineTo(
            cx + Math.cos(crack.points[i].angle) * crack.points[i].r,
            cy + Math.sin(crack.points[i].angle) * crack.points[i].r,
          );
        }
        // Color shifts from orange to white-hot at peak
        const r = Math.round(255);
        const g = Math.round(80 + 160 * intensity);
        const b = Math.round(10 + 60 * intensity);
        ctxRef.strokeStyle = `rgba(${r},${g},${b},${0.85 * intensity})`;
        ctxRef.lineWidth = 1.5;
        ctxRef.lineCap = 'round';
        ctxRef.lineJoin = 'round';
        ctxRef.stroke();
        ctxRef.restore();
      }
    }

    // ── Draw drip particles ───────────────────────────────────────────
    function drawDrips() {
      for (const d of drips) {
        const alpha = d.life * (d.life < 0.3 ? d.life / 0.3 : 1);
        const x = cx + Math.cos(d.angle) * d.r;
        const y = cy + Math.sin(d.angle) * d.r;

        ctxRef.save();
        ctxRef.globalCompositeOperation = 'screen';
        const g = ctxRef.createRadialGradient(x, y, 0, x, y, d.radius * 2.5);
        g.addColorStop(0, `rgba(255,200,50,${alpha})`);
        g.addColorStop(0.4, `rgba(255,80,0,${alpha * 0.7})`);
        g.addColorStop(1, 'rgba(200,20,0,0)');
        ctxRef.fillStyle = g;
        ctxRef.beginPath();
        ctxRef.arc(x, y, d.radius * 2.5, 0, Math.PI * 2);
        ctxRef.fill();
        ctxRef.restore();
      }
    }

    // ── Draw ember particles ──────────────────────────────────────────
    function drawEmbers() {
      for (const e of embers) {
        const alpha = e.life * (e.life < 0.4 ? e.life / 0.4 : 1);
        const x = cx + Math.cos(e.angle) * e.r;
        const y = cy + Math.sin(e.angle) * e.r;

        ctxRef.save();
        ctxRef.globalCompositeOperation = 'screen';
        ctxRef.globalAlpha = alpha * 0.8;
        ctxRef.fillStyle = 'rgba(255,160,20,0.9)';
        ctxRef.beginPath();
        ctxRef.arc(x, y, 1.2, 0, Math.PI * 2);
        ctxRef.fill();
        ctxRef.restore();
      }
    }

    // ── Draw outer corona glow ────────────────────────────────────────
    function drawCorona(t: number) {
      const breath = 0.5 + 0.5 * Math.sin(t * 0.7);
      ctxRef.save();
      ctxRef.globalCompositeOperation = 'screen';
      const g = ctxRef.createRadialGradient(cx, cy, outerR * 0.9, cx, cy, outerR * 1.25);
      g.addColorStop(0, `rgba(200,40,0,${0.18 + 0.12 * breath})`);
      g.addColorStop(0.5, `rgba(150,20,0,${0.08 + 0.06 * breath})`);
      g.addColorStop(1, 'rgba(100,10,0,0)');
      ctxRef.fillStyle = g;
      ctxRef.beginPath();
      ctxRef.arc(cx, cy, outerR * 1.25, 0, Math.PI * 2);
      ctxRef.fill();
      ctxRef.restore();
    }

    // ── Draw inner edge glow (border between ring and avatar) ─────────
    function drawInnerEdge(t: number) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.1);
      ctxRef.save();
      ctxRef.globalCompositeOperation = 'screen';
      const g = ctxRef.createRadialGradient(cx, cy, innerR * 0.85, cx, cy, innerR * 1.1);
      g.addColorStop(0, 'rgba(255,100,10,0)');
      g.addColorStop(0.6, `rgba(255,80,0,${0.25 + 0.20 * pulse})`);
      g.addColorStop(1, 'rgba(255,120,20,0)');
      ctxRef.fillStyle = g;
      ctxRef.beginPath();
      ctxRef.arc(cx, cy, innerR * 1.1, 0, Math.PI * 2);
      ctxRef.fill();
      ctxRef.restore();
    }

    // ── Main render loop ──────────────────────────────────────────────
    const ctxRef = ctx;
    function draw(ts: number) {
      if (!ctxRef) return;
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;

      ctxRef.clearRect(0, 0, W, H);

      // Clip to outer circle
      ctxRef.save();
      ctxRef.beginPath();
      ctxRef.arc(cx, cy, outerR + 2, 0, Math.PI * 2);
      ctxRef.clip();

      drawObsidianRing(t);
      drawCorona(t);
      drawCracks(t);
      drawInnerEdge(t);

      // Spawn & update drips
      if (Math.random() < 0.08) spawnDrip();
      for (let i = drips.length - 1; i >= 0; i--) {
        drips[i].r += drips[i].vr;
        drips[i].angle += drips[i].va;
        drips[i].life -= 1 / drips[i].maxLife;
        if (drips[i].life <= 0 || drips[i].r > outerR + 4) drips.splice(i, 1);
      }
      drawDrips();

      // Spawn & update embers
      if (Math.random() < 0.18) spawnEmber();
      for (let i = embers.length - 1; i >= 0; i--) {
        embers[i].r += embers[i].vr;
        embers[i].angle += embers[i].va;
        embers[i].life -= 1 / embers[i].maxLife;
        if (embers[i].life <= 0 || embers[i].r > outerR + 6) embers.splice(i, 1);
      }
      drawEmbers();

      ctxRef.restore();

      // Punch out avatar hole (clear inner circle so avatar shows through)
      ctxRef.save();
      ctxRef.globalCompositeOperation = 'destination-out';
      ctxRef.beginPath();
      ctxRef.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctxRef.fillStyle = 'rgba(0,0,0,1)';
      ctxRef.fill();
      ctxRef.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, active, outerSize]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: outerSize, height: outerSize }}
    >
      {/* Canvas ring layer */}
      <canvas
        ref={canvasRef}
        width={outerSize}
        height={outerSize}
        style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Avatar content — sits inside the ring */}
      <div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default MoltenLavaFrame;
