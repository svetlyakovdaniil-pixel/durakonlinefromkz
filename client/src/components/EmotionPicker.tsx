import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

export const EMOTIONS = [
  { id: 'laugh',  label: 'Смех',    url: '/assets/static/emotion_laugh.webp' },
  { id: 'cool',   label: 'Круто',   url: '/assets/static/emotion_cool.webp' },
  { id: 'angry',  label: 'Злость',  url: '/assets/static/emotion_angry.webp' },
  { id: 'sad',    label: 'Грусть',  url: '/assets/static/emotion_sad.webp' },
  { id: 'think',  label: 'Думаю',   url: '/assets/static/emotion_think.webp' },
  { id: 'wow',    label: 'Вау',     url: '/assets/static/emotion_wow.webp' },
  { id: 'heart',  label: 'Любовь',  url: '/assets/static/emotion_heart.webp' },
  { id: 'thumb',  label: 'Класс',   url: '/assets/static/emotion_thumb.webp' },
];

interface EmotionPickerProps {
  onSelect: (emotionId: string) => void;
  onClose: () => void;
}

/**
 * Full-screen modal emotion picker — styled like Durak Online:
 * dark overlay, rounded gray panel, 4-column grid, large emoji, X button.
 */
export function EmotionPicker({ onSelect, onClose }: EmotionPickerProps) {
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
    onClose();
  }, [onSelect, onClose]);

  return (
    /* Full-screen backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center pb-24 sm:items-center sm:pb-0"
      onClick={onClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div
        className="relative z-10 w-[min(92vw,360px)] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(60,65,80,0.97)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-white/80 text-sm font-semibold tracking-wide">Эмоции</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-400 active:scale-90 transition-all flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Emoji grid — 4 columns */}
        <div className="grid grid-cols-4 gap-3 p-4">
          {EMOTIONS.map(e => (
            <button
              key={e.id}
              onClick={() => handleSelect(e.id)}
              className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-white/15 active:scale-90 transition-all duration-100"
              title={e.label}
            >
              <img
                src={e.url}
                alt={e.label}
                className="w-14 h-14 object-contain drop-shadow-md"
                draggable={false}
              />
              <span className="text-[10px] text-white/60 font-medium leading-none">{e.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Emotion bubble shown above a player's avatar.
 * Renders as an absolute overlay that fills the parent container entirely.
 * The parent must be `position: relative` with explicit width/height matching the avatar.
 */
interface EmotionBubbleProps {
  emotionId: string;
}

export function EmotionBubble({ emotionId }: EmotionBubbleProps) {
  const emotion = EMOTIONS.find(e => e.id === emotionId);
  if (!emotion) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-emotion-pop rounded-full overflow-hidden"
    >
      <img
        src={emotion.url}
        alt={emotion.label}
        className="w-full h-full object-contain drop-shadow-lg"
        draggable={false}
      />
    </div>
  );
}

/** Hook to manage emotion picker open state with cooldown */
export function useEmotionPicker(cooldownMs = 2000) {
  const [open, setOpen] = useState(false);
  const [lastSent, setLastSent] = useState(0);

  const toggle = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const canSend = useCallback(() => {
    return Date.now() - lastSent >= cooldownMs;
  }, [lastSent, cooldownMs]);

  const markSent = useCallback(() => {
    setLastSent(Date.now());
  }, []);

  return { open, toggle, close, canSend, markSent };
}
