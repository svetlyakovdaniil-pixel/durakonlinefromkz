import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TutorialScenario } from '@/hooks/useInteractiveTutorial';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import type { ClientGameState } from '../../../shared/gameTypes';

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

// Sequential defend phases
type SeqDefendPhase = 'waiting' | 'defend1' | 'defend2' | 'bito-pause' | 'bito-anim' | 'done';

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
  const [defendedPairs, setDefendedPairs] = useState<number>(0); // how many pairs have been defended
  const seqClickCountRef = useRef(0);

  // Reset sequential defend state when step changes
  useEffect(() => {
    setSeqPhase('waiting');
    setDefendedPairs(0);
    seqClickCountRef.current = 0;
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

    for (const selector of scenario.highlightElements) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Skip elements that are hidden (zero size) - e.g. sm:hidden on desktop
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
      // Position at top of screen, 20% smaller
      const textBoxWidth = Math.min(336, window.innerWidth - 32);
      setTextPos({
        top: 12,
        left: window.innerWidth / 2 - textBoxWidth / 2,
        maxWidth: textBoxWidth,
      });
    } else if (scenario.textPosition === 'center' || rects.length === 0) {
      // Center the text box on screen
      const textBoxWidth = Math.min(420, window.innerWidth - 32);
      setTextPos({
        top: window.innerHeight / 2 - 140,
        left: window.innerWidth / 2 - textBoxWidth / 2,
        maxWidth: textBoxWidth,
      });
    } else if (rects.length === 1) {
      // Auto-position near the single spotlight
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
      // Multiple spotlights: center the text between them
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

    cardClickHandledRef.current = false;
    setAutoDefendActive(false);

    const handleCardClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const cardElement = target.closest('[data-card-id]');

      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');

        if (cardId && scenario.targetCard && cardId.includes(scenario.targetCard)) {
          // Sequential defend mode
          if (scenario.sequentialDefend) {
            const totalDefenses = scenario.sequentialDefend.defenseCards.length;
            seqClickCountRef.current += 1;
            const clickNum = seqClickCountRef.current;

            if (clickNum <= totalDefenses) {
              // Update defended pairs count
              setDefendedPairs(clickNum);

              // Hide the clicked card from hand visually
              const clickedEl = cardElement as HTMLElement;
              clickedEl.style.opacity = '0';
              clickedEl.style.transform = 'translateY(-40px) scale(0.5)';
              clickedEl.style.transition = 'all 0.4s ease-out';
              clickedEl.style.pointerEvents = 'none';

              if (clickNum === 1) {
                setSeqPhase('defend1');
              }

              if (clickNum >= totalDefenses) {
                // All cards defended — start bito sequence
                cardClickHandledRef.current = true;
                setSeqPhase('defend2');

                // After 2 seconds, show bito animation
                setTimeout(() => {
                  setSeqPhase('bito-anim');
                }, 2000);

                // After 3.5 seconds total, mark as done
                setTimeout(() => {
                  setSeqPhase('done');
                }, 3500);
              }
            }
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
  }, [scenario, onNext, onCardClick, currentStep]);

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

          // Determine arrow direction based on relative position
          if (textRect.bottom < sr.top) {
            // Text is above spotlight → arrow goes down
            startX = textCenterX;
            startY = textRect.bottom + 4;
            endX = spotCenterX;
            endY = sr.top;
          } else if (textRect.top > sr.top + sr.height) {
            // Text is below spotlight → arrow goes up
            startX = textCenterX;
            startY = textRect.top - 4;
            endX = spotCenterX;
            endY = sr.top + sr.height;
          } else if (textRect.left > sr.left + sr.width) {
            // Text is to the right → arrow goes left
            startX = textRect.left - 4;
            startY = textRect.top + textRect.height / 2;
            endX = sr.left + sr.width;
            endY = spotCenterY;
          } else {
            // Text is to the left → arrow goes right
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
      // For sequential defend, button is disabled until bito animation completes
      return seqPhase !== 'done';
    }
    if (scenario.requiredAction === 'click-card' && !cardClickHandledRef.current) return true;
    if (scenario.requiredAction === 'click-sort' && !sortClicked) return true;
    return false;
  })();

  // Render defense overlay on table cards for sequential defend
  const renderDefenseOverlay = () => {
    if (!isSeqDefend || defendedPairs === 0) return null;

    // Find table-area element to position defense cards
    const tableArea = document.querySelector('[data-tutorial="table-area"]');
    if (!tableArea) return null;

    const tableRect = tableArea.getBoundingClientRect();
    // Find individual battle pair containers inside table area
    const pairElements = tableArea.querySelectorAll(':scope > div');

    return (
      <>
        {Array.from(pairElements).slice(0, defendedPairs).map((pairEl, i) => {
          const pairRect = pairEl.getBoundingClientRect();
          return (
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
              <div className="w-full h-full rounded-lg border-2 border-emerald-400 bg-emerald-900/40 flex items-center justify-center">
                <span className="text-emerald-300 font-bold text-xs">✓</span>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Render bito animation overlay
  const renderBitoAnimation = () => {
    if (seqPhase !== 'bito-anim') return null;

    return (
      <div className="fixed inset-0 z-[70] pointer-events-none">
        {/* Cards flying to discard */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl sm:text-5xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)] tracking-wider animate-bounce-in">
            БИТО!
          </div>
        </div>
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

      {/* Defense overlay on table cards */}
      {renderDefenseOverlay()}

      {/* Bito animation */}
      {renderBitoAnimation()}

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
          opacity: (autoDefendActive || seqPhase === 'bito-anim') ? 0.3 : 1,
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

        <p className={`text-white leading-relaxed whitespace-pre-line ${isCompact ? 'mb-1.5 text-[10px] sm:text-xs' : 'mb-3 text-xs sm:text-sm'}`}>{scenario.text}</p>

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
            {currentStep === totalSteps - 1 ? 'Завершить' : 'Далее'}
            <ChevronRight size={isCompact ? 10 : 14} />
          </Button>
        </div>
      </div>
    </>
  );
}
