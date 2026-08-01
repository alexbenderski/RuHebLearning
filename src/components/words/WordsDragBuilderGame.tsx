import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { VOCAB_CATEGORIES } from '../../data/vocabulary';
import type { VocabWord, WordDifficulty } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useNikud } from '../../context/NikudContext';
import { getHebrew } from '../../data/nikudMap';
import styles from './WordsDragBuilderGame.module.css';

interface WordsDragBuilderGameProps {
  sourceWords?: VocabWord[];
  onAnswer?: (correct: boolean, wordId: string) => void;
}

type Answer = { givenId: string; correct: boolean };

function parseSentence(s: string): { before: string; word: string; after: string } | null {
  const m = s.match(/^([\s\S]*)\[(.+?)\]([\s\S]*)$/);
  if (!m) return null;
  return { before: m[1], word: m[2], after: m[3] };
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const DIFF_LABELS: Record<WordDifficulty, string> = {
  easy: 'Лёгкие',
  medium: 'Средние',
  hard: 'Сложные',
};

// ── Draggable tile ────────────────────────────────────────────────────────────
interface TileProps {
  word: VocabWord;
  placed: boolean;
  onAudio: (text: string) => void;
  displayHebrew: string;
}

const DraggableTile: React.FC<TileProps> = ({ word, placed, onAudio, displayHebrew }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: word.id,
    disabled: placed,
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`${styles.tile} ${placed ? styles.tilePlaced : ''} ${isDragging ? styles.tileDragging : ''}`}
      onClick={() => onAudio(word.hebrew)}
      title="Нажми чтобы слушать, перетащи в предложение"
      style={{ touchAction: 'none' }}
    >
      <span className={styles.tileHebrew}>{displayHebrew}</span>
      <span className={styles.tileTranslit}>{word.transliteration}</span>
    </button>
  );
};

// ── Droppable zone ────────────────────────────────────────────────────────────
interface ZoneProps {
  wordId: string;
  isAnswered: boolean;
  currentAnswer?: Answer;
  gameWords: VocabWord[];
  nikudOn: boolean;
}

