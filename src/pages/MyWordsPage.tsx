import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { SavedWord, WordDifficulty } from '../types';
import { getSavedWords, removeWordFromList, updateSavedWordDifficulty } from '../firebase/userService';
import { useProgressTracker } from '../hooks/useProgressTracker';
import useCloudTTS from '../hooks/useCloudTTS';
import { getNikudWordsForSavedWords, getVocalizedForm } from '../data/nikudWords';
import WordsMemoryGame from '../components/words/WordsMemoryGame';
import WordsDragBuilderGame from '../components/words/WordsDragBuilderGame';
import WordsNikudGame from '../components/words/WordsNikudGame';
import WordsQuiz from '../components/words/WordsQuiz';
import styles from './MyWordsPage.module.css';

interface MyWordsPageProps {
  userId: string;
}

const DIFFS: WordDifficulty[] = ['easy', 'medium', 'hard'];

const MyWordsPage: React.FC<MyWordsPageProps> = ({ userId }) => {
  const [savedWords, setSavedWords] = React.useState<SavedWord[]>([]);
  const [difficulty, setDifficulty] = React.useState<WordDifficulty>('easy');
  const [mode, setMode] = React.useState<'list' | 'memory' | 'drag' | 'nikud' | 'quiz'>('list');
  const navigate = useNavigate();
  const { trackStep } = useProgressTracker(userId);
  const { playAudio } = useCloudTTS();

  const loadWords = React.useCallback(async () => {
    const words = await getSavedWords(userId);
    setSavedWords(words);
  }, [userId]);

  React.useEffect(() => {
    loadWords().catch((err) => console.error('[my words]', err));
  }, [loadWords]);

  const filtered = savedWords.filter((w) => w.difficulty === difficulty);
  const nikudPool = React.useMemo(() => getNikudWordsForSavedWords(savedWords), [savedWords]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🗂️ Мой список слов</h1>
          <p className={styles.subtitle}>Личный словарь по сложности + мини-игры</p>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← На главную</button>
      </div>

      <div className={styles.row}>
        {DIFFS.map((d) => (
          <button
            key={d}
            className={`${styles.tab} ${difficulty === d ? styles.tabActive : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d === 'easy' ? 'Легко' : d === 'medium' ? 'Средне' : 'Сложно'} ({savedWords.filter((w) => w.difficulty === d).length})
          </button>
        ))}
      </div>

      <div className={styles.row}>
        <button className={`${styles.modeBtn} ${mode === 'list' ? styles.modeBtnActive : ''}`} onClick={() => setMode('list')}>
          📚 Список
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'memory' ? styles.modeBtnActive : ''}`}
          onClick={() => {
            setMode('memory');
            trackStep({ moduleId: 'my-words', stepId: `memory:${difficulty}` }).catch((err) => console.error('[my words progress]', err));
          }}
        >
          🧠 Memory game
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'drag' ? styles.modeBtnActive : ''}`}
          onClick={() => {
            setMode('drag');
            trackStep({ moduleId: 'my-words', stepId: `drag:${difficulty}` }).catch((err) => console.error('[my words progress]', err));
          }}
        >
          🧩 Drag words
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'quiz' ? styles.modeBtnActive : ''}`}
          onClick={() => {
            setMode('quiz');
            trackStep({ moduleId: 'my-words', stepId: `quiz:${difficulty}` }).catch((err) => console.error('[my words progress]', err));
          }}
        >
          🎯 Квиз
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'nikud' ? styles.modeBtnActive : ''}`}
          onClick={() => {
            setMode('nikud');
            trackStep({ moduleId: 'my-words', stepId: `nikud:${difficulty}` }).catch((err) => console.error('[my words progress]', err));
          }}
        >
          🔤 Никуд
        </button>
      </div>

      {mode === 'list' && (
        <div className={styles.list}>
          {filtered.length === 0 && <p className={styles.empty}>Нет слов в этом уровне. Добавь из модуля Слова.</p>}
          {filtered.map((w) => (
            <div key={w.id} className={styles.wordCard}>
              <div className={styles.wordMain}>
                <div className={styles.he}>{getVocalizedForm(w.hebrew)}</div>
                <div className={styles.ru}>{w.translation}</div>
                <div className={styles.tr}>{w.transliteration}</div>
              </div>
              <button
                className={styles.speakBtn}
                onClick={() => playAudio(w.hebrew)}
                title="Прослушать"
              >
                🔊
              </button>
              <button
                className={styles.removeBtn}
                onClick={async () => {
                  await removeWordFromList(userId, w.id);
                  await loadWords();
                }}
              >
                Удалить
              </button>
              <div className={styles.wordDiffRow}>
                {DIFFS.map((d) => (
                  <button
                    key={d}
                    className={`${styles.diffMiniBtn} ${w.difficulty === d ? styles.diffMiniBtnActive : ''}`}
                    onClick={async () => {
                      await updateSavedWordDifficulty(userId, w.id, d);
                      await loadWords();
                    }}
                  >
                    {d === 'easy' ? 'Л' : d === 'medium' ? 'С' : 'Т'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'memory' && filtered.length > 0 && (
        <WordsMemoryGame
          words={filtered}
          onEvent={(isMatch) => {
            trackStep({ moduleId: 'my-words', stepId: `memory-pair:${difficulty}`, isCorrect: isMatch }).catch((err) => console.error('[my words progress]', err));
          }}
        />
      )}

      {mode === 'drag' && filtered.length > 0 && (
        <WordsDragBuilderGame
          sourceWords={filtered}
          onAnswer={(correct, wordId) => {
            trackStep({ moduleId: 'my-words', stepId: `drag:${difficulty}:${wordId}`, isCorrect: correct }).catch((err) => console.error('[my words progress]', err));
          }}
        />
      )}

      {mode === 'quiz' && filtered.length > 0 && (
        <WordsQuiz
          userId={userId}
          categoryId="my-words"
          difficulty={difficulty}
          words={filtered}
          onFinish={() => setMode('list')}
        />
      )}

      {mode === 'nikud' && (
        <WordsNikudGame
          wordPool={nikudPool}
          onAnswer={(correct, wordId) => {
            trackStep({ moduleId: 'my-words', stepId: `nikud:${difficulty}:${wordId}`, isCorrect: correct }).catch((err) => console.error('[my words progress]', err));
          }}
        />
      )}
    </div>
  );
};

export default MyWordsPage;