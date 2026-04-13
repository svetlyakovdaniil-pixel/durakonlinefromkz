import { useRef, useEffect } from "react";
import { scheduleAnimation, cancelAnimation } from "@/lib/animationScheduler";

interface NeonFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * NeonFrame — animated neon glow effect around a circular avatar.
 * Performance: uses global AnimationScheduler (single RAF loop shared across all Canvas components).
 */
export function NeonFrame({ size, children, active = true, className = "" }: NeonFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scheduleIdRef = useRef<number>(0);

  const padding = Math.round(size * 0.3);
  const canvasSize = size + padding * 2;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const radius = size / 2;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const neonColors = [
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 0, b: 255 },
      { r: 100, g: 100, b: 255 },
    ];

    interface GlowParticle {
      angle: number;
      speed: number;
      dist: number;
      size: number;
      colorIdx: number;
      phase: number;
    }

    const glowParticles: GlowParticle[] = [];
    for (let i = 0; i < 30; i++) {
      glowParticles.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.015,
        dist: radius + 2 + Math.random() * 12,
        size: 1 + Math.random() * 3,
        colorIdx: Math.floor(Math.random() * neonColors.length),
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const gradCache = new Map<string, CanvasGradient>();
    const getParticleGrad = (px: number, py: number, gradSize: number, c: { r: number; g: number; b: number }, alpha: number): CanvasGradient => {
      const qx = Math.round(px / 3) * 3;
      const qy = Math.round(py / 3) * 3;
      const qa = Math.round(alpha * 4) / 4;
      const key = `${qx},${qy},${c.r},${c.g},${c.b},${qa}`;
      let grad = gradCache.get(key);
      if (!grad) {
        grad = ctx.createRadialGradient(px, py, 0, px, py, gradSize);
        grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        gradCache.set(key, grad);
        if (gradCache.size > 150) {
          const firstKey = gradCache.keys().next().value;
          if (firstKey !== undefined) gradCache.delete(firstKey);
        }
      }
      return grad;
    };

    scheduleIdRef.current = scheduleAnimation((_timestamp: number) => {
      time += 0.03;

      ctx.clearRect(0, 0, canvasSize, canvasSize);

      const pulse = 0.5 + 0.5 * Math.sin(time * 2);
      const glowAlpha = 0.15 + pulse * 0.15;

      for (let i = 3; i >= 0; i--) {
        const ringRadius = radius + 2 + i * 4;
        const colorShift = (time + i * 0.5) % (Math.PI * 2);
        const ci = Math.floor((colorShift / (Math.PI * 2)) * neonColors.length) % neonColors.length;
        const c = neonColors[ci];

        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${glowAlpha * (1 - i * 0.2)})`;
        ctx.lineWidth = 6 - i;
        ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, 0.8)`;
        ctx.shadowBlur = 15 - i * 3;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      const mainColorPhase = time * 0.8;
      const mc1 = neonColors[Math.floor(mainColorPhase) % neonColors.length];
      const mc2 = neonColors[(Math.floor(mainColorPhase) + 1) % neonColors.length];
      const blend = mainColorPhase % 1;
      const mr = Math.floor(mc1.r + (mc2.r - mc1.r) * blend);
      const mg = Math.floor(mc1.g + (mc2.g - mc1.g) * blend);
      const mb = Math.floor(mc1.b + (mc2.b - mc1.b) * blend);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, 0.9)`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = `rgba(${mr}, ${mg}, ${mb}, 1)`;
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (const p of glowParticles) {
        p.angle += p.speed;
        const wobble = Math.sin(time * 3 + p.phase) * 3;
        const px = centerX + Math.cos(p.angle) * (p.dist + wobble);
        const py = centerY + Math.sin(p.angle) * (p.dist + wobble);
        const c = neonColors[p.colorIdx];
        const pAlpha = 0.4 + 0.4 * Math.sin(time * 4 + p.phase);

        const grad = getParticleGrad(px, py, p.size * 3, c, pAlpha);
        ctx.beginPath();
        ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    });

    return () => {
      cancelAnimation(scheduleIdRef.current);
      gradCache.clear();
    };
  }, [active, canvasSize, centerX, centerY, radius]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`} style={{ width: canvasSize, height: canvasSize }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: canvasSize, height: canvasSize,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", top: padding, left: padding, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}

export default NeonFrame;
