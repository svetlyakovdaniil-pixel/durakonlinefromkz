import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TutorialScenario } from '@/hooks/useInteractiveTutorial';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import type { ClientGameState } from '../../../shared/gameTypes';
import { CARD_IMAGES_CUSTOM, CARD_BACK_CUSTOM_URL, getCustomCardImageKey, SUIT_SYMBOLS, SUIT_COLORS } from '../../../shared/cardAssets';

interface TutorialStepDisplayProps {
  scenario: TutorialScenario | null;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onCardClick?: (cardId: string) => void;
  tutorialHighlightIds?: Set<string>;
  gameState?: ClientGameState;
}

interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Sequential defend phases:
// waiting → defend1 → defend2 → bito-text → bito-fly → done
type SeqDefendPhase = 'waiting' | 'defend1' | 'defend2' | 'bito-text' | 'bito-fly' | 'done';

// Helper: get card image URL for a card notation like '6h' or '777'
function getCardImageUrl(cardNotation: string): string | null {
  // Special case: 777 has no suit
  if (cardNotation === '777') {
    const key = getCustomCardImageKey('777', 'spades'); // suit is ignored for 777
    if (!key) return null;
    return CARD_IMAGES_CUSTOM[key] || null;
  }
  const suitMap: Record<string, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
  const suitChar = cardNotation.slice(-1);
  const rank = cardNotation.slice(0, -1);
  const suit = suitMap[suitChar];
  if (!suit) return null;
  const key = getCustomCardImageKey(rank, suit);
  if (!key) return null;
  return CARD_IMAGES_CUSTOM[key] || null;
}

