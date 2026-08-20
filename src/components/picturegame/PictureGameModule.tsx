import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PICTURE_GAME_LEVELS } from '../../data/pictureGameData';
import styles from './PictureGameModule.module.css';

interface PictureGameModuleProps {
  userId: string;
}

const PictureGameModule: React.FC<PictureGameModuleProps> = ({ userId: _userId }) => {
  const navigate = useNavigate();
  const [unlockedLevels] = useState<Set<number>>(new Set([1])); // For now, only level 1 is unlocked

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Домой
        </button>
        <h1 className={styles.title}>🖼️ Игра с картинками</h1>
        <p className={styles.subtitle}>
          Перетащи слова на правильные места на картинке
        </p>
      </div>

      <div className={styles.levelsGrid}>
        {PICTURE_GAME_LEVELS.map((level) => {
          const isUnlocked = unlockedLevels.has(level.levelId);
          return (
            <div
              key={level.levelId}
              className={`${styles.levelCard} ${isUnlocked ? styles.unlocked : styles.locked}`}
              onClick={() => isUnlocked && navigate(`/picture-game/${level.levelId}`)}
            >
              <div className={styles.levelNumber}>Уровень {level.levelId}</div>
              <div className={styles.levelIcon}>
                {isUnlocked ? '🏠' : '🔒'}
              </div>
              <div className={styles.levelInfo}>
                <div className={styles.levelTitle}>
                  {isUnlocked ? 'Дом и мебель' : 'Заблокировано'}
                </div>
                <div className={styles.levelDesc}>
                  {isUnlocked ? `${level.items.length} слов` : 'Пройди предыдущий уровень'}
                </div>
              </div>
              {isUnlocked && (
                <button className={styles.playBtn}>
                  Играть →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PictureGameModule;
