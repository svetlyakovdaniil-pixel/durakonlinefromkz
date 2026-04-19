import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface TutorialHintProps {
  title: string;
  description: string;
  situation: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export default function TutorialHint({
  title,
  description,
  situation,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}: TutorialHintProps) {
  const { t, locale } = useTranslation();

  const stepLabel = locale === 'kk'
      ? `Қадам ${currentStep} / ${totalSteps}`
      : locale === 'en'
        ? `Step ${currentStep} of ${totalSteps}`
        : `Шаг ${currentStep} из ${totalSteps}`;

  const descLabel = t('tutorial.descLabel');
  const situationLabel = t('tutorial.situationLabel');
  const backLabel = t('common.back');
  const nextLabel = currentStep === totalSteps ? t('tutorial.finish') : t('tutorial.next');

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-40 bg-[#1a2d45] border-2 border-amber-700/50 rounded-lg p-4 shadow-2xl max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-amber-300 font-bold text-lg">{title}</h3>
          <p className="text-amber-200/70 text-xs mt-1">{stepLabel}</p>
        </div>
        <button
          onClick={onSkip}
          className="text-amber-200/50 hover:text-amber-100 transition-colors flex-shrink-0 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#0a1628] rounded-full h-1.5 mb-3">
        <div
          className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-amber-100 text-sm font-semibold mb-1">{descLabel}</p>
          <p className="text-amber-100/80 text-sm">{description}</p>
        </div>

        <div>
          <p className="text-amber-100 text-sm font-semibold mb-1">{situationLabel}</p>
          <p className="text-amber-100/80 text-sm">{situation}</p>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onPrevious}
          disabled={currentStep === 1}
          variant="outline"
          size="sm"
          className="flex-1 border-amber-700/30 text-amber-200 hover:bg-[#0a1628] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {backLabel}
        </Button>

        <Button
          onClick={onNext}
          disabled={currentStep === totalSteps}
          size="sm"
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
