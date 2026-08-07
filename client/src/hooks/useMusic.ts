import { useCallback, useEffect, useRef, useState } from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
// Fallback tracks (used when no playlist is loaded from backend)
const DEFAULT_TRACKS = [
  getAssetUrl('/assets/static/1_fd1382d6.mp3'),
  getAssetUrl('/assets/static/2_97b3c0a9.mp3'),
  getAssetUrl('/assets/static/3_9c1cf3b0.mp3'),
  getAssetUrl('/assets/static/4_3882b329.mp3'),
  getAssetUrl('/assets/static/5_79e63061.mp3'),
  getAssetUrl('/assets/static/6_2a64f936.mp3'),
  getAssetUrl('/assets/static/7_48c4f68c.mp3'),
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
  return 0.24;
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
 * Supports dynamic playlists — call setTracks() to switch playlist.
 * Plays tracks sequentially in a loop.
 * choiceMade is session-only (not persisted) — dialog shows every time user enters lobby.
 * enabled state is NOT persisted either — fresh choice every session.
 * Volume IS persisted in localStorage.
 */
export function useMusic() {
  // Whether the user has made the initial choice THIS SESSION (not persisted)
  const [choiceMade, setChoiceMade] = useState(false);

  // Whether music is enabled
  const [enabled, setEnabled] = useState(false);

  // Current tracks (can be updated dynamically)
  const [tracks, setTracksState] = useState<string[]>(DEFAULT_TRACKS);

  // Volume (persisted)
  const [volume, setVolumeState] = useState(readMusicVolume);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(readMusicVolume());
  const tracksRef = useRef<string[]>(DEFAULT_TRACKS);

  // Keep tracksRef in sync
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Keep volumeRef in sync and update current audio element
  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // When a track ends, play the next one
  const handleTrackEnd = useCallback(() => {
    const currentTracks = tracksRef.current;
    if (currentTracks.length === 0) return;
    const nextIndex = (trackIndexRef.current + 1) % currentTracks.length;
    trackIndexRef.current = nextIndex;

    if (audioRef.current) {
      audioRef.current.removeEventListener('ended', handleTrackEnd);
    }

    const audio = new Audio(currentTracks[nextIndex]);
    audio.volume = volumeRef.current;
    audioRef.current = audio;
    audio.addEventListener('ended', handleTrackEnd);
    audio.play().catch(() => {});
    isPlayingRef.current = true;
  }, []);

  // Play the current track
  const playTrack = useCallback((index: number) => {
    const currentTracks = tracksRef.current;
    if (currentTracks.length === 0) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleTrackEnd);
    }

    const safeIndex = index % currentTracks.length;
    const audio = new Audio(currentTracks[safeIndex]);
    audio.volume = volumeRef.current;
    audioRef.current = audio;
    trackIndexRef.current = safeIndex;

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

  // Pause music without changing enabled state (for preview)
  const pauseMusic = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, []);

  // Resume music from where it was paused (for preview)
  const resumeMusic = useCallback(() => {
    if (audioRef.current && !isPlayingRef.current && enabled) {
      audioRef.current.play().catch(() => {});
      isPlayingRef.current = true;
    }
  }, [enabled]);

  // Check if music is actually playing (not just enabled)
  const isPlaying = useCallback(() => {
    return isPlayingRef.current;
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

  // Set tracks dynamically (for playlist switching)
  const setTracks = useCallback((newTracks: string[]) => {
    if (newTracks.length === 0) return;
    // Apply getAssetUrl to all tracks (handles native iOS/Android where relative paths don't work)
    const resolvedTracks = newTracks.map(t => getAssetUrl(t));
    setTracksState(resolvedTracks);
    tracksRef.current = resolvedTracks;
    trackIndexRef.current = 0;
    // If currently playing, restart with new playlist
    if (isPlayingRef.current && enabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleTrackEnd);
      }
      const audio = new Audio(newTracks[0]);
      audio.volume = volumeRef.current;
      audioRef.current = audio;
      audio.addEventListener('ended', handleTrackEnd);
      audio.play().catch(() => {});
    }
  }, [enabled, handleTrackEnd]);

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
    pauseMusic,
    resumeMusic,
    isPlaying,
    volume,
    setVolume,
    tracks,
    setTracks,
  };
}
