import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MainMap.module.css';
import characterImage from '../../assets/character.gif';
import mapImage from '../../assets/israelMapBackground.png';
import num1Img from '../../assets/num1.png';
import num2Img from '../../assets/num2.png';
import num3Img from '../../assets/num3.png';
import num4Img from '../../assets/num4.png';
import runningSound from '../../assets/runningSound.mp3';
import bubbleClickSound from '../../assets/bubbleClickSound.mp3';

// ── Admin user ID for testing overrides ──-
const ADMIN_USER_ID = 'QPqOShAyR2OuSBvZYRU9SB09HC33';

// ── Node data interface ──
interface MapNode {
  id: number;
  name: string;
  x: number;
  y: number;
  route: string | null;
  icon: string;
}

interface ResolvedNode extends MapNode {
  left: string;
  top: string;
  locked: boolean;
}

// ── Absolute pixel coordinates from Figma ──
const NODE_COORDS_ABSOLUTE: MapNode[] = [
  { id: 1, name: 'Хайфа', x: 639, y: 348, route: '/stage-map', icon: num1Img },
  { id: 2, name: 'Кейсария', x: 601, y: 461, route: '/stage-map2', icon: num2Img },
  { id: 3, name: 'Город 3', x: 795, y: 279, route: '/stage-map3', icon: num3Img },
  { id: 4, name: 'Город 4', x: 569, y: 689, route: null, icon: num4Img },
];

// ── Constants (matching StageMap2) ──
const CHAR_WIDTH = 120 * 0.85 * 0.7;
const NODE_ICON_SIZE = 66;
const DRAG_CLICK_THRESHOLD = 6;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

// ── Helpers ──
function playSoundFile(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {
    console.error('Audio file error:', e);
  }
}

function isStory1Completed(): boolean {
  try {
    const raw = localStorage.getItem('story_passed');
    if (raw) {
      const parsed = JSON.parse(raw) as Record<number, boolean>;
      return !!parsed[5];
    }
  } catch { /* ignore */ }
  return false;
}

function isStory2Completed(): boolean {
  try {
    const raw = localStorage.getItem('story2_passed');
    if (raw) {
      const parsed = JSON.parse(raw) as Record<number, boolean>;
      return !!parsed[5];
    }
  } catch { /* ignore */ }
  return false;
}

function isNodeLocked(id: number, isAdmin: boolean): boolean {
  if (isAdmin) {
    return id === 4;
  }
  switch (id) {
    case 1: return false;
    case 2: return !isStory1Completed();
    case 3: return !isStory2Completed();
    case 4: return true;
    default: return true;
  }
}

