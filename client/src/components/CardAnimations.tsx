import { useState, useEffect, useRef, useMemo } from 'react';
import { CARD_BACK_URL, CARD_BACK_CUSTOM_URL } from '../../../shared/cardAssets';
import { getAssetUrl } from '@/lib/assetUrl';

const _CARD_BACK_URL = getAssetUrl(CARD_BACK_URL);
const _CARD_BACK_CUSTOM_URL = getAssetUrl(CARD_BACK_CUSTOM_URL);

// ---- Deal Animation ----
// Shows cards flying from deck area to hand area when cards are drawn after a trick.
// Desktop: cards fly from the deck position (right side) to hand (bottom center).
// Mobile: a mini deck appears at center-top, deals cards downward, then disappears.

interface DealAnimationProps {
  cardCount: number;
  deckStyle: 'classic' | 'custom';
  fromDeck: 'deck1' | 'deck2';
  onComplete?: () => void;
}

export function DealAnimation({ cardCount, deckStyle, fromDeck, onComplete }: DealAnimationProps) {
  const [cards, setCards] = useState<{ id: number; phase: 'waiting' | 'flying' | 'done' }[]>([]);
  const [deckVisible, setDeckVisible] = useState(false);
  const backUrl = deckStyle === 'custom' ? _CARD_BACK_CUSTOM_URL : _CARD_BACK_URL;
  const completedRef = useRef(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  useEffect(() => {
    completedRef.current = false;
    const total = Math.min(cardCount, 14);
    if (total <= 0) {
      onComplete?.();
      return;
    }

    const initialCards = Array.from({ length: total }, (_, i) => ({
      id: i,
      phase: 'waiting' as const,
    }));
    setCards(initialCards);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // On mobile, show the deck first, then deal
    if (isMobile) {
      setDeckVisible(true);
      // Start dealing after deck appears (200ms)
      const dealDelay = 200;
      initialCards.forEach((_, i) => {
        const timer = setTimeout(() => {
          setCards(prev => prev.map(c => c.id === i ? { ...c, phase: 'flying' } : c));
        }, dealDelay + i * 100);
        timers.push(timer);

        const doneTimer = setTimeout(() => {
          setCards(prev => prev.map(c => c.id === i ? { ...c, phase: 'done' } : c));
        }, dealDelay + i * 100 + 350);
        timers.push(doneTimer);
      });

      // Hide deck after all cards dealt
      const hideDeckTimer = setTimeout(() => {
        setDeckVisible(false);
      }, dealDelay + total * 100 + 400);
      timers.push(hideDeckTimer);

      const completeTimer = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }, dealDelay + total * 100 + 500);
      timers.push(completeTimer);
    } else {
      // Desktop: standard animation
      initialCards.forEach((_, i) => {
        const timer = setTimeout(() => {
          setCards(prev => prev.map(c => c.id === i ? { ...c, phase: 'flying' } : c));
        }, i * 120);
        timers.push(timer);

        const doneTimer = setTimeout(() => {
          setCards(prev => prev.map(c => c.id === i ? { ...c, phase: 'done' } : c));
        }, i * 120 + 450);
        timers.push(doneTimer);
      });

      const completeTimer = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }, total * 120 + 550);
      timers.push(completeTimer);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
      setDeckVisible(false);
    };
  }, [cardCount, onComplete, fromDeck, isMobile]);

  // Desktop deck position
  const deckStartRight = fromDeck === 'deck1' ? '10%' : '25%';
  const deckStartTop = '35%';

  if (isMobile) {
    // Mobile: deck appears at center-top, cards fly to bottom
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Mini deck that appears and disappears */}
        {deckVisible && (
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-200"
            style={{
              top: '30%',
              opacity: deckVisible ? 1 : 0,
              transform: `translateX(-50%) scale(${deckVisible ? 1 : 0.5})`,
            }}
          >
            <div className="w-10 h-14 rounded-md overflow-hidden shadow-xl border-2 border-amber-600/60">
              <img src={backUrl} alt="" className="w-full h-full object-cover" />
            </div>
            {/* Stack effect */}
            <div className="absolute -top-0.5 -left-0.5 w-10 h-14 rounded-md overflow-hidden shadow-md border border-amber-700/30 -z-10">
              <img src={backUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Flying cards */}
        {cards.map(card => {
          if (card.phase === 'done') return null;
          const isFlying = card.phase === 'flying';
          const spreadX = (card.id - Math.floor(cardCount / 2)) * 3;

          return (
            <div
              key={card.id}
              className="absolute left-1/2"
              style={{
                top: isFlying ? 'calc(100dvh - 100px)' : '30%',
                marginLeft: isFlying ? `${spreadX}px` : '0px',
                width: '36px',
                height: '52px',
                transition: isFlying ? 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                opacity: card.phase === 'waiting' ? 0.8 : isFlying ? 1 : 0,
                transform: isFlying
                  ? `translateX(-50%) rotate(${(card.id - Math.floor(cardCount / 2)) * 2}deg) scale(0.9)`
                  : 'translateX(-50%) rotate(0deg) scale(0.5)',
                zIndex: 100 + card.id,
              }}
            >
              <div className="w-full h-full rounded-md overflow-hidden shadow-lg border border-amber-700/40">
                <img src={backUrl} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {cards.map(card => {
        if (card.phase === 'done') return null;
        const isFlying = card.phase === 'flying';
        const spreadX = (card.id - Math.floor(cardCount / 2)) * 4;

        return (
          <div
            key={card.id}
            className="absolute"
            style={{
              top: isFlying ? 'calc(100vh - 130px)' : deckStartTop,
              right: isFlying ? `calc(50% - ${spreadX}px)` : deckStartRight,
              width: '52px',
              height: '78px',
              transition: isFlying ? 'all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              opacity: card.phase === 'waiting' ? 0.85 : isFlying ? 1 : 0,
              transform: isFlying
                ? `rotate(${(card.id - Math.floor(cardCount / 2)) * 1.5}deg) scale(0.85)`
                : 'rotate(0deg) scale(0.6)',
              zIndex: 100 + card.id,
            }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden shadow-xl border-2 border-amber-700/40">
              <img src={backUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Bito Animation ----
// Shows cards flying from battlefield to discard pile when round ends (successful defense)
// Desktop only — mobile skips this animation per user request

interface BitoAnimationProps {
  cardCount: number;
  deckStyle: 'classic' | 'custom';
  onComplete?: () => void;
}

export function BitoAnimation({ cardCount, deckStyle, onComplete }: BitoAnimationProps) {
  const [cards, setCards] = useState<{ id: number; phase: 'start' | 'flying' | 'done' }[]>([]);
  const backUrl = deckStyle === 'custom' ? _CARD_BACK_CUSTOM_URL : _CARD_BACK_URL;
  const completedRef = useRef(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const startPositions = useMemo(() => {
    return Array.from({ length: Math.min(cardCount, 12) }, (_, i) => ({
      x: 30 + (i % 4) * 15 + Math.random() * 5,
      y: 30 + Math.floor(i / 4) * 15 + Math.random() * 5,
      rotation: (Math.random() - 0.5) * 20,
    }));
  }, [cardCount]);

  useEffect(() => {
    completedRef.current = false;

    // On mobile, skip bito animation entirely — just complete immediately
    if (isMobile) {
      onComplete?.();
      return;
    }

    const total = Math.min(cardCount, 12);
    if (total === 0) {
      onComplete?.();
      return;
    }

    const initialCards = Array.from({ length: total }, (_, i) => ({
      id: i,
      phase: 'start' as const,
    }));
    setCards(initialCards);

    const timers: ReturnType<typeof setTimeout>[] = [];

    const startTimer = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, phase: 'flying' as const })));
    }, 100);
    timers.push(startTimer);

    const doneTimer = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, phase: 'done' as const })));
    }, 700);
    timers.push(doneTimer);

    const completeTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, 800);
    timers.push(completeTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [cardCount, onComplete, isMobile]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {cards.map(card => {
        if (card.phase === 'done') return null;
        const isFlying = card.phase === 'flying';
        const pos = startPositions[card.id] || { x: 50, y: 40, rotation: 0 };

        return (
          <div
            key={card.id}
            className="absolute"
            style={{
              left: isFlying ? '60px' : `${pos.x}%`,
              top: isFlying ? '60%' : `${pos.y}%`,
              width: '48px',
              height: '72px',
              transition: 'all 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53)',
              opacity: isFlying ? 0.3 : 0.9,
              transform: isFlying
                ? `rotate(${pos.rotation + 180}deg) scale(0.5)`
                : `rotate(${pos.rotation}deg) scale(1)`,
              zIndex: 100 + card.id,
            }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border border-amber-700/30">
              <img src={backUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        );
      })}

      {/* "БИТО!" text overlay */}
      {cards.some(c => c.phase === 'flying') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl sm:text-5xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)] tracking-wider bito-text-enter">
            БИТО!
          </div>
        </div>
      )}
    </div>
  );
}
