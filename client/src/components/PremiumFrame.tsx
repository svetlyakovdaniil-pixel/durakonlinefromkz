/**
 * PremiumFrame — animated gold frame with falling coins for premium users.
 * Uses the generated PREMIUM frame image as an overlay.
 */
const PREMIUM_FRAME_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/premium-frame-v2_3b824022.png';

interface PremiumFrameProps {
  size: number;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PremiumFrame({ size, active, children, className = '' }: PremiumFrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Avatar content */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          // Inset slightly so the frame overlaps the edges
          margin: Math.round(size * 0.08),
        }}
      >
        {children}
      </div>

      {/* PREMIUM frame overlay */}
      <img
        src={PREMIUM_FRAME_URL}
        alt="PREMIUM"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.7))',
          animation: 'premiumFrameGlow 2s ease-in-out infinite',
          zIndex: 10,
        }}
        draggable={false}
      />

      <style>{`
        @keyframes premiumFrameGlow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(250,204,21,0.7)); }
          50% { filter: drop-shadow(0 0 14px rgba(250,204,21,1)) drop-shadow(0 0 20px rgba(250,180,0,0.5)); }
        }
      `}</style>
    </div>
  );
}
