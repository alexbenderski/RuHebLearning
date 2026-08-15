import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StageMap.module.css';
import characterImage from '../../assets/character.gif';
import mapImage from '../../assets/CesareaBackgroundStage2.png';
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
  top: string;
  left: string;
}

const STAGES: StageCoord[] = [
  { stage: 1, label: 'Этап 1', top: '92%', left: '56%' },
  { stage: 2, label: 'Этап 2', top: '72%', left: '39%' },
  { stage: 3, label: 'Этап 3', top: '48%', left: '19%' },
  { stage: 4, label: 'Этап 4', top: '52%', left: '59%' },
  { stage: 5, label: 'Этап 5', top: '20%', left: '81%' },
];

const LAST_STAGE = STAGES.length;

const BASE_CHAR_WIDTH = 120 * 0.85 * 0.7;
const SHRINK_PER_STAGE = 0.9;

const LEVEL_BASE_SIZE = 44 * 1.5; // 66px

/** Map layer is 150% of the container so there is room to pan. */
const MAP_OVERSCALE = 1.5;
const MAP_OVERSCALE_OFFSET = (MAP_OVERSCALE - 1) / 2; // 0.25

/** Convert a container percentage to the same point inside the oversized map layer. */
function toMapPct(containerPct: string): string {
  const val = parseFloat(containerPct) / 100;
  return `${((val + MAP_OVERSCALE_OFFSET) / MAP_OVERSCALE) * 100}%`;
}

/** Minimum drag distance before we treat a gesture as a pan (not a click). */
const DRAG_CLICK_THRESHOLD = 6;

function getLevelSize(stage: number): number {
  const base = LEVEL_BASE_SIZE * Math.pow(SHRINK_PER_STAGE, stage - 1);
  if (stage === 5) return base * 1.3;
  return base;
}

