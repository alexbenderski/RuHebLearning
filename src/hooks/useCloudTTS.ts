import { useState, useCallback } from 'react';

interface CloudTTSState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

// Shared across all hook instances: only one audio plays at a time
let activeAudio: HTMLAudioElement | null = null;
// In-memory URL cache: text → storage URL (avoids repeat API calls per session)
const urlCache = new Map<string, string>();

// Fallback speech synthesis so letter/word sounds always work,
// even if the backend TTS server is unavailable or media playback is blocked.
function speakFallback(text: string): boolean {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'he-IL';
      utt.rate = 0.75;
      utt.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const hebrew = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('he'));
      if (hebrew) {
        utt.voice = hebrew;
      } else if (voices.length) {
        utt.voice = voices[0];
      }

      window.speechSynthesis.speak(utt);
    };

    // Voices may not be loaded yet on first call — wait for them
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    } else {
      doSpeak();
    }
    return true;
  } catch {
    return false;
  }
}

const useCloudTTS = () => {
  const [state, setState] = useState<CloudTTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
  });

  const stopCurrent = () => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.src = '';
      activeAudio = null;
    }
  };

  const playAudio = useCallback(async (text: string) => {
    if (!text) return;
    stopCurrent();
    setState({ isLoading: true, isPlaying: false, error: null });

    try {
      // Check in-memory cache before hitting the API
      let url = urlCache.get(text);

      if (!url) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: { url: string } = await res.json();
        url = data.url;
        urlCache.set(text, url);
      }

      const audio = new Audio(url);
      activeAudio = audio;

      audio.onplay  = () => setState({ isLoading: false, isPlaying: true,  error: null });
      audio.onended = () => setState({ isLoading: false, isPlaying: false, error: null });
      audio.onerror = () => {
        setState({ isLoading: false, isPlaying: false, error: null });
        // Backend returned a URL that failed to load — use browser TTS instead
        speakFallback(text);
      };

      setState(s => ({ ...s, isLoading: false }));

      // play() can reject if blocked by browser policy; fall back to speech synthesis
      await audio.play().catch(() => {
        setState({ isLoading: false, isPlaying: false, error: null });
        speakFallback(text);
      });
    } catch (err) {
      // Network/server failure — still pronounce the letter/word locally
      speakFallback(text);
      setState({ isLoading: false, isPlaying: false, error: null });
    }
  }, []);

  return { ...state, playAudio };
};

export default useCloudTTS;