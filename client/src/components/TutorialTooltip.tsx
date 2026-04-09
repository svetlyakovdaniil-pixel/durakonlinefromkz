import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface TutorialTooltipProps {
  targetElement: HTMLElement | null;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  isActive: boolean;
}

export function TutorialTooltip({
  targetElement,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  isActive,
}: TutorialTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || !targetElement || !tooltipRef.current) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      if (!tooltipRect) return;

      // Position tooltip to the right of the target, or below if not enough space
      let top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      let left = rect.right + 20;

      // Adjust if tooltip goes off-screen
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = rect.left - tooltipRect.width - 20;
      }

      if (top < 10) {
        top = rect.top + rect.height + 10;
      } else if (top + tooltipRect.height > window.innerHeight - 10) {
        top = rect.top - tooltipRect.height - 10;
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isActive, targetElement]);

  if (!isActive) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[95] bg-slate-900 border border-amber-600/60 rounded-lg shadow-2xl p-4 max-w-sm"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Title */}
      <h3 className="text-amber-100 font-bold text-lg mb-2">{title}</h3>

      {/* Description */}
      <p className="text-amber-200/80 text-sm mb-4 leading-relaxed">{description}</p>

      {/* Progress and buttons */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-300/60 font-semibold">
          Шаг {currentStep} из {totalSteps}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-amber-200/70 text-sm font-semibold transition-colors"
          >
            Пропустить
          </button>
          <button
            onClick={onNext}
            className="px-3 py-1.5 rounded-lg bg-amber-600/60 hover:bg-amber-600/80 text-white text-sm font-semibold transition-colors flex items-center gap-1"
          >
            Далее
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
