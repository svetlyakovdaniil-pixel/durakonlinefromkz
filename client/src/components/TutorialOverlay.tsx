import { useEffect, useRef, useState } from 'react';

interface TutorialOverlayProps {
  targetElement: HTMLElement | null;
  isActive: boolean;
  padding?: number;
}

export function TutorialOverlay({ targetElement, isActive, padding = 8 }: TutorialOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isActive || !targetElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Draw semi-transparent dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get target element position
      const rect = targetElement.getBoundingClientRect();
      const x = rect.left - padding;
      const y = rect.top - padding;
      const width = rect.width + padding * 2;
      const height = rect.height + padding * 2;

      // Clear spotlight area with rounded corners
      ctx.clearRect(x, y, width, height);

      // Draw border around spotlight
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      setDimensions({ width: canvas.width, height: canvas.height });
    };

    updateCanvas();
    window.addEventListener('resize', updateCanvas);
    return () => window.removeEventListener('resize', updateCanvas);
  }, [isActive, targetElement, padding]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[90] pointer-events-none"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  );
}
