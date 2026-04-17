import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianApocalypseAvatar — Nuclear void obsidian with purple apocalypse.
 * Season: Апокалипсис (Season 8) | Rank: Обсидиан
 * Animation:
 *   - SVG lightning bolts flickering around the avatar border
 *   - Rotating obsidian lava ring with purple cracks
 *   - Pulsing radioactive glow (purple/violet)
 *   - Floating ember sparks rising upward
 *   - All animation is OUTSIDE the avatar — avatar is fully visible
 */
export function ObsidianApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const r = size / 2;

  // Outer ring dimensions — 32% larger on each side
  const ringSize = size * 1.36;
  const ringOffset = -(ringSize - size) / 2;
  const ringR = ringSize / 2;

  // Lightning bolt paths — 6 bolts evenly spaced around the ring
  const lightnings = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60) * Math.PI / 180;
    const innerR = ringR * 0.68;
    const outerR = ringR * 0.97;
    const spread = ringR * 0.11;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perpCos = Math.cos(angle + Math.PI / 2);
    const perpSin = Math.sin(angle + Math.PI / 2);
    const cx = ringR;
    const cy = ringR;
    // Main zigzag bolt
    const sx = cx + cos * innerR;
    const sy = cy + sin * innerR;
    const m1x = cx + cos * (innerR + (outerR - innerR) * 0.33) + perpCos * spread;
    const m1y = cy + sin * (innerR + (outerR - innerR) * 0.33) + perpSin * spread;
    const m2x = cx + cos * (innerR + (outerR - innerR) * 0.66) - perpCos * spread * 0.7;
    const m2y = cy + sin * (innerR + (outerR - innerR) * 0.66) - perpSin * spread * 0.7;
    const ex = cx + cos * outerR;
    const ey = cy + sin * outerR;
    // Branch from midpoint
    const midR = (innerR + outerR) * 0.5;
    const bx = cx + cos * midR + perpCos * spread * 1.6;
    const by = cy + sin * midR + perpSin * spread * 1.6;
    const b2x = cx + cos * (midR + spread * 0.5) + perpCos * spread * 2.2;
    const b2y = cy + sin * (midR + spread * 0.5) + perpSin * spread * 2.2;
    return {
      main: `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${m1x.toFixed(1)} ${m1y.toFixed(1)} L ${m2x.toFixed(1)} ${m2y.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      branch: `M ${m1x.toFixed(1)} ${m1y.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)} L ${b2x.toFixed(1)} ${b2y.toFixed(1)}`,
    };
  });

  // Lava crack angles on the obsidian ring
  const cracks = [30, 95, 155, 215, 275, 335];

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oap-glow-${uid} {
          0%,100% {
            box-shadow:
              0 0 0 1.5px rgba(192,132,252,0.85),
              0 0 8px 3px rgba(168,85,247,0.95),
              0 0 18px 7px rgba(139,92,246,0.55),
              0 0 36px 14px rgba(109,40,217,0.28);
          }
          40% {
            box-shadow:
              0 0 0 2px rgba(233,213,255,1),
              0 0 16px 7px rgba(192,132,252,1),
              0 0 34px 14px rgba(168,85,247,0.75),
              0 0 64px 24px rgba(139,92,246,0.38);
          }
          70% {
            box-shadow:
              0 0 0 1.5px rgba(168,85,247,0.9),
              0 0 10px 4px rgba(147,51,234,0.85),
              0 0 24px 9px rgba(126,34,206,0.5),
              0 0 44px 16px rgba(109,40,217,0.22);
          }
        }
        @keyframes oap-ring-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes oap-lava-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes oap-crack-${uid} {
          0%,100% { opacity: 0.5; }
          50%     { opacity: 1; }
        }
        /* Lightning bolt animations — each fires at a different time */
        @keyframes oap-b0-${uid} {
          0%,2%   { opacity: 1; }
          3%,100% { opacity: 0; }
        }
        @keyframes oap-b1-${uid} {
          0%,17%  { opacity: 0; }
          18%,20% { opacity: 1; }
          21%,100%{ opacity: 0; }
        }
        @keyframes oap-b2-${uid} {
          0%,34%  { opacity: 0; }
          35%,38% { opacity: 1; }
          39%,100%{ opacity: 0; }
        }
        @keyframes oap-b3-${uid} {
          0%,51%  { opacity: 0; }
          52%,55% { opacity: 1; }
          56%,100%{ opacity: 0; }
        }
        @keyframes oap-b4-${uid} {
          0%,66%  { opacity: 0; }
          67%,70% { opacity: 1; }
          71%,100%{ opacity: 0; }
        }
        @keyframes oap-b5-${uid} {
          0%,81%  { opacity: 0; }
          82%,85% { opacity: 1; }
          86%,100%{ opacity: 0; }
        }
        /* Ember sparks */
        @keyframes oap-e0-${uid} {
          0%   { transform: translate(0,0) scale(1); opacity: 0.95; }
          100% { transform: translate(-${(size*0.14).toFixed(1)}px,-${(size*1.0).toFixed(1)}px) scale(0.1); opacity: 0; }
        }
        @keyframes oap-e1-${uid} {
          0%   { transform: translate(0,0) scale(1); opacity: 0.9; }
          100% { transform: translate(${(size*0.1).toFixed(1)}px,-${(size*0.9).toFixed(1)}px) scale(0.12); opacity: 0; }
        }
        @keyframes oap-e2-${uid} {
          0%   { transform: translate(0,0) scale(1); opacity: 0.85; }
          100% { transform: translate(${(size*0.18).toFixed(1)}px,-${(size*1.05).toFixed(1)}px) scale(0.08); opacity: 0; }
        }
        @keyframes oap-e3-${uid} {
          0%   { transform: translate(0,0) scale(1); opacity: 0.9; }
          100% { transform: translate(-${(size*0.07).toFixed(1)}px,-${(size*0.85).toFixed(1)}px) scale(0.15); opacity: 0; }
        }
        @keyframes oap-e4-${uid} {
          0%   { transform: translate(0,0) scale(1); opacity: 0.95; }
          100% { transform: translate(${(size*0.22).toFixed(1)}px,-${(size*0.95).toFixed(1)}px) scale(0.1); opacity: 0; }
        }
        /* Radiation symbol pulse */
        @keyframes oap-rad-${uid} {
          0%,100% { opacity: 0.22; transform: scale(1); }
          50%     { opacity: 0.42; transform: scale(1.1); }
        }
      `}</style>

      {/* ── OUTER OBSIDIAN RING (rotating slowly) ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: ringOffset, left: ringOffset,
        width: ringSize, height: ringSize,
        borderRadius: '50%',
        animation: `oap-ring-${uid} 9s linear infinite`,
        pointerEvents: 'none',
      }}>
        <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}
          style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <mask id={`rm-${uid}`}>
              <circle cx={ringR} cy={ringR} r={ringR - 0.5} fill="white" />
              <circle cx={ringR} cy={ringR} r={ringR * 0.72} fill="black" />
            </mask>
            <filter id={`rf-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Dark obsidian base ring */}
          <circle cx={ringR} cy={ringR} r={ringR - 1}
            fill="none" stroke="rgba(12,8,20,0.9)" strokeWidth={ringR * 0.28}
            mask={`url(#rm-${uid})`} />
          {/* Outer glow border */}
          <circle cx={ringR} cy={ringR} r={ringR * 0.87}
            fill="none" stroke="rgba(168,85,247,0.35)" strokeWidth="1.5" />
          <circle cx={ringR} cy={ringR} r={ringR * 0.73}
            fill="none" stroke="rgba(192,132,252,0.28)" strokeWidth="1" />
          {/* Lava cracks */}
          {cracks.map((deg, i) => {
            const a = deg * Math.PI / 180;
            const ir = ringR * 0.74;
            const or2 = ringR * 0.96;
            const x1 = ringR + Math.cos(a) * ir;
            const y1 = ringR + Math.sin(a) * ir;
            const x2 = ringR + Math.cos(a) * or2;
            const y2 = ringR + Math.sin(a) * or2;
            const pa = a + Math.PI / 2;
            const mr = (ir + or2) * 0.5;
            const bx = ringR + Math.cos(a) * mr + Math.cos(pa) * ringR * 0.06;
            const by = ringR + Math.sin(a) * mr + Math.sin(pa) * ringR * 0.06;
            const bright = i % 2 === 0;
            return (
              <g key={i} filter={`url(#rf-${uid})`}
                style={{ animation: `oap-crack-${uid} ${1.8 + i * 0.35}s ease-in-out ${i * 0.28}s infinite` }}>
                <polyline points={`${x1.toFixed(1)},${y1.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`}
                  stroke={bright ? 'rgba(233,213,255,0.95)' : 'rgba(192,132,252,0.8)'}
                  strokeWidth={bright ? '1.4' : '0.9'} fill="none"
                  mask={`url(#rm-${uid})`} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── INNER LAVA RING (counter-rotating, faster) ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: ringOffset * 0.52, left: ringOffset * 0.52,
        width: size * 1.18, height: size * 1.18,
        borderRadius: '50%',
        animation: `oap-lava-${uid} 4.5s linear infinite`,
        pointerEvents: 'none',
      }}>
        {(() => {
          const s2 = size * 1.18;
          const r2 = s2 / 2;
          const ir2 = r2 * 0.84;
          const or3 = r2 * 0.98;
          return (
            <svg width={s2} height={s2} viewBox={`0 0 ${s2} ${s2}`} style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <mask id={`lm-${uid}`}>
                  <circle cx={r2} cy={r2} r={r2} fill="white" />
                  <circle cx={r2} cy={r2} r={ir2} fill="black" />
                </mask>
                <filter id={`lf-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b" />
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {Array.from({ length: 14 }, (_, i) => {
                const a1 = (i / 14) * Math.PI * 2;
                const a2 = ((i + 0.55) / 14) * Math.PI * 2;
                const bright = i % 3 === 0;
                const x1 = r2 + Math.cos(a1) * ir2;
                const y1 = r2 + Math.sin(a1) * ir2;
                const x2 = r2 + Math.cos(a2) * or3;
                const y2 = r2 + Math.sin(a2) * or3;
                return (
                  <line key={i} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)}
                    stroke={bright ? 'rgba(233,213,255,0.85)' : 'rgba(168,85,247,0.55)'}
                    strokeWidth={bright ? '1.6' : '0.9'}
                    mask={`url(#lm-${uid})`}
                    filter={bright ? `url(#lf-${uid})` : undefined}
                  />
                );
              })}
            </svg>
          );
        })()}
      </div>

      {/* ── SVG LIGHTNING BOLTS ── */}
      <svg aria-hidden="true" style={{
        position: 'absolute',
        top: ringOffset, left: ringOffset,
        width: ringSize, height: ringSize,
        pointerEvents: 'none',
        overflow: 'visible',
      }} viewBox={`0 0 ${ringSize} ${ringSize}`}>
        <defs>
          <filter id={`bf-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="1.2 0 0 0 0.7  0 0 1.5 0 0.4  0 0 2.5 0 1  0 0 0 3.5 0" result="glow" />
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {lightnings.map((bolt, i) => (
          <g key={i} filter={`url(#bf-${uid})`}
            style={{ animation: `oap-b${i}-${uid} ${1.1 + i * 0.13}s ease-in-out ${i * 0.05}s infinite`, opacity: 0 }}>
            {/* Glow layer */}
            <path d={bolt.main} stroke="rgba(192,132,252,0.7)" strokeWidth="3.5" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Core white bolt */}
            <path d={bolt.main} stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Branch */}
            <path d={bolt.branch} stroke="rgba(233,213,255,0.65)" strokeWidth="0.9" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </svg>

      {/* ── EMBER SPARKS (rise upward from bottom) ── */}
      {[
        { x: '18%', c: 'rgba(192,132,252,0.95)', dur: 1.8, delay: 0 },
        { x: '38%', c: 'rgba(168,85,247,0.9)',   dur: 2.1, delay: 0.45 },
        { x: '52%', c: 'rgba(233,213,255,0.85)', dur: 1.65, delay: 0.85 },
        { x: '68%', c: 'rgba(147,51,234,0.9)',   dur: 2.25, delay: 0.2 },
        { x: '83%', c: 'rgba(192,132,252,0.8)',  dur: 1.95, delay: 1.1 },
      ].map((e, i) => {
        const es = Math.max(2.5, size * 0.065);
        return (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            bottom: `-${es * 0.4}px`,
            left: e.x,
            width: es, height: es,
            borderRadius: '50%',
            background: e.c,
            boxShadow: `0 0 5px 2px ${e.c}`,
            animation: `oap-e${i}-${uid} ${e.dur}s ease-out ${e.delay}s infinite`,
            pointerEvents: 'none',
          }} />
        );
      })}

      {/* ── RADIATION SYMBOL HINT (barely visible, outside avatar) ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: ringOffset * 1.4, left: ringOffset * 1.4,
        width: size * 1.1, height: size * 1.1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        animation: `oap-rad-${uid} 3.2s ease-in-out infinite`,
      }}>
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.8" fill="rgba(192,132,252,0.8)" />
          {[0, 120, 240].map((deg, i) => {
            const a1 = ((deg - 30) * Math.PI) / 180;
            const a2 = ((deg + 30) * Math.PI) / 180;
            const R = 9;
            return (
              <path key={i}
                d={`M 12 12 L ${(12 + R * Math.cos(a1)).toFixed(2)} ${(12 + R * Math.sin(a1)).toFixed(2)} A ${R} ${R} 0 0 1 ${(12 + R * Math.cos(a2)).toFixed(2)} ${(12 + R * Math.sin(a2)).toFixed(2)} Z`}
                fill="rgba(168,85,247,0.65)"
              />
            );
          })}
        </svg>
      </div>

      {/* ── AVATAR (clean, fully visible) ── */}
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'absolute', top: 0, left: 0,
        animation: `oap-glow-${uid} 2.5s ease-in-out infinite`,
        border: '2px solid rgba(192,132,252,0.8)',
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_apocalypse_v2_464c2e3e.png"
          alt="Обсидиан Апокалипсис"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      </div>
    </div>
  );
}
