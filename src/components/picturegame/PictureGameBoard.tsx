import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PICTURE_GAME_LEVELS, type PictureGameItem } from '../../data/pictureGameData';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import styles from './PictureGameBoard.module.css';

interface PlacedWord {
  itemId: number;
  wordId: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1200;

const PictureGameBoard: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { playAudio } = useCloudTTS();
  const { playCorrect, playWrong } = useSoundEffects();

  const level = PICTURE_GAME_LEVELS.find((l) => l.levelId === Number(levelId));

  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [draggedWord, setDraggedWord] = useState<PictureGameItem | null>(null);

  // Pan & Zoom state
  const [scale, setScale] = useState(0.5);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingWord = useRef(false);

  // Keep positionRef in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const clampPosition = useCallback((pos: { x: number; y: number }, currentScale: number) => {
    if (!containerRef.current) return pos;

    const scaledW = IMAGE_WIDTH * currentScale;
    const scaledH = IMAGE_HEIGHT * currentScale;

    // Allow panning such that at least 100px of the image remains visible
    const minVisible = 100;
    const maxX = Math.max(0, (scaledW - minVisible) / 2);
    const maxY = Math.max(0, (scaledH - minVisible) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, pos.x)),
      y: Math.max(-maxY, Math.min(maxY, pos.y)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't pan if we're dragging a word card (HTML5 drag)
    if (isDraggingWord.current) return;
    // Don't pan if clicking on a drop zone or placed word
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.dropZone}`) || target.closest(`.${styles.placedWordCard}`)) return;

    setIsPanning(true);
    panStart.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const newPos = {
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    };
    setPosition(clampPosition(newPos, scale));
  }, [isPanning, scale, clampPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));

    // Zoom toward mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Mouse position relative to the image center in the current transform
      const imgMouseX = mouseX - rect.width / 2 - position.x;
      const imgMouseY = mouseY - rect.height / 2 - position.y;

      const scaleRatio = newScale / scale;
      const newX = mouseX - rect.width / 2 - imgMouseX * scaleRatio;
      const newY = mouseY - rect.height / 2 - imgMouseY * scaleRatio;

      const clampedPos = clampPosition({ x: newX, y: newY }, newScale);
      setScale(newScale);
      setPosition(clampedPos);
    } else {
      setScale(newScale);
    }
  }, [scale, position, clampPosition]);

  // Track HTML5 drag state to prevent panning during word drag
  useEffect(() => {
    const handleDragStart = () => { isDraggingWord.current = true; };
    const handleDragEnd = () => { isDraggingWord.current = false; };
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Reset view when level changes
  useEffect(() => {
    setScale(0.5);
    setPosition({ x: 0, y: 0 });
  }, [levelId]);

  if (!level) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Уровень не найден</h2>
          <button onClick={() => navigate('/picture-game')} className={styles.backBtn}>
            Назад к уровням
          </button>
        </div>
      </div>
    );
  }

  const handleDragStart = (item: PictureGameItem) => {
    setDraggedWord(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetItem: PictureGameItem) => {
    if (!draggedWord || showResults) return;

    // Check if this drop zone already has a word
    const existingPlacement = placedWords.find((p) => p.itemId === targetItem.id);
    if (existingPlacement) return;

    // Add the placement
    setPlacedWords([...placedWords, { itemId: targetItem.id, wordId: draggedWord.id }]);
    setDraggedWord(null);
  };

  const handleRemoveWord = (itemId: number) => {
    if (showResults) return;
    setPlacedWords(placedWords.filter((p) => p.itemId !== itemId));
  };

  const handleWordClick = (item: PictureGameItem) => {
    playAudio(item.wordVowels);
  };

  const handleSubmit = () => {
    // Check if all words are placed
    if (placedWords.length !== level.items.length) {
      alert(`Разместите все слова! Осталось: ${level.items.length - placedWords.length}`);
      return;
    }

    // Play sound effects based on results
    const correctCount = placedWords.filter((p) => p.itemId === p.wordId).length;
    if (correctCount === level.items.length) {
      playCorrect();
    } else {
      playWrong();
    }

    setShowResults(true);
  };

  const handleReset = () => {
    setPlacedWords([]);
    setShowResults(false);
  };

  const isWordPlaced = (wordId: number) => {
    return placedWords.some((p) => p.wordId === wordId);
  };

  const getPlacedWord = (itemId: number): PictureGameItem | null => {
    const placement = placedWords.find((p) => p.itemId === itemId);
    if (!placement) return null;
    return level.items.find((item) => item.id === placement.wordId) || null;
  };

  const isCorrectPlacement = (itemId: number): boolean => {
    const placement = placedWords.find((p) => p.itemId === itemId);
    return placement ? placement.itemId === placement.wordId : false;
  };

  const correctCount = placedWords.filter((p) => p.itemId === p.wordId).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/picture-game')}>
          ← Назад
        </button>
        <h1 className={styles.title}>Уровень {level.levelId}</h1>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            📍 {placedWords.length}/{level.items.length}
          </span>
          {showResults && (
            <span className={styles.statItem}>
              ✅ {correctCount}/{level.items.length}
            </span>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className={styles.gameArea}>
        {/* Picture with Drop Zones - Pannable & Zoomable */}
        <div
          ref={containerRef}
          className={`${styles.pictureContainer} ${isPanning ? styles.panning : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className={styles.transformLayer}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
            }}
          >
            <img
              src={level.imageSrc}
              alt="Game Level"
              className={styles.picture}
              draggable={false}
            />
            
            {/* Drop Zones Overlay */}
            {level.items.map((item) => {
              const placedWord = getPlacedWord(item.id);
              const isCorrect = isCorrectPlacement(item.id);
              
              return (
                <div
                  key={item.id}
                  className={`${styles.dropZone} ${placedWord ? styles.filled : ''} ${
                    showResults ? (isCorrect ? styles.correct : styles.incorrect) : ''
                  }`}
                  style={{ left: `${item.x}px`, top: `${item.y}px` }}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(item)}
                >
                  {placedWord ? (
                    <div className={styles.placedWordCard}>
                      <div className={styles.wordHebrew}>{placedWord.wordVowels}</div>
                      <div className={styles.wordTranscription}>{placedWord.transcription}</div>
                      {!showResults && (
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemoveWord(item.id)}
                          title="Убрать"
                        >
                          ×
                        </button>
                      )}
                      {showResults && !isCorrect && (
                        <div className={styles.correctAnswer}>
                          ✓ {item.wordVowels}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptyZone}>
                      {showResults && (
                        <div className={styles.missedWord}>
                          {item.wordVowels}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className={styles.zoomControls}>
          <button
            className={styles.zoomBtn}
            onClick={() => {
              const newScale = Math.min(MAX_SCALE, scale + 0.2);
              setScale(newScale);
              setPosition(clampPosition(position, newScale));
            }}
            title="Приблизить"
          >
            +
          </button>
          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
          <button
            className={styles.zoomBtn}
            onClick={() => {
              const newScale = Math.max(MIN_SCALE, scale - 0.2);
              setScale(newScale);
              setPosition(clampPosition(position, newScale));
            }}
            title="Отдалить"
          >
            −
          </button>
          <button
            className={styles.zoomBtn}
            onClick={() => {
              setScale(0.5);
              setPosition({ x: 0, y: 0 });
            }}
            title="Сбросить"
          >
            ↺
          </button>
        </div>

        {/* Word Bank */}
        {!showResults && (
          <div className={styles.wordBank}>
            <div className={styles.bankTitle}>Перетащи слова на картинку:</div>
            <div className={styles.wordGrid}>
              {level.items.map((item) => (
                <div
                  key={item.id}
                  draggable={!isWordPlaced(item.id)}
                  onDragStart={() => handleDragStart(item)}
                  onClick={() => handleWordClick(item)}
                  className={`${styles.wordCard} ${isWordPlaced(item.id) ? styles.placed : ''}`}
                >
                  <div className={styles.wordHebrew}>{item.wordVowels}</div>
                  <div className={styles.wordTranscription}>{item.transcription}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!showResults && (
          <div className={styles.actions}>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={placedWords.length !== level.items.length}
            >
              Проверить ответы
            </button>
          </div>
        )}

        {/* Results Panel */}
        {showResults && (
          <div className={styles.resultsPanel}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                {correctCount === level.items.length ? '🎉 Отлично!' : '📊 Результаты'}
              </h2>
              <p className={styles.resultsScore}>
                Правильно: {correctCount} из {level.items.length}
              </p>
            </div>

            <div className={styles.vocabularyList}>
              <h3 className={styles.vocabTitle}>📚 Словарь:</h3>
              {level.items.map((item) => (
                <div key={item.id} className={styles.vocabItem}>
                  <div className={styles.vocabWord}>
                    <span className={styles.vocabHebrew}>{item.wordVowels}</span>
                    <span className={styles.vocabTranscription}>{item.transcription}</span>
                  </div>
                  <div className={styles.vocabTranslation}>{item.translation}</div>
                </div>
              ))}
            </div>

            <div className={styles.grammarSection}>
              <h3 className={styles.grammarTitle}>📖 Грамматические пояснения:</h3>
              <div
                className={styles.grammarContent}
                dangerouslySetInnerHTML={{ __html: level.grammarExplanation.replace(/\n/g, '<br/>') }}
              />
            </div>

            <div className={styles.resultsActions}>
              <button className={styles.retryBtn} onClick={handleReset}>
                🔄 Попробовать снова
              </button>
              <button className={styles.backBtn} onClick={() => navigate('/picture-game')}>
                📋 К списку уровней
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PictureGameBoard;