import React, { useState, useMemo } from 'react';
import { NIKUD_WORDS, NIKUD_MARKS, getMarksForWord } from '../../data/nikudWords';
import type { NikudWordData, NikudSlot, NikudMarkDef } from '../../data/nikudWords';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useGameTimer } from '../../hooks/useGameTimer';
import styles from './WordsNikudGame.module.css';

interface WordsNikudGameProps {
  onAnswer?: (correct: boolean, wordId: string) => void;
}

type GamePhase = 'setup' | 'game' | 'results';

interface SlotAssignment {
  slotId: string;
  markId: string;
}

interface WordResult {
  word: NikudWordData;
  assignments: SlotAssignment[];
  allCorrect: boolean;
  mistakes: { slot: NikudSlot; placed: NikudMarkDef | null; correct: NikudMarkDef }[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const WordsNikudGame: React.FC<WordsNikudGameProps> = ({ onAnswer }) => {
  const { playAudio } = useCloudTTS();
  const { playClick, playMatch } = useSoundEffects();
  const { formattedTime, resetTimer } = useGameTimer(true);

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [wordCount, setWordCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const [gameWords, setGameWords] = useState<NikudWordData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<WordResult[]>([]);

  // Current word state
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});
  const [draggedMarkId, setDraggedMarkId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [currentMistakes, setCurrentMistakes] = useState<WordResult['mistakes']>([]);

  const availableWords = useMemo(() => {
    if (difficulty === 'all') return NIKUD_WORDS;
    return NIKUD_WORDS.filter((w) => w.difficulty === difficulty);
  }, [difficulty]);

  const effectiveCount = Math.min(wordCount, availableWords.length);

  const startGame = () => {
    const selected = shuffle(availableWords).slice(0, effectiveCount);
    setGameWords(selected);
    setCurrentIdx(0);
    setResults([]);
    setSlotAssignments({});
    setChecked(false);
    setCurrentMistakes([]);
    setDraggedMarkId(null);
    resetTimer();
    setPhase('game');
  };

  const currentWord = gameWords[currentIdx];
  const isLast = currentIdx === gameWords.length - 1;

  // Shuffled available marks for the current word
  const availableMarks = useMemo(() => {
    if (!currentWord) return [];
    const marks = getMarksForWord(currentWord);
    // Add some extra decoy marks for harder difficulty
    if (currentWord.difficulty !== 'easy') {
      const decoys = NIKUD_MARKS.filter(
        (m) => !marks.find((cm) => cm.id === m.id)
      ).slice(0, currentWord.difficulty === 'hard' ? 4 : 2);
      return shuffle([...marks, ...decoys]);
    }
    return shuffle(marks);
  }, [currentWord]);

  const handleDragStart = (markId: string) => {
    playClick();
    setDraggedMarkId(markId);
  };

  const handleSlotDrop = (slotId: string) => {
    if (!draggedMarkId || checked) return;
    setSlotAssignments((prev) => {
      // Remove this mark from any other slot it was assigned to
      const next: Record<string, string> = {};
      for (const [key, val] of Object.entries(prev)) {
        if (val !== draggedMarkId) {
          next[key] = val;
        }
      }
      next[slotId] = draggedMarkId;
      return next;
    });
    setDraggedMarkId(null);
  };

  const handleSlotClick = (slotId: string) => {
    if (checked) return;
    // If a mark is being dragged, drop it
    if (draggedMarkId) {
      handleSlotDrop(slotId);
      return;
    }
    // If slot already has a mark, remove it (click to clear)
    if (slotAssignments[slotId]) {
      setSlotAssignments((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
    }
  };

  const handleMarkClick = (markId: string) => {
    if (checked) return;
    playClick();
    // If already dragging this mark, cancel drag
    if (draggedMarkId === markId) {
      setDraggedMarkId(null);
      return;
    }
    setDraggedMarkId(markId);
  };

  const allSlotsFilled = useMemo(() => {
    if (!currentWord) return false;
    return currentWord.slots.every((s) => slotAssignments[s.id]);
  }, [currentWord, slotAssignments]);

  const handleCheck = () => {
    if (!currentWord || !allSlotsFilled) return;

    const mistakes: WordResult['mistakes'] = [];
    let allCorrect = true;

    for (const slot of currentWord.slots) {
      const placedMarkId = slotAssignments[slot.id];
      const placedMark = placedMarkId ? NIKUD_MARKS.find((m) => m.id === placedMarkId) : null;
      const correctMark = NIKUD_MARKS.find((m) => m.id === slot.correctMarkId);

      if (placedMarkId !== slot.correctMarkId) {
        allCorrect = false;
        mistakes.push({
          slot,
          placed: placedMark || null,
          correct: correctMark!,
        });
      }
    }

    if (allCorrect) {
      playMatch();
    } else {
      playClick();
    }

    setChecked(true);
    setCurrentMistakes(mistakes);

    const result: WordResult = {
      word: currentWord,
      assignments: currentWord.slots.map((s) => ({
        slotId: s.id,
        markId: slotAssignments[s.id] || '',
      })),
      allCorrect,
      mistakes,
    };

    setResults((prev) => [...prev, result]);
    onAnswer?.(allCorrect, currentWord.id);
  };

  const handleNext = () => {
    if (isLast) {
      setPhase('results');
    } else {
      setCurrentIdx((i) => i + 1);
      setSlotAssignments({});
      setChecked(false);
      setCurrentMistakes([]);
      setDraggedMarkId(null);
    }
  };

  const totalCorrect = results.filter((r) => r.allCorrect).length;

  // ── SETUP PHASE ───────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className={styles.setup}>
        <h3 className={styles.setupTitle}>🔤 Никуд — Расставь огласовки</h3>
        <p className={styles.setupDesc}>
          Перетащи знаки никуда (огласовки) на правильные места в слове.
          Знаки могут быть под буквой, над буквой или внутри буквы.
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
                {d === 'all' ? 'Все' : d === 'easy' ? 'Лёгкие' : d === 'medium' ? 'Средние' : 'Сложные'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            Слов в игре: <strong>{effectiveCount}</strong>
            {effectiveCount < wordCount && ` (доступно ${availableWords.length})`}
          </div>
          <input
            type="range"
            min={3}
            max={Math.max(3, availableWords.length)}
            value={Math.min(wordCount, availableWords.length)}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}><span>3</span><span>{availableWords.length}</span></div>
        </div>

        <button
          className={styles.startBtn}
          onClick={startGame}
          disabled={availableWords.length === 0}
        >
          {availableWords.length === 0 ? 'Нет слов' : `Начать (${effectiveCount} слов) →`}
        </button>
      </div>
    );
  }

  // ── RESULTS PHASE ─────────────────────────────────────────
  if (phase === 'results') {
    return (
      <div className={styles.results}>
        <div className={styles.resultsHeader}>
          <h3 className={styles.resultsTitle}>Результаты Никуд</h3>
          <div className={styles.resultsBadge}>{totalCorrect}/{gameWords.length}</div>
        </div>
        <p className={styles.resultsSubtitle}>
          {totalCorrect === gameWords.length
            ? `🎉 Отлично! Все слова собраны верно за ${formattedTime}!`
            : `Правильно: ${totalCorrect}, ошибок: ${gameWords.length - totalCorrect} (Время: ${formattedTime})`}
        </p>
        <div className={styles.resultsList}>
          {results.map((r, i) => (
            <div key={i} className={`${styles.resultItem} ${r.allCorrect ? styles.resultOk : styles.resultFail}`}>
              <div className={styles.resultMark}>{r.allCorrect ? '✅' : '❌'}</div>
              <div className={styles.resultBody}>
                <div className={styles.resultWordRow}>
                  <span className={styles.hebrewWord}>{r.word.wordWithNikud}</span>
                  <span className={styles.resultTranslit}>[{r.word.transliteration}]</span>
                  <span className={styles.resultTranslation}>{r.word.translation}</span>
                </div>
                {!r.allCorrect && (
                  <div className={styles.mistakesList}>
                    {r.mistakes.map((m, mi) => (
                      <div key={mi} className={styles.mistakeItem}>
                        Буква {m.slot.letterIndex + 1}: нужно{' '}
                        <strong>{m.correct.name}</strong> ({m.correct.char} — {m.correct.sound})
                        {m.placed && (
                          <>, а поставлено <span className={styles.wrongMark}>{m.placed.name}</span> ({m.placed.char})</>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className={styles.startBtn} onClick={() => setPhase('setup')}>Играть снова</button>
      </div>
    );
  }

  // ── GAME PHASE ────────────────────────────────────────────
  if (!currentWord) {
    return (
      <div className={styles.wrap}>
        <div className={styles.setup}>
          <p>Нет доступных слов для игры.</p>
          <button className={styles.startBtn} onClick={() => setPhase('setup')}>Назад</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameWrap}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressInfo}>
          <span>Слово {currentIdx + 1} из {gameWords.length}</span>
          <span className={styles.timer}>{formattedTime}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((currentIdx + 1) / gameWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Word display with slots */}
      <div className={styles.wordArea}>
        <div className={styles.wordHint}>
          <span className={styles.hintLabel}>Значение:</span>
          <span className={styles.hintValue}>{currentWord.translation}</span>
          <button className={styles.speakBtn} onClick={() => playAudio(currentWord.wordWithNikud)} title="Прослушать">
            🔊
          </button>
        </div>

        <div className={styles.lettersRow}>
          {[...currentWord.letters].reverse().map((letter, reversedIdx) => {
            const li = currentWord.letters.length - 1 - reversedIdx;
            const letterSlots = currentWord.slots.filter((s) => s.letterIndex === li);
            const hasAbove = letterSlots.some((s) => s.position === 'above');
            const hasInside = letterSlots.some((s) => s.position === 'inside');
            const hasUnder = letterSlots.some((s) => s.position === 'under');

            return (
              <div key={li} className={styles.letterCell}>
                {/* Above slot */}
                {hasAbove && letterSlots.filter((s) => s.position === 'above').map((slot) => {
                  const assignedMarkId = slotAssignments[slot.id];
                  const assignedMark = assignedMarkId ? NIKUD_MARKS.find((m) => m.id === assignedMarkId) : null;
                  const isMistake = checked && assignedMarkId !== slot.correctMarkId;
                  return (
                    <div
                      key={slot.id}
                      className={`${styles.slot} ${styles.slotAbove} ${assignedMark ? styles.slotFilled : ''} ${isMistake ? styles.slotMistake : ''} ${checked && assignedMarkId === slot.correctMarkId ? styles.slotCorrect : ''} ${draggedMarkId ? styles.slotTarget : ''}`}
                      onClick={() => handleSlotClick(slot.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleSlotDrop(slot.id)}
                    >
                      {assignedMark ? (
                        <span className={styles.markChar}>{assignedMark.char}</span>
                      ) : (
                        <span className={styles.slotPlaceholder}>·</span>
                      )}
                    </div>
                  );
                })}

                {/* Letter display */}
                <div className={`${styles.letterBox} ${hasInside ? styles.letterWithInside : ''}`}>
                  <span className={styles.letterChar}>{letter}</span>
                  {/* Inside slot (rendered over the letter) */}
                  {hasInside && letterSlots.filter((s) => s.position === 'inside').map((slot) => {
                    const assignedMarkId = slotAssignments[slot.id];
                    const assignedMark = assignedMarkId ? NIKUD_MARKS.find((m) => m.id === assignedMarkId) : null;
                    const isMistake = checked && assignedMarkId !== slot.correctMarkId;
                    return (
                      <div
                        key={slot.id}
                        className={`${styles.slot} ${styles.slotInside} ${assignedMark ? styles.slotFilled : ''} ${isMistake ? styles.slotMistake : ''} ${checked && assignedMarkId === slot.correctMarkId ? styles.slotCorrect : ''} ${draggedMarkId ? styles.slotTarget : ''}`}
                        onClick={() => handleSlotClick(slot.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleSlotDrop(slot.id)}
                      >
                        {assignedMark ? (
                          <span className={styles.markChar}>{assignedMark.char}</span>
                        ) : (
                          <span className={styles.slotPlaceholder}>◦</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Under slot */}
                {hasUnder && letterSlots.filter((s) => s.position === 'under').map((slot) => {
                  const assignedMarkId = slotAssignments[slot.id];
                  const assignedMark = assignedMarkId ? NIKUD_MARKS.find((m) => m.id === assignedMarkId) : null;
                  const isMistake = checked && assignedMarkId !== slot.correctMarkId;
                  return (
                    <div
                      key={slot.id}
                      className={`${styles.slot} ${styles.slotUnder} ${assignedMark ? styles.slotFilled : ''} ${isMistake ? styles.slotMistake : ''} ${checked && assignedMarkId === slot.correctMarkId ? styles.slotCorrect : ''} ${draggedMarkId ? styles.slotTarget : ''}`}
                      onClick={() => handleSlotClick(slot.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleSlotDrop(slot.id)}
                    >
                      {assignedMark ? (
                        <span className={styles.markChar}>{assignedMark.char}</span>
                      ) : (
                        <span className={styles.slotPlaceholder}>_</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available marks tray */}
      <div className={styles.marksTray}>
        <div className={styles.trayLabel}>
          {draggedMarkId ? 'Отпусти знак на нужное место →' : 'Перетащи знак никуда на слово ↑'}
        </div>
        <div className={styles.marksRow}>
          {availableMarks.map((mark) => {
            const isUsed = Object.values(slotAssignments).includes(mark.id);
            const isDragging = draggedMarkId === mark.id;
            return (
              <div
                key={mark.id}
                className={`${styles.markChip} ${isUsed ? styles.markUsed : ''} ${isDragging ? styles.markDragging : ''}`}
                draggable={!checked && !isUsed}
                onClick={() => handleMarkClick(mark.id)}
                onDragStart={() => handleDragStart(mark.id)}
                onDragEnd={() => setDraggedMarkId(null)}
              >
                <span className={styles.markChipChar}>{mark.char}</span>
                <span className={styles.markChipName}>{mark.name}</span>
                <span className={styles.markChipSound}>({mark.sound})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mistakes feedback */}
      {checked && currentMistakes.length > 0 && (
        <div className={styles.feedbackPanel}>
          <h4>❌ Ошибки:</h4>
          {currentMistakes.map((m, mi) => (
            <div key={mi} className={styles.feedbackItem}>
              <span>Буква {m.slot.letterIndex + 1} ({currentWord.letters[m.slot.letterIndex]}): </span>
              <span>нужно <strong>{m.correct.name}</strong> ({m.correct.char} — звук "{m.correct.sound}")</span>
              {m.placed && (
                <span> — ты поставил <span className={styles.wrongMark}>{m.placed.name}</span> ({m.placed.char})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {checked && currentMistakes.length === 0 && (
        <div className={styles.successPanel}>
          🎉 Правильно! {currentWord.wordWithNikud} — {currentWord.transliteration} ({currentWord.translation})
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.actionRow}>
        {!checked ? (
          <button
            className={`${styles.checkBtn} ${!allSlotsFilled ? styles.checkBtnDisabled : ''}`}
            onClick={handleCheck}
            disabled={!allSlotsFilled}
          >
            {allSlotsFilled ? '✓ Проверить' : 'Заполни все места'}
          </button>
        ) : (
          <button className={styles.nextBtn} onClick={handleNext}>
            {isLast ? '📊 Результаты' : 'Следующее слово →'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WordsNikudGame;