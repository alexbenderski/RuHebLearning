import React from 'react';
import type { VocabWord } from '../../types';
import { useGameTimer } from '../../hooks/useGameTimer';
import styles from './WordsMemoryGame.module.css';

type MemoryCard = {
  id: string;
  pairId: string;
  value: string;
  isHebrew: boolean;
  matched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildDeck(words: VocabWord[], pairCount: number): MemoryCard[] {
  const source = shuffle(words).slice(0, Math.min(pairCount, words.length));
  const cards: MemoryCard[] = [];
  source.forEach((w) => {
    cards.push({ id: `${w.id}-he`, pairId: w.id, value: w.hebrew, isHebrew: true, matched: false });
    cards.push({ id: `${w.id}-ru`, pairId: w.id, value: w.translation, isHebrew: false, matched: false });
  });
  return shuffle(cards);
}

interface WordsMemoryGameProps {
  words: VocabWord[];
  onEvent?: (isMatch: boolean) => void;
}

const PAIR_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

const WordsMemoryGame: React.FC<WordsMemoryGameProps> = ({ words, onEvent }) => {
  const maxPairs = Math.min(8, words.length);
  const [phase, setPhase] = React.useState<'setup' | 'play' | 'flash' | 'done'>('setup');
  const [pairCount, setPairCount] = React.useState(Math.min(6, maxPairs));
  const [deck, setDeck] = React.useState<MemoryCard[]>([]);
  const [open, setOpen] = React.useState<number[]>([]);
  const [moves, setMoves] = React.useState(0);
  const [countdown, setCountdown] = React.useState(5);
  const [exploding, setExploding] = React.useState<Set<string>>(new Set());
  const [totalTime, setTotalTime] = React.useState(0);

  const { seconds, formattedTime, resetTimer } = useGameTimer(phase === 'play' || phase === 'flash');

  const startGame = () => {
    setDeck(buildDeck(words, pairCount));
    setOpen([]);
    setMoves(0);
    setCountdown(5);
    setExploding(new Set());
    resetTimer();
    setPhase('play');
  };

  // 5s play -> 1s flash loop
  React.useEffect(() => {
    if (phase === 'play') {
      if (countdown <= 0) {
        setPhase('flash');
        setCountdown(1); // 1 sec for flash
        return;
      }
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === 'flash') {
      if (countdown <= 0) {
        setPhase('play');
        setCountdown(5); // 5 sec for play
        return;
      }
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [phase, countdown]);

  const clickCard = (idx: number) => {
    if (phase !== 'play') return;
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
        const ids = new Set([deck[a].id, deck[b].id]);
        setExploding(ids);
        setDeck((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setOpen([]);
        setTimeout(() => {
          setExploding(new Set());
          // Check win after animation
          setDeck((prev) => {
            if (prev.every((c) => c.matched)) {
              setTotalTime(seconds);
              setPhase('done');
            }
            return prev;
          });
        }, 580);
      } else {
        setTimeout(() => setOpen([]), 750);
      }
    }
  };

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const opts = PAIR_OPTIONS.filter((n) => n <= maxPairs);
    return (
      <div className={styles.wrap}>
        <h3 className={styles.setupTitle}>🧠 Memory — выбери количество пар</h3>
        <div className={styles.pairOptions}>
          {opts.map((n) => (
            <button
              key={n}
              className={`${styles.pairBtn} ${pairCount === n ? styles.pairBtnActive : ''}`}
              onClick={() => setPairCount(n)}
            >
              <span className={styles.pairBtnNum}>{n}</span>
              <span className={styles.pairBtnSub}>{n * 2} карт</span>
            </button>
          ))}
        </div>
        <button className={styles.startBtn} onClick={startGame}>Начать →</button>
      </div>
    );
  }

  // ── PLAY / FLASH / DONE ───────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <span>🧠 Memory</span>
        <div className={styles.timerRow}>
          {phase === 'flash' ? (
            <span className={styles.flashText}>Смотри!</span>
          ) : (
            <span className={styles.countdown}>Подсказка через: {countdown}</span>
          )}
        </div>
        <div className={styles.statsRight}>
          <span className={styles.gameTimer}>⏱ {phase === 'done' ? totalTime + 's' : formattedTime}</span>
          <span>Ходы: {moves}</span>
        </div>
      </div>

      <div className={styles.grid}>
        {deck.map((card, idx) => {
          const isForceOpen = phase === 'flash';
          const isOpen = isForceOpen || open.includes(idx);
          const isBursting = exploding.has(card.id);
          if (card.matched && !isBursting) {
            return <div key={card.id} className={styles.cardGone} />;
          }
          return (
            <button
              key={card.id}
              className={`${styles.card} ${isOpen ? styles.open : ''} ${isBursting ? styles.exploding : ''} ${card.isHebrew && isOpen ? styles.hebrewCard : ''}`}
              onClick={() => clickCard(idx)}
            >
              {isOpen || isBursting ? card.value : '❓'}
            </button>
          );
        })}
      </div>

      {phase === 'done' && (
        <div className={styles.done}>
          <p>🎉 Все пары за {moves} ходов!</p>
          <button className={styles.restart} onClick={() => setPhase('setup')}>Ещё раз</button>
        </div>
      )}
    </div>
  );
};

export default WordsMemoryGame;

