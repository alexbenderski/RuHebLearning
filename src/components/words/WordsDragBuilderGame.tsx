import React from 'react';
import useCloudTTS from '../../hooks/useCloudTTS';
import { DRAG_SENTENCES, type DragSentence } from '../../data/sentences';
import styles from './WordsDragBuilderGame.module.css';

import type { VocabWord } from '../../types';

interface WordsDragBuilderGameProps {
  /** Retained for API compatibility with WordsModule – the game uses global sentence data. */
  words: VocabWord[];
  trackedIds: Set<string>;
  onDropCheck?: (correct: boolean, wordId: string) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Return a sentence different from `excludeId`, preferring ones with tracked words. */
function pickSentence(excludeId: string, trackedIds: Set<string>): DragSentence {
  const candidates = DRAG_SENTENCES.filter((s) => s.id !== excludeId);
  const preferred = candidates.filter((s) => s.tokens.some((t) => t.id && trackedIds.has(t.id)));
  const pool = preferred.length > 0 ? preferred : candidates.length > 0 ? candidates : DRAG_SENTENCES;
  return pool[Math.floor(Math.random() * pool.length)];
}

const WordsDragBuilderGame: React.FC<WordsDragBuilderGameProps> = ({ trackedIds, onDropCheck }) => {
  const { playAudio } = useCloudTTS();

  const [sentence, setSentence] = React.useState<DragSentence>(() =>
    pickSentence('', trackedIds),
  );

  // Indices of tokens that become blanks (vocab words with an id)
  const blankIndices = React.useMemo(
    () => sentence.tokens.reduce<number[]>((acc, t, i) => (t.id !== null ? [...acc, i] : acc), []),
    [sentence],
  );

  // Stable shuffled order for the bank (re-shuffled when sentence changes)
  const [shuffledBankOrder, setShuffledBankOrder] = React.useState<number[]>(() =>
    shuffle(blankIndices),
  );
  React.useEffect(() => {
    setShuffledBankOrder(shuffle(blankIndices));
  }, [blankIndices]);

  // filled[slotTokenIdx] = bankTokenIdx  (which tile was placed into which blank)
  const [filled, setFilled] = React.useState<Record<number, number>>({});
  const [checked, setChecked] = React.useState(false);
  const [results, setResults] = React.useState<Record<number, boolean>>({});

  const placedSet = new Set(Object.values(filled));
  const bankIndices = blankIndices.filter((i) => !placedSet.has(i));
  const allFilled = blankIndices.length > 0 && blankIndices.every((i) => i in filled);

  const handleDrop = (slotIdx: number, bankTokenIdx: number) => {
    if (checked) return;
    setFilled((prev) => {
      const next = { ...prev };
      // Remove bankToken from any slot it already occupies
      for (const key of Object.keys(next)) {
        if (next[Number(key)] === bankTokenIdx) delete next[Number(key)];
      }
      next[slotIdx] = bankTokenIdx;
      return next;
    });
  };

  const handleRemoveFromSlot = (slotIdx: number) => {
    if (checked) return;
    setFilled((prev) => {
      const next = { ...prev };
      delete next[slotIdx];
      return next;
    });
  };

  const handleCheck = () => {
    const newResults: Record<number, boolean> = {};
    for (const slotIdx of blankIndices) {
      const isCorrect = filled[slotIdx] === slotIdx;
      newResults[slotIdx] = isCorrect;
      const wordId = sentence.tokens[slotIdx].id;
      if (wordId) onDropCheck?.(isCorrect, wordId);
    }
    setResults(newResults);
    setChecked(true);
  };

  const handleNext = () => {
    const next = pickSentence(sentence.id, trackedIds);
    setSentence(next);
    setFilled({});
    setChecked(false);
    setResults({});
  };

  const correctCount = Object.values(results).filter(Boolean).length;
  const allCorrect = checked && correctCount === blankIndices.length;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span>📝 Собери предложение</span>
        <button className={styles.skipBtn} onClick={handleNext}>
          Пропустить →
        </button>
      </div>

      <p className={styles.instructions}>
        Перетащи слова снизу на нужные места в предложении. Нажми на заполненное место, чтобы убрать слово обратно.
      </p>

      {/* Sentence with blank drop-targets, displayed RTL */}
      <div className={styles.sentenceWrap} dir="rtl">
        {sentence.tokens.map((token, idx) => {
          if (token.id === null) {
            // Fixed grammatical word – always visible
            return (
              <span key={idx} className={styles.fixedWord}>
                {token.hebrew}
              </span>
            );
          }

          const placedTokenIdx = filled[idx];
          const placedToken =
            placedTokenIdx !== undefined ? sentence.tokens[placedTokenIdx] : null;
          const result = checked ? results[idx] : undefined;

          return (
            <div
              key={idx}
              className={[
                styles.blank,
                placedToken ? styles.blankFilled : '',
                result === true ? styles.blankCorrect : result === false ? styles.blankWrong : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(idx, Number(e.dataTransfer.getData('text/plain')));
              }}
              onClick={() => placedToken && handleRemoveFromSlot(idx)}
              title={placedToken ? 'Нажми, чтобы убрать' : 'Перетащи слово сюда'}
            >
              {placedToken ? (
                <div className={styles.placedWord}>
                  <span className={styles.placedHebrew} dir="rtl">
                    {placedToken.hebrew}
                  </span>
                  <span className={styles.placedTranslit} dir="ltr">
                    {placedToken.transliteration}
                  </span>
                </div>
              ) : (
                <span className={styles.blankPlaceholder}>___</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Translation (hidden until checked) */}
      <div className={styles.translationHint}>
        {checked ? (
          <span>
            🔤 <b>{sentence.translation}</b>
          </span>
        ) : (
          <span className={styles.translationHidden}>🔒 Перевод покажется после проверки</span>
        )}
      </div>

      {/* Word bank */}
      <div className={styles.bankSection}>
        <div className={styles.bankLabel}>Слова для перетаскивания:</div>
        <div className={styles.bank}>
          {shuffledBankOrder
            .filter((i) => bankIndices.includes(i))
            .map((tokenIdx) => {
              const token = sentence.tokens[tokenIdx];
              return (
                <button
                  key={tokenIdx}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData('text/plain', String(tokenIdx))
                  }
                  className={styles.tile}
                  onClick={() => playAudio(token.hebrew)}
                  title="Нажми чтобы послушать · перетащи в предложение"
                >
                  <span className={styles.tileHebrew} dir="rtl">
                    {token.hebrew}
                  </span>
                  <span className={styles.tileTranslit}>{token.transliteration}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Check button – shown when all blanks are filled */}
      {allFilled && !checked && (
        <button className={styles.checkBtn} onClick={handleCheck}>
          ✅ Проверить ответ
        </button>
      )}

      {/* Feedback */}
      {checked && (
        <div className={styles.feedback}>
          {allCorrect ? (
            <span className={styles.success}>🎉 Отлично! Всё верно!</span>
          ) : (
            <span className={styles.partial}>
              ✅ {correctCount} / {blankIndices.length} верно — попробуй ещё раз!
            </span>
          )}
          <button className={styles.nextBtn} onClick={handleNext}>
            Следующее предложение →
          </button>
        </div>
      )}
    </div>
  );
};

export default WordsDragBuilderGame;
