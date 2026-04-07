import { useRef, useEffect, useCallback } from "react";

interface LightningFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

interface LightningBolt {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  alpha: number;
  width: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

/**
 * LightningFrame — renders animated lightning bolts around a circular avatar.
 * Uses Canvas 2D with procedural lightning generation and electric sparks.
 */
export function LightningFrame({ size, children, active = true, className = "" }: LightningFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const boltsRef = useRef<LightningBolt[]>([]);
  const sparksRef = useRef<Spark[]>([]);

  const padding = Math.round(size * 0.35);
  const canvasSize = size + padding * 2;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const radius = size / 2;

  const generateBolt = useCallback((): LightningBolt => {
    const startAngle = Math.random() * Math.PI * 2;
    const arcLength = 0.3 + Math.random() * 1.2;
    const endAngle = startAngle + (Math.random() > 0.5 ? arcLength : -arcLength);

    const points: { x: number; y: number }[] = [];
    const segments = 8 + Math.floor(Math.random() * 8);
    const boltRadius = radius + 3 + Math.random() * 10;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + (endAngle - startAngle) * t;
      const jitter = i === 0 || i === segments ? 0 : (Math.random() - 0.5) * 12;
      const r = boltRadius + jitter;
      points.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
      });
    }

    return {
      points,
      life: 8 + Math.floor(Math.random() * 12),
      maxLife: 8 + Math.floor(Math.random() * 12),
      alpha: 0.7 + Math.random() * 0.3,
      width: 1 + Math.random() * 2,
    };
  }, [centerX, centerY, radius]);

  const generateSpark = useCallback((x: number, y: number): Spark => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 10 + Math.random() * 15,
      maxLife: 10 + Math.random() * 15,
      size: 0.5 + Math.random() * 1.5,
    };
  }, []);

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

    const bolts = boltsRef.current;
    const sparks = sparksRef.current;
    let time = 0;
    let lastTime = 0;
    const frameInterval = 1000 / 60;

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      if (delta >= frameInterval * 0.8) {
        lastTime = timestamp;
        time += 1;

        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Electric glow ring
        const pulse = 0.3 + 0.3 * Math.sin(time * 0.1);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 180, 255, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(100, 180, 255, 0.8)";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Spawn new bolts
        if (Math.random() < 0.15) {
          bolts.push(generateBolt());
          // Spawn sparks at bolt start
          const bolt = bolts[bolts.length - 1];
          const startPt = bolt.points[0];
          for (let s = 0; s < 3; s++) {
            sparks.push(generateSpark(startPt.x, startPt.y));
          }
        }

        // Draw and update bolts
        for (let i = bolts.length - 1; i >= 0; i--) {
          const bolt = bolts[i];
          bolt.life -= 1;
          if (bolt.life <= 0) {
            bolts.splice(i, 1);
            continue;
          }

          const lifeRatio = bolt.life / bolt.maxLife;
          const alpha = bolt.alpha * lifeRatio;

          // Main bolt
          ctx.beginPath();
          ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
          for (let j = 1; j < bolt.points.length; j++) {
            ctx.lineTo(bolt.points[j].x, bolt.points[j].y);
          }
          ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`;
          ctx.lineWidth = bolt.width;
          ctx.shadowColor = `rgba(100, 180, 255, ${alpha})`;
          ctx.shadowBlur = 10;
          ctx.stroke();

          // Bright core
          ctx.beginPath();
          ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
          for (let j = 1; j < bolt.points.length; j++) {
            ctx.lineTo(bolt.points[j].x, bolt.points[j].y);
          }
          ctx.strokeStyle = `rgba(220, 240, 255, ${alpha * 0.8})`;
          ctx.lineWidth = bolt.width * 0.4;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Jitter existing points for flicker effect
          if (bolt.life > 2) {
            for (let j = 1; j < bolt.points.length - 1; j++) {
              bolt.points[j].x += (Math.random() - 0.5) * 2;
              bolt.points[j].y += (Math.random() - 0.5) * 2;
            }
          }
        }

        // Draw and update sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life -= 1;
          if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.95;
          s.vy *= 0.95;

          const lifeRatio = s.life / s.maxLife;
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
          grad.addColorStop(0, `rgba(200, 230, 255, ${lifeRatio * 0.8})`);
          grad.addColorStop(0.5, `rgba(100, 180, 255, ${lifeRatio * 0.4})`);
          grad.addColorStop(1, `rgba(50, 100, 255, 0)`);

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Static electricity ambient particles
        if (Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const dist = radius + 2 + Math.random() * 15;
          const px = centerX + Math.cos(angle) * dist;
          const py = centerY + Math.sin(angle) * dist;
          sparks.push(generateSpark(px, py));
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      boltsRef.current = [];
      sparksRef.current = [];
    };
  }, [active, canvasSize, centerX, centerY, radius, generateBolt, generateSpark]);

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

export default LightningFrame;
