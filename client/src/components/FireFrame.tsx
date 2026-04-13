import { useRef, useEffect, useCallback } from "react";

interface FireFrameProps {
  /** Size of the avatar area in pixels */
  size: number;
  /** Children (avatar image) rendered inside the frame */
  children: React.ReactNode;
  /** Whether the fire animation is active */
  active?: boolean;
  /** Optional className for the wrapper */
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  /** Angle on the circle where this particle spawns */
  angle: number;
}

/**
 * FireFrame — renders a realistic animated fire effect around a circular avatar.
 * Uses Canvas 2D with a particle system for smooth 60fps animation.
 * The fire burns outward from a golden ring border around the avatar.
 */
export function FireFrame({ size, children, active = true, className = "" }: FireFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  // The canvas needs extra space around the avatar for the fire effect
  const padding = Math.round(size * 0.35);
  const canvasSize = size + padding * 2;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const radius = size / 2;

  const createParticle = useCallback((): Particle => {
    const angle = Math.random() * Math.PI * 2;
    // Spawn on the circle edge with slight randomness
    const spawnRadius = radius + (Math.random() - 0.5) * 4;
    const x = centerX + Math.cos(angle) * spawnRadius;
    const y = centerY + Math.sin(angle) * spawnRadius;

    // Velocity: outward from center + upward bias for fire look
    const outwardSpeed = 0.3 + Math.random() * 0.8;
    const upwardBias = -0.5 - Math.random() * 1.2; // fire goes up
    const vx = Math.cos(angle) * outwardSpeed + (Math.random() - 0.5) * 0.3;
    const vy = Math.sin(angle) * outwardSpeed + upwardBias;

    const maxLife = 20 + Math.random() * 35;

    return {
      x,
      y,
      vx,
      vy,
      life: maxLife,
      maxLife,
      size: 2 + Math.random() * 4,
      angle,
    };
  }, [centerX, centerY, radius]);

  const createEmber = useCallback((): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const spawnRadius = radius + Math.random() * 8;
    const x = centerX + Math.cos(angle) * spawnRadius;
    const y = centerY + Math.sin(angle) * spawnRadius;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1.5 - Math.random() * 2.5,
      life: 30 + Math.random() * 40,
      maxLife: 30 + Math.random() * 40,
      size: 0.5 + Math.random() * 1.5,
      angle,
    };
  }, [centerX, centerY, radius]);

  useEffect(() => {
    if (!active) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const particles = particlesRef.current;

    // Initialize with some particles (reduced for mobile performance)
    for (let i = 0; i < 40; i++) {
      const p = createParticle();
      p.life = Math.random() * p.maxLife; // stagger initial lifetimes
      particles.push(p);
    }

    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      if (delta >= frameInterval * 0.8) {
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Spawn new particles (reduced count for mobile performance)
        const spawnCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < spawnCount; i++) {
          particles.push(createParticle());
        }
        // Spawn embers (sparks flying up)
        if (Math.random() < 0.25) {
          particles.push(createEmber());
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 1;

          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }

          // Apply physics
          p.x += p.vx;
          p.y += p.vy;
          // Slight upward acceleration (hot air rises)
          p.vy -= 0.02;
          // Slight random turbulence
          p.vx += (Math.random() - 0.5) * 0.1;

          const lifeRatio = p.life / p.maxLife;

          // Color transitions: white-yellow core → orange → red → dark red/transparent
          let r: number, g: number, b: number, a: number;
          if (lifeRatio > 0.7) {
            // Core: bright yellow-white
            const t = (lifeRatio - 0.7) / 0.3;
            r = 255;
            g = Math.floor(200 + t * 55);
            b = Math.floor(50 + t * 150);
            a = 0.8 + t * 0.2;
          } else if (lifeRatio > 0.4) {
            // Mid: orange
            const t = (lifeRatio - 0.4) / 0.3;
            r = 255;
            g = Math.floor(80 + t * 120);
            b = Math.floor(10 + t * 40);
            a = 0.6 + t * 0.2;
          } else if (lifeRatio > 0.15) {
            // Outer: red
            const t = (lifeRatio - 0.15) / 0.25;
            r = Math.floor(180 + t * 75);
            g = Math.floor(20 + t * 60);
            b = 5;
            a = 0.3 + t * 0.3;
          } else {
            // Dying: dark red, fading out
            const t = lifeRatio / 0.15;
            r = Math.floor(80 + t * 100);
            g = Math.floor(t * 20);
            b = 0;
            a = t * 0.3;
          }

          // Draw particle — simplified (no radial gradient per particle for mobile perf)
          const currentSize = p.size * (0.3 + lifeRatio * 0.7);

          // Single filled circle (fast)
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.7})`;
          ctx.fill();

          // Core bright spot
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fill();
        }

        // Draw golden ring border
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(218, 165, 32, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner glow on the ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 200, 50, 0.3)";
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      particlesRef.current = [];
    };
  }, [active, canvasSize, centerX, centerY, radius, createParticle, createEmber]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: canvasSize, height: canvasSize }}
    >
      {/* Fire canvas behind the avatar */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: canvasSize,
          height: canvasSize,
          pointerEvents: "none",
        }}
      />
      {/* Avatar centered within the canvas area */}
      <div
        style={{
          position: "absolute",
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

export default FireFrame;
