import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VOCAB_CATEGORIES } from '../../data/vocabulary';
import type { VocabCategory, VocabWord, WordDifficulty } from '../../types';
import FlashCard from './FlashCard';
import WordsQuiz from './WordsQuiz';
import WordsMemoryGame from './WordsMemoryGame';
import WordsDragBuilderGame from './WordsDragBuilderGame';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import { getSavedWords, getTrackedWordIds, removeWordFromList, saveWordToList } from '../../firebase/userService';
import styles from './WordsModule.module.css';

type Mode = 'categories' | 'cards' | 'practice' | 'memory' | 'drag';


interface WordsModuleProps {
  userId?: string;
}

const WordsModule: React.FC<WordsModuleProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('categories');
  const [category, setCategory] = useState<VocabCategory | null>(null);
  const [difficulty, setDifficulty] = useState<WordDifficulty>('easy');
  const [cardIdx, setCardIdx] = useState(0);
  const [practiceCount, setPracticeCount] = useState(10);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [chooserWord, setChooserWord] = useState<VocabWord | null>(null);
  const { trackStep } = useProgressTracker(userId);

  const allDiffWords = category ? category.words.filter(w => w.difficulty === difficulty) : [];
  // Stable shuffle reset when category/difficulty/count changes
  const activeWords = React.useMemo(
    () => [...allDiffWords].sort(() => Math.random() - 0.5).slice(0, Math.min(practiceCount, allDiffWords.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category?.id, difficulty, practiceCount],
  );

  React.useEffect(() => {
    if (!userId) return;
    Promise.all([getSavedWords(userId), getTrackedWordIds(userId)])
      .then(([words, tracked]) => {
        setSavedIds(new Set(words.map((w) => w.id)));
        setTrackedIds(tracked);
      })
      .catch((err) => console.error('[saved words load]', err));
  }, [userId]);

  const toggleSaveWord = async (word: VocabWord) => {
    if (!userId) return;
    const isSaved = savedIds.has(word.id);
    if (isSaved) {
      await removeWordFromList(userId, word.id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(word.id);
        return next;
      });
    } else {
      setChooserWord(word);
      return;
    }
    trackStep({
      moduleId: 'words',
      stepId: isSaved ? `unsave:${word.id}` : `save:${word.id}`,
      payload: { difficulty: word.difficulty },
    }).catch((err) => console.error('[progress save word]', err));
  };

  const saveWithDifficulty = async (picked: WordDifficulty) => {
    if (!userId || !chooserWord) return;
    const payload = { ...chooserWord, difficulty: picked };
    await saveWordToList(userId, payload);
    setSavedIds((prev) => new Set(prev).add(chooserWord.id));
    setTrackedIds((prev) => new Set(prev).add(chooserWord.id));
    trackStep({
      moduleId: 'words',
      stepId: `save:${chooserWord.id}`,
      payload: { difficulty: picked },
    }).catch((err) => console.error('[progress save word]', err));
    setChooserWord(null);
  };

  const openCategory = (cat: VocabCategory) => {
    setCategory(cat);
    setDifficulty('easy');
    setCardIdx(0);
    setMode('cards');
    trackStep({
      moduleId: 'words',
      stepId: `open-category:${cat.id}`,
      payload: { category: cat.id },
    }).catch((err) => console.error('[progress words]', err));
  };

  const backToCategories = () => {
    setMode('categories');
    setCategory(null);
    setCardIdx(0);
  };

  return (
    <div className={styles.module}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>💬 Слова</h1>
          <p className={styles.subtitle}>
            {mode === 'drag' && !category ? '🧩 Квиз из всех слов' : category ? `${category.icon} ${category.name}` : 'Выбери категорию для изучения'}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Дашборд</button>
          {mode !== 'categories' && (
            <button className={styles.backBtn} onClick={backToCategories}>
              ← Все категории
            </button>
          )}
        </div>
      </div>

      {/* Mode: category grid */}
      {mode === 'categories' && (
        <div className={styles.catGrid}>
          {VOCAB_CATEGORIES.map((cat) => (
            <button key={cat.id} className={styles.catCard} onClick={() => openCategory(cat)}>
              <span className={styles.catIcon}>{cat.icon}</span>
              <span className={styles.catName}>{cat.name}</span>
              <span className={styles.catCount}>{cat.words.length} слов</span>
            </button>
          ))}
          <button className={`${styles.catCard} ${styles.catCardDrag}`} onClick={() => setMode('drag')}>
            <span className={styles.catIcon}>🧩</span>
            <span className={styles.catName}>Drag Words</span>
            <span className={styles.catCount}>Квиз из всех слов</span>
          </button>
        </div>
      )}

      {mode !== 'categories' && category && (
        <>
          <div className={styles.difficultyRow}>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                className={`${styles.diffBtn} ${difficulty === d ? styles.diffBtnActive : ''}`}
                onClick={() => {
                  setDifficulty(d);
                  setCardIdx(0);
                  trackStep({
                    moduleId: 'words',
                    stepId: `difficulty:${category.id}:${d}`,
                    payload: { category: category.id, difficulty: d },
                  }).catch((err) => console.error('[progress words]', err));
                }}
              >
                {d === 'easy' ? 'Легко' : d === 'medium' ? 'Средне' : 'Сложно'} ({category.words.filter(w => w.difficulty === d).length})
              </button>
            ))}
          </div>

          {mode !== 'drag' && (
            <div className={styles.countRow}>
              <span className={styles.countLabel}>
                Слов за сеанс: <strong>{Math.min(practiceCount, allDiffWords.length)}</strong>
                {allDiffWords.length > 0 && ` / ${allDiffWords.length}`}
              </span>
              <input
                type="range" min={3} max={Math.max(3, allDiffWords.length)} step={1}
                value={Math.min(practiceCount, Math.max(3, allDiffWords.length))}
                onChange={(e) => { setPracticeCount(Number(e.target.value)); setCardIdx(0); }}
                className={styles.countSlider}
              />
            </div>
          )}

          <div className={styles.modeRow}>
            <button className={`${styles.modePill} ${mode === 'cards' ? styles.modePillActive : ''}`} onClick={() => setMode('cards')}>🃏 Карточки</button>
            <button className={`${styles.modePill} ${mode === 'practice' ? styles.modePillActive : ''}`} onClick={() => setMode('practice')}>🎯 Квиз</button>
            <button className={`${styles.modePill} ${mode === 'memory' ? styles.modePillActive : ''}`} onClick={() => setMode('memory')}>🧠 Memory</button>
            <button className={`${styles.modePill} ${mode === 'drag' ? styles.modePillActive : ''}`} onClick={() => setMode('drag')}>🧩 Drag words</button>
          </div>
        </>
      )}

      {/* Mode: flashcards */}
      {mode === 'cards' && category && activeWords.length > 0 && (
        <FlashCard
          userId={userId}
          word={activeWords[cardIdx]}
          isSaved={savedIds.has(activeWords[cardIdx].id)}
          onToggleSave={toggleSaveWord}
          current={cardIdx + 1}
          total={activeWords.length}
          onPrev={() => setCardIdx(i => Math.max(0, i - 1))}
          onNext={() => {
            if (cardIdx + 1 < activeWords.length) {
              setCardIdx(i => i + 1);
            } else {
              setMode('practice');
              trackStep({
                moduleId: 'words',
                stepId: `cards-complete:${category.id}:${difficulty}`,
                payload: { category: category.id, difficulty },
              }).catch((err) => console.error('[progress words]', err));
            }
          }}
        />
      )}

      {/* Mode: practice quiz */}
      {mode === 'practice' && category && activeWords.length > 0 && (
        <WordsQuiz
          userId={userId}
          words={activeWords}
          categoryId={category.id}
          difficulty={difficulty}
          onFinish={() => { setCardIdx(0); setMode('cards'); }}
        />
      )}

      {mode === 'memory' && activeWords.length > 0 && (
        <WordsMemoryGame
          words={activeWords}
          onEvent={(isMatch) => {
            trackStep({
              moduleId: 'words',
              stepId: `memory:${category?.id}:${difficulty}`,
              isCorrect: isMatch,
            }).catch((err) => console.error('[progress words memory]', err));
          }}
        />
      )}

      {mode === 'drag' && (
        <WordsDragBuilderGame
          sourceWords={category ? category.words : undefined}
          onAnswer={(correct, wordId) => {
            trackStep({
              moduleId: 'words',
              stepId: `drag:${category?.id ?? 'all'}:${difficulty}:${wordId}`,
              isCorrect: correct,
            }).catch((err) => console.error('[progress words drag]', err));
          }}
        />
      )}

      {chooserWord && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>Куда сохранить слово?</h3>
            <p>{chooserWord.hebrew} — {chooserWord.translation}</p>
            <div className={styles.chooserBtns}>
              <button onClick={() => saveWithDifficulty('easy')}>Легко</button>
              <button onClick={() => saveWithDifficulty('medium')}>Средне</button>
              <button onClick={() => saveWithDifficulty('hard')}>Сложно</button>
            </div>
            <button className={styles.cancelBtn} onClick={() => setChooserWord(null)}>Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordsModule;
