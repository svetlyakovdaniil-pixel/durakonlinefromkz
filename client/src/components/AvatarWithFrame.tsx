import { Flame, Zap, Snowflake, Crown } from 'lucide-react';
import { FireFrame } from './FireFrame';
import { NeonFrame } from './NeonFrame';
import { LightningFrame } from './LightningFrame';
import { IceFrame } from './IceFrame';
import { PremiumFrame } from './PremiumFrame';
import { GreatKhanFrame } from './GreatKhanFrame';
import { ObsidianNeonFrame } from './ObsidianNeonFrame';
import { RubyNeonFrame } from './RubyNeonFrame';
import { AmberNeonFrame } from './AmberNeonFrame';
import { ZirconNeonFrame } from './ZirconNeonFrame';
import { MoltenLavaFrame } from './MoltenLavaFrame';
import { OniJapaneseFrame } from './OniJapaneseFrame';

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

  // Strip season suffix (e.g. 'obsidian_neon_2026Q3' → 'obsidian_neon')
  const baseFrameId = frameId.replace(/_\d{4}Q[1-4]$/, '');

  switch (baseFrameId) {
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
    case 'obsidian_neon':
      return <ObsidianNeonFrame size={size} active={true} className={className}>{children}</ObsidianNeonFrame>;
    case 'ruby_neon':
      return <RubyNeonFrame size={size} active={true} className={className}>{children}</RubyNeonFrame>;
    case 'amber_neon':
      return <AmberNeonFrame size={size} active={true} className={className}>{children}</AmberNeonFrame>;
    case 'zircon_neon':
      return <ZirconNeonFrame size={size} active={true} className={className}>{children}</ZirconNeonFrame>;
    case 'molten_lava':
      return <MoltenLavaFrame size={size} active={true} className={className}>{children}</MoltenLavaFrame>;
    case 'oni_japanese':
      return <OniJapaneseFrame size={size} active={true} className={className}>{children}</OniJapaneseFrame>;
    default:
      return <div className={className}>{children}</div>;
  }
}

/**
 * Renders the appropriate icon for a given frame type.
 */
export function FrameIcon({ frameId, className = 'w-5 h-5' }: { frameId: string; className?: string }) {
  // Strip season suffix
  const baseId = frameId.replace(/_\d{4}Q[1-4]$/, '');
  switch (baseId) {
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
    case 'obsidian_neon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${className} text-cyan-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(0,212,255,0.9)" />
          <circle cx="12" cy="12" r="6" stroke="rgba(0,80,255,0.85)" />
        </svg>
      );
    case 'ruby_neon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${className} text-red-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(220,0,60,0.9)" />
          <circle cx="12" cy="12" r="6" stroke="rgba(255,80,160,0.75)" strokeDasharray="4 2" />
        </svg>
      );
    case 'amber_neon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${className} text-amber-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(245,158,11,0.9)" />
          <circle cx="12" cy="12" r="6" stroke="rgba(251,146,60,0.8)" />
        </svg>
      );
    case 'zircon_neon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${className} text-orange-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(249,115,22,0.9)" />
          <circle cx="12" cy="12" r="6" stroke="rgba(168,85,247,0.85)" />
        </svg>
      );
    case 'molten_lava':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${className} text-orange-500`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(30,10,5,0.9)" fill="rgba(10,5,5,0.8)" />
          <path d="M6 10 Q8 8 10 11 Q12 14 14 10 Q16 6 18 9" stroke="rgba(255,100,10,0.9)" strokeWidth="1.5" fill="none" />
          <path d="M5 14 Q7 12 9 15 Q11 18 13 14 Q15 10 17 13" stroke="rgba(255,60,0,0.7)" strokeWidth="1" fill="none" />
        </svg>
      );
    case 'oni_japanese':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-red-500`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(180,20,0,0.9)" strokeWidth="1.5" fill="rgba(10,0,0,0.8)" />
          <path d="M9 7 Q10 4 12 6 Q14 4 15 7" fill="rgba(212,140,0,0.9)" />
          <ellipse cx="9.5" cy="11" rx="1.5" ry="1" fill="rgba(255,80,0,0.9)" />
          <ellipse cx="14.5" cy="11" rx="1.5" ry="1" fill="rgba(255,80,0,0.9)" />
          <path d="M9 15 Q12 17 15 15" stroke="rgba(212,140,0,0.8)" strokeWidth="1" fill="none" />
        </svg>
      );
    default:
      return null;
  }
}

export default FrameWrapper;
