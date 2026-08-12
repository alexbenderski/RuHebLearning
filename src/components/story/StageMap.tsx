import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './StageMap.module.css';
import characterImage from '../../assets/character.gif';
import mapImage from '../../assets/bahaiBackgroundStage.png';

interface StageCoord {
  stage: number;
  label: string;
  /** Distance from the bottom of the container, e.g. '10%' */
  bottom: string;
  /** Distance from the left of the container, e.g. '50%' */
  left: string;
  /** CSS transform scale, e.g. 0.9 */
  scale: number;
}

/** Video timestamp (in seconds) that corresponds to each stage. */
const STAGE_TIMESTAMPS = [0, 1.25, 2.5, 3.75, 5];

/**
 * Stage coordinate presets from Figma.
 *
 * Image native size: 1314 × 1920
 * Figma coords (x, y from top-left) converted to % relative to image:
 *   left% = (x / 1314) * 100
 *   bottom% = ((1920 - y) / 1920) * 100
 *
 * The container uses aspect-ratio: 1314/1920 with object-fit: contain,
 * so these percentages stay accurate at any screen size.
 */
const STAGES: StageCoord[] = [
  { stage: 1, label: 'Этап 1', bottom: '17.97%', left: '50.0%', scale: 1 },
  { stage: 2, label: 'Этап 2', bottom: '33.75%', left: '50.0%', scale: 1 },
  { stage: 3, label: 'Этап 3', bottom: '45.68%', left: '50.0%', scale: 1 },
  { stage: 4, label: 'Этап 4', bottom: '55.42%', left: '50.0%', scale: 1 },
  { stage: 5, label: 'Этап 5', bottom: '62.14%', left: '50.0%', scale: 1 },
];

const LAST_STAGE = STAGES.length;

/**
 * Base character width: original 120px reduced by 15%.
 * Each subsequent stage shrinks the character by 10% of the previous size.
 *   stage N width = BASE_CHAR_WIDTH * (SHRINK_PER_STAGE ^ (N - 1))
 */
const BASE_CHAR_WIDTH = 120 * 0.85; // 102px
const SHRINK_PER_STAGE = 0.9;       // 10% reduction per stage

/**
 * Replace this with the actual video file path.
 * Place a .mp4 file in `public/` and update the path below, e.g.:
 *   const VIDEO_SRC = '/storyBg.mp4';
 * Or set to `null` to hide the video and only show the black background.
 */
const VIDEO_SRC: string | null = null;

const StageMap: React.FC = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef<number | null>(null);

  const stage = STAGES[currentStage - 1];
  const isFirst = currentStage === 1;
  const isLast = currentStage === LAST_STAGE;

  // ── Video scrubbing ──────────────────────────────────────────
  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(1, Math.min(LAST_STAGE, target));
      if (clamped === currentStage) return;
      setCurrentStage(clamped);

      const vid = videoRef.current;
      if (!vid) return;

      const targetTime = STAGE_TIMESTAMPS[clamped - 1];
      if (targetTime > (vid.currentTime ?? 0)) {
        setIsScrubbing(true);
        targetTimeRef.current = targetTime;
        vid.play().catch(() => {
          vid.currentTime = targetTime;
          setIsScrubbing(false);
        });
      } else {
        vid.currentTime = targetTime;
        vid.pause();
        setIsScrubbing(false);
      }
    },
    [currentStage],
  );

  // Monitor timeupdate → pause when we reach the target timestamp
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => {
      if (
        isScrubbing &&
        targetTimeRef.current !== null &&
        vid.currentTime >= targetTimeRef.current
      ) {
        vid.pause();
        setIsScrubbing(false);
        targetTimeRef.current = null;
      }
    };

    vid.addEventListener('timeupdate', onTimeUpdate);
    return () => vid.removeEventListener('timeupdate', onTimeUpdate);
  }, [isScrubbing]);

  // Pause video initially
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.pause();
  }, []);

  // Character width shrinks by 10% per stage
  const charWidth = BASE_CHAR_WIDTH * Math.pow(SHRINK_PER_STAGE, currentStage - 1);

  // ── Dev mode: click-to-map ────────────────────────────────────
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore clicks on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.height - (e.clientY - rect.top); // distance from bottom
    const leftPct = ((x / rect.width) * 100).toFixed(1);
    const bottomPct = ((y / rect.height) * 100).toFixed(1);

    const text = `bottom: '${bottomPct}%', left: '${leftPct}%'`;

    navigator.clipboard.writeText(text).then(
      () => alert(`📋 Скопировано в буфер обмена!\n${text}`),
      () => alert(`📍 Координаты:\n${text}`),
    );
  }, []);

  return (
    <div className={styles.scene}>
      {/* ── 9:16 mobile-first container ── */}
      <div className={styles.container} onClick={handleMapClick}>
        {/* Background image — always visible as fallback */}
        <img className={styles.bgImage} src={mapImage} alt="Map background" />

        {/* Background video — overlays the image when a video source is set */}
        {VIDEO_SRC && (
          <video
            ref={videoRef}
            className={styles.video}
            src={VIDEO_SRC}
            muted
            playsInline
            preload="auto"
            loop={false}
          />
        )}

        {/* Character overlay */}
        <div
          className={styles.character}
          style={{
            bottom: stage.bottom,
            left: stage.left,
            transform: `translate(-50%, 0) scale(${stage.scale})`,
          }}
        >
          <img
            className={styles.characterImg}
            src={characterImage}
            alt="Character"
            style={{ width: charWidth }}
          />
        </div>

        {/* Stage label */}
        <div className={styles.label}>{stage.label}</div>

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={styles.arrowBtn}
            onClick={() => goTo(currentStage - 1)}
            disabled={isFirst}
            aria-label="Previous stage"
          >
            ←
          </button>

          {STAGES.map((s) => (
            <button
              key={s.stage}
              className={`${styles.stageBtn} ${s.stage === currentStage ? styles.active : ''}`}
              onClick={() => goTo(s.stage)}
            >
              {s.stage}
            </button>
          ))}

          <button
            className={styles.arrowBtn}
            onClick={() => goTo(currentStage + 1)}
            disabled={isLast}
            aria-label="Next stage"
          >
            →
          </button>
        </div>

        {/* Dev hint */}
        <p className={styles.devHint}>🖱️ Click the map to copy coordinates</p>
      </div>
    </div>
  );
};

export default StageMap;