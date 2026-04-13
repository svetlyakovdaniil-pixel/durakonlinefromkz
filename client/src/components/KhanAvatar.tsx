import { useRef, useEffect } from "react";
import { scheduleAnimation, cancelAnimation } from "@/lib/animationScheduler";

interface KhanAvatarProps {
  size?: number;
  className?: string;
}

/**
 * Animated avatar: Steppe Khan warrior wielding a sword.
 * The warrior swings his sword in a looping arc animation.
 * Background: warm steppe sunset (orange/amber gradient).
 * Rendered entirely on Canvas for smooth 60fps animation.
 */
export function KhanAvatar({ size = 48, className = "" }: KhanAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scheduleIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const S = size * dpr;
    canvas.width = S;
    canvas.height = S;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const R = S / 2;
    const cx = R;
    const cy = R;

    // Sword swing particles (sparks)
    type Spark = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      life: number;
      maxLife: number;
      radius: number;
    };
    const sparks: Spark[] = [];

    let t = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / 60;

    function drawBackground() {
      if (!ctx) return;
      // Steppe sunset gradient
      const bg = ctx.createLinearGradient(0, 0, 0, S);
      bg.addColorStop(0, "#1a0a00");
      bg.addColorStop(0.35, "#5c1a00");
      bg.addColorStop(0.65, "#c45200");
      bg.addColorStop(1, "#3d1000");

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, S, S);

      // Horizon glow
      const glow = ctx.createRadialGradient(cx, S * 0.72, 0, cx, S * 0.72, R * 0.9);
      glow.addColorStop(0, "rgba(255,140,0,0.35)");
      glow.addColorStop(0.5, "rgba(255,80,0,0.12)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, S, S);

      ctx.restore();
    }

    function drawStars() {
      if (!ctx) return;
      const starPositions = [
        [0.12, 0.08], [0.8, 0.06], [0.55, 0.12], [0.35, 0.18],
        [0.9, 0.22], [0.06, 0.3], [0.7, 0.28],
      ];
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      starPositions.forEach(([sx, sy]) => {
        const alpha = 0.35 + 0.25 * Math.sin(t * 0.04 + sx * 12);
        ctx.beginPath();
        ctx.arc(sx * S, sy * S, 0.7 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,150,${alpha})`;
        ctx.fill();
      });
      ctx.restore();
    }

    function drawGround() {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Ground / steppe
      const ground = ctx.createLinearGradient(0, S * 0.75, 0, S);
      ground.addColorStop(0, "#2a1200");
      ground.addColorStop(1, "#0d0500");
      ctx.fillStyle = ground;
      ctx.fillRect(0, S * 0.75, S, S * 0.25);

      ctx.restore();
    }

    function spawnSparks(sx: number, sy: number, intensity: number) {
      if (intensity < 0.3) return;
      const count = Math.floor(intensity * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (1.5 + Math.random() * 2.5) * dpr;
        sparks.push({
          x: sx + (Math.random() - 0.5) * 4 * dpr,
          y: sy + (Math.random() - 0.5) * 4 * dpr,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5 * dpr,
          alpha: 0.9,
          life: 0,
          maxLife: 10 + Math.random() * 8,
          radius: (0.8 + Math.random() * 1.4) * dpr,
        });
      }
    }

    function updateSparks() {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15 * dpr; // gravity
        p.alpha = 0.9 * (1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) sparks.splice(i, 1);
      }
    }

    function drawSparks() {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      sparks.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,50,${p.alpha})`;
        ctx.fill();
      });
      ctx.restore();
    }

    /**
     * Draw the Khan warrior.
     * Warrior is centered at (wx, wy).
     * swordAngle: angle of the sword arm (radians from vertical).
     */
    function drawWarrior(wx: number, wy: number, sc: number, swordAngle: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.scale(sc, sc);

      const d = dpr;

      // ── Shadow ──────────────────────────────────────────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(0, 28 * d, 14 * d, 4 * d, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.restore();

      // ── Legs ────────────────────────────────────────────────────────────────
      // Left leg
      ctx.beginPath();
      ctx.moveTo(-4 * d, 8 * d);
      ctx.lineTo(-6 * d, 26 * d);
      ctx.lineTo(-2 * d, 26 * d);
      ctx.lineTo(-1 * d, 8 * d);
      ctx.closePath();
      ctx.fillStyle = "#5a3010";
      ctx.fill();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(4 * d, 8 * d);
      ctx.lineTo(6 * d, 26 * d);
      ctx.lineTo(2 * d, 26 * d);
      ctx.lineTo(1 * d, 8 * d);
      ctx.closePath();
      ctx.fillStyle = "#5a3010";
      ctx.fill();

      // Boots
      ctx.fillStyle = "#2a1500";
      ctx.beginPath();
      ctx.roundRect(-7 * d, 23 * d, 5 * d, 5 * d, 1 * d);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(2 * d, 23 * d, 5 * d, 5 * d, 1 * d);
      ctx.fill();

      // ── Robe / Armor body ────────────────────────────────────────────────────
      // Main robe
      const robeGrad = ctx.createLinearGradient(-10 * d, -8 * d, 10 * d, 10 * d);
      robeGrad.addColorStop(0, "#8b1a00");
      robeGrad.addColorStop(0.5, "#c42800");
      robeGrad.addColorStop(1, "#6b1000");
      ctx.beginPath();
      ctx.moveTo(-9 * d, -8 * d);
      ctx.lineTo(-10 * d, 10 * d);
      ctx.lineTo(10 * d, 10 * d);
      ctx.lineTo(9 * d, -8 * d);
      ctx.closePath();
      ctx.fillStyle = robeGrad;
      ctx.fill();

      // Gold trim on robe
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 0.8 * d;
      ctx.beginPath();
      ctx.moveTo(-9 * d, -8 * d);
      ctx.lineTo(-10 * d, 10 * d);
      ctx.moveTo(9 * d, -8 * d);
      ctx.lineTo(10 * d, 10 * d);
      ctx.stroke();

      // Belt
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.rect(-10 * d, 4 * d, 20 * d, 2.5 * d);
      ctx.fill();

      // ── Left arm (shield arm, static) ───────────────────────────────────────
      ctx.save();
      ctx.translate(-9 * d, -5 * d);
      // Upper arm
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-5 * d, 8 * d);
      ctx.lineTo(-3 * d, 8 * d);
      ctx.lineTo(2 * d, 0);
      ctx.closePath();
      ctx.fillStyle = "#8b1a00";
      ctx.fill();
      // Shield
      ctx.save();
      ctx.translate(-6 * d, 10 * d);
      const shieldGrad = ctx.createLinearGradient(-5 * d, -6 * d, 5 * d, 6 * d);
      shieldGrad.addColorStop(0, "#b8860b");
      shieldGrad.addColorStop(0.5, "#ffd700");
      shieldGrad.addColorStop(1, "#8b6914");
      ctx.beginPath();
      ctx.moveTo(0, -7 * d);
      ctx.lineTo(5 * d, -2 * d);
      ctx.lineTo(5 * d, 4 * d);
      ctx.lineTo(0, 7 * d);
      ctx.lineTo(-5 * d, 4 * d);
      ctx.lineTo(-5 * d, -2 * d);
      ctx.closePath();
      ctx.fillStyle = shieldGrad;
      ctx.fill();
      ctx.strokeStyle = "#8b6914";
      ctx.lineWidth = 0.7 * d;
      ctx.stroke();
      // Shield emblem (star)
      ctx.fillStyle = "#8b1a00";
      ctx.beginPath();
      ctx.arc(0, 0, 2 * d, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();

      // ── Right arm (sword arm, animated) ─────────────────────────────────────
      ctx.save();
      ctx.translate(9 * d, -6 * d);
      ctx.rotate(swordAngle);

      // Upper arm
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(4 * d, 10 * d);
      ctx.lineTo(6 * d, 10 * d);
      ctx.lineTo(2 * d, 0);
      ctx.closePath();
      ctx.fillStyle = "#8b1a00";
      ctx.fill();

      // Forearm
      ctx.beginPath();
      ctx.moveTo(4 * d, 10 * d);
      ctx.lineTo(6 * d, 20 * d);
      ctx.lineTo(8 * d, 20 * d);
      ctx.lineTo(6 * d, 10 * d);
      ctx.closePath();
      ctx.fillStyle = "#7a1500";
      ctx.fill();

      // Hand
      ctx.beginPath();
      ctx.arc(7 * d, 21 * d, 3 * d, 0, Math.PI * 2);
      ctx.fillStyle = "#c8956c";
      ctx.fill();

      // ── Sword ────────────────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(7 * d, 21 * d);

      // Sword handle
      ctx.fillStyle = "#5a3010";
      ctx.beginPath();
      ctx.rect(-1.5 * d, 0, 3 * d, 8 * d);
      ctx.fill();

      // Guard (cross-guard)
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.rect(-5 * d, 7 * d, 10 * d, 2.5 * d);
      ctx.fill();

      // Blade
      const bladeGrad = ctx.createLinearGradient(-1.5 * d, 9 * d, 1.5 * d, 38 * d);
      bladeGrad.addColorStop(0, "#ffffff");
      bladeGrad.addColorStop(0.3, "#e8e8e8");
      bladeGrad.addColorStop(0.7, "#b0b0b0");
      bladeGrad.addColorStop(1, "#888888");
      ctx.beginPath();
      ctx.moveTo(-1.5 * d, 9 * d);
      ctx.lineTo(1.5 * d, 9 * d);
      ctx.lineTo(0.5 * d, 38 * d);
      ctx.lineTo(-0.5 * d, 38 * d);
      ctx.closePath();
      ctx.fillStyle = bladeGrad;
      ctx.fill();

      // Blade shine
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 0.1);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 0.5 * d;
      ctx.beginPath();
      ctx.moveTo(-0.5 * d, 10 * d);
      ctx.lineTo(-0.3 * d, 36 * d);
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // sword
      ctx.restore(); // sword arm

      // ── Neck ────────────────────────────────────────────────────────────────
      ctx.fillStyle = "#c8956c";
      ctx.beginPath();
      ctx.rect(-3 * d, -14 * d, 6 * d, 8 * d);
      ctx.fill();

      // ── Head ────────────────────────────────────────────────────────────────
      // Face
      const faceGrad = ctx.createRadialGradient(-1 * d, -20 * d, 1 * d, 0, -20 * d, 9 * d);
      faceGrad.addColorStop(0, "#d4a574");
      faceGrad.addColorStop(0.7, "#c8956c");
      faceGrad.addColorStop(1, "#a0724a");
      ctx.beginPath();
      ctx.ellipse(0, -20 * d, 8 * d, 9 * d, 0, 0, Math.PI * 2);
      ctx.fillStyle = faceGrad;
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#1a0800";
      ctx.beginPath();
      ctx.ellipse(-3 * d, -21 * d, 1.5 * d, 1.2 * d, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(3 * d, -21 * d, 1.5 * d, 1.2 * d, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(-2.5 * d, -22 * d, 0.5 * d, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3.5 * d, -22 * d, 0.5 * d, 0, Math.PI * 2);
      ctx.fill();

      // Mustache
      ctx.strokeStyle = "#3a1a00";
      ctx.lineWidth = 0.8 * d;
      ctx.beginPath();
      ctx.moveTo(-4 * d, -17 * d);
      ctx.quadraticCurveTo(-2 * d, -15 * d, 0, -17 * d);
      ctx.moveTo(0, -17 * d);
      ctx.quadraticCurveTo(2 * d, -15 * d, 4 * d, -17 * d);
      ctx.stroke();

      // ── Helmet ───────────────────────────────────────────────────────────────
      // Helmet base
      const helmetGrad = ctx.createLinearGradient(-8 * d, -32 * d, 8 * d, -22 * d);
      helmetGrad.addColorStop(0, "#b8860b");
      helmetGrad.addColorStop(0.4, "#ffd700");
      helmetGrad.addColorStop(0.7, "#daa520");
      helmetGrad.addColorStop(1, "#8b6914");
      ctx.beginPath();
      ctx.moveTo(-8 * d, -22 * d);
      ctx.lineTo(-9 * d, -27 * d);
      ctx.quadraticCurveTo(-7 * d, -35 * d, 0, -36 * d);
      ctx.quadraticCurveTo(7 * d, -35 * d, 9 * d, -27 * d);
      ctx.lineTo(8 * d, -22 * d);
      ctx.closePath();
      ctx.fillStyle = helmetGrad;
      ctx.fill();
      ctx.strokeStyle = "#8b6914";
      ctx.lineWidth = 0.7 * d;
      ctx.stroke();

      // Helmet spike
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.moveTo(-1.5 * d, -35 * d);
      ctx.lineTo(1.5 * d, -35 * d);
      ctx.lineTo(0, -42 * d);
      ctx.closePath();
      ctx.fill();

      // Helmet cheek guards
      ctx.fillStyle = "#b8860b";
      ctx.beginPath();
      ctx.moveTo(-9 * d, -27 * d);
      ctx.lineTo(-10 * d, -22 * d);
      ctx.lineTo(-8 * d, -22 * d);
      ctx.lineTo(-8 * d, -27 * d);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9 * d, -27 * d);
      ctx.lineTo(10 * d, -22 * d);
      ctx.lineTo(8 * d, -22 * d);
      ctx.lineTo(8 * d, -27 * d);
      ctx.closePath();
      ctx.fill();

      // Helmet decoration line
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 0.6 * d;
      ctx.beginPath();
      ctx.moveTo(-8 * d, -26 * d);
      ctx.lineTo(8 * d, -26 * d);
      ctx.stroke();

      ctx.restore(); // warrior translate
    }

    function drawBorder() {
      if (!ctx) return;
      const borderAlpha = 0.7 + 0.3 * Math.sin(t * 0.05);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 1.5 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,165,0,${borderAlpha})`;
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();
      ctx.restore();
    }

    scheduleIdRef.current = scheduleAnimation(function frame(timestamp: number) {
      if (timestamp - lastFrameTime < frameInterval * 0.8) {
        return;
      }
      lastFrameTime = timestamp;
      t++;
      if (!ctx) return;

      // With alpha:false we fill background instead of clearRect
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, S, S);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      drawBackground();
      drawStars();
      drawGround();

      // Warrior position: centered, slightly below center
      const wx = cx;
      const wy = cy + R * 0.12;
      const sc = (S / 160); // scale relative to canvas size

      // Sword swing animation:
      // Phase 1 (0→π): swing down-forward (raise → strike)
      // Phase 2 (π→2π): return to raised position
      const swingCycle = (t * 0.04) % (Math.PI * 2);
      // swordAngle: arm rotation. 0 = arm pointing down.
      // Swing from -1.1 (raised back) to +0.9 (forward strike)
      let swordAngle: number;
      let swingSpeed: number;

      if (swingCycle < Math.PI) {
        // Forward swing (fast)
        const p = swingCycle / Math.PI;
        swordAngle = -1.1 + p * 2.0; // -1.1 → +0.9
        swingSpeed = Math.abs(Math.cos(swingCycle)); // speed peaks at mid-swing
      } else {
        // Return (slow)
        const p = (swingCycle - Math.PI) / Math.PI;
        swordAngle = 0.9 - p * 2.0; // +0.9 → -1.1
        swingSpeed = 0;
      }

      // Spawn sparks at sword tip when swinging forward fast
      if (swingCycle < Math.PI * 0.7 && swingSpeed > 0.5) {
        // Estimate sword tip position in world coords
        const armX = wx + (9 * dpr * sc);
        const armY = wy + (-6 * dpr * sc);
        const swordTipDist = (21 + 38) * dpr * sc; // hand + blade length
        const totalAngle = swordAngle;
        const tipX = armX + Math.sin(totalAngle) * swordTipDist;
        const tipY = armY + Math.cos(totalAngle) * swordTipDist;
        spawnSparks(tipX, tipY, swingSpeed);
      }

      updateSparks();
      drawSparks();
      drawWarrior(wx, wy, sc, swordAngle);

      ctx.restore();
      drawBorder();

    });

    return () => {
      cancelAnimation(scheduleIdRef.current);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-full ${className}`}
      style={{ borderRadius: "50%", display: "block" }}
    />
  );
}
