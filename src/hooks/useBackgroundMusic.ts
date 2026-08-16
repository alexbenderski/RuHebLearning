import { useState, useEffect, useCallback } from 'react';
import track1 from '../assets/pianoBackground.mp3';
import track2 from '../assets/pianoBackground2.mp3';

const TRACKS = [track1, track2];
const STORAGE_KEY = 'ruhebstudy_bgmusic';

interface MusicState {
  isPlaying: boolean;
  volume: number; // 0-100
}

// ── Module-level singleton ──
let audio: HTMLAudioElement | null = null;
let trackIndex = 0;
let state: MusicState = { isPlaying: false, volume: 30 };
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const loadPersisted = (): MusicState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isPlaying: parsed.isPlaying ?? false,
        volume: parsed.volume ?? 30,
      };
    }
  } catch {}
  return { isPlaying: false, volume: 30 };
};

const persist = (s: MusicState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

// Load persisted state on module init (no audio element yet)
state = loadPersisted();

/** Create the Audio element lazily — only on first user interaction */
const getAudio = (): HTMLAudioElement => {
  if (!audio) {
    audio = new Audio();
    audio.volume = state.volume / 100;
    audio.loop = false;

    const playNext = () => {
      trackIndex = (trackIndex + 1) % TRACKS.length;
      if (audio) {
        audio.src = TRACKS[trackIndex];
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('ended', playNext);
  }
  return audio;
};

const applyPlayState = () => {
  const a = audio;
  if (!a) return;
  if (state.isPlaying) {
    if (!a.src || a.src === window.location.href) {
      a.src = TRACKS[trackIndex];
    }
    a.play().catch(() => {});
  } else {
    a.pause();
  }
};

const applyVolume = () => {
  if (audio) {
    audio.volume = state.volume / 100;
  }
};

export const useBackgroundMusic = () => {
  const [local, setLocal] = useState<MusicState>(state);

  useEffect(() => {
    const handler = () => setLocal({ ...state });
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const togglePlay = useCallback(() => {
    getAudio(); // ensure audio exists (first user gesture)
    state = { ...state, isPlaying: !state.isPlaying };
    persist(state);
    applyPlayState();
    notify();
  }, []);

  const changeVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, newVolume));
    getAudio(); // ensure audio exists
    state = { ...state, volume: clamped };
    persist(state);
    applyVolume();
    notify();
  }, []);

  return {
    isPlaying: local.isPlaying,
    volume: local.volume,
    togglePlay,
    changeVolume,
  };
};