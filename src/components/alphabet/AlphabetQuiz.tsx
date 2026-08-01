import React, { useState, useCallback } from 'react';
import type { HebrewLetter } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import styles from './AlphabetQuiz.module.css';

interface AlphabetQuizProps {
  letters: HebrewLetter[];
  userId?: string;
  onAnswer?: (letterChar: string, correct: boolean) => void;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildOptions(correct: HebrewLetter, all: HebrewLetter[]): HebrewLetter[] {
  const pool = all.filter(l => l.letter !== correct.letter);
  const wrong = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

// Single state object guarantees current and options always correspond to the same letter
type Question = { current: HebrewLetter; options: HebrewLetter[] };

function makeQuestion(letters: HebrewLetter[]): Question {
  const current = pickRandom(letters);
  return { current, options: buildOptions(current, letters) };
}

const AlphabetQuiz: React.FC<AlphabetQuizProps> = ({ letters, userId, onAnswer }) => {
  const [question, setQuestion] = useState<Question>(() => makeQuestion(letters));
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const { playAudio } = useCloudTTS();
  const { trackStep } = useProgressTracker(userId);

  const { current, options } = question;

  const nextQuestion = useCallback(() => {
    setQuestion(makeQuestion(letters));
    setSelected(null);
  }, [letters]);

  const handleAnswer = (letter: HebrewLetter) => {
    if (selected !== null) return;
    setSelected(letter.letter);
    setTotal(t => t + 1);
    const isCorrect = letter.letter === current.letter;
    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      playAudio(current.letter);
    } else {
      setStreak(0);
    }
    trackStep({
      moduleId: 'alphabet',
      stepId: `quiz:${current.letter}`,
      isCorrect,
      payload: { selected: letter.letter },
    }).catch((err) => console.error('[progress alphabet]', err));
    onAnswer?.(current.letter, isCorrect);
    setTimeout(nextQuestion, 1300);
  };

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className={styles.quiz}>
      {/* Stats bar */}
      <div className={styles.stats}>
        <span className={styles.stat}>✅ {score} / {total}</span>
        <span className={styles.stat}>🎯 {accuracy}%</span>
        {streak >= 3 && (
          <span className={`${styles.stat} ${styles.streak}`}>🔥 Серия: {streak}!</span>
        )}
      </div>

      {/* Question */}
      <div className={styles.questionBox}>
        <p className={styles.prompt}>Как называется эта буква?</p>
        <button className={styles.bigLetter} onClick={() => playAudio(current.letter)} title="Прослушать">
          {current.letter}
        </button>
        <p className={styles.tapHint}>нажми на букву, чтобы услышать</p>
      </div>

      {/* Options */}
      <div className={styles.options}>
        {options.map((opt) => {
          let cls = styles.option;
          if (selected !== null) {
            if (opt.letter === current.letter) cls = `${styles.option} ${styles.correct}`;
            else if (opt.letter === selected) cls = `${styles.option} ${styles.wrong}`;
          }
          return (
            <button key={opt.letter} className={cls} onClick={() => handleAnswer(opt)}>
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AlphabetQuiz;
