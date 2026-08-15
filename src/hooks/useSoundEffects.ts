import correctSound from '../assets/CorrectAnswerSound.mp3';
import wrongSound from '../assets/WrongAnswerSound.mp3';

export const useSoundEffects = () => {
  /** Classic retro UI click (WebAudio synth) */
  const playClick = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.error('Audio click error:', e);
    }
  };

  /** Correct answer — plays CorrectAnswerSound.mp3 */
  const playCorrect = () => {
    try {
      const audio = new Audio(correctSound);
      audio.volume = 0.55;
      audio.play().catch(() => {});
    } catch (e) {
      console.error('Audio correct error:', e);
    }
  };

  /** Wrong answer — plays WrongAnswerSound.mp3 */
  const playWrong = () => {
    try {
      const audio = new Audio(wrongSound);
      audio.volume = 0.55;
      audio.play().catch(() => {});
    } catch (e) {
      console.error('Audio wrong error:', e);
    }
  };

  /** Backwards-compatible alias for correct answer */
  const playMatch = playCorrect;

  /** Play any sound file from the assets folder */
  const playSoundFile = (src: string) => {
    try {
      const audio = new Audio(src);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.error('Audio file error:', e);
    }
  };

  return { playClick, playMatch, playCorrect, playWrong, playSoundFile };
};