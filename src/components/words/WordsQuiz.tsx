import React, { useState } from 'react';
import type { VocabWord } from '../../types';
import type { WordDifficulty } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import styles from './WordsQuiz.module.css';

interface WordsQuizProps {
  userId?: string;
  categoryId: string;
  difficulty: WordDifficulty;
  words: VocabWord[];
  onFinish: () => void;
}

function buildOptions(correct: VocabWord, all: VocabWord[]): VocabWord[] {
  const pool = all.filter(w => w.id !== correct.id);
  const wrong = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

const WordsQuiz: React.FC<WordsQuizProps> = ({ userId, categoryId, difficulty, words, onFinish }) => {
  const shuffled = React.useMemo(
    () => [...words].sort(() => Math.random() - 0.5),
    [words],
  );
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState(() => buildOptions(shuffled[0], words));
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playAudio, isLoading } = useCloudTTS();
  const { trackStep } = useProgressTracker(userId);

  const current = shuffled[idx];

  const handleAnswer = (w: VocabWord) => {
    if (selected !== null) return;
    setSelected(w.id);
    const isCorrect = w.id === current.id;
    if (w.id === current.id) setScore(s => s + 1);
    trackStep({
      moduleId: 'words',
      stepId: `quiz:${categoryId}:${difficulty}:${current.id}`,
      isCorrect,
      payload: { selected: w.id, expected: current.id },
    }).catch((err) => console.error('[progress words quiz]', err));
    setTimeout(() => {
      if (idx + 1 >= shuffled.length) {
        setDone(true);
      } else {
        const next = shuffled[idx + 1];
        setIdx(i => i + 1);
        setOptions(buildOptions(next, words));
        setSelected(null);
      }
    }, 1200);
  };

  if (done) {
    const perfect = score === shuffled.length;
    const good = score >= shuffled.length / 2;
    return (
      <div className={styles.result}>
        <div className={styles.resultEmoji}>{perfect ? '🏆' : good ? '⭐' : '💪'}</div>
        <h2 className={styles.resultScore}>{score} / {shuffled.length}</h2>
        <p className={styles.resultMsg}>
          {perfect ? 'Отлично! Все слова знаешь!' : good ? 'Хорошо! Продолжай учиться!' : 'Нужна практика. Ещё раз?'}
        </p>
        <button className={styles.retryBtn} onClick={onFinish}>
          ← Вернуться к карточкам
        </button>
      </div>
    );
  }

  return (
    <div className={styles.quiz}>
      {/* Progress */}
      <div className={styles.statsRow}>
        <span>Вопрос {idx + 1} / {shuffled.length}</span>
        <span>✅ {score}</span>
      </div>

      {/* Question */}
      <div className={styles.questionBox}>
        <p className={styles.prompt}>Переведи слово на русский:</p>
        <button className={`${styles.hebrewWord} ${isLoading ? styles.loading : ''}`}
          onClick={() => playAudio(current.hebrew)} title={isLoading ? 'Загрузка...' : 'Прослушать'}>
          {current.hebrew}
        </button>
        <div className={styles.translit}>{current.transliteration}</div>
      </div>

      {/* Options */}
      <div className={styles.options}>
        {options.map((opt) => {
          let cls = styles.option;
          if (selected !== null) {
            if (opt.id === current.id)  cls = `${styles.option} ${styles.correct}`;
            else if (opt.id === selected) cls = `${styles.option} ${styles.wrong}`;
          }
          return (
            <button key={opt.id} className={cls} onClick={() => handleAnswer(opt)}>
              {opt.translation}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WordsQuiz;
