import { useCallback, useEffect, useRef, useState } from 'react';

// CDN URLs for background music tracks (played sequentially in order)
const MUSIC_TRACKS = [
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№1_fd1382d6.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№2_97b3c0a9.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№3_9c1cf3b0.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№4_3882b329.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№5_79e63061.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№6_2a64f936.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№7_48c4f68c.mp3',
];

const STORAGE_KEY = 'kazakh-durak-music-enabled';
const STORAGE_CHOICE_KEY = 'kazakh-durak-music-choice-made';

/**
 * Background music manager hook.
 * Plays 7 tracks sequentially in a loop.
 * Persists enabled/disabled preference to localStorage.
 */
export function useMusic() {
  // Whether the user has made the initial choice (dialog shown)
  const [choiceMade, setChoiceMade] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_CHOICE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Whether music is enabled
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Play the current track
  const playTrack = useCallback((index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleTrackEnd);
    }

    const audio = new Audio(MUSIC_TRACKS[index % MUSIC_TRACKS.length]);
    audio.volume = 0.3;
    audioRef.current = audio;
    trackIndexRef.current = index % MUSIC_TRACKS.length;

    audio.addEventListener('ended', handleTrackEnd);
    audio.play().catch(() => {
      // Autoplay blocked — will retry on next user interaction
    });
    isPlayingRef.current = true;
  }, []);

  // When a track ends, play the next one
  function handleTrackEnd() {
    const nextIndex = (trackIndexRef.current + 1) % MUSIC_TRACKS.length;
    trackIndexRef.current = nextIndex;

    if (audioRef.current) {
      audioRef.current.removeEventListener('ended', handleTrackEnd);
    }

    const audio = new Audio(MUSIC_TRACKS[nextIndex]);
    audio.volume = 0.3;
    audioRef.current = audio;
    audio.addEventListener('ended', handleTrackEnd);
    audio.play().catch(() => {});
    isPlayingRef.current = true;
  }

  // Start playing music
  const startMusic = useCallback(() => {
    setEnabled(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    playTrack(trackIndexRef.current);
  }, [playTrack]);

  // Stop playing music
  const stopMusic = useCallback(() => {
    setEnabled(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'false');
    } catch {}
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, []);

  // Toggle music on/off
  const toggle = useCallback(() => {
    if (enabled) {
      stopMusic();
    } else {
      startMusic();
    }
  }, [enabled, startMusic, stopMusic]);

  // Make the initial choice
  const makeChoice = useCallback((enableMusic: boolean) => {
    setChoiceMade(true);
    try {
      localStorage.setItem(STORAGE_CHOICE_KEY, 'true');
    } catch {}
    if (enableMusic) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [startMusic, stopMusic]);

  // Auto-resume music on mount if enabled
  useEffect(() => {
    if (enabled && choiceMade && !isPlayingRef.current) {
      playTrack(trackIndexRef.current);
    }
    return () => {
      // Don't stop music on unmount — it should persist across page transitions
    };
  }, [enabled, choiceMade, playTrack]);

  // Cleanup on full unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current = null;
      }
    };
  }, []);

  return {
    enabled,
    choiceMade,
    toggle,
    makeChoice,
    startMusic,
    stopMusic,
  };
}
