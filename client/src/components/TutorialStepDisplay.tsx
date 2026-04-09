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
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [textPosition, setTextPosition] = useState<{ top: number; left: number; maxWidth: number }>({
    top: 0,
    left: 0,
    maxWidth: 400,
  });
  const cardClickHandledRef = useRef(false);
  const textBoxRef = useRef<HTMLDivElement>(null);

  // Calculate spotlight position and text position
  const updatePositions = useCallback(() => {
    if (!scenario?.highlightElement) {
      setSpotlightRect(null);
      // Center the text box when no spotlight
      setTextPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 200,
        maxWidth: 400,
      });
      return;
    }

    const element = document.querySelector(scenario.highlightElement);
    if (!element) {
      setSpotlightRect(null);
      setTextPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 200,
        maxWidth: 400,
      });
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;
    const sr: SpotlightRect = {
      left: rect.left - padding,
      top: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
    setSpotlightRect(sr);

    // Calculate text position near the spotlight
    const textBoxWidth = Math.min(380, window.innerWidth - 32);
    const textBoxHeight = 260; // approximate
    const gap = 16;

    let textTop = 0;
    let textLeft = 0;

    // Determine best position: above, below, left, or right of spotlight
    const spaceAbove = sr.top;
    const spaceBelow = window.innerHeight - (sr.top + sr.height);
    const spaceLeft = sr.left;
    const spaceRight = window.innerWidth - (sr.left + sr.width);

    if (spaceBelow >= textBoxHeight + gap) {
      // Place below
      textTop = sr.top + sr.height + gap;
      textLeft = Math.max(16, Math.min(sr.left + sr.width / 2 - textBoxWidth / 2, window.innerWidth - textBoxWidth - 16));
    } else if (spaceAbove >= textBoxHeight + gap) {
      // Place above
      textTop = sr.top - textBoxHeight - gap;
      textLeft = Math.max(16, Math.min(sr.left + sr.width / 2 - textBoxWidth / 2, window.innerWidth - textBoxWidth - 16));
    } else if (spaceRight >= textBoxWidth + gap) {
      // Place to the right
      textTop = Math.max(16, Math.min(sr.top + sr.height / 2 - textBoxHeight / 2, window.innerHeight - textBoxHeight - 16));
      textLeft = sr.left + sr.width + gap;
    } else if (spaceLeft >= textBoxWidth + gap) {
      // Place to the left
      textTop = Math.max(16, Math.min(sr.top + sr.height / 2 - textBoxHeight / 2, window.innerHeight - textBoxHeight - 16));
      textLeft = sr.left - textBoxWidth - gap;
    } else {
      // Fallback: place at center bottom
      textTop = window.innerHeight - textBoxHeight - 16;
      textLeft = Math.max(16, window.innerWidth / 2 - textBoxWidth / 2);
    }

    setTextPosition({ top: textTop, left: textLeft, maxWidth: textBoxWidth });
  }, [scenario?.highlightElement]);

  useEffect(() => {
    updatePositions();
    // Recalculate on resize
    window.addEventListener('resize', updatePositions);
    // Also recalculate after a short delay (elements may still be rendering)
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

    // Reset the flag when scenario changes
    cardClickHandledRef.current = false;

    const handleCardClick = (e: Event) => {
      if (cardClickHandledRef.current) return;

      const target = e.target as HTMLElement;
      const cardElement = target.closest('[data-card-id]');

      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');

        // Check if this is the target card
        if (cardId && scenario.targetCard && cardId.includes(scenario.targetCard)) {
          cardClickHandledRef.current = true;
          onCardClick?.(cardId);

          // Auto-advance after a short delay
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

  // Build the overlay with a cutout for the spotlight
  const renderOverlay = () => {
    if (!spotlightRect) {
      // Full dark overlay
      return <div className="fixed inset-0 bg-black/75 z-40 pointer-events-none" />;
    }

    // Use CSS clip-path to create a cutout
    const { left, top, width, height } = spotlightRect;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    return (
      <div className="fixed inset-0 z-40 pointer-events-none">
        <svg width={vw} height={vh} className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width={vw} height={vh} fill="white" />
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                rx="8"
                ry="8"
                fill="black"
              />
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

  // Render arrow pointing from text to spotlight
  const renderArrow = () => {
    if (!spotlightRect || !textBoxRef.current) return null;

    const textRect = textBoxRef.current.getBoundingClientRect();
    const spotCenterX = spotlightRect.left + spotlightRect.width / 2;
    const spotCenterY = spotlightRect.top + spotlightRect.height / 2;
    const textCenterX = textRect.left + textRect.width / 2;
    const textCenterY = textRect.top + textRect.height / 2;

    // Determine which edge of the text box is closest to the spotlight
    let startX: number, startY: number;
    let endX: number, endY: number;

    if (textRect.bottom < spotlightRect.top) {
      // Text is above spotlight
      startX = textCenterX;
      startY = textRect.bottom;
      endX = spotCenterX;
      endY = spotlightRect.top;
    } else if (textRect.top > spotlightRect.top + spotlightRect.height) {
      // Text is below spotlight
      startX = textCenterX;
      startY = textRect.top;
      endX = spotCenterX;
      endY = spotlightRect.top + spotlightRect.height;
    } else if (textRect.left > spotlightRect.left + spotlightRect.width) {
      // Text is to the right
      startX = textRect.left;
      startY = textCenterY;
      endX = spotlightRect.left + spotlightRect.width;
      endY = spotCenterY;
    } else {
      // Text is to the left
      startX = textRect.right;
      startY = textCenterY;
      endX = spotlightRect.left;
      endY = spotCenterY;
    }

    return (
      <svg
        className="fixed inset-0 z-50 pointer-events-none"
        width={window.innerWidth}
        height={window.innerHeight}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#facc15" />
          </marker>
        </defs>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#facc15"
          strokeWidth="2"
          strokeDasharray="6,4"
          markerEnd="url(#arrowhead)"
          className="animate-pulse"
        />
      </svg>
    );
  };

  return (
    <>
      {/* Overlay with spotlight cutout */}
      {renderOverlay()}

      {/* Spotlight border glow */}
      {spotlightRect && (
        <div
          className="fixed border-3 border-yellow-400 rounded-lg z-50 pointer-events-none transition-all duration-300"
          style={{
            left: spotlightRect.left,
            top: spotlightRect.top,
            width: spotlightRect.width,
            height: spotlightRect.height,
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.5), inset 0 0 20px rgba(250, 204, 21, 0.1)',
          }}
        />
      )}

      {/* Arrow from text to spotlight */}
      {renderArrow()}

      {/* Text panel positioned near the spotlight */}
      <div
        ref={textBoxRef}
        className="fixed z-50 bg-slate-900/95 border-2 border-yellow-400/80 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm"
        style={{
          top: textPosition.top,
          left: textPosition.left,
          maxWidth: textPosition.maxWidth,
          width: textPosition.maxWidth,
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

        <p className="text-white mb-3 text-xs sm:text-sm leading-relaxed">{scenario.text}</p>

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
