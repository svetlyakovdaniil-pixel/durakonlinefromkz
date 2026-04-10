import { Card, DeckStyle } from '../../../shared/gameTypes';
import {
  CARD_IMAGES, CARD_IMAGES_CUSTOM,
  CARD_BACK_URL, CARD_BACK_CUSTOM_URL,
  SUIT_SYMBOLS, SUIT_COLORS,
  getCardImageKey, getCustomCardImageKey,
} from '../../../shared/cardAssets';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  playable?: boolean;
  highlighted?: boolean;
  small?: boolean;
  medium?: boolean;
  /** Battlefield size: 'lg' (1-2 pairs), 'md' (3-4), 'sm' (5-6), 'xs' (7+) */
  battleSize?: 'lg' | 'md' | 'sm' | 'xs';
  revealed?: boolean;
  deckStyle?: DeckStyle;
  onClick?: () => void;
  className?: string;
}

function NumberCard({ card }: { card: Card }) {
  const symbol = card.suit ? SUIT_SYMBOLS[card.suit] || '' : '';
  const color = card.suit ? SUIT_COLORS[card.suit] || '#1a1a2e' : '#1a1a2e';

  return (
    <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-between p-1 sm:p-1.5 relative overflow-hidden pointer-events-none">
      {/* Ornament background */}
      <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" viewBox="0 0 100 140">
        <circle cx="50" cy="70" r="35" fill={color} />
        <path d="M50 20 L65 50 L50 80 L35 50 Z" fill={color} opacity="0.5" />
      </svg>
      {/* Top-left rank */}
      <div className="self-start z-10 leading-none" style={{ color }}>
        <div className="text-[9px] sm:text-xs font-bold">{card.rank}</div>
        <div className="text-[9px] sm:text-xs -mt-0.5">{symbol}</div>
      </div>
      {/* Center suit */}
      <div className="z-10 text-lg sm:text-2xl" style={{ color }}>
        {symbol}
      </div>
      {/* Bottom-right rank */}
      <div className="self-end z-10 leading-none rotate-180" style={{ color }}>
        <div className="text-[9px] sm:text-xs font-bold">{card.rank}</div>
        <div className="text-[9px] sm:text-xs -mt-0.5">{symbol}</div>
      </div>
    </div>
  );
}

export default function PlayingCard({ card, faceDown, selected, playable, highlighted, small, medium, battleSize, revealed, deckStyle = 'classic', onClick, className }: PlayingCardProps) {
  // Responsive card sizes:
  // small = opponent mini cards
  // medium = battlefield cards (legacy fixed size)
  // battleSize = adaptive battlefield cards based on pair count
  // default = hand cards
  let sizeClasses: string;
  if (small) {
    sizeClasses = 'w-7 h-11 sm:w-11 sm:h-15';
  } else if (battleSize) {
    // Adaptive battlefield sizes for mobile, desktop stays consistent
    switch (battleSize) {
      case 'lg': sizeClasses = 'w-[60px] h-[88px] sm:w-22 sm:h-32'; break; // 1-2 pairs
      case 'md': sizeClasses = 'w-14 h-21 sm:w-22 sm:h-32'; break;        // 3-4 pairs (same as old medium)
      case 'sm': sizeClasses = 'w-11 h-16 sm:w-20 sm:h-28'; break;        // 5-6 pairs
      case 'xs': sizeClasses = 'w-9 h-[52px] sm:w-18 sm:h-26'; break;     // 7+ pairs
    }
  } else if (medium) {
    sizeClasses = 'w-14 h-21 sm:w-22 sm:h-32';
  } else {
    sizeClasses = 'w-[62px] h-[92px] sm:w-24 sm:h-34';
  }

  const isCustom = deckStyle === 'custom';
  const backUrl = isCustom ? CARD_BACK_CUSTOM_URL : CARD_BACK_URL;

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClasses} rounded-lg overflow-hidden shadow-md border border-amber-900/30 ${className || ''}`}
        onClick={onClick}
      >
        <img src={backUrl} alt="card back" className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }

  // Both decks now have images for all cards (6-10, J, Q, K, A, 777)
  const imageKey = isCustom
    ? getCustomCardImageKey(card.rank, card.suit)
    : getCardImageKey(card.rank, card.suit);
  const imageMap = isCustom ? CARD_IMAGES_CUSTOM : CARD_IMAGES;
  const hasImage = imageKey && imageMap[imageKey];

  return (
    <div
      className={`${sizeClasses} rounded-lg overflow-hidden shadow-md border-2 transition-all duration-150
        ${selected ? 'border-amber-400 ring-2 ring-amber-400/50 -translate-y-2' : 'border-amber-900/30'}
        ${playable ? 'hover:-translate-y-2 hover:shadow-lg hover:border-amber-500/60 cursor-pointer' : ''}
        ${highlighted ? 'border-emerald-400 ring-2 ring-emerald-400/60 shadow-emerald-400/30 shadow-lg animate-pulse' : ''}
        ${revealed ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-400/30 shadow-lg' : ''}
        ${className || ''}`}
      onClick={playable || onClick ? onClick : undefined}
    >
      {hasImage ? (
        <div className="w-full h-full bg-white relative pointer-events-none">
          <img src={imageMap[imageKey!]} alt={`${card.rank} ${card.suit || ''}`} className="w-full h-full object-cover relative z-10 pointer-events-none" loading="lazy" />
        </div>
      ) : (
        <NumberCard card={card} />
      )}
    </div>
  );
}
