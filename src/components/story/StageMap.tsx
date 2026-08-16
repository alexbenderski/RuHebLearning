import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StageMap.module.css';
import characterImage from '../../assets/character.gif';
import mapImage from '../../assets/bahaiBackgroundStage.png';
import level1Img from '../../assets/level1.png';
import level2Img from '../../assets/level2.png';
import level3Img from '../../assets/level3.png';
import level4Img from '../../assets/level4.png';
import level5Img from '../../assets/level5.png';
import bubbleClickSound from '../../assets/bubbleClickSound.mp3';
import runningSound from '../../assets/runningSound.mp3';

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

const UNLOCK_VERSION = 2; // bump to reset stale unlock data for existing users

function loadUnlocked(): Record<number, boolean> {
  try {
    const version = Number(localStorage.getItem('story_unlocked_v'));
    const raw = localStorage.getItem('story_unlocked');
    if (raw && version === UNLOCK_VERSION) {
      const parsed = JSON.parse(raw) as Record<number, boolean>;
      if (parsed && typeof parsed === 'object') {
        return { 1: true, ...parsed };
      }
    }
  } catch { /* ignore */ }
  return { 1: true, 2: false, 3: false, 4: false, 5: false };
}
function saveUnlocked(state: Record<number, boolean>) {
  localStorage.setItem('story_unlocked_v', String(UNLOCK_VERSION));
  localStorage.setItem('story_unlocked', JSON.stringify(state));
}

function playSoundFile(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {
    console.error('Audio file error:', e);
  }
}

