import React from 'react';
import type { VocabWord } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import styles from './WordsDragBuilderGame.module.css';

type Slot = {
  word: VocabWord;
  filledWordId: string | null;
};

interface WordsDragBuilderGameProps {
  words: VocabWord[];
  trackedIds: Set<string>;
  onDropCheck?: (correct: boolean, wordId: string) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const WordsDragBuilderGame: React.FC<WordsDragBuilderGameProps> = ({ words, trackedIds, onDropCheck }) => {
  const source = React.useMemo(() => shuffle(words).slice(0, Math.min(5, words.length)), [words]);
  const draggableWords = React.useMemo(() => shuffle(source.filter((w) => trackedIds.has(w.id))), [source, trackedIds]);

  const [slots, setSlots] = React.useState<Slot[]>(() => source.map((w) => ({ word: w, filledWordId: null })));
  const [bank, setBank] = React.useState<VocabWord[]>(draggableWords);
  const [errorHint, setErrorHint] = React.useState<string | null>(null);
  const { playAudio } = useCloudTTS();

  React.useEffect(() => {
    setSlots(source.map((w) => ({ word: w, filledWordId: null })));
    setBank(draggableWords);
    setErrorHint(null);
  }, [source, draggableWords]);

  const onDropToSlot = (slotIndex: number, draggedWordId: string) => {
    const slot = slots[slotIndex];
    const dragged = source.find((w) => w.id === draggedWordId);
    if (!slot || !dragged) return;

    const isCorrect = slot.word.id === draggedWordId;
    onDropCheck?.(isCorrect, draggedWordId);

    if (isCorrect) {
      setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { ...s, filledWordId: draggedWordId } : s)));
      setBank((prev) => prev.filter((w) => w.id !== draggedWordId));
      setErrorHint(null);
    } else {
      setErrorHint(`Неверно: «${dragged.translation}» не подходит к «${slot.word.translation}». Слушай слово и попробуй снова.`);
    }
  };

  const completed = slots.filter((s) => !trackedIds.has(s.word.id) || s.filledWordId === s.word.id).length;
  const totalToComplete = slots.filter((s) => trackedIds.has(s.word.id)).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span>🧩 Собери слова</span>
        <span>Собрано: {completed}/{totalToComplete}</span>
      </div>

      <div className={styles.instructions}>
        Слова, которые ты уже учил, нужно перетащить в правильные места. Новые слова пока показаны по-русски.
      </div>

      <div className={styles.slots}>
        {slots.map((slot, idx) => {
          const isTracked = trackedIds.has(slot.word.id);
          const placed = source.find((w) => w.id === slot.filledWordId);
          return (
            <div
              key={slot.word.id}
              className={`${styles.slot} ${!isTracked ? styles.slotLocked : ''}`}
              onDragOver={(e) => isTracked && e.preventDefault()}
              onDrop={(e) => {
                if (!isTracked) return;
                const wordId = e.dataTransfer.getData('text/plain');
                onDropToSlot(idx, wordId);
              }}
            >
              <button className={styles.speakBtn} onClick={() => playAudio(slot.word.hebrew)}>🔊</button>
              {!isTracked && (
                <div className={styles.russian}>{slot.word.translation}</div>
              )}
              {isTracked && (
                <div className={styles.target}>
                  {placed ? placed.hebrew : '____'}
                  <div className={styles.russian}>{slot.word.translation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.bank}>
        {bank.map((w) => (
          <button
            key={w.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', w.id)}
            className={styles.tile}
            onClick={() => playAudio(w.hebrew)}
            title="Нажми чтобы слушать, перетащи в слот"
          >
            {w.hebrew}
          </button>
        ))}
      </div>

      {errorHint && <div className={styles.error}>{errorHint}</div>}
      {totalToComplete > 0 && completed === totalToComplete && <div className={styles.success}>🎉 Отлично! Все выученные слова собраны верно.</div>}
    </div>
  );
};

export default WordsDragBuilderGame;
