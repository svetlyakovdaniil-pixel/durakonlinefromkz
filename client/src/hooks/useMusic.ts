import { useCallback, useEffect, useRef, useState } from 'react';

// CDN URLs for background music tracks (played sequentially in order)
const MUSIC_TRACKS = [
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№1_fd1382d6.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№2_97b3c0a9.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№3_9c1cf3b0.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№4_3882b329.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№5_79e63061.mp3',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№6_2a64f936.mp3',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663508367403/JjIAoPpnRIxeEDFN.mp3', // Trimmed to 3:02
];

const SETTINGS_KEY = 'kazakh-durak-settings';

function readMusicVolume(): number {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.musicVolume === 'number') return parsed.musicVolume;
    }
  } catch {}
  return 0.3;
}

function writeMusicVolume(vol: number) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.musicVolume = vol;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
  } catch {}
}

/**
 * Background music manager hook.
 * Plays 7 tracks sequentially in a loop.
 * choiceMade is session-only (not persisted) — dialog shows every time user enters lobby.
 * enabled state is NOT persisted either — fresh choice every session.
 * Volume IS persisted in localStorage.
 */
export function useMusic() {
  // Whether the user has made the initial choice THIS SESSION (not persisted)
  const [choiceMade, setChoiceMade] = useState(false);

  // Whether music is enabled
  const [enabled, setEnabled] = useState(false);

  // Volume (persisted)
  const [volume, setVolumeState] = useState(readMusicVolume);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(readMusicVolume());

  // Keep volumeRef in sync and update current audio element
  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // When a track ends, play the next one
  const handleTrackEnd = useCallback(() => {
    const nextIndex = (trackIndexRef.current + 1) % MUSIC_TRACKS.length;
    trackIndexRef.current = nextIndex;

    if (audioRef.current) {
      audioRef.current.removeEventListener('ended', handleTrackEnd);
    }

    const audio = new Audio(MUSIC_TRACKS[nextIndex]);
    audio.volume = volumeRef.current;
    audioRef.current = audio;
    audio.addEventListener('ended', handleTrackEnd);
    audio.play().catch(() => {});
    isPlayingRef.current = true;
  }, []);

  // Play the current track
  const playTrack = useCallback((index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleTrackEnd);
    }

    const audio = new Audio(MUSIC_TRACKS[index % MUSIC_TRACKS.length]);
    audio.volume = volumeRef.current;
    audioRef.current = audio;
    trackIndexRef.current = index % MUSIC_TRACKS.length;

    audio.addEventListener('ended', handleTrackEnd);
    audio.play().catch(() => {
      // Autoplay blocked — will retry on next user interaction
    });
    isPlayingRef.current = true;
  }, [handleTrackEnd]);

  // Start playing music
  const startMusic = useCallback(() => {
    setEnabled(true);
    playTrack(trackIndexRef.current);
  }, [playTrack]);

  // Stop playing music
  const stopMusic = useCallback(() => {
    setEnabled(false);
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

  // Make the initial choice (session-only, no localStorage)
  const makeChoice = useCallback((enableMusic: boolean) => {
    setChoiceMade(true);
    if (enableMusic) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [startMusic, stopMusic]);

  // Set volume (0..1)
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    writeMusicVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  // Cleanup on full unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current = null;
      }
    };
  }, [handleTrackEnd]);

  return {
    enabled,
    choiceMade,
    toggle,
    makeChoice,
    startMusic,
    stopMusic,
    volume,
    setVolume,
  };
}
