import React, { useState, useEffect } from 'react';
import type { VocabWord } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import styles from './FlashCard.module.css';

interface FlashCardProps {
  userId?: string;
  word: VocabWord;
  isSaved: boolean;
  onToggleSave: (word: VocabWord) => void | Promise<void>;
  current: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
}

const FlashCard: React.FC<FlashCardProps> = ({ userId, word, isSaved, onToggleSave, current, total, onNext, onPrev }) => {
  const [flipped, setFlipped] = useState(false);
  const { playAudio, isLoading, isPlaying } = useCloudTTS();
  const { trackStep } = useProgressTracker(userId);

  // reset flip when card changes
  useEffect(() => { setFlipped(false); }, [word.id]);

  useEffect(() => {
    trackStep({
      moduleId: 'words',
      stepId: `card:${word.id}`,
      payload: { wordId: word.id, difficulty: word.difficulty },
    }).catch((err) => console.error('[progress words card]', err));
  }, [trackStep, word.id, word.difficulty]);

  const isLast = current >= total;
  const progressPct = (current / total) * 100;

  return (
    <div className={styles.container}>
      {/* Progress */}
      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>Карточка {current} / {total}</span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Flip card */}
      <div
        className={`${styles.cardWrapper} ${flipped ? styles.flipped : ''}`}
        onClick={() => setFlipped(f => !f)}
        role="button"
        aria-label={flipped ? 'Показать лицевую сторону' : 'Показать перевод'}
      >
        {/* Inner hosts both faces */}
        <div className={styles.cardInner}>
          {/* ── Front ── */}
          <div className={styles.front}>
            <span className={styles.faceHint}>нажми чтобы перевернуть ↩</span>
            <div className={styles.hebrewWord}>{word.hebrew}</div>
            <div className={styles.translit}>{word.transliteration}</div>
            <button
              className={`${styles.audioBtn} ${isLoading ? styles.audioBtnLoading : ''}`}
              onClick={(e) => { e.stopPropagation(); playAudio(word.hebrew); }}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Загрузка...' : isPlaying ? '🔉 Воспроизводится...' : '🔊 Слушать'}
            </button>
            <button
              className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleSave(word); }}
            >
              {isSaved ? '✅ В моем списке' : '➕ В мой список'}
            </button>
          </div>

          {/* ── Back ── */}
          <div className={styles.back}>
            <span className={styles.faceHint}>нажми чтобы перевернуть ↩</span>
            <div className={styles.hebrewWordSmall}>{word.hebrew}</div>
            <div className={styles.translation}>{word.translation}</div>
            <div className={styles.translitBack}>{word.transliteration}</div>
            <div className={styles.mnemonic}>
              <span className={styles.mnemonicIcon}>💡</span>
              <span>{word.mnemonic}</span>
            </div>
            <button
              className={`${styles.audioBtn} ${isLoading ? styles.audioBtnLoading : ''}`}
              onClick={(e) => { e.stopPropagation(); playAudio(word.hebrew); }}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Загрузка...' : isPlaying ? '🔉 Воспроизведение...' : '🔊 Слушать'}
            </button>
            <button
              className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleSave(word); }}
            >
              {isSaved ? '✅ В моем списке' : '➕ В мой список'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={onPrev} disabled={current <= 1}>
          ← Назад
        </button>
        <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={onNext}>
          {isLast ? '🎯 Начать практику!' : 'Далее →'}
        </button>
      </div>
    </div>
  );
};

export default FlashCard;
