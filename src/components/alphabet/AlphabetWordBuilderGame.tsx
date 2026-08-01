import React from 'react';
import type { VocabWord } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import styles from './AlphabetWordBuilderGame.module.css';

interface AlphabetWordBuilderGameProps {
  learnedWords: VocabWord[];
  onStep?: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function splitChars(word: string): string[] {
  return [...word.replace(/\s+/g, '')];
}

const AlphabetWordBuilderGame: React.FC<AlphabetWordBuilderGameProps> = ({ learnedWords, onStep }) => {
  const { playAudio } = useCloudTTS();

  const [word, setWord] = React.useState<VocabWord | null>(null);
  const [slots, setSlots] = React.useState<string[]>([]);
  const [letters, setLetters] = React.useState<string[]>([]);
  const [hint, setHint] = React.useState<string | null>(null);

  const initRound = React.useCallback(() => {
    const candidate = shuffle(learnedWords).find((w) => splitChars(w.hebrew).length >= 3) ?? null;
    setWord(candidate);
    if (!candidate) {
      setSlots([]);
      setLetters([]);
      setHint('Сначала выучи и сохрани больше слов.');
      return;
    }
    const chars = splitChars(candidate.hebrew);
    const distractors = shuffle(['א', 'ב', 'ת', 'ל', 'מ', 'כ', 'ר']).slice(0, 2);
    setSlots(Array(chars.length).fill(''));
    setLetters(shuffle([...chars, ...distractors]));
    setHint(null);
  }, [learnedWords]);

  React.useEffect(() => {
    initRound();
  }, [initRound]);

  if (!word) {
    return <div className={styles.empty}>Нет достаточного количества выученных слов для игры.</div>;
  }

  const target = splitChars(word.hebrew);
  const isComplete = slots.every((s) => s !== '');
  const isCorrect = isComplete && slots.join('') === target.join('');

  const onDrop = (slotIndex: number, letter: string) => {
    const expected = target[slotIndex];
    if (letter !== expected) {
      setHint(`Ошибка: сюда нужна буква «${expected}», а не «${letter}». Перевод: ${word.translation}.`);
      onStep?.(false);
      return;
    }

    const nextSlots = [...slots];
    nextSlots[slotIndex] = letter;
    setSlots(nextSlots);
    setLetters((prev) => {
      const i = prev.indexOf(letter);
      if (i < 0) return prev;
      const copy = [...prev];
      copy.splice(i, 1);
      return copy;
    });
    setHint(null);
    onStep?.(true);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3>🧩 Построй слово</h3>
        <button className={styles.speakBtn} onClick={() => playAudio(word.hebrew)}>🔊 Слушать</button>
      </div>

      <p className={styles.prompt}>Собери слово по переводу: <b>{word.translation}</b></p>

      <div className={styles.slots}>
        {slots.map((value, idx) => (
          <div
            key={idx}
            className={styles.slot}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const letter = e.dataTransfer.getData('text/plain');
              if (value) return;
              onDrop(idx, letter);
            }}
          >
            {value || '_'}
          </div>
        ))}
      </div>

      <div className={styles.letters}>
        {letters.map((letter, idx) => (
          <button
            key={`${letter}-${idx}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', letter)}
            className={styles.letter}
            onClick={() => playAudio(letter)}
            title="Нажми чтобы слушать, перетащи в слот"
          >
            {letter}
          </button>
        ))}
      </div>

      {hint && <div className={styles.hint}>{hint}</div>}
      {isCorrect && (
        <div className={styles.success}>
          <span>✅ Верно: {word.hebrew}</span>
          <button className={styles.nextBtn} onClick={initRound}>Следующее слово</button>
        </div>
      )}
    </div>
  );
};

export default AlphabetWordBuilderGame;