const StageMap: React.FC = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(() => {
    // When coming from "Следующий уровень", skip the welcome modal so the
    // character walk on the map is visible.
    if (sessionStorage.getItem('story_pending_level')) return false;
    return !sessionStorage.getItem('story_in_level');
  });
  const [currentStage, setCurrentStage] = useState(() => {
    const saved = Number(sessionStorage.getItem('story_current_stage'));
    return saved >= 1 && saved <= LAST_STAGE ? saved : 1;
  });
  const [containerHeight, setContainerHeight] = useState(0);
  const [characterStarted, setCharacterStarted] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [staticFrame, setStaticFrame] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>(loadUnlocked);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingNav = (() => {
    const raw = sessionStorage.getItem('story_pending_level');
    return raw ? Number(raw) : null;
  })();
  const initRef = useRef(false);
  const navTimerRef = useRef<number | null>(null);

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

  // Handle pending navigation from the "Следующий уровень" button
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (pendingNav !== null && pendingNav >= 1 && pendingNav <= LAST_STAGE) {
      // Unlock the level if needed
      if (!unlocked[pendingNav]) {
        const next = { ...unlocked, [pendingNav]: true };
        setUnlocked(next);
        saveUnlocked(next);
      }

      if (pendingNav === currentStage) {
        // Already standing on that stage — open it directly
        sessionStorage.removeItem('story_pending_level');
        sessionStorage.setItem('story_in_level', 'true');
        navigate(`/story-level/${pendingNav}`);
      } else {
        // Animate the character walking to the target stage
        playSoundFile(runningSound);
        setCurrentStage(pendingNav);
        sessionStorage.setItem('story_current_stage', String(pendingNav));
        startMoveAnimation(4000);
        // After the walk animation, open the level page
        navTimerRef.current = window.setTimeout(() => {
          sessionStorage.removeItem('story_pending_level');
          sessionStorage.setItem('story_in_level', 'true');
          navigate(`/story-level/${pendingNav}`);
        }, 4000);
      }
    } else {
      // No pending level — just clean up
      sessionStorage.removeItem('story_pending_level');
    }

    return () => {
      // Reset the guard so StrictMode's double-mount re-runs this effect
      initRef.current = false;
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Capture the first frame of the character GIF to freeze it while standing idle
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setStaticFrame(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        console.error('Failed to capture character first frame:', e);
      }
    };
    img.src = characterImage;
  }, []);

  const moveTimerRef = useRef<number | null>(null);
  const startMoveAnimation = (durationMs: number) => {
    if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current);
    setIsMoving(true);
    moveTimerRef.current = window.setTimeout(() => setIsMoving(false), durationMs);
  };

  const goTo = (target: number) => {
    const clamped = Math.max(1, Math.min(LAST_STAGE, target));
    if (clamped === currentStage) return;
    playSoundFile(runningSound);
    setCurrentStage(clamped);
    sessionStorage.setItem('story_current_stage', String(clamped));
    startMoveAnimation(4000);
  };

  const handleLevelClick = (stageNum: number) => {
    if (!unlocked[stageNum]) return;
    playSoundFile(bubbleClickSound);
    sessionStorage.setItem('story_in_level', 'true');
    const isSameStage = stageNum === currentStage;
    if (!isSameStage) {
      playSoundFile(runningSound);
      setCurrentStage(stageNum);
      sessionStorage.setItem('story_current_stage', String(stageNum));
      startMoveAnimation(3000);
    }
    setTimeout(() => {
      navigate(`/story-level/${stageNum}`);
    }, isSameStage ? 0 : 3000);
  };

  const handleStartJourney = () => {
    setShowWelcome(false);
    setCharacterStarted(true);
    playSoundFile(runningSound);
    startMoveAnimation(4000);
    setTimeout(() => {
      setCurrentStage(1);
      sessionStorage.setItem('story_current_stage', '1');
    }, 100);
  };

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
        <div
          className={styles.mapLayer}
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin,
          }}
        >
          <img className={styles.bgImage} src={mapImage} alt="Map background" />

          {STAGES.map((s) => {
            const size = getLevelSize(s.stage);
            const isActive = s.stage === currentStage;
            const locked = !unlocked[s.stage];
            return (
              <button
                key={s.stage}
                className={`${styles.levelIcon} ${isActive ? styles.levelIconActive : ''} ${locked ? styles.levelIconLocked : ''}`}
                style={{
                  bottom: s.bottom,
                  left: s.left,
                  width: size,
                  height: size,
                }}
                onClick={() => handleLevelClick(s.stage)}
                disabled={locked || pendingNav !== null}
                aria-label={locked ? `${s.label} (заблокирован)` : `Go to ${s.label}`}
              >
                <img
                  src={LEVEL_IMAGES[s.stage - 1]}
                  alt={`Level ${s.stage}`}
                  className={styles.levelImg}
                />
                {locked && <span className={styles.lockOverlay}>🔒</span>}
              </button>
            );
          })}
        </div>

        {characterStarted && (
          <div
            className={`${styles.character} ${isMoving ? styles.characterWalk : ''}`}
            style={{
              bottom: `${charBottom}%`,
              left: '50%',
              transform: 'translate(-50%, 0)',
            }}
          >
            <img
              className={`${styles.characterImg} ${isMoving ? styles.characterMoving : styles.characterIdle}`}
              src={isMoving ? characterImage : (staticFrame ?? characterImage)}
              alt="Character"
              style={{ width: charWidth }}
            />
          </div>
        )}

        <div className={styles.label}>{stage.label}</div>

        <div className={styles.controls}>
          <button className={styles.arrowBtn} onClick={() => goTo(currentStage - 1)} disabled={isFirst || pendingNav !== null} aria-label="Previous stage">←</button>
          <button
            className={styles.arrowBtn}
            onClick={() => {
              sessionStorage.removeItem('story_in_level');
              navigate('/');
            }}
            aria-label="Back to dashboard"
          >
            🏠
          </button>
          <button className={styles.arrowBtn} onClick={() => goTo(currentStage + 1)} disabled={isLast || pendingNav !== null} aria-label="Next stage">→</button>
        </div>
      </div>

      {showWelcome && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>🗺️ Добро пожаловать в сюжет!</h2>
            <div className={styles.modalBody}>
              <p>Ты находишься на карте приключений. Здесь тебе предстоит пройти <strong>5 этапов</strong> изучения иврита.</p>
              <p>На каждом этапе ты будешь:</p>
              <ul>
                <li>📚 Изучать теорию — буквы, звуки, правила никуда</li>
                <li>🎯 Проходить квиз из 20 вопросов по теме этапа</li>
                <li>🔓 Открывать следующий уровень, набрав <strong>80% и выше</strong></li>
              </ul>
              <p className={styles.modalHint}>Этап 1 открыт. Этапы 2–5 нужно разблокировать, набрав 80% и выше на предыдущем этапе!</p>
            </div>
            <button className={styles.startBtn} onClick={handleStartJourney}>
              Давай начнем! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageMap;