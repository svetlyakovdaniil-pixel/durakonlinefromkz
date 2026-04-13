import { useRef, useEffect } from "react";

interface IceFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

interface IceShard {
  angle: number;
  length: number;
  width: number;
  offset: number;
  rotSpeed: number;
  phase: number;
}

interface Snowflake {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  phase: number;
  drift: number;
}

/**
 * IceFrame — renders an animated ice/frost effect around a circular avatar.
 * Uses Canvas 2D with ice crystals, frost particles, and cold mist.
 */
export function IceFrame({ size, children, active = true, className = "" }: IceFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const padding = Math.round(size * 0.35);
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
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    // Generate ice shards around the ring
    const shards: IceShard[] = [];
    for (let i = 0; i < 16; i++) {
      shards.push({
        angle: (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
        length: 8 + Math.random() * 16,
        width: 1.5 + Math.random() * 3,
        offset: radius + 1 + Math.random() * 3,
        rotSpeed: (Math.random() - 0.5) * 0.002,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Snowflake particles
    const snowflakes: Snowflake[] = [];
    for (let i = 0; i < 25; i++) {
      snowflakes.push({
        angle: Math.random() * Math.PI * 2,
        dist: radius + 5 + Math.random() * 20,
        speed: 0.003 + Math.random() * 0.008,
        size: 1 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.3,
      });
    }

    let time = 0;
    let lastTime = 0;
    const frameInterval = 1000 / 60;

    const drawSnowflakeShape = (x: number, y: number, sz: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.lineWidth = 0.5;
      // Simple 6-pointed star
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * sz, Math.sin(a) * sz);
        ctx.stroke();
        // Small branches
        const bx = Math.cos(a) * sz * 0.6;
        const by = Math.sin(a) * sz * 0.6;
        const ba1 = a + 0.5;
        const ba2 = a - 0.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(ba1) * sz * 0.3, by + Math.sin(ba1) * sz * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(ba2) * sz * 0.3, by + Math.sin(ba2) * sz * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    };

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      if (delta >= frameInterval * 0.8) {
        lastTime = timestamp;
        time += 0.02;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Frost mist glow
        const mistPulse = 0.15 + 0.1 * Math.sin(time * 1.5);
        const mistGrad = ctx.createRadialGradient(centerX, centerY, radius - 5, centerX, centerY, radius + 25);
        mistGrad.addColorStop(0, `rgba(150, 200, 255, 0)`);
        mistGrad.addColorStop(0.5, `rgba(150, 200, 255, ${mistPulse})`);
        mistGrad.addColorStop(1, `rgba(100, 160, 255, 0)`);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 25, 0, Math.PI * 2);
        ctx.fillStyle = mistGrad;
        ctx.fill();

        // Ice ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150, 210, 255, 0.7)`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(100, 180, 255, 0.6)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner frost ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 230, 255, 0.3)`;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Draw ice shards
        for (const shard of shards) {
          shard.angle += shard.rotSpeed;
          const shimmer = 0.4 + 0.4 * Math.sin(time * 3 + shard.phase);
          const sx = centerX + Math.cos(shard.angle) * shard.offset;
          const sy = centerY + Math.sin(shard.angle) * shard.offset;
          const ex = centerX + Math.cos(shard.angle) * (shard.offset + shard.length);
          const ey = centerY + Math.sin(shard.angle) * (shard.offset + shard.length);

          // Shard body
          const perpAngle = shard.angle + Math.PI / 2;
          const hw = shard.width / 2;

          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(perpAngle) * hw, sy + Math.sin(perpAngle) * hw);
          ctx.lineTo(ex, ey);
          ctx.lineTo(sx - Math.cos(perpAngle) * hw, sy - Math.sin(perpAngle) * hw);
          ctx.closePath();

          const shardGrad = ctx.createLinearGradient(sx, sy, ex, ey);
          shardGrad.addColorStop(0, `rgba(180, 220, 255, ${shimmer * 0.6})`);
          shardGrad.addColorStop(0.5, `rgba(200, 240, 255, ${shimmer * 0.8})`);
          shardGrad.addColorStop(1, `rgba(150, 200, 255, ${shimmer * 0.2})`);
          ctx.fillStyle = shardGrad;
          ctx.fill();

          // Shard edge glow
          ctx.strokeStyle = `rgba(200, 230, 255, ${shimmer * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Draw snowflakes
        for (const sf of snowflakes) {
          sf.angle += sf.speed;
          const wobble = Math.sin(time * 2 + sf.phase) * 3;
          const px = centerX + Math.cos(sf.angle) * (sf.dist + wobble);
          const py = centerY + Math.sin(sf.angle) * (sf.dist + wobble + sf.drift * time * 10);
          const alpha = 0.3 + 0.4 * Math.sin(time * 2.5 + sf.phase);

          drawSnowflakeShape(px, py, sf.size, alpha);

          // Glow around snowflake
          const sfGrad = ctx.createRadialGradient(px, py, 0, px, py, sf.size * 2);
          sfGrad.addColorStop(0, `rgba(180, 220, 255, ${alpha * 0.3})`);
          sfGrad.addColorStop(1, `rgba(150, 200, 255, 0)`);
          ctx.beginPath();
          ctx.arc(px, py, sf.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = sfGrad;
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

export default IceFrame;
