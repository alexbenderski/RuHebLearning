import React from 'react';
import type { HebrewLetter } from '../../types';
import { getVariantsForLetters } from '../../data/letterNikud';
import useCloudTTS from '../../hooks/useCloudTTS';
import styles from './AlphabetTeach.module.css';

interface AlphabetTeachProps {
  letters: HebrewLetter[];
}

/**
 * Teaching view: for each letter show ALL of its nikud variants with
 * the mark name, Russian transliteration and the resulting sound.
 * Each variant has a play button for its exact pronunciation.
 */
const AlphabetTeach: React.FC<AlphabetTeachProps> = ({ letters }) => {
  const { playAudio, isLoading, isPlaying } = useCloudTTS();

  return (
    <div className={styles.wrap}>
      {letters.map((letter) => {
        const variants = getVariantsForLetters([letter.letter]).filter(
          (v) => v.baseLetter === letter.letter,
        );

        return (
          <section key={letter.letter} className={styles.letterSection}>
            <header className={styles.letterHeader}>
              <div className={styles.letterBase}>
                <span className={styles.baseChar}>{letter.letter}</span>
                <div className={styles.baseInfo}>
                  <h3 className={styles.baseName}>{letter.name}</h3>
                  <span className={styles.baseTranslit}>{letter.transliteration}</span>
                </div>
              </div>
              <button
                className={styles.playBtn}
                onClick={() => playAudio(letter.letter)}
                disabled={isLoading}
                title="Прослушать букву"
              >
                {isLoading ? '⏳' : isPlaying ? '🔉' : '🔊'}
              </button>
            </header>

            <div className={styles.variantGrid}>
              {variants.length > 0 ? (
                variants.map((v) => (
                  <div key={v.id} className={styles.variantCard}>
                    <button
                      className={styles.variantChar}
                      onClick={() => playAudio(v.nikudChar)}
                      title={`Прослушать ${v.nikudChar} (${v.markName})`}
                    >
                      {v.nikudChar}
                    </button>
                    <span className={styles.variantMark}>{v.markName}</span>
                    <span className={styles.variantSound}>{v.sound}</span>
                  </div>
                ))
              ) : (
                <p className={styles.noVariants}>
                  Конечная форма — используется только в конце слова.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default AlphabetTeach;