function loadUnlocked(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem('story2_unlocked');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { 1: true, 2: true, 3: true, 4: false, 5: false };
}
function saveUnlocked(state: Record<number, boolean>) {
  localStorage.setItem('story2_unlocked', JSON.stringify(state));
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

const StageMap2: React.FC = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(() => {
    if (sessionStorage.getItem('story2_pending_level')) return false;
    return !sessionStorage.getItem('story2_in_level');
  });
  const [currentStage, setCurrentStage] = useState(() => {
    const saved = Number(sessionStorage.getItem('story2_current_stage'));
    return saved >= 1 && saved <= LAST_STAGE ? saved : 1;
  });
  const [characterStarted, setCharacterStarted] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [staticFrame, setStaticFrame] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>(loadUnlocked);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useRef({ w: 0, h: 0 });

  // ── Drag-to-pan state ──
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const dragMovedRef = useRef(false);
  const dragSuppressClickRef = useRef(false);

  const pendingNav = (() => {
    const raw = sessionStorage.getItem('story2_pending_level');
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
        containerSize.current = { w: entry.contentRect.width, h: entry.contentRect.height };
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
      if (!unlocked[pendingNav]) {
        const next = { ...unlocked, [pendingNav]: true };
        setUnlocked(next);
        saveUnlocked(next);
      }

      if (pendingNav === currentStage) {
        sessionStorage.removeItem('story2_pending_level');
        sessionStorage.setItem('story2_in_level', 'true');
        navigate(`/story-level2/${pendingNav}`);
      } else {
        playSoundFile(runningSound);
        setCurrentStage(pendingNav);
        sessionStorage.setItem('story2_current_stage', String(pendingNav));
        startMoveAnimation(4000);
        navTimerRef.current = window.setTimeout(() => {
          sessionStorage.removeItem('story2_pending_level');
          sessionStorage.setItem('story2_in_level', 'true');
          navigate(`/story-level2/${pendingNav}`);
        }, 4000);
      }
    } else {
      sessionStorage.removeItem('story2_pending_level');
    }

    return () => {
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
    sessionStorage.setItem('story2_current_stage', String(clamped));
    startMoveAnimation(4000);
  };

  const handleLevelClick = (stageNum: number) => {
    if (dragSuppressClickRef.current) return; // ignore click after a drag gesture
    if (!unlocked[stageNum]) return;
    playSoundFile(bubbleClickSound);
    sessionStorage.setItem('story2_in_level', 'true');
    const isSameStage = stageNum === currentStage;
    if (!isSameStage) {
      playSoundFile(runningSound);
      setCurrentStage(stageNum);
      sessionStorage.setItem('story2_current_stage', String(stageNum));
      startMoveAnimation(3000);
    }
    setTimeout(() => {
      navigate(`/story-level2/${stageNum}`);
    }, isSameStage ? 0 : 3000);
  };

  const handleStartJourney = () => {
    setShowWelcome(false);
    setCharacterStarted(true);
    playSoundFile(runningSound);
    startMoveAnimation(4000);
    setTimeout(() => {
      setCurrentStage(1);
      sessionStorage.setItem('story2_current_stage', '1');
    }, 100);
  };

  const charWidth = BASE_CHAR_WIDTH * Math.pow(SHRINK_PER_STAGE, currentStage - 1);

  /** Clamp a pixel offset so the map layer always covers the entire container. */
  const clampPan = useCallback((x: number, y: number) => {
    const { w, h } = containerSize.current;
    if (w === 0 || h === 0) return { x: 0, y: 0 };
    const maxX = MAP_OVERSCALE_OFFSET * w;
    const maxY = MAP_OVERSCALE_OFFSET * h;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  // ── Drag handlers ──
  const onDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragMovedRef.current = false;
    dragStartRef.current = { x: clientX, y: clientY, panX: panOffset.x, panY: panOffset.y };
  };
  const onDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    if (!dragMovedRef.current && Math.abs(dx) + Math.abs(dy) > DRAG_CLICK_THRESHOLD) {
      dragMovedRef.current = true;
    }
    setPanOffset(clampPan(
      dragStartRef.current.panX + dx,
      dragStartRef.current.panY + dy,
    ));
  };
  const onDragEnd = () => {
    if (dragMovedRef.current) {
      // Suppress the next click so the level icon doesn't open after a drag
      dragSuppressClickRef.current = true;
      window.setTimeout(() => { dragSuppressClickRef.current = false; }, 100);
    }
    setIsDragging(false);
  };

  return (
    <div className={styles.scene} style={{ background: 'transparent' }}>
      <div
        className={styles.container}
        ref={containerRef}
        style={{
          background: 'transparent',
          cursor: isDragging ? 'grabbing' : 'default',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={(e) => onDragStart(e.clientX, e.clientY)}
        onMouseMove={(e) => onDragMove(e.clientX, e.clientY)}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            onDragStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) {
            onDragMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={onDragEnd}
      >
        <div
          className={styles.mapLayer}
          style={{
            width: `${MAP_OVERSCALE * 100}%`,
            height: `${MAP_OVERSCALE * 100}%`,
            left: `${-MAP_OVERSCALE_OFFSET * 100}%`,
            top: `${-MAP_OVERSCALE_OFFSET * 100}%`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            // Disable the 3s CSS transition while dragging so the map follows the finger
            transition: isDragging ? 'none' : 'transform 3s ease-in-out',
          }}
        >
          <img className={styles.bgImage} src={mapImage} alt="Caesarea map" />

          {STAGES.map((s) => (
            <button
              key={s.stage}
              className={`${styles.levelIcon} ${s.stage === currentStage ? styles.levelIconActive : ''} ${!unlocked[s.stage] ? styles.levelIconLocked : ''}`}
              style={{
                top: toMapPct(s.top),
                left: toMapPct(s.left),
                width: getLevelSize(s.stage),
                height: getLevelSize(s.stage),
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => handleLevelClick(s.stage)}
              disabled={!unlocked[s.stage] || pendingNav !== null}
              aria-label={!unlocked[s.stage] ? `${s.label} (заблокирован)` : `Go to ${s.label}`}
            >
              <img
                src={LEVEL_IMAGES[s.stage - 1]}
                alt={`Level ${s.stage}`}
                className={styles.levelImg}
              />
              {!unlocked[s.stage] && <span className={styles.lockOverlay}>🔒</span>}
            </button>
          ))}
          </div>

        {/* CHARACTER — fixed overlay, never moves with the drag */}
        {characterStarted && (
          <div
            className={`${styles.character} ${isMoving ? styles.characterWalk : ''}`}
            style={{
              position: 'absolute',
              zIndex: 10,
              pointerEvents: 'none',
              top: stage.top,
              left: stage.left,
              transform: 'translate(-50%, -50%)',
              transition: 'top 4s ease-in-out, left 4s ease-in-out',
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
              sessionStorage.removeItem('story2_in_level');
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
            <h2 className={styles.modalTitle}>🏛️ Добро пожаловать в Кейсарию!</h2>
            <div className={styles.modalBody}>
              <p>Добро пожаловать на 2-й уровень! Теперь, когда ты знаешь буквы и огласовки (никуд), пришло время научиться читать и понимать свои первые слова на иврите.</p>
              <p>Мы выучим базовые слова для повседневной жизни: еда, семья, действия и места.</p>
              <p>На каждом этапе ты будешь:</p>
              <ul>
                <li>🧩 Собирать слова из букв (Собери слово)</li>
                <li>🎯 Проходить мини-квиз по выученным словам</li>
                <li>🔓 Открывать следующий уровень, набрав <strong>80% и выше</strong></li>
              </ul>
              <p className={styles.modalHint}>Этапы 1–3 открыты сразу. Этапы 4 и 5 нужно разблокировать!</p>
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

export default StageMap2;