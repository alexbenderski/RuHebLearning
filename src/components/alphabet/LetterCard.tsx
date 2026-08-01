import React from 'react';
import type { HebrewLetter } from '../../types';
import type { LetterStat } from './AlphabetModule';
import useCloudTTS from '../../hooks/useCloudTTS';
import styles from './LetterCard.module.css';

interface LetterCardProps {
  letter: HebrewLetter;
  index?: number;
  stats?: LetterStat;
}

const LetterCard: React.FC<LetterCardProps> = ({ letter, index, stats }) => {
  const { playAudio, isLoading, isPlaying } = useCloudTTS();

  const accuracy = stats && stats.total > 0 ? stats.correct / stats.total : null;
  const accentColor = accuracy === null ? undefined
    : accuracy >= 0.8  ? '#10b981'
    : accuracy >= 0.5  ? '#f59e0b'
    : '#ef4444';

  return (
    <div
      className={`${styles.card} ${letter.isFinal ? styles.final : ''}`}
      style={accentColor ? { borderColor: `${accentColor}55`, boxShadow: `0 0 14px ${accentColor}22` } : undefined}
    >
      {index !== undefined && <span className={styles.index}>{index}</span>}
      {letter.isFinal && letter.finalOf && (
        <span className={styles.finalBadge}>← {letter.finalOf}</span>
      )}
      <div className={styles.hebrew}>{letter.letter}</div>
      <div className={styles.name}>{letter.name}</div>
      <div className={styles.translit}>{letter.transliteration}</div>
      <button
        className={`${styles.audioBtn} ${isLoading ? styles.audioBtnLoading : ''}`}
        onClick={() => playAudio(letter.letter)}
        disabled={isLoading}
        title={isLoading ? 'Загрузка...' : isPlaying ? 'Воспроизводится...' : 'Прослушать'}
        aria-label={`Произнести ${letter.name}`}
      >
        {isLoading ? '⏳' : isPlaying ? '🔉' : '🔊'}
      </button>

      {stats && stats.total > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.statsBar}>
            <div
              className={styles.statsFill}
              style={{ width: `${(stats.correct / stats.total) * 100}%`, background: accentColor }}
            />
          </div>
          <span className={styles.statsText} style={{ color: accentColor }}>
            {stats.correct}/{stats.total}
          </span>
        </div>
      )}
    </div>
  );
};

export default LetterCard;
