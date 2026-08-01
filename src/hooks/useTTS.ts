const useTTS = () => {
  const speak = (text: string, preferLang = 'he-IL') => {
    if (!window.speechSynthesis) return;

    const doSpeak = () => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.75;
      utt.pitch = 1;
      utt.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = preferLang.split('-')[0]; // 'he'
      const hebrewVoice = voices.find(v => v.lang.startsWith(langPrefix));

      if (hebrewVoice) {
        // Hebrew voice installed — use it with correct lang
        utt.voice = hebrewVoice;
        utt.lang  = preferLang;
      } else {
        // No Hebrew voice — fall back to system default so audio plays at all
        const fallback = voices.find(v => v.default) ?? voices[0];
        if (fallback) { utt.voice = fallback; utt.lang = fallback.lang; }
      }

      window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    } else {
      doSpeak();
    }
  };

  return { speak };
};

export default useTTS;
