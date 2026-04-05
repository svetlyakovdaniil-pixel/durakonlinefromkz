import { useState, useEffect, useRef, useMemo } from 'react';
import { CARD_BACK_URL, CARD_BACK_CUSTOM_URL } from '../../../shared/cardAssets';

// ---- Deal Animation ----
// Shows cards flying from deck area to hand area when game starts

interface DealAnimationProps {
  cardCount: number;
  deckStyle: 'classic' | 'custom';
  onComplete?: () => void;
}

export function DealAnimation({ cardCount, deckStyle, onComplete }: DealAnimationProps) {
  const [cards, setCards] = useState<{ id: number; phase: 'waiting' | 'flying' | 'done' }[]>([]);
  const backUrl = deckStyle === 'custom' ? CARD_BACK_CUSTOM_URL : CARD_BACK_URL;
  const completedRef = useRef(false);

  useEffect(() => {
    const total = Math.min(cardCount, 14);
    const initialCards = Array.from({ length: total }, (_, i) => ({
      id: i,
      phase: 'waiting' as const,
    }));
    setCards(initialCards);

    // Stagger card dealing
    const timers: ReturnType<typeof setTimeout>[] = [];
    initialCards.forEach((_, i) => {
      const timer = setTimeout(() => {
        setCards(prev => prev.map(c => c.id === i ? { ...c, phase: 'flying' } : c));
      }, i * 80); // 80ms between each card
      timers.push(timer);

      const doneTimer = setTimeout(() => {
        setCards(prev => prev.map(c => c.id === i ? { ...c, phase: 'done' } : c));
      }, i * 80 + 500); // 500ms flight time
      timers.push(doneTimer);
    });

    // Complete animation
    const completeTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, total * 80 + 600);
    timers.push(completeTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [cardCount, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {cards.map(card => {
        if (card.phase === 'done') return null;
        const isFlying = card.phase === 'flying';

        // Start position: top-right (deck area)
        // End position: bottom-center (hand area)
        // Add slight horizontal spread
        const spreadX = (card.id - 7) * 3; // spread cards horizontally

        return (
          <div
            key={card.id}
            className="absolute"
            style={{
              // Start from deck area (top-right)
              top: isFlying ? 'calc(100vh - 120px)' : '50%',
              right: isFlying ? `calc(50% - ${spreadX}px)` : '80px',
              width: '56px',
              height: '84px',
              transition: isFlying ? 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              opacity: card.phase === 'waiting' ? 0.9 : isFlying ? 1 : 0,
              transform: isFlying
                ? `rotate(${(card.id - 7) * 2}deg) scale(0.9)`
                : 'rotate(0deg) scale(0.7)',
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
// Shows cards flying from battlefield to discard pile when round ends

interface BitoAnimationProps {
  cardCount: number;
  deckStyle: 'classic' | 'custom';
  onComplete?: () => void;
}

export function BitoAnimation({ cardCount, deckStyle, onComplete }: BitoAnimationProps) {
  const [cards, setCards] = useState<{ id: number; phase: 'start' | 'flying' | 'done' }[]>([]);
  const backUrl = deckStyle === 'custom' ? CARD_BACK_CUSTOM_URL : CARD_BACK_URL;
  const completedRef = useRef(false);

  // Pre-compute random positions for cards on the battlefield
  const startPositions = useMemo(() => {
    return Array.from({ length: Math.min(cardCount, 12) }, (_, i) => ({
      // Spread across center area
      x: 30 + (i % 4) * 15 + Math.random() * 5,
      y: 30 + Math.floor(i / 4) * 15 + Math.random() * 5,
      rotation: (Math.random() - 0.5) * 20,
    }));
  }, [cardCount]);

  useEffect(() => {
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

    // Small delay then start flying
    const timers: ReturnType<typeof setTimeout>[] = [];

    const startTimer = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, phase: 'flying' as const })));
    }, 100);
    timers.push(startTimer);

    // Mark done
    const doneTimer = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, phase: 'done' as const })));
    }, 700);
    timers.push(doneTimer);

    // Complete
    const completeTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, 800);
    timers.push(completeTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [cardCount, onComplete]);

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
              // Start from battlefield positions, fly to discard pile (left side)
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
