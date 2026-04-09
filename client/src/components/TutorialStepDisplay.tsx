import React, { useEffect, useRef } from 'react';
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

export default function TutorialStepDisplay({
  scenario,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onCardClick,
}: TutorialStepDisplayProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const cardClickHandledRef = useRef(false);

  useEffect(() => {
    if (scenario?.highlightElement) {
      const element = document.querySelector(scenario.highlightElement);
      if (element && highlightRef.current) {
        const rect = element.getBoundingClientRect();
        highlightRef.current.style.left = `${rect.left}px`;
        highlightRef.current.style.top = `${rect.top}px`;
        highlightRef.current.style.width = `${rect.width}px`;
        highlightRef.current.style.height = `${rect.height}px`;
      }
    }
  }, [scenario?.highlightElement]);

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

  return (
    <>
      {/* Затемнение */}
      <div className="fixed inset-0 bg-black/70 z-40 pointer-events-none" />

      {/* Spotlight - выделенная область */}
      {scenario.highlightElement && (
        <div
          ref={highlightRef}
          className="fixed border-4 border-yellow-400 rounded-lg z-50 pointer-events-none shadow-lg"
          style={{
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.5)',
          }}
        />
      )}

      {/* Текст и кнопки */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-yellow-400 mb-1">{scenario.title}</h3>
            <p className="text-xs text-gray-400">Шаг {currentStep + 1} из {totalSteps}</p>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-white mb-4 text-sm leading-relaxed">{scenario.text}</p>

        {scenario.instruction && (
          <p className="text-yellow-300 text-xs mb-4 italic">{scenario.instruction}</p>
        )}

        {/* Прогресс-бар */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Кнопки навигации */}
        <div className="flex gap-2 justify-between">
          <Button
            onClick={onPrevious}
            disabled={currentStep === 0}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Назад
          </Button>

          <Button
            onClick={onNext}
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            disabled={scenario.requiredAction === 'click-card' && !cardClickHandledRef.current}
          >
            {currentStep === totalSteps - 1 ? 'Завершить' : 'Далее'}
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Стрелка на выделенный элемент */}
      {scenario.highlightElement && (
        <div className="fixed z-50 pointer-events-none">
          <svg
            className="w-12 h-12 text-yellow-400 animate-bounce"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{
              left: 'calc(50% + 100px)',
              top: 'calc(50% - 100px)',
            }}
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
      )}
    </>
  );
}
