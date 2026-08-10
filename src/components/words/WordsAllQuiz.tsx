import React, { useState, useMemo } from 'react';
import { VOCAB_CATEGORIES } from '../../data/vocabulary';
import type { VocabWord, WordDifficulty } from '../../types';
import WordsQuiz from './WordsQuiz';
import styles from './WordsAllQuiz.module.css';

interface WordsAllQuizProps {
  userId?: string;
  onBack: () => void;
}

const DIFF_LABELS: Record<'all' | WordDifficulty, string> = {
  all: 'Все',
  easy: 'Лёгкие',
  medium: 'Средние',
  hard: 'Сложные',
};

const WordsAllQuiz: React.FC<WordsAllQuizProps> = ({ userId, onBack }) => {
  const [phase, setPhase] = useState<'setup' | 'playing'>('setup');
  const [difficulty, setDifficulty] = useState<'all' | WordDifficulty>('all');
  const [wordCount, setWordCount] = useState(10);

  const allWords = useMemo(() => VOCAB_CATEGORIES.flatMap((c) => c.words), []);
  const filteredWords = useMemo(() => {
    if (difficulty === 'all') return allWords;
    return allWords.filter((w) => w.difficulty === difficulty);
  }, [allWords, difficulty]);

  const effectiveCount = Math.min(wordCount, filteredWords.length);
  const [gameWords, setGameWords] = useState<VocabWord[]>([]);

  const startGame = () => {
    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5).slice(0, effectiveCount);
    setGameWords(shuffled);
    setPhase('playing');
  };

  if (phase === 'playing') {
    return (
      <WordsQuiz
        userId={userId}
        words={gameWords}
        categoryId="all"
        difficulty={difficulty === 'all' ? 'easy' : difficulty}
        optionPool={filteredWords}
        onFinish={() => setPhase('setup')}
      />
    );
  }

  return (
    <div className={styles.setup}>
      <h3 className={styles.setupTitle}>🎯 Квиз по всем словам</h3>
      <p className={styles.setupDesc}>
        Все слова из всех категорий перемешаны. Проверь себя на полной лексике курса!
      </p>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Сложность</div>
        <div className={styles.diffRow}>
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              className={`${styles.diffBtn} ${difficulty === d ? styles.diffBtnActive : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {DIFF_LABELS[d]} ({d === 'all' ? allWords.length : allWords.filter((w) => w.difficulty === d).length})
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          Слов в квизе: <strong>{effectiveCount}</strong>
          {effectiveCount < wordCount && ` (доступно ${filteredWords.length})`}
        </div>
        <input
          type="range"
          min={5}
          max={Math.max(5, filteredWords.length)}
          step={1}
          value={Math.min(wordCount, Math.max(5, filteredWords.length))}
          onChange={(e) => setWordCount(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.sliderLabels}>
          <span>5</span>
          <span>{filteredWords.length}</span>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button
          className={styles.startBtn}
          onClick={startGame}
          disabled={filteredWords.length === 0}
        >
          {filteredWords.length === 0 ? 'Нет слов' : `Начать квиз (${effectiveCount}) →`}
        </button>
        <button className={styles.backBtn} onClick={onBack}>
          ← Назад
        </button>
      </div>
    </div>
  );
};

export default WordsAllQuiz;