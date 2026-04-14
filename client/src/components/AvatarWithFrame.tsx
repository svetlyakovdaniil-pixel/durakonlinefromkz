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
import { ObsidianUnderwaterFrame } from './ObsidianUnderwaterFrame';
import { ObsidianEgyptianFrame } from './ObsidianEgyptianFrame';
import { ObsidianPirateFrame } from './ObsidianPirateFrame';
import { ObsidianNorseFrame } from './ObsidianNorseFrame';
import { ObsidianSpaceFrame } from './ObsidianSpaceFrame';
import { ObsidianCyberpunkFrame } from './ObsidianCyberpunkFrame';
import { ObsidianHiphopFrame } from './ObsidianHiphopFrame';
import { ObsidianAngelsDemonsFrame } from './ObsidianAngelsDemonsFrame';

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
    // Season S1-S5, S10-S12 Obsidian frames
    case 'obsidian_underwater':
      return <ObsidianUnderwaterFrame size={size} active={true} className={className}>{children}</ObsidianUnderwaterFrame>;
    case 'obsidian_egyptian':
      return <ObsidianEgyptianFrame size={size} active={true} className={className}>{children}</ObsidianEgyptianFrame>;
    case 'obsidian_pirate':
      return <ObsidianPirateFrame size={size} active={true} className={className}>{children}</ObsidianPirateFrame>;
    case 'obsidian_norse':
      return <ObsidianNorseFrame size={size} active={true} className={className}>{children}</ObsidianNorseFrame>;
    case 'obsidian_space':
      return <ObsidianSpaceFrame size={size} active={true} className={className}>{children}</ObsidianSpaceFrame>;
    case 'obsidian_cyberpunk':
      return <ObsidianCyberpunkFrame size={size} active={true} className={className}>{children}</ObsidianCyberpunkFrame>;
    case 'obsidian_hiphop':
      return <ObsidianHiphopFrame size={size} active={true} className={className}>{children}</ObsidianHiphopFrame>;
    case 'obsidian_angels_demons':
      return <ObsidianAngelsDemonsFrame size={size} active={true} className={className}>{children}</ObsidianAngelsDemonsFrame>;
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
    // Season Obsidian frame icons
    case 'obsidian_underwater':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-teal-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(0,200,180,0.9)" strokeWidth="1.5" fill="rgba(0,20,30,0.8)" />
          <path d="M6 12 Q9 8 12 12 Q15 16 18 12" stroke="rgba(0,200,180,0.85)" strokeWidth="1.2" fill="none" />
          <circle cx="8" cy="10" r="1" fill="rgba(100,255,240,0.9)" />
          <circle cx="16" cy="14" r="1" fill="rgba(100,255,240,0.9)" />
        </svg>
      );
    case 'obsidian_egyptian':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-amber-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(200,160,0,0.9)" strokeWidth="1.5" fill="rgba(20,10,0,0.8)" />
          <ellipse cx="12" cy="10" rx="4" ry="2.5" fill="none" stroke="rgba(255,200,0,0.85)" strokeWidth="1" />
          <circle cx="12" cy="10" r="1.2" fill="rgba(255,180,0,0.95)" />
          <path d="M9 14 Q12 16 15 14" stroke="rgba(200,140,0,0.8)" strokeWidth="1" fill="none" />
        </svg>
      );
    case 'obsidian_pirate':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-blue-300`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(0,80,200,0.9)" strokeWidth="1.5" fill="rgba(0,5,20,0.8)" />
          <circle cx="12" cy="10" r="3" fill="none" stroke="rgba(180,220,255,0.85)" strokeWidth="1" />
          <circle cx="10" cy="9.5" r="0.8" fill="rgba(180,220,255,0.9)" />
          <circle cx="14" cy="9.5" r="0.8" fill="rgba(180,220,255,0.9)" />
          <path d="M9 13 L9 15 M12 13 L12 15 M15 13 L15 15" stroke="rgba(180,220,255,0.8)" strokeWidth="0.8" />
        </svg>
      );
    case 'obsidian_norse':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-purple-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(140,60,220,0.9)" strokeWidth="1.5" fill="rgba(10,0,20,0.8)" />
          <rect x="9" y="5" width="6" height="5" rx="1" fill="rgba(180,100,255,0.85)" stroke="rgba(220,180,255,0.7)" strokeWidth="0.5" />
          <rect x="11" y="10" width="2" height="7" rx="0.5" fill="rgba(140,80,220,0.8)" />
          <rect x="8" y="13" width="8" height="1.5" rx="0.5" fill="rgba(100,60,180,0.75)" />
        </svg>
      );
    case 'obsidian_space':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-purple-300`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(100,0,200,0.9)" strokeWidth="1.5" fill="rgba(5,0,15,0.8)" />
          <circle cx="12" cy="12" r="3" fill="rgba(60,0,120,0.9)" stroke="rgba(200,100,255,0.8)" strokeWidth="0.8" />
          <circle cx="7" cy="8" r="0.8" fill="rgba(200,150,255,0.9)" />
          <circle cx="17" cy="9" r="0.6" fill="rgba(150,200,255,0.9)" />
          <circle cx="16" cy="16" r="0.7" fill="rgba(255,255,255,0.85)" />
        </svg>
      );
    case 'obsidian_cyberpunk':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-green-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(0,255,180,0.9)" strokeWidth="1.5" fill="rgba(0,10,8,0.8)" />
          <rect x="8" y="8" width="8" height="8" rx="1" fill="none" stroke="rgba(0,255,180,0.7)" strokeWidth="0.8" />
          <rect x="10" y="10" width="4" height="4" rx="0.5" fill="rgba(255,0,180,0.6)" stroke="rgba(255,0,180,0.8)" strokeWidth="0.5" />
          <line x1="8" y1="12" x2="6" y2="12" stroke="rgba(0,200,255,0.8)" strokeWidth="0.8" />
          <line x1="16" y1="12" x2="18" y2="12" stroke="rgba(0,200,255,0.8)" strokeWidth="0.8" />
        </svg>
      );
    case 'obsidian_hiphop':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-yellow-400`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(200,150,0,0.9)" strokeWidth="1.5" fill="rgba(10,5,0,0.8)" />
          <circle cx="12" cy="12" r="4" fill="none" stroke="rgba(255,200,0,0.7)" strokeWidth="0.8" strokeDasharray="2 1" />
          <circle cx="12" cy="12" r="1.5" fill="rgba(255,220,0,0.9)" />
          <line x1="7" y1="7" x2="9" y2="9" stroke="rgba(200,100,0,0.7)" strokeWidth="0.8" />
          <line x1="17" y1="7" x2="15" y2="9" stroke="rgba(200,100,0,0.7)" strokeWidth="0.8" />
        </svg>
      );
    case 'obsidian_angels_demons':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`${className} text-purple-300`}>
          <circle cx="12" cy="12" r="9" stroke="rgba(180,120,255,0.9)" strokeWidth="1.5" fill="rgba(10,0,15,0.8)" />
          <path d="M12 4 Q8 7 6 12" stroke="rgba(255,220,100,0.8)" strokeWidth="1" fill="none" />
          <path d="M12 4 Q16 7 18 12" stroke="rgba(220,0,60,0.8)" strokeWidth="1" fill="none" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
          <ellipse cx="12" cy="4" rx="3" ry="1" fill="none" stroke="rgba(255,220,100,0.7)" strokeWidth="0.8" />
        </svg>
      );
    default:
      return null;
  }
}

export default FrameWrapper;
