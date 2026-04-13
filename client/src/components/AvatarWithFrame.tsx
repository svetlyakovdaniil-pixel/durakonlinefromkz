import { Flame, Zap, Snowflake, Crown } from 'lucide-react';
import { FireFrame } from './FireFrame';
import { NeonFrame } from './NeonFrame';
import { LightningFrame } from './LightningFrame';
import { IceFrame } from './IceFrame';
import { PremiumFrame } from './PremiumFrame';
import { GreatKhanFrame } from './GreatKhanFrame';

/**
 * Renders the correct animated frame component around children based on frameId.
 * If frameId is null/undefined, renders children without a frame.
 */
export function FrameWrapper({
  frameId,
  size,
  children,
  className = '',
}: {
  frameId: string | null | undefined;
  size: number;
  children: React.ReactNode;
  className?: string;
}) {
  if (!frameId) {
    return <div className={className}>{children}</div>;
  }

  switch (frameId) {
    case 'fire':
      return <FireFrame size={size} active={true} className={className}>{children}</FireFrame>;
    case 'neon':
      return <NeonFrame size={size} active={true} className={className}>{children}</NeonFrame>;
    case 'lightning':
      return <LightningFrame size={size} active={true} className={className}>{children}</LightningFrame>;
    case 'ice':
      return <IceFrame size={size} active={true} className={className}>{children}</IceFrame>;
    case 'premium':
      return <PremiumFrame size={size} active={true} className={className}>{children}</PremiumFrame>;
    case 'great_khan':
      return <GreatKhanFrame size={size} active={true} className={className}>{children}</GreatKhanFrame>;
    default:
      return <div className={className}>{children}</div>;
  }
}

/**
 * Renders the appropriate icon for a given frame type.
 */
export function FrameIcon({ frameId, className = 'w-5 h-5' }: { frameId: string; className?: string }) {
  switch (frameId) {
    case 'fire':
      return <Flame className={`${className} text-orange-400`} />;
    case 'neon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${className} text-cyan-400`}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case 'lightning':
      return <Zap className={`${className} text-blue-300`} />;
    case 'ice':
      return <Snowflake className={`${className} text-sky-300`} />;
    case 'premium':
      return <Crown className={`${className} text-yellow-400`} />;
    case 'great_khan':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${className} text-yellow-400`}>
          <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="rgba(218,165,32,0.3)" stroke="rgba(218,165,32,0.9)" />
          <circle cx="12" cy="12" r="2" fill="rgba(255,215,0,0.8)" />
        </svg>
      );
    default:
      return null;
  }
}

export default FrameWrapper;
