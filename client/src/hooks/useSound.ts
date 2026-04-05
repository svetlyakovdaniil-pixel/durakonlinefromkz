import { useCallback, useEffect, useRef, useState } from 'react';

// CDN URLs for sound effects
const SOUND_URLS = {
  cardPlay: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/card_play_da558a42.wav',
  cardDeal: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/card_deal_faaefea0.wav',
  cardTake: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/card_take_df5eef77.wav',
  roundWin: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/round_win_72f79f57.wav',
  gameWin: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/game_win_1b8d5eaa.wav',
  gameLose: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/game_lose_d0b3c1f1.wav',
  yourTurn: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/your_turn_5509c6b9.wav',
  timerWarning: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/timer_warning_cc1cb949.wav',
} as const;

export type SoundName = keyof typeof SOUND_URLS;

const STORAGE_KEY = 'kazakh-durak-sound-enabled';
const SETTINGS_KEY = 'kazakh-durak-settings';

function readSoundEnabled(): boolean {
  try {
    // First try the settings context key (primary source)
    const settingsRaw = localStorage.getItem(SETTINGS_KEY);
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (typeof parsed.soundEnabled === 'boolean') return parsed.soundEnabled;
    }
    // Fallback to legacy key
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== 'false';
  } catch {
    return true;
  }
}

/**
 * Sound manager hook for the card game.
 * Preloads all sounds on first user interaction and provides play functions.
 * Reads sound enabled state from SettingsContext localStorage.
 */
export function useSound() {
  const [enabled, setEnabled] = useState(readSoundEnabled);

  const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const preloaded = useRef(false);

  // Listen for storage changes (from SettingsContext updates)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = readSoundEnabled();
      setEnabled(prev => prev !== current ? current : prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Preload all sounds
  const preload = useCallback(() => {
    if (preloaded.current) return;
    preloaded.current = true;

    for (const [name, url] of Object.entries(SOUND_URLS)) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.5;
      audio.src = url;
      audioCache.current.set(name as SoundName, audio);
    }
  }, []);

  // Preload on first user interaction
  useEffect(() => {
    const handler = () => {
      preload();
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };

    document.addEventListener('click', handler, { once: false });
    document.addEventListener('keydown', handler, { once: false });
    document.addEventListener('touchstart', handler, { once: false });

    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [preload]);

  // Play a sound effect
  const play = useCallback((name: SoundName, volume?: number) => {
    if (!enabled) return;

    const cached = audioCache.current.get(name);
    if (cached) {
      const clone = cached.cloneNode() as HTMLAudioElement;
      clone.volume = volume ?? 0.5;
      clone.play().catch(() => {});
    } else {
      const audio = new Audio(SOUND_URLS[name]);
      audio.volume = volume ?? 0.5;
      audio.play().catch(() => {});
    }
  }, [enabled]);

  // Toggle sound on/off (updates both keys for sync)
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
        // Also update settings context key
        const settingsRaw = localStorage.getItem(SETTINGS_KEY);
        if (settingsRaw) {
          const parsed = JSON.parse(settingsRaw);
          parsed.soundEnabled = next;
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
        }
      } catch {}
      return next;
    });
  }, []);

  return { play, enabled, toggle, preload };
}
