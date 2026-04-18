import { memo } from 'react';
import { Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Isolated timer component — renders independently from the rest of GameTable.
 * Using React.memo ensures it only re-renders when `seconds` or `secLabel` changes,
 * preventing the entire GameTable from re-rendering every second.
 */

interface TurnTimerMobileProps {
  seconds: number;
}

export const TurnTimerMobile = memo(function TurnTimerMobile({ seconds }: TurnTimerMobileProps) {
  const isUrgent = seconds <= 5;
  const display = seconds >= 99 ? '--' : `${seconds}с`;

  return (
    <Badge
      data-tutorial="timer"
      className={`sm:hidden text-sm px-2 py-1 ${
        isUrgent
          ? 'bg-red-900/60 text-red-300 border-red-700/40 animate-pulse'
          : 'bg-amber-900/60 text-amber-300 border-amber-700/40'
      }`}
    >
      <Timer className="w-4 h-4 mr-0.5" />
      {display}
    </Badge>
  );
});

interface TurnTimerDesktopProps {
  seconds: number;
  secLabel: string;
}

export const TurnTimerDesktop = memo(function TurnTimerDesktop({ seconds, secLabel }: TurnTimerDesktopProps) {
  const isUrgent = seconds <= 5;

  return (
    <div
      data-tutorial="timer-desktop"
      className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 border-2 transition-all ${
        isUrgent
          ? 'bg-red-900/60 border-red-500/50 animate-pulse'
          : 'bg-black/50 border-amber-700/30'
      }`}
    >
      <Timer className={`w-6 h-6 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
      <span
        className={`text-4xl md:text-5xl font-black tabular-nums leading-none ${
          isUrgent ? 'text-red-300' : 'text-amber-300'
        }`}
      >
        {seconds >= 99 ? '--' : seconds}
      </span>
      <span className={`text-xs font-medium ${isUrgent ? 'text-red-400/70' : 'text-amber-200/50'}`}>
        {seconds >= 99 ? '' : secLabel}
      </span>
    </div>
  );
});
