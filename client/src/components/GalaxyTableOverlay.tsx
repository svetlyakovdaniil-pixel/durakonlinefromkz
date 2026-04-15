import React, { useMemo } from 'react';

/**
 * GalaxyTableOverlay — animated star layer for the Galaxy table style.
 * Renders a set of twinkling/fading stars as absolutely-positioned dots
 * using CSS keyframe animations injected via a <style> tag.
 * Each star has a randomised position, size, colour, and animation timing.
 */

interface Star {
  id: number;
  x: number;   // % from left
  y: number;   // % from top
  r: number;   // radius in px
  color: string;
  dur: number; // animation duration in seconds
  delay: number; // animation delay in seconds
  type: 'twinkle' | 'fade' | 'pulse';
}

const STAR_COLORS = [
  '#ffffff',
  '#e8f0ff',
  '#c8d8ff',
  '#a0c4ff',
  '#b8aaff',
  '#ffd6ff',
  '#ffe0a0',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateStars(count: number): Star[] {
  const rng = seededRandom(42);
  const types: Star['type'][] = ['twinkle', 'fade', 'pulse'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rng() * 100,
    y: rng() * 100,
    r: rng() * 2.2 + 0.6,
    color: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
    dur: rng() * 3 + 1.5,
    delay: rng() * 5,
    type: types[Math.floor(rng() * types.length)],
  }));
}

// 60 animated stars + 80 static background stars
const ANIMATED_STARS = generateStars(60);
const STATIC_STARS = generateStars(80).map((s, i) => ({
  ...s,
  id: i + 1000,
  x: seededRandom(i * 7 + 99)() * 100,
  y: seededRandom(i * 13 + 77)() * 100,
  r: seededRandom(i * 3 + 55)() * 1.2 + 0.3,
}));

const CSS = `
@keyframes galaxy-twinkle {
  0%   { opacity: 0.15; transform: scale(0.8); }
  25%  { opacity: 1;    transform: scale(1.3); }
  50%  { opacity: 0.3;  transform: scale(0.9); }
  75%  { opacity: 0.9;  transform: scale(1.1); }
  100% { opacity: 0.15; transform: scale(0.8); }
}
@keyframes galaxy-fade {
  0%   { opacity: 0.05; }
  40%  { opacity: 0.85; }
  60%  { opacity: 0.85; }
  100% { opacity: 0.05; }
}
@keyframes galaxy-pulse {
  0%   { opacity: 0.2;  box-shadow: 0 0 0px currentColor; }
  50%  { opacity: 1;    box-shadow: 0 0 6px 2px currentColor; }
  100% { opacity: 0.2;  box-shadow: 0 0 0px currentColor; }
}
`;

const ANIM_MAP: Record<Star['type'], string> = {
  twinkle: 'galaxy-twinkle',
  fade: 'galaxy-fade',
  pulse: 'galaxy-pulse',
};

interface Props {
  enabled?: boolean; // controlled by animationsEnabled setting
}

const GalaxyTableOverlay: React.FC<Props> = ({ enabled = true }) => {
  const animatedStars = useMemo(() => ANIMATED_STARS, []);
  const staticStars = useMemo(() => STATIC_STARS, []);

  return (
    <>
      <style>{CSS}</style>
      {/* Static background stars — always visible, no animation */}
      {staticStars.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.r * 2}px`,
            height: `${star.r * 2}px`,
            borderRadius: '50%',
            backgroundColor: star.color,
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Animated twinkling stars */}
      {animatedStars.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.r * 2}px`,
            height: `${star.r * 2}px`,
            borderRadius: '50%',
            backgroundColor: star.color,
            color: star.color,
            opacity: 0.2,
            pointerEvents: 'none',
            animation: enabled
              ? `${ANIM_MAP[star.type]} ${star.dur}s ease-in-out ${star.delay}s infinite`
              : 'none',
          }}
        />
      ))}
    </>
  );
};

export default GalaxyTableOverlay;
