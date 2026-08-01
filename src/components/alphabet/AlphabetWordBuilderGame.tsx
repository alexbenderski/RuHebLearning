import React from 'react';
import type { VocabWord } from '../../types';
import { ALL_LETTERS } from '../../data/alphabet';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useGameTimer } from '../../hooks/useGameTimer';
import { playClick } from '../../hooks/useSoundEffects';
import styles from './AlphabetWordBuilderGame.module.css';

interface AlphabetWordBuilderGameProps {
  learnedWords: VocabWord[];
  onStep?: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function splitChars(word: string): string[] {
  return [...word.replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, '')];
}

const LETTER_NAME: Record<string, string> = Object.fromEntries(
  ALL_LETTERS.map((l) => [l.letter, `${l.name} (${l.transliteration})`]),
);

const AlphabetWordBuilderGame: React.FC<AlphabetWordBuilderGameProps> = ({ learnedWords, onStep }) => {
  const { playAudio } = useCloudTTS();

  const [word, setWord] = React.useState<VocabWord | null>(null);
  const [slots, setSlots] = React.useState<string[]>([]);
  const [letters, setLetters] = React.useState<string[]>([]);
  const [selectedLetter, setSelectedLetter] = React.useState<string | null>(null);
  const [buildPhase, setBuildPhase] = React.useState<'building' | 'checked'>('building');
  const [checkResult, setCheckResult] = React.useState<boolean[]>([]);
  const [totalTime, setTotalTime] = React.useState(0);

  const { seconds, formattedTime, resetTimer } = useGameTimer(buildPhase === 'building');

  const initRound = React.useCallback(() => {
    const candidate = shuffle(learnedWords).find((w) => splitChars(w.hebrew).length >= 3) ?? null;
    setWord(candidate);
    if (!candidate) {
      setSlots([]);
      setLetters([]);
      setBuildPhase('building');
      setCheckResult([]);
      return;
    }
    const chars = splitChars(candidate.hebrew);
    const distractors = shuffle(['א', 'ב', 'ת', 'ל', 'מ', 'כ', 'ר']).slice(0, 2);
    setSlots(Array(chars.length).fill(''));
    setLetters(shuffle([...chars, ...distractors]));
    setBuildPhase('building');
    setCheckResult([]);
    setSelectedLetter(null);
    resetTimer();
  }, [learnedWords, resetTimer]);

  React.useEffect(() => {
    initRound();
  }, [initRound]);

  if (!word) {
    return <div className={styles.empty}>Нет достаточного количества выученных слов для игры.</div>;
  }

  const target = splitChars(word.hebrew);
  const isComplete = slots.every((s) => s !== '');
  const isAllCorrect = buildPhase === 'checked' && checkResult.every(Boolean);

  const onDrop = (slotIndex: number, letter: string) => {
    if (buildPhase === 'checked') return;
    const nextSlots = [...slots];
    const displaced = nextSlots[slotIndex];
    nextSlots[slotIndex] = letter;
    setSlots(nextSlots);
    setLetters((prev) => {
      const copy = [...prev];
      const i = copy.indexOf(letter);
      if (i >= 0) copy.splice(i, 1);
      if (displaced) copy.push(displaced);
      return copy;
    });
    setSelectedLetter(null);
  };

  /** Tap-to-select letter, then tap slot to place (mobile friendly). */
  const handleLetterTap = (letter: string) => {
    playClick();
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
      playAudio(letter);
    }
  };

  const handleSlotTap = (slotIndex: number) => {
    if (buildPhase === 'checked') return;
    if (selectedLetter) {
      playClick();
      onDrop(slotIndex, selectedLetter);
    } else if (slots[slotIndex]) {
      playClick();
      setLetters((prev) => [...prev, slots[slotIndex]]);
      setSlots((prev) => prev.map((s, i) => (i === slotIndex ? '' : s)));
    }
  };

  const handleCheck = () => {
    const result = slots.map((s, i) => s === target[i]);
    setCheckResult(result);
    setTotalTime(seconds);
    setBuildPhase('checked');
    onStep?.(result.every(Boolean));
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3>🧩 Построй слово</h3>
        <div className={styles.headerRight}>
          <span className={styles.timer}>⏱ {buildPhase === 'checked' ? totalTime + 's' : formattedTime}</span>
          <button className={styles.speakBtn} onClick={() => playAudio(word.hebrew)}>🔊 Слушать</button>
        </div>
      </div>

      <p className={styles.prompt}>Собери слово по переводу: <b>{word.translation}</b></p>
      <p className={styles.promptTranslit}>{word.transliteration}</p>

      <div className={styles.slotsWrap} dir="rtl">
        <div className={styles.slots}>
          {slots.map((value, idx) => {
            let slotCls = styles.slot;
            if (buildPhase === 'checked') {
              slotCls = `${styles.slot} ${checkResult[idx] ? styles.slotCorrect : styles.slotWrong}`;
            } else if (value) {
              slotCls = `${styles.slot} ${styles.slotFilled}`;
            }
            return (
              <div
                key={idx}
                className={slotCls}
                onDragOver={(e) => { if (buildPhase !== 'checked') e.preventDefault(); }}
                onDrop={(e) => {
                  if (buildPhase === 'checked') return;
                  onDrop(idx, e.dataTransfer.getData('text/plain'));
                }}
                onClick={() => handleSlotTap(idx)}
              >
                {value || ''}
              </div>
            );
          })}
        </div>
      </div>

      {buildPhase === 'building' && (
        <>
          {selectedLetter && (
            <div className={styles.selectedHint}>
              Выбрана буква <strong>{selectedLetter}</strong> — нажми на слот чтобы поставить
            </div>
          )}
          <div className={styles.letters}>
            {letters.map((letter, idx) => (
              <button
                key={`${letter}-${idx}`}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', letter)}
                className={`${styles.letter} ${selectedLetter === letter ? styles.letterSelected : ''}`}
                onClick={() => handleLetterTap(letter)}
                title="Нажми чтобы выбрать, перетащи в слот"
              >
                {letter}
              </button>
            ))}
          </div>
          {isComplete && (
            <button className={styles.checkBtn} onClick={handleCheck}>
              Проверить ✓
            </button>
          )}
        </>
      )}

      {buildPhase === 'checked' && (
        <div className={styles.feedback}>
          <div className={styles.feedbackTitle}>
            {isAllCorrect ? `✅ Верно! Время: ${totalTime} сек.` : `❌ Есть ошибки (Время: ${totalTime} сек.)`}
          </div>

          {!isAllCorrect && (
            <>
              <div className={styles.feedbackCorrect}>
                <span className={styles.feedbackLabel}>Правильное слово:</span>
                <span className={styles.feedbackHeb}>{word.hebrew}</span>
                <span className={styles.feedbackTranslit}>({word.transliteration})</span>
              </div>

              {/* Letter-by-letter breakdown, RTL */}
              <div className={styles.feedbackSlots} dir="rtl">
                {target.map((ch, i) => (
                  <div key={i} className={`${styles.feedbackSlotItem} ${slots[i] === ch ? styles.feedbackSlotOk : styles.feedbackSlotErr}`}>
                    <span className={styles.feedbackLetter}>{ch}</span>
                    <span className={styles.feedbackLetterName} dir="ltr">{LETTER_NAME[ch] ?? ch}</span>
                    {slots[i] !== ch && (
                      <span className={styles.feedbackWasLetter} dir="ltr">ты: {slots[i] || '—'}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={styles.feedbackActions}>
            <button className={styles.speakBtn} onClick={() => playAudio(word.hebrew)}>🔊 Слушать</button>
            <button className={styles.nextBtn} onClick={initRound}>Следующее слово →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlphabetWordBuilderGame;
