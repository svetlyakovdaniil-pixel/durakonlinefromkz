import { useRef, useEffect } from "react";

interface NeonFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * NeonFrame — renders an animated neon glow effect around a circular avatar.
 * Uses Canvas 2D with pulsing neon rings and electric particles.
 */
export function NeonFrame({ size, children, active = true, className = "" }: NeonFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const padding = Math.round(size * 0.3);
  const canvasSize = size + padding * 2;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const radius = size / 2;

  useEffect(() => {
    if (!active) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    // Neon color palette: cyan, magenta, blue
    const neonColors = [
      { r: 0, g: 255, b: 255 },   // cyan
      { r: 255, g: 0, b: 255 },   // magenta
      { r: 100, g: 100, b: 255 }, // blue
    ];

    // Floating glow particles
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
    let lastTime = 0;
    const frameInterval = 1000 / 60;

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      if (delta >= frameInterval * 0.8) {
        lastTime = timestamp;
        time += 0.03;

        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Outer glow ring — pulsing
        const pulse = 0.5 + 0.5 * Math.sin(time * 2);
        const glowAlpha = 0.15 + pulse * 0.15;

        // Draw multiple glow rings
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

        // Main neon ring — color cycling
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

        // Floating glow particles orbiting
        for (const p of glowParticles) {
          p.angle += p.speed;
          const wobble = Math.sin(time * 3 + p.phase) * 3;
          const px = centerX + Math.cos(p.angle) * (p.dist + wobble);
          const py = centerY + Math.sin(p.angle) * (p.dist + wobble);
          const c = neonColors[p.colorIdx];
          const pAlpha = 0.4 + 0.4 * Math.sin(time * 4 + p.phase);

          const grad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
          grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${pAlpha})`);
          grad.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, ${pAlpha * 0.4})`);
          grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

          ctx.beginPath();
          ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
