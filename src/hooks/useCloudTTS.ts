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
      audio.onerror = () => setState({ isLoading: false, isPlaying: false, error: 'Ошибка воспроизведения' });

      setState(s => ({ ...s, isLoading: false }));

      // play() can throw on mobile if not triggered by user gesture
      await audio.play().catch(() => {
        setState({ isLoading: false, isPlaying: false, error: 'Нажмите ещё раз для воспроизведения' });
      });
    } catch (err) {
      console.error('[useCloudTTS]', err);
      setState({ isLoading: false, isPlaying: false, error: 'Не удалось загрузить аудио' });
    }
  }, []);

  return { ...state, playAudio };
};

export default useCloudTTS;
