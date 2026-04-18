import { useState, useCallback } from 'react';

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

export function EmotionPicker({ onSelect, onClose }: EmotionPickerProps) {
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
    onClose();
  }, [onSelect, onClose]);

  return (
    <div
      className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2"
      onClick={e => e.stopPropagation()}
    >
      {/* Arrow pointing down */}
      <div className="relative">
        <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/10">
          <div className="grid grid-cols-4 gap-1.5">
            {EMOTIONS.map(e => (
              <button
                key={e.id}
                onClick={() => handleSelect(e.id)}
                className="w-12 h-12 rounded-xl hover:bg-white/20 active:scale-90 transition-all duration-100 flex items-center justify-center"
                title={e.label}
              >
                <img
                  src={e.url}
                  alt={e.label}
                  className="w-10 h-10 object-contain"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
        {/* Down arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-black/80" />
      </div>
    </div>
  );
}

interface EmotionBubbleProps {
  emotionId: string;
}

export function EmotionBubble({ emotionId }: EmotionBubbleProps) {
  const emotion = EMOTIONS.find(e => e.id === emotionId);
  if (!emotion) return null;

  return (
    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-emotion-pop">
      <div className="relative">
        <div className="bg-black/75 backdrop-blur-sm rounded-2xl p-1.5 shadow-xl border border-white/15">
          <img
            src={emotion.url}
            alt={emotion.label}
            className="w-12 h-12 object-contain"
            draggable={false}
          />
        </div>
        {/* Down arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-black/75" />
      </div>
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
