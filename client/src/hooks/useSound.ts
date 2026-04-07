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
  bito: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/bito1_120_6a477906.mp3',
} as const;

export type SoundName = keyof typeof SOUND_URLS;

const SETTINGS_KEY = 'kazakh-durak-settings';

function readSoundSettings(): { enabled: boolean; volume: number } {
  try {
    const settingsRaw = localStorage.getItem(SETTINGS_KEY);
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      return {
        enabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
        volume: typeof parsed.soundVolume === 'number' ? parsed.soundVolume : 0.5,
      };
    }
  } catch {}
  return { enabled: true, volume: 0.5 };
}

function writeSoundSettings(enabled: boolean, volume: number) {
  try {
    const settingsRaw = localStorage.getItem(SETTINGS_KEY);
    const parsed = settingsRaw ? JSON.parse(settingsRaw) : {};
    parsed.soundEnabled = enabled;
    parsed.soundVolume = volume;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
  } catch {}
}

// ── Singleton Web Audio engine (shared across all hook instances) ──

let audioCtx: AudioContext | null = null;
const bufferCache = new Map<SoundName, AudioBuffer>();
let preloaded = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

async function fetchAndDecode(name: SoundName, url: string): Promise<void> {
  try {
    const ctx = getAudioContext();
    const resp = await fetch(url);
    const arrayBuf = await resp.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);
    bufferCache.set(name, audioBuf);
  } catch (e) {
    console.warn(`[useSound] Failed to preload ${name}:`, e);
  }
}

function preloadAll() {
  if (preloaded) return;
  preloaded = true;
  for (const [name, url] of Object.entries(SOUND_URLS)) {
    fetchAndDecode(name as SoundName, url);
  }
}

// Per-sound volume multipliers (relative to master volume)
const SOUND_VOLUME_MULTIPLIERS: Partial<Record<SoundName, number>> = {
  bito: 0.7,      // 30% quieter
  cardTake: 0.7,  // 30% quieter
};

function playBuffer(name: SoundName, volume: number) {
  const buffer = bufferCache.get(name);
  if (!buffer) return;

  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const multiplier = SOUND_VOLUME_MULTIPLIERS[name] ?? 1;
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume * multiplier;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(0);
}

/**
 * Sound manager hook using Web Audio API for zero-latency playback.
 * Decodes audio files into AudioBuffers on first user interaction.
 * Each play() creates a new BufferSource — unlimited concurrent sounds, no clipping.
 */
export function useSound() {
  const initial = readSoundSettings();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [volume, setVolume] = useState(initial.volume);
  const enabledRef = useRef(initial.enabled);
  const volumeRef = useRef(initial.volume);

  // Keep refs in sync
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // Listen for external settings changes (from SettingsContext)
  useEffect(() => {
    const interval = setInterval(() => {
      const s = readSoundSettings();
      setEnabled(prev => prev !== s.enabled ? s.enabled : prev);
      setVolume(prev => prev !== s.volume ? s.volume : prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Preload on first user interaction
  useEffect(() => {
    const handler = () => {
      getAudioContext(); // ensure context is created on user gesture
      preloadAll();
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
  }, []);

  // Play a sound effect — uses refs for instant access without stale closures
  const play = useCallback((name: SoundName, volumeOverride?: number) => {
    if (!enabledRef.current) return;
    const vol = volumeOverride ?? volumeRef.current;
    playBuffer(name, vol);
  }, []);

  // Toggle sound on/off
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      enabledRef.current = next;
      writeSoundSettings(next, volumeRef.current);
      return next;
    });
  }, []);

  // Set volume (0..1)
  const setVol = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    volumeRef.current = clamped;
    writeSoundSettings(enabledRef.current, clamped);
  }, []);

  return { play, enabled, toggle, preload: preloadAll, volume, setVolume: setVol };
}