// Helper: render a mini card face for overlay
function MiniCardFace({ cardNotation, className }: { cardNotation: string; className?: string }) {
  const imgUrl = getCardImageUrl(cardNotation);
  if (imgUrl) {
    return (
      <div className={`w-full h-full bg-white rounded-lg overflow-hidden ${className || ''}`}>
        <img src={imgUrl} alt={cardNotation} className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }
  // Fallback: render text-based card (for cards with suit)
  if (cardNotation === '777') {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center ${className || ''}`}>
        <div className="font-bold text-white text-sm">777</div>
      </div>
    );
  }
  const suitMap: Record<string, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
  const suitChar = cardNotation.slice(-1);
  const rank = cardNotation.slice(0, -1);
  const suit = suitMap[suitChar] || 'spades';
  const symbol = SUIT_SYMBOLS[suit] || '';
  const color = SUIT_COLORS[suit] || '#1a1a2e';
  return (
    <div className={`w-full h-full bg-white rounded-lg flex flex-col items-center justify-center p-1 ${className || ''}`}>
      <div className="font-bold text-xs" style={{ color }}>{rank}</div>
      <div className="text-sm" style={{ color }}>{symbol}</div>
    </div>
  );
}

export default function TutorialStepDisplay({
  scenario,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onCardClick,
  tutorialHighlightIds,
  gameState,
}: TutorialStepDisplayProps) {
  const [spotlightRects, setSpotlightRects] = useState<SpotlightRect[]>([]);
  const [textPos, setTextPos] = useState<{ top: number; left: number; maxWidth: number }>({
    top: 0,
    left: 0,
    maxWidth: 400,
  });
  const cardClickHandledRef = useRef(false);
  const textBoxRef = useRef<HTMLDivElement>(null);

  // Sequential defend state
  const [seqPhase, setSeqPhase] = useState<SeqDefendPhase>('waiting');
  const [defendedPairs, setDefendedPairs] = useState<number>(0);
  const seqClickCountRef = useRef(0);
  // Track hidden card elements so we can restore them on step change
  const hiddenCardElementsRef = useRef<HTMLElement[]>([]);
  // Track table card positions for bito-fly animation
  const tableCardRectsRef = useRef<{ left: number; top: number; width: number; height: number }[]>([]);
  // Track bito-fly card animation phase
  const [bitoFlyPhase, setBitoFlyPhase] = useState<'start' | 'flying' | 'done'>('start');

  // Transfer mechanic state
  // 'idle' → player hasn't clicked card yet
  // 'card-selected' → player clicked the transfer card, show "Перевести" button
  // 'transferring' → card flying to table animation
  // 'card-on-table' → card appeared on table, show message overlay (2s)
  // 'transferred' → message gone, Next button active
  type TransferPhase = 'idle' | 'card-selected' | 'transferring' | 'card-on-table' | 'transferred';
  const [transferPhase, setTransferPhase] = useState<TransferPhase>('idle');

  // Reset ALL state when step changes (including when going back from step 10 to step 9)
  useEffect(() => {
    setSeqPhase('waiting');
    setDefendedPairs(0);
    seqClickCountRef.current = 0;
    cardClickHandledRef.current = false;
    setAutoDefendActive(false);
    setBitoFlyPhase('start');
    tableCardRectsRef.current = [];
    setTransferPhase('idle');

    // Restore any previously hidden card elements
    hiddenCardElementsRef.current.forEach(el => {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
      el.style.pointerEvents = '';
    });
    hiddenCardElementsRef.current = [];

    // Also restore any hidden table card elements
    const tableArea = document.querySelector('[data-tutorial="table-area"]');
    if (tableArea) {
      const pairElements = tableArea.querySelectorAll(':scope > div') as NodeListOf<HTMLElement>;
      pairElements.forEach(el => {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.transition = '';
      });
    }
  }, [currentStep]);

  // Calculate spotlight positions and text position
  const updatePositions = useCallback(() => {
    if (!scenario?.highlightElements || scenario.highlightElements.length === 0) {
      setSpotlightRects([]);
      setTextPos({
        top: window.innerHeight / 2 - 120,
        left: window.innerWidth / 2 - 200,
        maxWidth: 400,
      });
      return;
    }

    const rects: SpotlightRect[] = [];
    const padding = 8;

    // Helper to resolve selectors including nth-of-type for opponent-info
    const resolveSelector = (selector: string): Element | null => {
      const nthMatch = selector.match(/\[data-tutorial="opponent-info"\]:nth-of-type\((\d+)\)/);
      if (nthMatch) {
        const idx = parseInt(nthMatch[1]) - 1;
        const allOpponents = document.querySelectorAll('[data-tutorial="opponent-info"]');
        return allOpponents[idx] || null;
      }
      return document.querySelector(selector);
    };

    for (const selector of scenario.highlightElements) {
      const element = resolveSelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        rects.push({
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      }
    }

    setSpotlightRects(rects);

    // Text position
    if (scenario.textPosition === 'top') {
      const textBoxWidth = Math.min(336, window.innerWidth - 32);
      setTextPos({
        top: 12,
        left: window.innerWidth / 2 - textBoxWidth / 2,
        maxWidth: textBoxWidth,
      });
    } else if (scenario.textPosition === 'center' || rects.length === 0) {
      const textBoxWidth = Math.min(336, window.innerWidth - 32);
      setTextPos({
        top: window.innerHeight / 2 - 140,
        left: window.innerWidth / 2 - textBoxWidth / 2,
        maxWidth: textBoxWidth,
      });
    } else if (rects.length === 1) {
      const sr = rects[0];
      const textBoxWidth = Math.min(380, window.innerWidth - 32);
      const textBoxHeight = 260;
      const gap = 16;

      let textTop = 0;
      let textLeft = 0;

      const spaceAbove = sr.top;
      const spaceBelow = window.innerHeight - (sr.top + sr.height);
      const spaceRight = window.innerWidth - (sr.left + sr.width);
      const spaceLeft = sr.left;

      if (spaceBelow >= textBoxHeight + gap) {
        textTop = sr.top + sr.height + gap;
        textLeft = Math.max(16, Math.min(sr.left + sr.width / 2 - textBoxWidth / 2, window.innerWidth - textBoxWidth - 16));
      } else if (spaceAbove >= textBoxHeight + gap) {
        textTop = sr.top - textBoxHeight - gap;
        textLeft = Math.max(16, Math.min(sr.left + sr.width / 2 - textBoxWidth / 2, window.innerWidth - textBoxWidth - 16));
      } else if (spaceRight >= textBoxWidth + gap) {
        textTop = Math.max(16, Math.min(sr.top + sr.height / 2 - textBoxHeight / 2, window.innerHeight - textBoxHeight - 16));
        textLeft = sr.left + sr.width + gap;
      } else if (spaceLeft >= textBoxWidth + gap) {
        textTop = Math.max(16, Math.min(sr.top + sr.height / 2 - textBoxHeight / 2, window.innerHeight - textBoxHeight - 16));
        textLeft = sr.left - textBoxWidth - gap;
      } else {
        textTop = window.innerHeight - textBoxHeight - 16;
        textLeft = Math.max(16, window.innerWidth / 2 - textBoxWidth / 2);
      }

      setTextPos({ top: textTop, left: textLeft, maxWidth: textBoxWidth });
    } else {
      const textBoxWidth = Math.min(420, window.innerWidth - 32);
      setTextPos({
        top: window.innerHeight / 2 - 140,
        left: window.innerWidth / 2 - textBoxWidth / 2,
        maxWidth: textBoxWidth,
      });
    }
  }, [scenario?.highlightElements, scenario?.textPosition]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    const timer = setTimeout(updatePositions, 100);
    const timer2 = setTimeout(updatePositions, 500);
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [updatePositions, currentStep]);

  // Make tutorial-highlighted cards clickable through overlay
  useEffect(() => {
    if (!scenario || !tutorialHighlightIds || tutorialHighlightIds.size === 0) return;

    const highlightedElements: HTMLElement[] = [];
    tutorialHighlightIds.forEach(cardId => {
      const el = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
      if (el) {
        el.style.position = 'relative';
        el.style.zIndex = '60';
        el.style.pointerEvents = 'auto';
        highlightedElements.push(el);
      }
    });

    return () => {
      highlightedElements.forEach(el => {
        el.style.position = '';
        el.style.zIndex = '';
        el.style.pointerEvents = '';
      });
    };
  }, [scenario, tutorialHighlightIds]);

  // State for auto-defend animation (legacy single-click)
  const [autoDefendActive, setAutoDefendActive] = useState(false);

  // Handle card clicks for interactive scenarios
  useEffect(() => {
    if (!scenario || scenario.requiredAction !== 'click-card' || !scenario.targetCard) {
      return;
    }

    // Don't re-register handler if already completed (prevents issues on re-render)
    // But DO allow re-registration when seqPhase is 'waiting' (fresh start / step back)
    if (scenario.sequentialDefend && seqPhase !== 'waiting' && seqPhase !== 'defend1') {
      return;
    }

    // For transfer mechanic, only register when idle
    if (scenario.transferMechanic && transferPhase !== 'idle') {
      return;
    }

    const handleCardClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const cardElement = target.closest('[data-card-id]');

      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');

        if (cardId && scenario.targetCard && cardId.includes(scenario.targetCard)) {
          // Sequential defend mode
          if (scenario.sequentialDefend) {
            const totalDefenses = scenario.sequentialDefend.defenseCards.length;
            
            // Prevent extra clicks
            if (seqClickCountRef.current >= totalDefenses) return;
            
            seqClickCountRef.current += 1;
            const clickNum = seqClickCountRef.current;

            if (clickNum <= totalDefenses) {
              // Update defended pairs count
              setDefendedPairs(clickNum);

              // Hide the clicked card from hand visually and track it
              const clickedEl = cardElement as HTMLElement;
              clickedEl.style.opacity = '0';
              clickedEl.style.transform = 'translateY(-40px) scale(0.5)';
              clickedEl.style.transition = 'all 0.4s ease-out';
              clickedEl.style.pointerEvents = 'none';
              hiddenCardElementsRef.current.push(clickedEl);

              if (clickNum === 1) {
                setSeqPhase('defend1');
              }

              if (clickNum >= totalDefenses) {
                // All cards defended
                cardClickHandledRef.current = true;

                // Check if we should skip bito animation
                if (scenario.sequentialDefend!.noBitoAnimation) {
                  // No bito — just mark as done immediately (enable Next button)
                  setSeqPhase('done');
                  return;
                }

                // Start bito sequence
                setSeqPhase('defend2');

                // Capture table card positions before they get animated
                const tableArea = document.querySelector('[data-tutorial="table-area"]');
                if (tableArea) {
                  const pairEls = tableArea.querySelectorAll(':scope > div');
                  tableCardRectsRef.current = Array.from(pairEls).map(el => {
                    const r = el.getBoundingClientRect();
                    return { left: r.left, top: r.top, width: r.width, height: r.height };
                  });
                }

                // After exactly 2 seconds, show БИТО text
                setTimeout(() => {
                  setSeqPhase('bito-text');
                }, 2000);

                // After 3 seconds, start flying cards to bito
                setTimeout(() => {
                  // Hide actual table cards
                  const tableArea = document.querySelector('[data-tutorial="table-area"]');
                  if (tableArea) {
                    const pairEls = tableArea.querySelectorAll(':scope > div') as NodeListOf<HTMLElement>;
                    pairEls.forEach(el => {
                      el.style.opacity = '0';
                      el.style.transition = 'opacity 0.3s';
                    });
                  }
                  setSeqPhase('bito-fly');
                  setBitoFlyPhase('start');
                }, 3000);

                // After 3.1s, start flying animation
                setTimeout(() => {
                  setBitoFlyPhase('flying');
                }, 3100);

                // After 3.8s, cards done flying
                setTimeout(() => {
                  setBitoFlyPhase('done');
                }, 3800);

                // After 4s, mark as done (next button enabled)
                setTimeout(() => {
                  setSeqPhase('done');
                }, 4000);
              }
            }
            return;
          }

          // Transfer mechanic mode
          if (scenario.transferMechanic) {
            if (transferPhase !== 'idle') return;
            setTransferPhase('card-selected');
            return;
          }

          // Legacy autoDefend mode
          if (cardClickHandledRef.current) return;
          cardClickHandledRef.current = true;
          onCardClick?.(cardId);

          if (scenario.autoDefend) {
            setAutoDefendActive(true);
            setTimeout(() => {
              onNext();
            }, 1200);
          } else {
            setTimeout(() => {
              onNext();
            }, 500);
          }
        }
      }
    };

    document.addEventListener('click', handleCardClick, true);
    return () => document.removeEventListener('click', handleCardClick, true);
  }, [scenario, onNext, onCardClick, currentStep, seqPhase, transferPhase]);

  // Handle sort button click for step 6
  const [sortClicked, setSortClicked] = useState(false);
  useEffect(() => {
    if (!scenario || scenario.requiredAction !== 'click-sort') {
      setSortClicked(false);
      return;
    }

    setSortClicked(false);

    const handleSortClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const sortBtn = target.closest('[data-tutorial="sort-button"]');
      if (sortBtn) {
        setSortClicked(true);
        setTimeout(() => {
          onNext();
        }, 800);
      }
    };

    // Make sort button clickable through overlay
    const sortButton = document.querySelector('[data-tutorial="sort-button"]') as HTMLElement;
    if (sortButton) {
      sortButton.style.position = 'relative';
      sortButton.style.zIndex = '51';
      sortButton.style.pointerEvents = 'auto';
    }

    document.addEventListener('click', handleSortClick, true);
    return () => {
      document.removeEventListener('click', handleSortClick, true);
      if (sortButton) {
        sortButton.style.position = '';
        sortButton.style.zIndex = '';
        sortButton.style.pointerEvents = '';
      }
    };
  }, [scenario, onNext, currentStep]);

  if (!scenario) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Build the overlay with cutouts for all spotlights
  const renderOverlay = () => {
    if (spotlightRects.length === 0) {
      return <div className="fixed inset-0 bg-black/75 z-40 pointer-events-none" />;
    }

    return (
      <div className="fixed inset-0 z-40 pointer-events-none">
        <svg width={vw} height={vh} className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width={vw} height={vh} fill="white" />
              {spotlightRects.map((sr, i) => (
                <rect
                  key={i}
                  x={sr.left}
                  y={sr.top}
                  width={sr.width}
                  height={sr.height}
                  rx="8"
                  ry="8"
                  fill="black"
                />
              ))}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width={vw}
            height={vh}
            fill="rgba(0,0,0,0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>
    );
  };

  // Render arrows from text box to each spotlight
  const renderArrows = () => {
    if (spotlightRects.length === 0 || !textBoxRef.current) return null;

    const textRect = textBoxRef.current.getBoundingClientRect();
    const textCenterX = textRect.left + textRect.width / 2;

    return (
      <svg
        className="fixed inset-0 z-45 pointer-events-none"
        style={{ zIndex: 45 }}
        width={vw}
        height={vh}
      >
        <defs>
          <marker
            id="arrowhead-tutorial"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#facc15" />
          </marker>
        </defs>
        {spotlightRects.map((sr, i) => {
          const spotCenterX = sr.left + sr.width / 2;
          const spotCenterY = sr.top + sr.height / 2;

          let startX: number, startY: number;
          let endX: number, endY: number;

          if (textRect.bottom < sr.top) {
            startX = textCenterX;
            startY = textRect.bottom + 4;
            endX = spotCenterX;
            endY = sr.top;
          } else if (textRect.top > sr.top + sr.height) {
            startX = textCenterX;
            startY = textRect.top - 4;
            endX = spotCenterX;
            endY = sr.top + sr.height;
          } else if (textRect.left > sr.left + sr.width) {
            startX = textRect.left - 4;
            startY = textRect.top + textRect.height / 2;
            endX = sr.left + sr.width;
            endY = spotCenterY;
          } else {
            startX = textRect.right + 4;
            startY = textRect.top + textRect.height / 2;
            endX = sr.left;
            endY = spotCenterY;
          }

          return (
            <line
              key={i}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#facc15"
              strokeWidth="2"
              strokeDasharray="6,4"
              markerEnd="url(#arrowhead-tutorial)"
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  };

  const isCompact = scenario.textPosition === 'top';
  const isSeqDefend = !!scenario.sequentialDefend;

  // Determine if "Next" button should be disabled
  const isNextDisabled = (() => {
    if (isSeqDefend) {
      return seqPhase !== 'done';
    }
    if (scenario.transferMechanic) {
      return transferPhase !== 'transferred' && transferPhase !== 'card-on-table';
    }
    if (scenario.requiredAction === 'click-card' && !cardClickHandledRef.current) return true;
    if (scenario.requiredAction === 'click-sort' && !sortClicked) return true;
    return false;
  })();

  // Render real defense card overlays on table attack cards
  const renderDefenseOverlay = () => {
    if (!isSeqDefend) return null;

    const preDefended = scenario.sequentialDefend?.preDefendedCards || [];
    const totalVisible = preDefended.length + defendedPairs;
    if (totalVisible === 0) return null;

    const hasPreDefended = preDefended.length > 0;
    // Keep overlays visible in 'done' phase only if noBitoAnimation (step 11 style)
    // For steps with bito animation (like step 12), overlays should disappear with the bito fly
    const keepVisible = scenario.sequentialDefend?.noBitoAnimation && seqPhase === 'done';
    if ((seqPhase === 'bito-fly' || seqPhase === 'done') && !keepVisible) return null;

    const tableArea = document.querySelector('[data-tutorial="table-area"]');
    if (!tableArea) return null;

    const pairElements = tableArea.querySelectorAll(':scope > div');
    const defenseCards = scenario.sequentialDefend!.defenseCards;

    const overlays: React.ReactNode[] = [];

    // Pre-defended cards (from previous step, shown from the start)
    preDefended.forEach((cardNotation, i) => {
      if (i >= pairElements.length) return;
      const pairRect = pairElements[i].getBoundingClientRect();
      overlays.push(
        <div
          key={`pre-defense-${i}`}
          className="fixed z-[55] pointer-events-none"
          style={{
            left: pairRect.left + 12,
            top: pairRect.top + 12,
            width: pairRect.width - 4,
            height: pairRect.height - 4,
          }}
        >
          <div className="w-full h-full rounded-lg overflow-hidden border-2 border-emerald-400/60 shadow-lg shadow-emerald-400/20">
            <MiniCardFace cardNotation={cardNotation} />
          </div>
        </div>
      );
    });

    // Player-defended cards (animated bounce-in)
    for (let i = 0; i < defendedPairs; i++) {
      const pairIdx = preDefended.length + i;
      if (pairIdx >= pairElements.length) break;
      const pairRect = pairElements[pairIdx].getBoundingClientRect();
      const cardNotation = defenseCards[i] || defenseCards[0];
      overlays.push(
        <div
          key={`defense-${i}`}
          className="fixed z-[55] pointer-events-none animate-bounce-in"
          style={{
            left: pairRect.left + 12,
            top: pairRect.top + 12,
            width: pairRect.width - 4,
            height: pairRect.height - 4,
          }}
        >
          <div className="w-full h-full rounded-lg overflow-hidden border-2 border-emerald-400 shadow-lg shadow-emerald-400/30">
            <MiniCardFace cardNotation={cardNotation} />
          </div>
        </div>
      );
    }

    return <>{overlays}</>;
  };

  // Render БИТО text overlay
  const renderBitoText = () => {
    if (seqPhase !== 'bito-text' && seqPhase !== 'bito-fly') return null;

    return (
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-3xl sm:text-5xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)] tracking-wider animate-bounce-in"
            style={{
              opacity: seqPhase === 'bito-fly' ? 0 : 1,
              transition: 'opacity 0.5s',
            }}
          >
            БИТО!
          </div>
        </div>
      </div>
    );
  };

  // Render bito-fly animation: card backs flying from table positions to discard area
  const renderBitoFlyAnimation = () => {
    if (seqPhase !== 'bito-fly') return null;

    const rects = tableCardRectsRef.current;
    if (rects.length === 0) return null;

    // Each table pair has 2 cards (attack + defense), so total flying cards = pairs * 2
    const flyingCards: { id: number; startLeft: number; startTop: number; w: number; h: number }[] = [];
    rects.forEach((r, i) => {
      // Attack card position
      flyingCards.push({ id: i * 2, startLeft: r.left, startTop: r.top, w: r.width, h: r.height });
      // Defense card position (offset)
      flyingCards.push({ id: i * 2 + 1, startLeft: r.left + 12, startTop: r.top + 12, w: r.width, h: r.height });
    });

    // Bito counter position (left side of screen for desktop, top-left for mobile)
    const isMobile = vw < 640;
    const bitoTargetLeft = isMobile ? 10 : 60;
    const bitoTargetTop = isMobile ? 10 : vh * 0.6;

    return (
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {flyingCards.map(card => {
          const isFlying = bitoFlyPhase === 'flying';
          const isDone = bitoFlyPhase === 'done';

          if (isDone) return null;

          return (
            <div
              key={card.id}
              className="absolute"
              style={{
                left: isFlying ? bitoTargetLeft : card.startLeft,
                top: isFlying ? bitoTargetTop : card.startTop,
                width: isFlying ? 40 : card.w,
                height: isFlying ? 60 : card.h,
                transition: 'all 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53)',
                opacity: isFlying ? 0.2 : 0.9,
                transform: isFlying
                  ? `rotate(${(card.id - 1) * 15}deg) scale(0.4)`
                  : 'rotate(0deg) scale(1)',
                zIndex: 100 + card.id,
              }}
            >
              <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border border-amber-700/30">
                <img src={CARD_BACK_CUSTOM_URL} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Overlay with spotlight cutouts */}
      {renderOverlay()}

      {/* Spotlight border glows */}
      {spotlightRects.map((sr, i) => (
        <div
          key={i}
          className="fixed border-3 border-yellow-400 rounded-lg z-50 pointer-events-none transition-all duration-300"
          style={{
            left: sr.left,
            top: sr.top,
            width: sr.width,
            height: sr.height,
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.5), inset 0 0 20px rgba(250, 204, 21, 0.1)',
          }}
        />
      ))}

      {/* Arrows from text to spotlights */}
      {scenario.showArrows !== false && renderArrows()}

      {/* Custom arrows between game elements (e.g. clockwise direction) */}
      {scenario.customArrows && scenario.customArrows.length > 0 && (() => {
        // Resolve elements: support "opponent-info:N" syntax for nth opponent
        const resolveElement = (selector: string): Element | null => {
          const nthMatch = selector.match(/\[data-tutorial="opponent-info"\]:nth-of-type\((\d+)\)/);
          if (nthMatch) {
            const idx = parseInt(nthMatch[1]) - 1;
            const allOpponents = document.querySelectorAll('[data-tutorial="opponent-info"]');
            return allOpponents[idx] || null;
          }
          return document.querySelector(selector);
        };

        // Get text box rect for avoidance
        const textBoxRect = textBoxRef.current?.getBoundingClientRect();

        // Build curved path data for each arrow
        const pathData: { d: string; color: string }[] = [];
        scenario.customArrows!.forEach((arrow) => {
          const fromEl = resolveElement(arrow.from);
          const toEl = resolveElement(arrow.to);
          if (!fromEl || !toEl) return;
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();
          const fromCX = fromRect.left + fromRect.width / 2;
          const fromCY = fromRect.top + fromRect.height / 2;
          const toCX = toRect.left + toRect.width / 2;
          const toCY = toRect.top + toRect.height / 2;

          const fromIsBottom = fromCY > vh * 0.6;
          const toIsBottom = toCY > vh * 0.6;
          const fromIsTop = fromCY < vh * 0.4;
          const toIsTop = toCY < vh * 0.4;

          if (fromIsTop && toIsTop) {
            // Both in top row (opponent to opponent) — short curved arrow under their icons
            const startX = fromRect.right - 4;
            const startY = fromRect.bottom + 8;
            const endX = toRect.left + 4;
            const endY = toRect.bottom + 8;
            // Curve downward for clockwise feel
            const midX = (startX + endX) / 2;
            const cpY = Math.max(startY, endY) + 25;
            const d = `M ${startX} ${startY} Q ${midX} ${cpY} ${endX} ${endY}`;
            pathData.push({ d, color: arrow.color || '#facc15' });
          } else if (fromIsTop && toIsBottom) {
            // Top-right opponent → player hand: go down on the RIGHT side, around text box
            const startX = fromRect.right + 4;
            const startY = fromCY + 10;
            const endX = toRect.right - 20;
            const endY = toRect.top - 6;

            if (textBoxRect) {
              // Route around the right edge of the text box
              const tbRight = textBoxRect.right + 30;
              const tbTop = textBoxRect.top;
              const tbBottom = textBoxRect.bottom;
              // Go from start → right of text box top → right of text box bottom → end
              const d = `M ${startX} ${startY} C ${tbRight + 20} ${startY + 40}, ${tbRight + 20} ${tbBottom - 40}, ${endX} ${endY}`;
              pathData.push({ d, color: arrow.color || '#facc15' });
            } else {
              const d = `M ${startX} ${startY} C ${startX + 60} ${(startY + endY) / 2}, ${endX + 60} ${(startY + endY) / 2}, ${endX} ${endY}`;
              pathData.push({ d, color: arrow.color || '#facc15' });
            }
          } else if (fromIsBottom && toIsTop) {
            // Player hand → top-left opponent: go up on the LEFT side, around text box
            const startX = toRect.left + 20;
            const startY = toRect.top - 6;
            const endX = toRect.left - 4;
            const endY = toCY + 10;
            // Actually: from = player hand (bottom), to = top-left opponent
            const sX = fromRect.left + 20;
            const sY = fromRect.top - 6;
            const eX = toRect.left - 4;
            const eY = toCY + 10;

            if (textBoxRect) {
              // Route around the left edge of the text box
              const tbLeft = textBoxRect.left - 30;
              const tbTop = textBoxRect.top;
              const tbBottom = textBoxRect.bottom;
              // Go from start → left of text box bottom → left of text box top → end
              const d = `M ${sX} ${sY} C ${tbLeft - 20} ${sY - 40}, ${tbLeft - 20} ${eY + 40}, ${eX} ${eY}`;
              pathData.push({ d, color: arrow.color || '#facc15' });
            } else {
              const d = `M ${sX} ${sY} C ${sX - 60} ${(sY + eY) / 2}, ${eX - 60} ${(sY + eY) / 2}, ${eX} ${eY}`;
              pathData.push({ d, color: arrow.color || '#facc15' });
            }
          } else {
            // Fallback: simple curved arrow
            const startX = fromCX;
            const startY = fromRect.bottom + 6;
            const endX = toCX;
            const endY = toRect.top - 6;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const dx = endX - startX;
            const dy = endY - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const curveAmount = Math.min(dist * 0.25, 30);
            const cpX = midX + (dy / dist) * curveAmount;
            const cpY = midY - (dx / dist) * curveAmount;
            const d = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
            pathData.push({ d, color: arrow.color || '#facc15' });
          }
        });

        if (pathData.length === 0) return null;
        return (
          <svg
            className="fixed inset-0 z-[55] pointer-events-none"
            width={vw}
            height={vh}
          >
            <defs>
              <marker
                id="arrowhead-custom"
                markerWidth="12"
                markerHeight="8"
                refX="12"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 12 4, 0 8" fill="#facc15" />
              </marker>
            </defs>
            {pathData.map((p, i) => (
              <path
                key={i}
                d={p.d}
                stroke={p.color}
                strokeWidth="3"
                strokeDasharray="8,5"
                fill="none"
                markerEnd="url(#arrowhead-custom)"
                opacity="0.9"
              />
            ))}
          </svg>
        );
      })()}

      {/* Arrow from table area to Next button after noBito sequential defend */}
      {isSeqDefend && seqPhase === 'done' && scenario.sequentialDefend?.showArrowToNextButton && (() => {
        const tableArea = document.querySelector('[data-tutorial="table-area"]');
        const nextBtn = textBoxRef.current?.querySelector('button:last-child');
        if (!tableArea || !nextBtn) return null;
        const tableRect = tableArea.getBoundingClientRect();
        const textBoxRect = textBoxRef.current?.getBoundingClientRect();
        const startX = tableRect.right;
        const startY = tableRect.top;
        // End at the bottom-right corner of the text box area (near the Next button)
        const endX = (textBoxRect ? textBoxRect.right + 4 : 200);
        const endY = (textBoxRect ? textBoxRect.bottom - 8 : 200);
        return (
          <svg
            className="fixed inset-0 z-[55] pointer-events-none"
            width={vw}
            height={vh}
          >
            <defs>
              <marker
                id="arrowhead-next-btn"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
              </marker>
            </defs>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              markerEnd="url(#arrowhead-next-btn)"
              opacity="0.9"
            />
          </svg>
        );
      })()}

      {/* Defense overlay on table cards — real card images */}
      {renderDefenseOverlay()}

      {/* БИТО text overlay */}
      {renderBitoText()}

      {/* Bito fly animation — cards flying to discard */}
      {renderBitoFlyAnimation()}

      {/* Auto-defend success overlay (legacy) */}
      {autoDefendActive && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="bg-emerald-900/90 border-2 border-emerald-400 rounded-2xl px-8 py-6 text-center animate-bounce-in shadow-2xl">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-emerald-300 font-bold text-lg">Отбито!</p>
            <p className="text-emerald-200/70 text-sm mt-1">Карты побили сами себя</p>
          </div>
        </div>
      )}

      {/* Text panel */}
      <div
        ref={textBoxRef}
        className={`fixed z-50 bg-slate-900/95 border-2 border-yellow-400/80 rounded-xl shadow-2xl backdrop-blur-sm ${isCompact ? 'p-2.5 sm:p-3' : 'p-4 sm:p-5'}`}
        style={{
          top: textPos.top,
          left: textPos.left,
          maxWidth: textPos.maxWidth,
          width: textPos.maxWidth,
          opacity: (autoDefendActive || seqPhase === 'bito-text' || seqPhase === 'bito-fly' || transferPhase === 'card-on-table') ? 0.3 : 1,
          transition: 'opacity 0.3s',
        }}
      >
        <div className={`flex justify-between items-start ${isCompact ? 'mb-1.5' : 'mb-3'}`}>
          <div>
            <h3 className={`font-bold text-yellow-400 ${isCompact ? 'text-sm sm:text-base mb-0' : 'text-base sm:text-lg mb-0.5'}`}>{scenario.title}</h3>
            <p className={`text-gray-400 ${isCompact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'}`}>Шаг {currentStep + 1} из {totalSteps}</p>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white transition ml-2 shrink-0"
          >
            <X size={isCompact ? 14 : 18} />
          </button>
        </div>

        <p className={`text-white leading-relaxed whitespace-pre-line ${isCompact ? 'mb-1.5 text-[10px] sm:text-xs' : 'mb-3 text-xs sm:text-sm'}`}
          dangerouslySetInnerHTML={{ __html: scenario.text.replace(/<red>(.*?)<\/red>/g, '<span class="text-red-500 font-bold">$1</span>').replace(/\n/g, '<br/>') }}
        />

        {scenario.instruction && (
          <p className={`text-yellow-300 italic ${isCompact ? 'text-[9px] sm:text-[10px] mb-1.5' : 'text-[10px] sm:text-xs mb-3'}`}>{scenario.instruction}</p>
        )}

        {/* Progress bar */}
        <div className={`w-full bg-gray-700 rounded-full ${isCompact ? 'h-1 mb-1.5' : 'h-1.5 mb-3'}`}>
          <div
            className={`bg-yellow-400 rounded-full transition-all duration-300 ${isCompact ? 'h-1' : 'h-1.5'}`}
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>



        {/* Navigation buttons */}
        <div className="flex gap-2 justify-between">
          <Button
            onClick={onPrevious}
            disabled={currentStep === 0}
            variant="outline"
            size={isCompact ? 'xs' as any : 'sm'}
            className={`flex items-center gap-1 ${isCompact ? 'text-[10px] h-6 px-2' : 'text-xs'}`}
          >
            <ChevronLeft size={isCompact ? 10 : 14} />
            Назад
          </Button>

          <Button
            onClick={onNext}
            variant="default"
            size={isCompact ? 'xs' as any : 'sm'}
            className={`flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold ${isCompact ? 'text-[10px] h-6 px-2' : 'text-xs'}`}
            disabled={isNextDisabled}
          >
            Далее
            <ChevronRight size={isCompact ? 10 : 14} />
          </Button>
        </div>
      </div>

      {/* Floating transfer button above player hand */}
      {scenario.transferMechanic && transferPhase === 'card-selected' && (() => {
        const playerHand = document.querySelector('[data-tutorial="player-hand"]');
        if (!playerHand) return null;
        const handRect = playerHand.getBoundingClientRect();
        return (
          <div
            className="fixed z-[65] flex justify-center animate-bounce-in"
            style={{
              left: handRect.left,
              top: handRect.top - 48,
              width: handRect.width,
            }}
          >
            <Button
              onClick={() => {
                setTransferPhase('transferring');
                // Hide the transfer card from hand
                if (tutorialHighlightIds) {
                  tutorialHighlightIds.forEach(cardId => {
                    const el = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
                    if (el) {
                      el.style.transition = 'all 0.3s ease-out';
                      el.style.opacity = '0';
                      el.style.transform = 'scale(0.5)';
                      el.style.pointerEvents = 'none';
                      hiddenCardElementsRef.current.push(el);
                    }
                  });
                }
                // After card disappears from hand, show it on table + message
                setTimeout(() => {
                  setTransferPhase('card-on-table');
                  // After 2 seconds, hide message and enable Next
                  setTimeout(() => {
                    setTransferPhase('transferred');
                  }, 2000);
                }, 400);
              }}
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2 shadow-lg shadow-emerald-500/30"
            >
              Перевести
            </Button>
          </div>
        );
      })()}

      {/* Transferred card rendered on table */}
      {scenario.transferMechanic && (transferPhase === 'card-on-table' || transferPhase === 'transferred') && (() => {
        const tableArea = document.querySelector('[data-tutorial="table-area"]');
        if (!tableArea) return null;
        const tableRect = tableArea.getBoundingClientRect();
        // Find an existing card on the table to match its size
        const existingTableCard = tableArea.querySelector('.relative > div, .relative > img') as HTMLElement;
        const existingCardParent = tableArea.querySelector('.relative') as HTMLElement;
        let cardW = 56;
        let cardH = 84;
        let gap = 8;
        if (existingCardParent) {
          const r = existingCardParent.getBoundingClientRect();
          cardW = r.width;
          cardH = r.height;
        }
        // Position: right after the last card with a small gap
        const cardNotation = scenario.transferMechanic!.transferCard;
        return (
          <div
            className="fixed z-[52] animate-bounce-in"
            style={{
              left: tableRect.right + gap,
              top: tableRect.top + (tableRect.height - cardH) / 2,
              width: cardW,
              height: cardH,
            }}
          >
            <MiniCardFace cardNotation={cardNotation} />
          </div>
        );
      })()}

      {/* Transfer success message overlay (disappears after 2s) */}
      {scenario.transferMechanic && transferPhase === 'card-on-table' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="bg-emerald-900/90 border-2 border-emerald-400 rounded-2xl px-8 py-6 text-center animate-bounce-in shadow-2xl">
            <div className="text-4xl mb-2">↩️</div>
            <p className="text-emerald-300 font-bold text-lg">Перевод!</p>
            <p className="text-emerald-200/70 text-sm mt-1">Вы перевели ход на игрока "{scenario.transferMechanic.targetBotName}",<br/>теперь бьется этот игрок</p>
          </div>
        </div>
      )}
    </>
  );
}
