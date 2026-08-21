import React, { useState } from 'react';
import type { VocabWord } from '../../types';
import type { WordDifficulty } from '../../types';
import { getVocalizedForm } from '../../data/nikudWords';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import { useGameTimer } from '../../hooks/useGameTimer';
import styles from './WordsQuiz.module.css';

export interface QuizResult {
  correct: number;
  total: number;
  pct: number;
}

interface WordsQuizProps {
  userId?: string;
  categoryId: string;
  difficulty: WordDifficulty;
  words: VocabWord[];
  onFinish: (result: QuizResult) => void;
  optionPool?: VocabWord[]; // optional larger pool for wrong-answer options
}

interface QuizHistory {
  question: VocabWord;
  selected: VocabWord;
}

function buildOptions(correct: VocabWord, all: VocabWord[]): VocabWord[] {
  const pool = all.filter(w => w.id !== correct.id);
  const wrong = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

const WordsQuiz: React.FC<WordsQuizProps> = ({ userId, categoryId, difficulty, words, onFinish, optionPool }) => {
  const shuffled = React.useMemo(
    () => [...words].sort(() => Math.random() - 0.5),
    [words],
  );
  const pool = optionPool ?? words;
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState(() => buildOptions(shuffled[0], pool));
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const { playAudio, isLoading } = useCloudTTS();
  const { playCorrect, playWrong } = useSoundEffects();
  const { trackStep } = useProgressTracker(userId);
  const { seconds, formattedTime } = useGameTimer(!done);

  const current = shuffled[idx];

  const handleAnswer = (w: VocabWord) => {
    if (selected !== null) return;
    setSelected(w.id);
    const isCorrect = w.id === current.id;
    if (w.id === current.id) {
      setScore(s => s + 1);
      playCorrect();
    } else {
      playWrong();
    }
    setHistory((prev) => [...prev, { question: current, selected: w }]);
    trackStep({
      moduleId: 'words',
      stepId: `quiz:${categoryId}:${difficulty}:${current.id}`,
      isCorrect,
      payload: { selected: w.id, expected: current.id },
    }).catch((err) => console.error('[progress words quiz]', err));
    setTimeout(() => {
      if (idx + 1 >= shuffled.length) {
        setTotalTime(seconds);
        setDone(true);
      } else {
        const next = shuffled[idx + 1];
        setIdx(i => i + 1);
        setOptions(buildOptions(next, pool));
        setSelected(null);
      }
    }, 1200);
  };

  const handleFinish = () => {
    const pct = shuffled.length > 0 ? Math.round((score / shuffled.length) * 100) : 0;
    onFinish({ correct: score, total: shuffled.length, pct });
  };

  if (done) {
    const perfect = score === shuffled.length;
    const good = score >= shuffled.length / 2;
    const wrongAnswers = history.filter((h) => h.question.id !== h.selected.id);
    const pct = shuffled.length > 0 ? Math.round((score / shuffled.length) * 100) : 0;
    return (
      <div className={styles.result}>
        <div className={styles.resultEmoji}>{perfect ? '🏆' : good ? '⭐' : '💪'}</div>
        <h2 className={styles.resultScore}>{score} / {shuffled.length} ({pct}%)</h2>
        <div className={styles.resultTime}>Время: {totalTime}s</div>
        <p className={styles.resultMsg}>
          {perfect ? 'Отлично! Все слова знаешь!' : good ? 'Хорошо! Продолжай учиться!' : 'Нужна практика. Ещё раз?'}
        </p>

        {wrongAnswers.length > 0 && (
          <div className={styles.reviewBlock}>
            <h3 className={styles.reviewTitle}>📖 Разбор ошибок</h3>
            {wrongAnswers.map((h, i) => (
              <div key={i} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                    <span className={styles.reviewCorrectRow}>
                      <span className={styles.reviewWrongWord} dir="rtl">{getVocalizedForm(h.question.hebrew)}</span>
                      <span className={styles.reviewTranslit}>[{h.question.transliteration}]</span>
                      <span className={styles.reviewTranslation}>{h.question.translation}</span>
                      <button className={styles.reviewSpeak} onClick={() => playAudio(getVocalizedForm(h.question.hebrew))} title="Прослушать">🔊</button>
                  </span>
                </div>
                <div className={styles.reviewMistake}>
                  Ты ответил: «{h.selected.translation}» — это {getVocalizedForm(h.selected.hebrew)} [{h.selected.transliteration}]
                  <button className={styles.reviewSpeak} onClick={() => playAudio(getVocalizedForm(h.selected.hebrew))} title="Прослушать">🔊</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className={styles.retryBtn} onClick={handleFinish}>
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
        <span className={styles.timerText}>⏱ {formattedTime}</span>
        <span>✅ {score}</span>
      </div>

      {/* Question */}
      <div className={styles.questionBox}>
        <p className={styles.prompt}>Переведи слово на русский:</p>
        <button className={`${styles.hebrewWord} ${isLoading ? styles.loading : ''}`}
          onClick={() => playAudio(getVocalizedForm(current.hebrew))} title={isLoading ? 'Загрузка...' : 'Прослушать'}>
          {getVocalizedForm(current.hebrew)}
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
<button key={opt.id} className={cls} disabled={selected !== null} onClick={() => handleAnswer(opt)}>
              {opt.translation}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WordsQuiz;