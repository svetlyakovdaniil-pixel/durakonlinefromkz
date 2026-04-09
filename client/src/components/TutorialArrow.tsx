import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TutorialArrowProps {
  targetElement: HTMLElement | null;
  position: 'top' | 'bottom' | 'left' | 'right';
  label: string;
  offset?: { x: number; y: number };
}

export default function TutorialArrow({
  targetElement,
  position,
  label,
  offset = { x: 0, y: 0 },
}: TutorialArrowProps) {
  const [arrowPosition, setArrowPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!targetElement) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      let top = rect.top + scrollTop;
      let left = rect.left + scrollLeft;

      const arrowWidth = 120;
      const arrowHeight = 40;
      const gap = 20;

      switch (position) {
        case 'top':
          top = rect.top + scrollTop - arrowHeight - gap;
          left = rect.left + scrollLeft + rect.width / 2 - arrowWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + scrollTop + gap;
          left = rect.left + scrollLeft + rect.width / 2 - arrowWidth / 2;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2 - arrowHeight / 2;
          left = rect.left + scrollLeft - arrowWidth - gap;
          break;
        case 'right':
          top = rect.top + scrollTop + rect.height / 2 - arrowHeight / 2;
          left = rect.right + scrollLeft + gap;
          break;
      }

      setArrowPosition({
        top: top + offset.y,
        left: left + offset.x,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetElement, position, offset]);

  if (!arrowPosition) return null;

  const getArrowIcon = () => {
    switch (position) {
      case 'top':
        return <ChevronUp className="w-6 h-6" />;
      case 'bottom':
        return <ChevronDown className="w-6 h-6" />;
      case 'left':
        return <ChevronLeft className="w-6 h-6" />;
      case 'right':
        return <ChevronRight className="w-6 h-6" />;
    }
  };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        top: `${arrowPosition.top}px`,
        left: `${arrowPosition.left}px`,
      }}
    >
      <div className="flex flex-col items-center gap-2 animate-bounce">
        <div className="text-amber-300 font-semibold text-sm bg-[#1a2d45] px-3 py-2 rounded border border-amber-700/50 whitespace-nowrap">
          {label}
        </div>
        <div className="text-amber-400">{getArrowIcon()}</div>
      </div>
    </div>
  );
}
