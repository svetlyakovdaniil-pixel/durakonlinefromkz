import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TutorialScenario } from '@/hooks/useInteractiveTutorial';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface TutorialStepDisplayProps {
  scenario: TutorialScenario | null;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onCardClick?: (cardId: string) => void;
}

interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function TutorialStepDisplay({
  scenario,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onCardClick,
}: TutorialStepDisplayProps) {
  const [spotlightRects, setSpotlightRects] = useState<SpotlightRect[]>([]);
  const [textPos, setTextPos] = useState<{ top: number; left: number; maxWidth: number }>({
    top: 0,
    left: 0,
    maxWidth: 400,
  });
  const cardClickHandledRef = useRef(false);
  const textBoxRef = useRef<HTMLDivElement>(null);

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
    if (scenario.textPosition === 'center' || rects.length === 0) {
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

  // Handle card clicks for interactive scenarios
  useEffect(() => {
    if (!scenario || scenario.requiredAction !== 'click-card' || !scenario.targetCard) {
      return;
    }

    cardClickHandledRef.current = false;

    const handleCardClick = (e: Event) => {
      if (cardClickHandledRef.current) return;

      const target = e.target as HTMLElement;
      const cardElement = target.closest('[data-card-id]');

      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');

        if (cardId && scenario.targetCard && cardId.includes(scenario.targetCard)) {
          cardClickHandledRef.current = true;
          onCardClick?.(cardId);

          setTimeout(() => {
            onNext();
          }, 500);
        }
      }
    };

    document.addEventListener('click', handleCardClick, true);
    return () => document.removeEventListener('click', handleCardClick, true);
  }, [scenario, onNext, onCardClick]);

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
      {renderArrows()}

      {/* Text panel */}
      <div
        ref={textBoxRef}
        className="fixed z-50 bg-slate-900/95 border-2 border-yellow-400/80 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm"
        style={{
          top: textPos.top,
          left: textPos.left,
          maxWidth: textPos.maxWidth,
          width: textPos.maxWidth,
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-yellow-400 mb-0.5">{scenario.title}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400">Шаг {currentStep + 1} из {totalSteps}</p>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white transition ml-2 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-white mb-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{scenario.text}</p>

        {scenario.instruction && (
          <p className="text-yellow-300 text-[10px] sm:text-xs mb-3 italic">{scenario.instruction}</p>
        )}

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-3">
          <div
            className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2 justify-between">
          <Button
            onClick={onPrevious}
            disabled={currentStep === 0}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs"
          >
            <ChevronLeft size={14} />
            Назад
          </Button>

          <Button
            onClick={onNext}
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs"
            disabled={scenario.requiredAction === 'click-card' && !cardClickHandledRef.current}
          >
            {currentStep === totalSteps - 1 ? 'Завершить' : 'Далее'}
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </>
  );
}
