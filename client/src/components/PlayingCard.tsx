import { useState } from 'react';
import { Card, DeckStyle } from '../../../shared/gameTypes';
import {
  CARD_IMAGES, CARD_IMAGES_CUSTOM,
  CARD_BACK_URL, CARD_BACK_CUSTOM_URL,
  SUIT_SYMBOLS, SUIT_COLORS,
  getCardImageKey, getCustomCardImageKey,
} from '../../../shared/cardAssets';
import { getAssetUrl } from '@/lib/assetUrl';

const _CARD_BACK_URL = getAssetUrl(CARD_BACK_URL);
const _CARD_BACK_CUSTOM_URL = getAssetUrl(CARD_BACK_CUSTOM_URL);
const _CARD_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(CARD_IMAGES).map(([k, v]) => [k, getAssetUrl(v)])
);
const _CARD_IMAGES_CUSTOM: Record<string, string> = Object.fromEntries(
  Object.entries(CARD_IMAGES_CUSTOM).map(([k, v]) => [k, getAssetUrl(v)])
);

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  playable?: boolean;
  highlighted?: boolean;
  small?: boolean;
  compact?: boolean;
  medium?: boolean;
  revealed?: boolean;
  deckStyle?: DeckStyle;
  onClick?: () => void;
  className?: string;
}

// Placeholder shown while the card image is loading (or if image fails)
// Shows rank + suit symbol so the card is always readable
function CardPlaceholder({ card, small }: { card: Card; small?: boolean }) {
  const symbol = card.suit ? SUIT_SYMBOLS[card.suit] || '' : '';
  const color = card.suit ? SUIT_COLORS[card.suit] || '#1a1a2e' : '#1a1a2e';
  return (
    <div
      className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-between pointer-events-none"
      style={{ padding: small ? '2px' : '4px' }}
    >
      <div className="self-start leading-none" style={{ color }}>
        <div className={`font-bold ${small ? 'text-[8px]' : 'text-[10px] sm:text-xs'}`}>{card.rank}</div>
        <div className={`-mt-0.5 ${small ? 'text-[8px]' : 'text-[10px] sm:text-xs'}`}>{symbol}</div>
      </div>
      <div className={`${small ? 'text-base' : 'text-xl sm:text-2xl'}`} style={{ color }}>
        {symbol}
      </div>
      <div className="self-end leading-none rotate-180" style={{ color }}>
        <div className={`font-bold ${small ? 'text-[8px]' : 'text-[10px] sm:text-xs'}`}>{card.rank}</div>
        <div className={`-mt-0.5 ${small ? 'text-[8px]' : 'text-[10px] sm:text-xs'}`}>{symbol}</div>
      </div>
    </div>
  );
}

// Card image with placeholder: shows rank+suit while loading, then fades in the image
// Uses eager loading to avoid white flash — browser caches images after first load
function CardImage({ src, alt, card, small }: { src: string; alt: string; card: Card; small?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return <CardPlaceholder card={card} small={small} />;
  }

  return (
    <div className="w-full h-full relative pointer-events-none">
      {/* Placeholder shown only while loading */}
      {!loaded && (
        <div className="absolute inset-0 pointer-events-none">
          <CardPlaceholder card={card} small={small} />
        </div>
      )}
      {/* Actual image — eager loading for instant display from cache */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover relative z-10 pointer-events-none"
        style={{ opacity: loaded ? 1 : 0 }}
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

// Card back image with placeholder (dark back)
function CardBackImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg flex items-center justify-center pointer-events-none">
        <div className="w-3/4 h-3/4 border-2 border-amber-700/50 rounded-md opacity-50" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative pointer-events-none">
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg pointer-events-none" />
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover relative z-10 pointer-events-none"
        style={{ opacity: loaded ? 1 : 0 }}
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
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

export default function PlayingCard({ card, faceDown, selected, playable, highlighted, small, compact, medium, revealed, deckStyle = 'classic', onClick, className }: PlayingCardProps) {
  // Responsive card sizes:
  // small = opponent mini cards (unchanged)
  // compact = landscape hand cards (medium-small)
  // medium = battlefield cards (+10% from original)
  // default = hand cards (+10% from original)
  const sizeClasses = small
    ? 'w-7 h-11 sm:w-11 sm:h-15'
    : compact
      ? 'w-[53px] h-[79px]'  // landscape hand cards (+10%)
      : medium
        ? 'w-[62px] h-[93px] sm:w-24 sm:h-[141px]'  // +10% from w-14/h-21/sm:w-22/sm:h-32
        : 'w-[75px] h-[111px] sm:w-[117px] sm:h-[165px]';  // +10% from the previous hand-card size

  const isCustom = deckStyle === 'custom';
  const backUrl = isCustom ? _CARD_BACK_CUSTOM_URL : _CARD_BACK_URL;

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClasses} rounded-lg overflow-hidden shadow-md border border-amber-900/30 ${className || ''}`}
        onClick={onClick}
      >
        <CardBackImage src={backUrl} alt="card back" />
      </div>
    );
  }

  // Both decks now have images for all cards (6-10, J, Q, K, A, 777)
  const imageKey = isCustom
    ? getCustomCardImageKey(card.rank, card.suit)
    : getCardImageKey(card.rank, card.suit);
  const imageMap = isCustom ? _CARD_IMAGES_CUSTOM : _CARD_IMAGES;
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
        <CardImage
          src={imageMap[imageKey!]}
          alt={`${card.rank} ${card.suit || ''}`}
          card={card}
          small={small}
        />
      ) : (
        <NumberCard card={card} />
      )}
    </div>
  );
}