function coordsToPercent(x: number, y: number, imgW: number, imgH: number): { top: string; left: string } {
  if (imgW <= 0 || imgH <= 0) return { top: '0%', left: '0%' };
  return {
    left: `${(x / imgW) * 100}%`,
    top: `${(y / imgH) * 100}%`,
  };
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

interface MainMapProps {
  userId: string;
}

const MainMap: React.FC<MainMapProps> = ({ userId }) => {
  const navigate = useNavigate();
  const isAdmin = userId === ADMIN_USER_ID;

  const [currentNode, setCurrentNode] = useState(() => {
    const saved = Number(sessionStorage.getItem('mainmap_current_node'));
    return saved >= 1 && saved <= 4 ? saved : 1;
  });
  const [isMoving, setIsMoving] = useState(false);
  const [staticFrame, setStaticFrame] = useState<string | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useRef({ w: 0, h: 0 });
  const imgNaturalSize = useRef({ w: 0, h: 0 });

  // ── Drag-to-pan state ──
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const dragMovedRef = useRef(false);
  const dragSuppressClickRef = useRef(false);

  // ── Pinch-to-zoom state ──
  const [scale, setScale] = useState(1);
  const pinchRef = useRef<{
    active: boolean;
    dist: number;
    centerX: number;
    centerY: number;
    startScale: number;
    startPanX: number;
    startPanY: number;
  }>({ active: false, dist: 0, centerX: 0, centerY: 0, startScale: 1, startPanX: 0, startPanY: 0 });

  // ── Track container size via ResizeObserver ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          containerSize.current = { w, h };
          if (imgNaturalSize.current.w > 0 && imgNaturalSize.current.h > 0) {
            setLayoutReady(true);
          }
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Get the background image's natural dimensions ──
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgNaturalSize.current = { w: img.naturalWidth, h: img.naturalHeight };
      if (containerSize.current.w > 0 && containerSize.current.h > 0) {
        setLayoutReady(true);
      }
    };
    img.src = mapImage;
  }, []);

  // ── Capture the first frame of the character GIF for idle display ──
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

  // ── Move animation timer ──
  const moveTimerRef = useRef<number | null>(null);
  const startMoveAnimation = (durationMs: number) => {
    if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current);
    setIsMoving(true);
    moveTimerRef.current = window.setTimeout(() => setIsMoving(false), durationMs);
  };

  // ── Build node data with computed percentages ──
  const nodes: ResolvedNode[] = NODE_COORDS_ABSOLUTE.map((n) => {
    const { left, top } = coordsToPercent(n.x, n.y, imgNaturalSize.current.w, imgNaturalSize.current.h);
    return { ...n, left, top, locked: isNodeLocked(n.id, isAdmin) };
  });

  const activeNode = nodes.find((n) => n.id === currentNode) || nodes[0];

  // ── Handle node click ──
  const handleNodeClick = (node: ResolvedNode) => {
    if (dragSuppressClickRef.current) return;
    if (node.locked) return;
    if (!node.route) return;

    playSoundFile(bubbleClickSound);
    const isSameNode = node.id === currentNode;
    if (!isSameNode) {
      playSoundFile(runningSound);
      setCurrentNode(node.id);
      sessionStorage.setItem('mainmap_current_node', String(node.id));
      startMoveAnimation(3000);
    }
    setTimeout(() => {
      navigate(node.route!);
    }, isSameNode ? 0 : 3000);
  };

  // ── Calculate world div size (cover-style) ──
  const { w: cw, h: ch } = containerSize.current;
  const { w: iw, h: ih } = imgNaturalSize.current;
  let worldW = cw || 1;
  let worldH = ch || 1;
  if (iw > 0 && ih > 0) {
    const scaleX = (cw || 1) / iw;
    const scaleY = (ch || 1) / ih;
    const s = Math.max(scaleX, scaleY);
    worldW = iw * s;
    worldH = ih * s;
  }

  const defaultOffsetX = (cw - worldW) / 2;
  const defaultOffsetY = (ch - worldH) / 2;

  const clampPan = useCallback(
    (x: number, y: number) => {
      const { w, h } = containerSize.current;
      if (w === 0 || h === 0) return { x: 0, y: 0 };
      const maxPanX = Math.max(0, (worldW * scale - w) / 2);
      const maxPanY = Math.max(0, (worldH * scale - h) / 2);
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [worldW, worldH, scale],
  );

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
    setPanOffset(clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy));
  };
  const onDragEnd = () => {
    if (dragMovedRef.current) {
      dragSuppressClickRef.current = true;
      window.setTimeout(() => { dragSuppressClickRef.current = false; }, 100);
    }
    setIsDragging(false);
  };

  // ── Pinch handlers (multi-touch only) ──
  const handleTouchStartForPinch = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const t2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
      pinchRef.current = {
        active: true,
        dist: distance(t1, t2),
        centerX: (t1.x + t2.x) / 2,
        centerY: (t1.y + t2.y) / 2,
        startScale: scale,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
    }
  };

  const handleTouchMoveForPinch = (e: React.TouchEvent) => {
    if (!pinchRef.current.active) return;
    if (e.touches.length !== 2) return;
    const t1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const t2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
    const newDist = distance(t1, t2);
    const ratio = pinchRef.current.dist > 0 ? newDist / pinchRef.current.dist : 1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.startScale * ratio));
    setScale(newScale);
  };

  const handleTouchEndForPinch = () => {
    if (pinchRef.current.active) {
      pinchRef.current.active = false;
    }
  };

  // ── Render ──
  return (
    <div className={styles.scene}>
      <div
        ref={containerRef}
        className={styles.container}
        style={{
          cursor: isDragging ? 'grabbing' : 'default',
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
        onTouchStart={handleTouchStartForPinch}
        onTouchMove={handleTouchMoveForPinch}
        onTouchEnd={handleTouchEndForPinch}
      >
        {layoutReady && (
          <div
            className={styles.world}
            style={{
              width: worldW,
              height: worldH,
              left: defaultOffsetX + panOffset.x,
              top: defaultOffsetY + panOffset.y,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'left 3s ease-in-out, top 3s ease-in-out',
            }}
          >
            <img src={mapImage} alt="Israel map" className={styles.bgImage} />

            {nodes.map((node) => (
              <button
                key={node.id}
                className={`${styles.nodeIcon} ${node.id === currentNode ? styles.nodeIconActive : ''} ${node.locked ? styles.nodeIconLocked : ''}`}
                style={{
                  top: node.top,
                  left: node.left,
                  width: NODE_ICON_SIZE,
                  height: NODE_ICON_SIZE,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handleNodeClick(node)}
                disabled={node.locked || !node.route}
                aria-label={node.locked ? `${node.name} (заблокирован)` : `Перейти в ${node.name}`}
              >
                <img src={node.icon} alt={node.name} className={styles.nodeImg} />
                {node.locked && <span className={styles.lockOverlay}>🔒</span>}
              </button>
            ))}

            <div
              className={`${styles.character} ${isMoving ? styles.characterWalk : ''}`}
              style={{
                top: activeNode.top,
                left: activeNode.left,
                transform: 'translate(-50%, -50%)',
                transition: 'top 4s ease-in-out, left 4s ease-in-out',
              }}
            >
              <img
                className={`${styles.characterImg} ${isMoving ? styles.characterMoving : styles.characterIdle}`}
                src={isMoving ? characterImage : (staticFrame ?? characterImage)}
                alt="Character"
                style={{ width: CHAR_WIDTH }}
              />
            </div>
          </div>
        )}

        <div className={styles.label}>{activeNode.name}</div>

        <div className={styles.controls}>
          <button className={styles.homeBtn} onClick={() => navigate('/')} aria-label="Back to dashboard">
            🏠
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMap;