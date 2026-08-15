import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './StageMap.module.css';
import characterImage from '../../assets/character.gif';
import mapImage from '../../assets/bahaiBackgroundStage.png';
import level1Img from '../../assets/level1.png';
import level2Img from '../../assets/level2.png';
import level3Img from '../../assets/level3.png';
import level4Img from '../../assets/level4.png';
import level5Img from '../../assets/level5.png';

const LEVEL_IMAGES = [level1Img, level2Img, level3Img, level4Img, level5Img];

interface StageCoord {
  stage: number;
  label: string;
  bottom: string;
  left: string;
}

const STAGES: StageCoord[] = [
  { stage: 1, label: 'Этап 1', bottom: '17.97%', left: '50.0%' },
  { stage: 2, label: 'Этап 2', bottom: '33.75%', left: '50.0%' },
  { stage: 3, label: 'Этап 3', bottom: '45.68%', left: '50.0%' },
  { stage: 4, label: 'Этап 4', bottom: '55.42%', left: '50.0%' },
  { stage: 5, label: 'Этап 5', bottom: '62.14%', left: '50.0%' },
];

const LAST_STAGE = STAGES.length;

const BASE_CHAR_WIDTH = 120 * 0.85 * 0.7;
const SHRINK_PER_STAGE = 0.9;

const LEVEL_BASE_SIZE = 44 * 1.5; // 66px

function getLevelSize(stage: number): number {
  const base = LEVEL_BASE_SIZE * Math.pow(SHRINK_PER_STAGE, stage - 1);
  if (stage === 5) return base * 1.3;
  return base;
}

const StageMap: React.FC = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const stage = STAGES[currentStage - 1];
  const isFirst = currentStage === 1;
  const isLast = currentStage === LAST_STAGE;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback((target: number) => {
    const clamped = Math.max(1, Math.min(LAST_STAGE, target));
    if (clamped === currentStage) return;
    setCurrentStage(clamped);
  }, [currentStage]);

  const charWidth = BASE_CHAR_WIDTH * Math.pow(SHRINK_PER_STAGE, currentStage - 1);

  const zoomScale = 1 + (currentStage - 1) * 0.2;

  const stageTopPct = (100 - parseFloat(stage.bottom)).toFixed(2);
  const transformOrigin = `${stage.left} ${stageTopPct}%`;

  const iconSize = getLevelSize(currentStage);
  const iconHalfHeightPct = containerHeight > 0 ? (iconSize / 2 / containerHeight) * 100 : 0;
  const charBottom = (parseFloat(stage.bottom) - iconHalfHeightPct * 2.5).toFixed(2);

  return (
    <div className={styles.scene}>
      <div className={styles.container} ref={containerRef}>
        {/* Map layer — scales and pans with zoom */}
        <div
          className={styles.mapLayer}
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin,
          }}
        >
          <img className={styles.bgImage} src={mapImage} alt="Map background" />

          {/* Level icons at each stage — clickable */}
          {STAGES.map((s) => {
            const size = getLevelSize(s.stage);
            const isActive = s.stage === currentStage;
            return (
              <button
                key={s.stage}
                className={`${styles.levelIcon} ${isActive ? styles.levelIconActive : ''}`}
                style={{
                  bottom: s.bottom,
                  left: s.left,
                  width: size,
                  height: size,
                }}
                onClick={() => goTo(s.stage)}
                aria-label={`Go to ${s.label}`}
              >
                <img
                  src={LEVEL_IMAGES[s.stage - 1]}
                  alt={`Level ${s.stage}`}
                  className={styles.levelImg}
                />
              </button>
            );
          })}
        </div>

        {/* Character overlay — smoothly moves to each stage */}
        <div
          className={styles.character}
          style={{
            bottom: `${charBottom}%`,
            left: '50%',
            transform: 'translate(-50%, 0)',
          }}
        >
          <img
            className={styles.characterImg}
            src={characterImage}
            alt="Character"
            style={{ width: charWidth }}
          />
        </div>

        <div className={styles.label}>{stage.label}</div>

        {/* Arrows-only controls at the very bottom */}
        <div className={styles.controls}>
          <button
            className={styles.arrowBtn}
            onClick={() => goTo(currentStage - 1)}
            disabled={isFirst}
            aria-label="Previous stage"
          >
            ←
          </button>
          <button
            className={styles.arrowBtn}
            onClick={() => goTo(currentStage + 1)}
            disabled={isLast}
            aria-label="Next stage"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageMap;