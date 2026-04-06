import { useCallback, useEffect, useRef, useState } from 'react';

// CDN URLs for sound effects
const SOUND_URLS = {
  // Original sounds
  cardDeal: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/card_deal_faaefea0.wav',
  roundWin: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/round_win_72f79f57.wav',
  gameWin: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/game_win_1b8d5eaa.wav',
  gameLose: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/game_lose_d0b3c1f1.wav',

  // New custom sounds
  cardPlay: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/%D0%BF%D0%BE%D0%BB%D0%BE%D0%B6%D0%B8%D0%BB%D0%B8%D0%BA%D0%B0%D1%80%D1%82%D1%83%D0%BD%D0%B0%D1%81%D1%82%D0%BE%D0%BB_2d5c774f.mp3',
  trumpPlay: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/%D0%BF%D0%BE%D0%BB%D0%BE%D0%B6%D0%B8%D0%BB%D0%B8%D0%BA%D0%BE%D0%B7%D1%8B%D1%80%D1%8C%D0%BD%D0%B0%D1%81%D1%82%D0%BE%D0%BB_a1725e72.mp3',
  cardTake: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/%D0%B1%D0%B5%D1%80%D0%B5%D1%82%D0%B2%D1%80%D1%83%D0%BA%D0%B8_8e6bac85.mp3',
  transfer: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4_685db838.mp3',
  multiCard: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%BA%D0%B8%D0%B4%D0%B0%D0%B5%D1%82%D0%BD%D0%B0%D1%81%D1%82%D0%BE%D0%BB%D1%81%D1%80%D0%B0%D0%B7%D1%83%D0%BD%D0%B5%D1%81%D0%BA%D0%BE%D0%BB%D1%8C%D0%BA%D0%BE%D0%BA%D0%B0%D1%80%D1%82%D0%B7%D0%B0%D1%80%D0%B0%D0%B7_db22f391.mp3',
  yourTurn: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/%D0%92%D0%90%D0%A8%D0%A5%D0%9E%D0%94_41ad06aa.mp3',
  bito: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/%D0%B1%D0%B8%D1%82%D0%BE1_fd285f9b.mp3',
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