const DroppableZone: React.FC<ZoneProps> = ({ wordId, isAnswered, currentAnswer, gameWords, nikudOn }) => {
  const { setNodeRef, isOver } = useDroppable({ id: wordId });
  const placed = currentAnswer ? gameWords.find((w) => w.id === currentAnswer.givenId) : null;
  return (
    <span
      ref={setNodeRef}
      className={`${isAnswered ? styles.dropZonePlaced : styles.dropZone} ${isOver && !isAnswered ? styles.dropZoneOver : ''}`}
      dir="rtl"
    >
      {placed ? getHebrew(placed.id, placed.hebrew, nikudOn) : 'גרור לכאן'}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const WordsDragBuilderGame: React.FC<WordsDragBuilderGameProps> = ({ sourceWords, onAnswer }) => {
  const { playAudio } = useCloudTTS();
  const { nikudOn } = useNikud();
  const allWords = React.useMemo(
    () => (sourceWords ?? VOCAB_CATEGORIES.flatMap((c) => c.words)).filter((w) => !!w.sentenceRu),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceWords],
  );

  const [phase, setPhase] = React.useState<'setup' | 'game' | 'results'>('setup');
  const [difficulties, setDifficulties] = React.useState<Set<WordDifficulty>>(new Set(['easy']));
  const [wordCount, setWordCount] = React.useState(10);
  const [gameWords, setGameWords] = React.useState<VocabWord[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, Answer>>({});
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);

  const { formattedTime, resetTimer } = useGameTimer(phase === 'game');

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const toggleDifficulty = (d: WordDifficulty) => {
    setDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d) && next.size > 1) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const available = allWords.filter((w) => difficulties.has(w.difficulty));
  const effectiveCount = Math.min(wordCount, available.length);

  const startGame = () => {
    const selected = shuffle(available).slice(0, effectiveCount);
    setGameWords(selected);
    setCurrentIdx(0);
    setAnswers({});
    resetTimer();
    setPhase('game');
  };

  const handleDrop = (targetWordId: string, draggedWordId: string) => {
    if (answers[targetWordId]) return;
    const isCorrect = targetWordId === draggedWordId;
    onAnswer?.(isCorrect, draggedWordId);
    setAnswers((prev) => ({ ...prev, [targetWordId]: { givenId: draggedWordId, correct: isCorrect } }));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over) handleDrop(over.id as string, active.id as string);
    setActiveDragId(null);
  };

  const correctCount = Object.values(answers).filter((a) => a.correct).length;

  if (phase === 'setup') {
    return (
      <div className={styles.setup}>
        <h3 className={styles.setupTitle}>🧩 Перетащи слова</h3>
        <p className={styles.setupDesc}>Перетащи ивритские слова в правильные предложения</p>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Сложность</div>
          <div className={styles.diffRow}>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <label key={d} className={`${styles.diffChk} ${difficulties.has(d) ? styles.diffChkOn : ''}`}>
                <input type="checkbox" checked={difficulties.has(d)} onChange={() => toggleDifficulty(d)} />
                {DIFF_LABELS[d]}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            Слов в игре: <strong>{effectiveCount}</strong>
            {effectiveCount < wordCount && ` (доступно только ${available.length})`}
          </div>
          <input
            type="range"
            min={5}
            max={20}
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}><span>5</span><span>20</span></div>
        </div>

        <button
          className={styles.startBtn}
          onClick={startGame}
          disabled={available.length === 0}
        >
          {available.length === 0 ? 'Нет слов' : `Начать (${effectiveCount} слов) →`}
        </button>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (phase === 'results') {
    return (
      <div className={styles.results}>
        <div className={styles.resultsHeader}>
          <h3 className={styles.resultsTitle}>Результаты теста</h3>
          <div className={styles.resultsBadge}>{correctCount}/{gameWords.length}</div>
        </div>
        <p className={styles.resultsSubtitle}>
          {correctCount === gameWords.length
            ? `🎉 Отлично! Все слова угаданы за ${formattedTime}!`
            : `Правильно: ${correctCount}, ошибок: ${gameWords.length - correctCount} (Время: ${formattedTime})`}
        </p>
        <div className={styles.resultsList}>
          {gameWords.map((word) => {
            const ans = answers[word.id];
            const parsed = parseSentence(word.sentenceRu ?? '');
            const ok = ans?.correct;
            return (
              <div key={word.id} className={`${styles.resultItem} ${ok ? styles.resultOk : styles.resultFail}`}>
                <div className={styles.resultMark}>{ok ? '✅' : '❌'}</div>
                <div className={styles.resultBody}>
                  <div className={styles.resultWordRow}>
                    <span className={styles.hebrewWord}>{getHebrew(word.id, word.hebrew, nikudOn)}</span>
                    <span className={styles.resultTranslit}>{word.transliteration}</span>
                    <span className={styles.resultTranslation}>{word.translation}</span>
                  </div>
                  {parsed && (
                    <div className={styles.resultSentence}>
                      {parsed.before}<strong className={styles.hebrewWord}>{getHebrew(word.id, word.hebrew, nikudOn)}</strong>{parsed.after}
                    </div>
                  )}
                  {!ok && ans && (
                    <div className={styles.resultMistake}>
                      Ты выбрал: {gameWords.find((w) => w.id === ans.givenId)?.hebrew ?? '—'}
                    </div>
                  )}
                  {!ans && <div className={styles.resultMistake}>Не отвечено</div>}
                </div>
              </div>
            );
          })}
        </div>
        <button className={styles.startBtn} onClick={() => setPhase('setup')}>Играть снова</button>
      </div>
    );
  }

  // ── GAME ─────────────────────────────────────────────────────────────────
  const currentWord = gameWords[currentIdx];
  const parsedCurrent = parseSentence(currentWord?.sentenceRu ?? '');
  const currentAnswer = answers[currentWord?.id];
  const isAnswered = !!currentAnswer;
  const isLast = currentIdx === gameWords.length - 1;
  const activeDragWord = activeDragId ? gameWords.find((w) => w.id === activeDragId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveDragId(active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragId(null)}
    >
      <div className={styles.wrap}>
        {/* Header */}
        <div className={styles.head}>
          <button className={styles.resetBtn} onClick={() => setPhase('setup')} title="Настройки">↩</button>
          <div className={styles.progress}>
            <span className={styles.progressText}>Вопрос {currentIdx + 1} / {gameWords.length}</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${((currentIdx + 1) / gameWords.length) * 100}%` }} />
            </div>
          </div>
          <div className={styles.stats}>
            <span className={styles.timer}>⏱ {formattedTime}</span>
            <span className={styles.score}>{correctCount}/{gameWords.length}</span>
          </div>
        </div>

        {/* Question card */}
        <div className={`${styles.card} ${isAnswered ? styles.cardDone : ''}`}>
          <button className={styles.speakBtn} onClick={() => playAudio(currentWord.hebrew)}>🔊</button>
          <div className={styles.cardContent}>
            {parsedCurrent ? (
              <>
                <div className={styles.sentenceRu}>
                  {parsedCurrent.before}<span className={styles.highlight}>{parsedCurrent.word}</span>{parsedCurrent.after}
                </div>
                <div className={`${styles.sentenceHeb} ${!isAnswered ? styles.dropTarget : ''}`}>
                  {parsedCurrent.before}
                  <DroppableZone
                    wordId={currentWord.id}
                    isAnswered={isAnswered}
                    currentAnswer={currentAnswer}
                    gameWords={gameWords}
                    nikudOn={nikudOn}
                  />
                  {parsedCurrent.after}
                </div>
              </>
            ) : (
              <div className={styles.sentenceRu}>{currentWord.translation}</div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className={styles.nav}>
          <button className={styles.navBtn} disabled={currentIdx === 0} onClick={() => setCurrentIdx((i) => i - 1)}>
            ← Назад
          </button>
          {isLast ? (
            <button className={`${styles.navBtn} ${styles.submitBtn}`} onClick={() => setPhase('results')}>
            Завершить тест ✓
          </button>
        ) : (
          <button className={styles.navBtn} onClick={() => setCurrentIdx((i) => i + 1)}>Далее →</button>
        )}
      </div>

      {/* Word bank */}
      <div className={styles.bankLabel}>Перетащи слово в предложение:</div>
      <div className={styles.bank}>
        {gameWords.map((w) => (
          <DraggableTile
            key={w.id}
            word={w}
            placed={!!answers[w.id]}
            onAudio={playAudio}
            displayHebrew={getHebrew(w.id, w.hebrew, nikudOn)}
          />
        ))}
      </div>
    </div>

    {/* Floating drag preview */}
    <DragOverlay dropAnimation={null}>
      {activeDragWord && (
        <div className={styles.tileOverlay}>
          <span className={styles.tileHebrew}>{getHebrew(activeDragWord.id, activeDragWord.hebrew, nikudOn)}</span>
          <span className={styles.tileTranslit}>{activeDragWord.transliteration}</span>
        </div>
      )}
    </DragOverlay>
  </DndContext>
  );
};

export default WordsDragBuilderGame;