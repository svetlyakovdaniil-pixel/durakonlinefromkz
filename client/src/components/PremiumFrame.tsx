import { useRef, useEffect, useCallback } from 'react';

interface PremiumFrameProps {
  size: number;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface Coin {
  x: number;
  y: number;
  vy: number;
  vx: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  /** 0-1 squish for tumbling effect */
  squish: number;
  squishDir: number;
  /** spawn angle on the top arc */
  spawnAngle: number;
  shimmer: number;
}

/**
 * PremiumFrame — animated gold coins falling from the top of the avatar circle,
 * piling up as a glittering heap at the bottom.
 * Uses Canvas 2D for smooth 60fps animation.
 */
export function PremiumFrame({ size, children, active = true, className = '' }: PremiumFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coinsRef = useRef<Coin[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Extra padding around avatar for coins
  const padding = Math.round(size * 0.38);
  const canvasSize = size + padding * 2;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const avatarRadius = size / 2;

  const createCoin = useCallback((): Coin => {
    // Spawn from a random angle in the top half arc (from -160° to -20°, i.e. mostly top)
    const spawnAngle = (-Math.PI * 0.9) + Math.random() * Math.PI * 0.8;
    const spawnRadius = avatarRadius + 4 + Math.random() * 8;
    const x = cx + Math.cos(spawnAngle) * spawnRadius;
    const y = cy + Math.sin(spawnAngle) * spawnRadius;

    const coinRadius = 2.5 + Math.random() * 2.5;
    const maxLife = 60 + Math.random() * 60;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.4 + Math.random() * 1.2,
      radius: coinRadius,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.18,
      life: maxLife,
      maxLife,
      squish: 1.0,
      squishDir: 1,
      spawnAngle,
      shimmer: Math.random(),
    };
  }, [cx, cy, avatarRadius]);

  useEffect(() => {
    if (!active) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const coins = coinsRef.current;

    // Pre-populate with staggered coins
    for (let i = 0; i < 18; i++) {
      const c = createCoin();
      c.life = Math.random() * c.maxLife;
      coins.push(c);
    }

    let lastTime = 0;
    const frameInterval = 1000 / 60;

    const drawCoin = (ctx: CanvasRenderingContext2D, c: Coin, alpha: number) => {
      const lifeRatio = c.life / c.maxLife;
      // Squish oscillation for tumbling look
      const squishFactor = 0.55 + 0.45 * Math.abs(Math.sin(c.rotation * 2));

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.scale(squishFactor, 1);

      // Coin body gradient
      const grad = ctx.createRadialGradient(-c.radius * 0.3, -c.radius * 0.3, 0, 0, 0, c.radius);
      const shimmerVal = 0.5 + 0.5 * Math.sin(timeRef.current * 0.05 + c.shimmer * 10);
      const bright = Math.floor(220 + shimmerVal * 35);
      grad.addColorStop(0, `rgba(${bright}, ${Math.floor(bright * 0.88)}, 80, ${alpha})`);
      grad.addColorStop(0.5, `rgba(200, 160, 40, ${alpha})`);
      grad.addColorStop(1, `rgba(140, 100, 10, ${alpha * 0.8})`);

      ctx.beginPath();
      ctx.ellipse(0, 0, c.radius, c.radius, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Coin edge highlight
      ctx.beginPath();
      ctx.ellipse(0, 0, c.radius, c.radius, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 220, 100, ${alpha * 0.7})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Inner shine spot
      ctx.beginPath();
      ctx.ellipse(-c.radius * 0.25, -c.radius * 0.25, c.radius * 0.35, c.radius * 0.25, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 180, ${alpha * shimmerVal * 0.6})`;
      ctx.fill();

      ctx.restore();
    };

    const drawHeap = (ctx: CanvasRenderingContext2D, t: number) => {
      // Pile of coins at the bottom of the avatar circle
      const heapCy = cy + avatarRadius + padding * 0.35;
      const heapW = avatarRadius * 0.85;
      const heapH = padding * 0.28;

      // Outer glow
      const glowGrad = ctx.createRadialGradient(cx, heapCy, 0, cx, heapCy, heapW * 1.1);
      const glowPulse = 0.25 + 0.15 * Math.sin(t * 0.04);
      glowGrad.addColorStop(0, `rgba(255, 200, 50, ${glowPulse})`);
      glowGrad.addColorStop(0.6, `rgba(200, 150, 20, ${glowPulse * 0.5})`);
      glowGrad.addColorStop(1, 'rgba(200, 150, 20, 0)');
      ctx.beginPath();
      ctx.ellipse(cx, heapCy, heapW * 1.1, heapH * 1.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Heap base
      const heapGrad = ctx.createLinearGradient(cx - heapW, heapCy - heapH, cx + heapW, heapCy + heapH);
      heapGrad.addColorStop(0, 'rgba(180, 130, 20, 0.9)');
      heapGrad.addColorStop(0.4, 'rgba(230, 185, 50, 0.95)');
      heapGrad.addColorStop(0.7, 'rgba(200, 155, 30, 0.9)');
      heapGrad.addColorStop(1, 'rgba(140, 100, 10, 0.85)');
      ctx.beginPath();
      ctx.ellipse(cx, heapCy, heapW, heapH, 0, 0, Math.PI * 2);
      ctx.fillStyle = heapGrad;
      ctx.fill();

      // Shimmer coins on heap surface
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI + Math.PI * 0.05;
        const hx = cx + Math.cos(angle) * heapW * 0.75;
        const hy = heapCy + Math.sin(angle) * heapH * 0.55 - heapH * 0.15;
        const shimmer = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.06 + i * 1.3));
        const r = 2.2 + Math.random() * 0.5;

        const cg = ctx.createRadialGradient(hx - r * 0.3, hy - r * 0.3, 0, hx, hy, r);
        const bright = Math.floor(200 + shimmer * 55);
        cg.addColorStop(0, `rgba(${bright}, ${Math.floor(bright * 0.9)}, 100, 0.95)`);
        cg.addColorStop(1, `rgba(160, 120, 20, 0.7)`);

        ctx.beginPath();
        ctx.ellipse(hx, hy, r, r * 0.65, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = cg;
        ctx.fill();

        // Highlight
        if (shimmer > 0.7) {
          ctx.beginPath();
          ctx.ellipse(hx - r * 0.2, hy - r * 0.2, r * 0.4, r * 0.3, -0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 245, 180, ${(shimmer - 0.7) * 1.5})`;
          ctx.fill();
        }
      }

      // Top highlight on heap
      const topGrad = ctx.createLinearGradient(cx - heapW * 0.5, heapCy - heapH, cx + heapW * 0.5, heapCy);
      topGrad.addColorStop(0, `rgba(255, 240, 140, ${0.3 + 0.2 * Math.sin(t * 0.05)})`);
      topGrad.addColorStop(1, 'rgba(255, 240, 140, 0)');
      ctx.beginPath();
      ctx.ellipse(cx, heapCy - heapH * 0.1, heapW * 0.7, heapH * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = topGrad;
      ctx.fill();
    };

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      if (delta >= frameInterval * 0.8) {
        lastTime = timestamp;
        timeRef.current += 1;
        const t = timeRef.current;

        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Spawn new falling coins
        if (Math.random() < 0.35) {
          coins.push(createCoin());
        }

        // Update & draw falling coins
        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i];
          c.life -= 1;

          if (c.life <= 0) {
            coins.splice(i, 1);
            continue;
          }

          // Physics
          c.x += c.vx;
          c.y += c.vy;
          c.vy += 0.035; // gravity
          c.vx *= 0.99;
          c.rotation += c.rotSpeed;
          c.shimmer += 0.02;

          const lifeRatio = c.life / c.maxLife;
          // Fade in at start, fade out at end
          let alpha = 1;
          if (lifeRatio > 0.85) alpha = (1 - lifeRatio) / 0.15;
          else if (lifeRatio < 0.2) alpha = lifeRatio / 0.2;

          drawCoin(ctx, c, alpha);
        }

        // Draw coin heap at bottom
        drawHeap(ctx, t);

        // Draw golden ring border around avatar
        ctx.beginPath();
        ctx.arc(cx, cy, avatarRadius + 1.5, 0, Math.PI * 2);
        const ringPulse = 0.6 + 0.3 * Math.sin(t * 0.06);
        ctx.strokeStyle = `rgba(218, 165, 32, ${ringPulse})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner ring glow
        ctx.beginPath();
        ctx.arc(cx, cy, avatarRadius + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 215, 80, ${ringPulse * 0.4})`;
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      coinsRef.current = [];
    };
  }, [active, canvasSize, cx, cy, avatarRadius, padding, createCoin]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: canvasSize, height: canvasSize }}
    >
      {/* Canvas behind avatar */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: canvasSize,
          height: canvasSize,
          pointerEvents: 'none',
        }}
      />
      {/* Avatar centered */}
      <div
        style={{
          position: 'absolute',
          top: padding,
          left: padding,
          width: size,
          height: size,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PremiumFrame;
