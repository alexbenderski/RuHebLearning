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

/** Minimum drag distance before we treat a gesture as a pan (not a click). */
const DRAG_CLICK_THRESHOLD = 6;

function getLevelSize(stage: number): number {
  const base = LEVEL_BASE_SIZE * Math.pow(SHRINK_PER_STAGE, stage - 1);
  if (stage === 5) return base * 1.3;
  return base;
}

const UNLOCK_VERSION = 2; // bump to reset stale unlock data for existing users

function loadUnlocked(): Record<number, boolean> {
  try {
    const version = Number(localStorage.getItem('story2_unlocked_v'));
    const raw = localStorage.getItem('story2_unlocked');
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
  localStorage.setItem('story2_unlocked_v', String(UNLOCK_VERSION));
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

// ── Admin user ID for testing overrides ──
const ADMIN_USER_ID = 'QPqOShAyR2OuSBvZYRU9SB09HC33';

interface StageMap2Props {
  userId: string;
}

const StageMap2: React.FC<StageMap2Props> = ({ userId }) => {
  const navigate = useNavigate();
  const isAdmin = userId === ADMIN_USER_ID;
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
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>(() => {
    const base = loadUnlocked();
    if (isAdmin) {
      // Admin: unlock all 5 levels
      return { 1: true, 2: true, 3: true, 4: true, 5: true };
    }
    return base;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useRef({ w: 0, h: 0 });
  const imgNaturalSize = useRef({ w: 0, h: 0 });

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

  // Track container size and image natural size
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

  // Get the image's natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgNaturalSize.current = { w: img.naturalWidth, h: img.naturalHeight };
    };
    img.src = mapImage;
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
    if (dragSuppressClickRef.current) return;
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

  // ── Calculate the world div size ──
  // The world div holds the full image (100% of its natural dimensions).
  // We want to show the image as large as possible, filling the container
  // in at least one dimension, and extending beyond in the other if needed.
  // The world div is positioned at negative offsets so the image covers the
  // container, and the user can drag to see the overflow.
  const { w: cw, h: ch } = containerSize.current;
  const { w: iw, h: ih } = imgNaturalSize.current;
  let worldW = cw || 1;
  let worldH = ch || 1;
  if (iw > 0 && ih > 0) {
    // Scale the image so it fills the container in at least one dimension
    const scaleX = (cw || 1) / iw;
    const scaleY = (ch || 1) / ih;
    const scale = Math.max(scaleX, scaleY); // cover — fill the container completely
    worldW = iw * scale;
    worldH = ih * scale;
  }

  // The world div is centered in the container by default.
  // Default offset (no pan) centers the world div:
  const defaultOffsetX = (cw - worldW) / 2;
  const defaultOffsetY = (ch - worldH) / 2;

  // Clamp pan so the world div always covers the container:
  // The world div can slide left/right/up/down but its edges must not
  // come inside the visible area.
  const clampPan = useCallback((x: number, y: number) => {
    const { w, h } = containerSize.current;
    if (w === 0 || h === 0) return { x: 0, y: 0 };
    // The world div is larger than the container in at least one direction.
    // Calculate how much it can move:
    const maxPanX = Math.max(0, (worldW - w) / 2);
    const maxPanY = Math.max(0, (worldH - h) / 2);
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, y)),
    };
  }, [worldW, worldH]);

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
      dragSuppressClickRef.current = true;
      window.setTimeout(() => { dragSuppressClickRef.current = false; }, 100);
    }
    setIsDragging(false);
  };

  return (
    <div className={styles.scene} style={{ background: 'transparent' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          background: 'transparent',
          cursor: isDragging ? 'grabbing' : 'default',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          onDragStart(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          e.preventDefault();
          onDragMove(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onDragEnd();
        }}
        onPointerLeave={(e) => {
          e.preventDefault();
          onDragEnd();
        }}
      >
        {/* WORLD: the full image, can extend beyond the container */}
        <div
          style={{
            position: 'absolute',
            width: worldW,
            height: worldH,
            left: defaultOffsetX + panOffset.x,
            top: defaultOffsetY + panOffset.y,
            transition: isDragging ? 'none' : 'left 3s ease-in-out, top 3s ease-in-out',
          }}
        >
          <img
            src={mapImage}
            alt="Caesarea map"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />

          {/* Level icons — positioned as percentages of the world div */}
          {STAGES.map((s) => (
            <button
              key={s.stage}
              className={`${styles.levelIcon} ${s.stage === currentStage ? styles.levelIconActive : ''} ${!unlocked[s.stage] ? styles.levelIconLocked : ''}`}
              style={{
                top: s.top,
                left: s.left,
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

          {/* Character — in the world div, at the same percentage coordinates */}
          {characterStarted && (
            <div
              className={`${styles.character} ${isMoving ? styles.characterWalk : ''}`}
              style={{
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
        </div>

        {/* Label — fixed overlay */}
        <div className={styles.label}>{stage.label}</div>

        {/* Controls — fixed */}
        <div className={styles.controls}>
          <button className={styles.arrowBtn} onClick={() => goTo(currentStage - 1)} disabled={isFirst || pendingNav !== null} aria-label="Previous stage">←</button>
          <button
            className={styles.arrowBtn}
            onClick={() => {
              sessionStorage.removeItem('story2_in_level');
              navigate('/main-map');
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

export default StageMap2;