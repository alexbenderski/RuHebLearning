import React from 'react';
import type { VocabWord } from '../../types';
import styles from './WordsMemoryGame.module.css';

type MemoryCard = {
  id: string;
  pairId: string;
  value: string;
  matched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildDeck(words: VocabWord[]): MemoryCard[] {
  const source = shuffle(words).slice(0, Math.min(6, words.length));
  const cards: MemoryCard[] = [];
  source.forEach((w) => {
    cards.push({ id: `${w.id}-he`, pairId: w.id, value: w.hebrew, matched: false });
    cards.push({ id: `${w.id}-ru`, pairId: w.id, value: w.translation, matched: false });
  });
  return shuffle(cards);
}

interface WordsMemoryGameProps {
  words: VocabWord[];
  onEvent?: (isMatch: boolean) => void;
}

const WordsMemoryGame: React.FC<WordsMemoryGameProps> = ({ words, onEvent }) => {
  const [deck, setDeck] = React.useState<MemoryCard[]>(() => buildDeck(words));
  const [open, setOpen] = React.useState<number[]>([]);
  const [moves, setMoves] = React.useState(0);

  React.useEffect(() => {
    setDeck(buildDeck(words));
    setOpen([]);
    setMoves(0);
  }, [words]);

  const allMatched = deck.length > 0 && deck.every((c) => c.matched);

  const clickCard = (idx: number) => {
    if (open.length === 2) return;
    if (deck[idx].matched || open.includes(idx)) return;

    const nextOpen = [...open, idx];
    setOpen(nextOpen);

    if (nextOpen.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextOpen;
      const isMatch = deck[a].pairId === deck[b].pairId;
      onEvent?.(isMatch);

      if (isMatch) {
        setDeck((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setOpen([]);
      } else {
        setTimeout(() => setOpen([]), 700);
      }
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <span>🧠 Memory</span>
        <span>Ходы: {moves}</span>
      </div>

      <div className={styles.grid}>
        {deck.map((card, idx) => {
          const isOpen = open.includes(idx);
          return (
            <button
              key={card.id}
              className={`${styles.card} ${card.matched ? styles.matched : ''} ${isOpen ? styles.open : ''}`}
              onClick={() => clickCard(idx)}
            >
              {card.matched || isOpen ? card.value : '❓'}
            </button>
          );
        })}
      </div>

      {allMatched && (
        <div className={styles.done}>
          <p>🎉 Отлично! Все пары собраны.</p>
          <button className={styles.restart} onClick={() => setDeck(buildDeck(words))}>Играть ещё</button>
        </div>
      )}
    </div>
  );
};

export default WordsMemoryGame;
