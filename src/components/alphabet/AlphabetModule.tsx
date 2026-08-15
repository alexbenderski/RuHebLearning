import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HEBREW_LETTERS, FINAL_LETTERS, ALL_LETTERS } from '../../data/alphabet';
import { getVariantsForLetters } from '../../data/letterNikud';
import LetterCard from './LetterCard';
import AlphabetTeach from './AlphabetTeach';
import AlphabetQuiz from './AlphabetQuiz';
import AlphabetMemoryGame from './AlphabetMemoryGame';
import AlphabetWordBuilderGame from './AlphabetWordBuilderGame';
import { VOCAB_CATEGORIES } from '../../data/vocabulary';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import { useLetterProgress } from '../../hooks/useLetterProgress';
import { getSavedWords } from '../../firebase/userService';
import type { VocabWord } from '../../types';
import styles from './AlphabetModule.module.css';

type Mode = 'browse' | 'quiz' | 'memory' | 'word-build';
export type LetterStat = { correct: number; total: number };

interface AlphabetModuleProps {
  userId?: string;
}

const AlphabetModule: React.FC<AlphabetModuleProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('browse');
  const [letterStats, setLetterStats] = useState<Record<string, LetterStat>>({});
  const [learnedWords, setLearnedWords] = useState<VocabWord[]>([]);
  const { trackStep } = useProgressTracker(userId);
  const { trackLetter } = useLetterProgress(userId);

  const nikudVariants = useMemo(
    () => getVariantsForLetters(ALL_LETTERS.map((l) => l.letter)),
    [],
  );

  // Use all vocabulary words as the pool for word-building.
  // Also load saved words from Firebase as a supplement.
  const allVocabWords = useMemo(() => VOCAB_CATEGORIES.flatMap((c) => c.words), []);

  React.useEffect(() => {
    if (!userId) return;
    getSavedWords(userId)
      .then((words) => {
        // Merge: keep all vocab words + any saved words that aren't already in vocab
        const existingIds = new Set(allVocabWords.map((w) => w.id));
        const extras = words.filter((w) => !existingIds.has(w.id));
        setLearnedWords([...allVocabWords, ...extras]);
      })
      .catch((err) => {
        console.error('[alphabet learned words]', err);
        setLearnedWords(allVocabWords);
      });
  }, [userId, allVocabWords]);

  const handleQuizAnswer = (letterChar: string, isCorrect: boolean) => {
    setLetterStats((prev) => ({
      ...prev,
      [letterChar]: {
        correct: (prev[letterChar]?.correct ?? 0) + (isCorrect ? 1 : 0),
        total: (prev[letterChar]?.total ?? 0) + 1,
      },
    }));
    trackLetter({ letter: letterChar, isCorrect, game: 'quiz', detail: 'nikud-pick' }).catch(console.error);
  };

  const totalAttempts = Object.values(letterStats).reduce((s, v) => s + v.total, 0);
  const weakLetters = ALL_LETTERS.filter((l) => {
    const s = letterStats[l.letter];
    return s && s.total >= 2 && s.correct / s.total < 0.6;
  });

  return (
    <div className={styles.module}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📖 Алфавит</h1>
          <p className={styles.subtitle}>22 основные буквы + 5 конечных форм</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Дашборд</button>
          <div className={styles.modeSwitcher}>
            <button
              className={`${styles.modeBtn} ${mode === 'browse' ? styles.active : ''}`}
              onClick={() => setMode('browse')}
            >
              📚 Изучить
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'quiz' ? styles.active : ''}`}
              onClick={() => setMode('quiz')}
            >
              🎯 Мини-квиз
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'memory' ? styles.active : ''}`}
              onClick={() => setMode('memory')}
            >
              🧠 Memory
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'word-build' ? styles.active : ''}`}
              onClick={() => setMode('word-build')}
            >
              🔤 Собери слово
            </button>
          </div>
        </div>
      </div>

      {mode === 'browse' ? (
        <>
          {/* Weak letters — shown only after quiz use */}
          {weakLetters.length > 0 && (
            <div className={styles.weakPanel}>
              <h3 className={styles.weakTitle}>🔴 Нужна практика:</h3>
              <div className={styles.weakGrid}>
                {weakLetters.map((l) => (
                  <div key={l.letter} className={styles.weakChip}>
                    <span className={styles.weakLetter}>{l.letter}</span>
                    <span className={styles.weakName}>{l.name}</span>
                    <span className={styles.weakAcc}>
                      {letterStats[l.letter].correct}/{letterStats[l.letter].total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Буквы с никудом — объяснения
              {totalAttempts > 0 && (
                <span className={styles.sessionNote}>{totalAttempts} попыток в сессии</span>
              )}
            </h2>
            <p className={styles.sectionHint}>
              Нажми на любой символ, чтобы услышать его звучание.
            </p>
            <AlphabetTeach letters={ALL_LETTERS} />
          </section>

          {/* Main 22 letters */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Основные буквы
              <span className={styles.count}>22</span>
            </h2>
            <div className={styles.grid}>
              {HEBREW_LETTERS.map((letter, i) => (
                <LetterCard
                  key={letter.letter}
                  letter={letter}
                  index={i + 1}
                  stats={letterStats[letter.letter]}
                />
              ))}
            </div>
          </section>

          {/* 5 final letters */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Конечные буквы — אותיות סופיות
              <span className={styles.count}>5</span>
            </h2>
            <p className={styles.sectionHint}>
              Эти буквы используются только в конце слова. Стрелка ← показывает обычную форму буквы.
            </p>
            <div className={`${styles.grid} ${styles.gridFinal}`}>
              {FINAL_LETTERS.map((letter) => (
                <LetterCard
                  key={letter.letter}
                  letter={letter}
                  stats={letterStats[letter.letter]}
                />
              ))}
            </div>
          </section>
        </>
      ) : mode === 'quiz' ? (
        <AlphabetQuiz
          letters={ALL_LETTERS}
          userId={userId}
          onAnswer={handleQuizAnswer}
          variants={nikudVariants}
        />
      ) : mode === 'memory' ? (
        <AlphabetMemoryGame
          letters={ALL_LETTERS}
          variants={nikudVariants}
          onEvent={(isMatch) => {
            trackStep({ moduleId: 'alphabet', stepId: 'memory-pair', isCorrect: isMatch }).catch((err) => console.error('[progress alphabet memory]', err));
          }}
          onLetterResult={(letterKey, isCorrect) => {
            trackLetter({ letter: letterKey, isCorrect, game: 'memory', detail: 'match' }).catch(console.error);
          }}
        />
      ) : (
        <AlphabetWordBuilderGame
          learnedWords={learnedWords}
          onStep={(correct) => {
            trackStep({ moduleId: 'alphabet', stepId: 'word-build-letter', isCorrect: correct }).catch((err) => console.error('[progress alphabet word build]', err));
          }}
        />
      )}
    </div>
  );
};

export default AlphabetModule;