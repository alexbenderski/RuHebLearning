import React from 'react';
import type { HebrewLetter } from '../../types';
import styles from './AlphabetMemoryGame.module.css';

type LetterCard = {
  id: string;
  pairId: string;
  label: string;
  matched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildDeck(letters: HebrewLetter[]): LetterCard[] {
  const base = shuffle(letters).slice(0, Math.min(8, letters.length));
  const cards: LetterCard[] = [];
  base.forEach((l) => {
    cards.push({ id: `${l.letter}-char`, pairId: l.letter, label: l.letter, matched: false });
    cards.push({ id: `${l.letter}-name`, pairId: l.letter, label: l.name, matched: false });
  });
  return shuffle(cards);
}

interface AlphabetMemoryGameProps {
  letters: HebrewLetter[];
  onEvent?: (isMatch: boolean) => void;
}

const AlphabetMemoryGame: React.FC<AlphabetMemoryGameProps> = ({ letters, onEvent }) => {
  const [deck, setDeck] = React.useState<LetterCard[]>(() => buildDeck(letters));
  const [open, setOpen] = React.useState<number[]>([]);
  const [moves, setMoves] = React.useState(0);

  const allMatched = deck.length > 0 && deck.every((c) => c.matched);

  const onPick = (idx: number) => {
    if (open.length === 2) return;
    if (deck[idx].matched || open.includes(idx)) return;

    const next = [...open, idx];
    setOpen(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
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
              onClick={() => onPick(idx)}
            >
              {card.matched || isOpen ? card.label : '❓'}
            </button>
          );
        })}
      </div>

      {allMatched && (
        <div className={styles.done}>
          <p>🎉 Отлично! Ты запомнил буквы.</p>
          <button className={styles.restart} onClick={() => { setDeck(buildDeck(letters)); setOpen([]); setMoves(0); }}>
            Играть ещё
          </button>
        </div>
      )}
    </div>
  );
};

export default AlphabetMemoryGame;
