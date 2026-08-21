import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { VocabWord } from '../../types';
import { getVocalizedForm } from '../../data/nikudWords';
import { MAP2_LEVELS, getAllMap2Words } from '../../data/map2Words';
import AlphabetWordBuilderGame, { type WordBuilderResult } from '../alphabet/AlphabetWordBuilderGame';
import WordsQuiz, { type QuizResult } from '../words/WordsQuiz';
import ExamQuestion from './ExamQuestion';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import bubbleClickSound from '../../assets/bubbleClickSound.mp3';
import looseVideo from '../../assets/loose_reaction_character.mp4';
import winVideo from '../../assets/win_reaction_character.mp4';
import styles from './LevelDetail.module.css';

const PASS_THRESHOLD_PCT = 80;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const UNLOCK_VERSION = 1;

function loadUnlocked(): Record<number, boolean> {
  try {
    const version = Number(localStorage.getItem('story3_unlocked_v'));
    const raw = localStorage.getItem('story3_unlocked');
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
  localStorage.setItem('story3_unlocked_v', String(UNLOCK_VERSION));
  localStorage.setItem('story3_unlocked', JSON.stringify(state));
}
function loadPassed(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem('story3_passed');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}
function savePassed(state: Record<number, boolean>) {
  localStorage.setItem('story3_passed', JSON.stringify(state));
}

interface ExamQuestionData {
  type: 'wordbuild' | 'quiz';
  word: VocabWord;
}

function getLevelGameType(levelNum: number): 'quiz' | 'wordbuild' {
  return levelNum % 2 === 1 ? 'quiz' : 'wordbuild';
}

function generateExamQuestions(words: VocabWord[], levelNum: number): ExamQuestionData[] {
  return shuffle(words).map((w) => ({
    // Level 5 (final exam) uses mixed types; levels 1-4 use the level-specific type
    type: levelNum === 5 ? (Math.random() < 0.5 ? 'wordbuild' : 'quiz') : getLevelGameType(levelNum),
    word: w,
  }));
}

const LevelDetail3: React.FC = () => {
  const navigate = useNavigate();
  const { levelId } = useParams<{ levelId: string }>();
  const levelNum = Number(levelId) || 1;
  const isFinalExam = levelNum === 5;

  const levelData = MAP2_LEVELS.find((l) => l.level === levelNum);

  const { playAudio } = useCloudTTS();
  const { playSoundFile, playCorrect, playWrong } = useSoundEffects();

  const [phase, setPhase] = useState<'theory' | 'exam' | 'training' | 'trainingGame' | 'lose' | 'win'>('theory');
  const [passed, setPassed] = useState<boolean>(loadPassed()[levelNum] ?? false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  const skipVideo = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = el.duration;
  };

  const [lastScorePct, setLastScorePct] = useState<number | null>(null);

  const levelWords = levelData?.words ?? [];
  const allMap2Words = useMemo(() => getAllMap2Words(), []);
  const [resetKey, setResetKey] = useState(0);

  // Exam state
  const [examQuestions, setExamQuestions] = useState<ExamQuestionData[]>([]);
  const [examIdx, setExamIdx] = useState(0);
  const [examCorrect, setExamCorrect] = useState(0);
  const [examTotal, setExamTotal] = useState(0);

  // Training state
  const [trainingGameType, setTrainingGameType] = useState<'wordbuild' | 'quiz'>('wordbuild');
  const [trainingQuestionCount, setTrainingQuestionCount] = useState(20);

  const markPassed = useCallback(() => {
    if (!passed) {
      const unlocked = loadUnlocked();
      if (levelNum < 5) unlocked[levelNum + 1] = true;
      saveUnlocked(unlocked);
      const passedState = loadPassed();
      passedState[levelNum] = true;
      savePassed(passedState);
      setPassed(true);
    }
    setPhase('win');
    setVideoEnded(false);
  }, [passed, levelNum, setPassed]);

  const showLose = useCallback(() => {
    setPhase('lose');
    setVideoEnded(false);
  }, []);

  const evaluateResult = useCallback(
    (pct: number) => {
      setLastScorePct(pct);
      if (pct >= PASS_THRESHOLD_PCT) markPassed();
      else showLose();
    },
    [markPassed, showLose],
  );

  const handleRetry = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setResetKey((k) => k + 1);
    setPhase('theory');
  }, [playSoundFile]);

  // ── Start exam for levels 1-4 ──
  const startLevelExam = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setExamQuestions(generateExamQuestions(levelWords, levelNum));
    setExamIdx(0);
    setExamCorrect(0);
    setExamTotal(0);
    setPhase('exam');
  }, [playSoundFile, levelWords, levelNum]);

  // ── Exam: Level 5 ──
  const startExam = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setExamQuestions(generateExamQuestions(getAllMap2Words(), 5));
    setExamIdx(0);
    setExamCorrect(0);
    setExamTotal(0);
    setPhase('exam');
  }, [playSoundFile]);

  const handleExamAnswer = useCallback((correct: boolean) => {
    if (correct) playCorrect();
    else playWrong();
    setExamCorrect((c) => c + (correct ? 1 : 0));
    setExamTotal((t) => t + 1);
  }, [playCorrect, playWrong]);

  const advanceExam = useCallback(() => {
    const next = examIdx + 1;
    if (next >= examQuestions.length) {
      const pct = examTotal > 0 ? Math.round((examCorrect / examTotal) * 100) : 0;
      evaluateResult(pct);
    } else {
      setExamIdx(next);
    }
  }, [examIdx, examQuestions.length, examCorrect, examTotal, evaluateResult]);

  const startTraining = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setPhase('training');
  }, [playSoundFile]);

  const handleTrainingGameFinish = useCallback(
    (result: QuizResult | WordBuilderResult) => {
      const pct = 'pct' in result ? result.pct : Math.round((result.correct / result.total) * 100);
      setLastScorePct(pct);
      playSoundFile(bubbleClickSound);
      setPhase('training');
    },
    [playSoundFile],
  );

  const scorePct = lastScorePct;

  // ── RENDER: LOSE ──
  if (phase === 'lose') {
    return (
      <div className={styles.loseOverlay}>
        <div className={styles.loseVideoWrap}>
          <div className={styles.videoClickWrap} onClick={skipVideo} style={{ cursor: 'pointer' }}>
            <video
              ref={videoRef}
              className={styles.loseVideo}
              src={looseVideo}
              autoPlay
              onEnded={() => setVideoEnded(true)}
              playsInline
            />
          </div>
          {videoEnded && (
            <div className={styles.loseActions}>
              <p className={styles.loseMsg}>Попробуй ещё раз! У тебя получится! 💪</p>
              {scorePct !== null && (
                <p className={styles.loseMsg} style={{ fontSize: '0.95rem', marginTop: -8 }}>
                  Результат: {scorePct}% (нужно {PASS_THRESHOLD_PCT}%)
                </p>
              )}
              <div className={styles.loseBtnRow}>
                <button className={styles.retryBtn} onClick={isFinalExam ? startExam : handleRetry}>
                  🔄 Попробовать снова
                </button>
                <button className={styles.mapBtn} onClick={() => navigate('/stage-map3')}>
                  🗺️ На карту
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RENDER: WIN ──
  if (phase === 'win') {
    return (
      <div className={styles.loseOverlay}>
        <div className={styles.loseVideoWrap}>
          <div className={styles.videoClickWrap} onClick={skipVideo} style={{ cursor: 'pointer' }}>
            <video
              ref={videoRef}
              className={styles.loseVideo}
              src={winVideo}
              autoPlay
              onEnded={() => setVideoEnded(true)}
              playsInline
            />
          </div>
          {videoEnded && (
            <div className={styles.loseActions}>
              <p className={styles.loseMsg}>🎉 Уровень пройден! Отлично!</p>
              {scorePct !== null && (
                <p className={styles.loseMsg} style={{ fontSize: '0.95rem', marginTop: -8 }}>
                  Результат: {scorePct}%
                </p>
              )}
              <div className={styles.loseBtnRow}>
                <button className={styles.retryBtn} onClick={isFinalExam ? startExam : handleRetry}>
                  🔄 Пройти ещё раз
                </button>
                <button
                  className={styles.mapBtn}
                  onClick={() => {
                    if (levelNum < 5) {
                      sessionStorage.setItem('story3_pending_level', String(levelNum + 1));
                      sessionStorage.removeItem('story3_in_level');
                      navigate('/stage-map3');
                    } else {
                      navigate('/main-map');
                    }
                  }}
                >
                  {levelNum < 5 ? '➡️ Следующий уровень' : '🗺️ На главную карту'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RENDER: THEORY (Levels 1–4) ──
  if (!isFinalExam && phase === 'theory') {
    const gameType = getLevelGameType(levelNum);
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/stage-map3')}>
            ← На карту
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{levelData?.title ?? `Уровень ${levelNum}`}</h1>
            <p className={styles.subtitle}>{levelData?.subtitle ?? ''}</p>
          </div>
          {passed && <span className={styles.passedBadge}>✅ Пройден</span>}
        </div>
        <div className={styles.theorySection}>
          <div className={styles.phraseBox}>
            <p className={styles.phrase}>{levelData?.phrase ?? ''}</p>
          </div>
          <div className={styles.topicsBox}>
            <h3>📚 Слова этого уровня:</h3>
            <ul>
              {levelWords.map((w) => (
                <li key={w.id}>
                  <button
                    onClick={() => playAudio(w.hebrew)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 6 }}
                    title="Прослушать"
                  >🔊</button>
                  <strong>{getVocalizedForm(w.hebrew)}</strong> [{w.transliteration}] — {w.translation}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.theoryActions}>
            <button className={styles.startQuizBtn} onClick={startLevelExam}>
              {gameType === 'quiz' ? '🎯 Начать тест' : '🧩 Собрать слова'} ({levelWords.length} вопросов) →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: EXAM (Levels 1-5) ──
  // Shows one question at a time with immediate feedback + grammar explanation
  if (phase === 'exam') {
    const currentQ = examQuestions[examIdx];
    if (!currentQ) return null;
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setPhase('theory')}>
            ← Назад
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{isFinalExam ? '🏆 Финальный экзамен' : (levelData?.title ?? `Уровень ${levelNum}`)}</h1>
            <p className={styles.subtitle}>
              {currentQ.type === 'wordbuild' ? '🧩 Собери слово' : '🎯 Квиз'}
              {' · '}Вопрос {examIdx + 1} из {examQuestions.length}
            </p>
          </div>
          <div className={styles.quizProgress}>
            ✅ {examCorrect}/{examTotal}
          </div>
        </div>
        <ExamQuestion
          key={`exam-q-${levelNum}-${examIdx}`}
          question={currentQ}
          onAnswer={handleExamAnswer}
          onNext={advanceExam}
          allWords={allMap2Words}
        />
      </div>
    );
  }

  // ── RENDER: TRAINING (Level 5) ──
  if (isFinalExam && phase === 'training') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => { playSoundFile(bubbleClickSound); setPhase('theory'); }}>
            ← Назад
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>📚 Тренировка</h1>
            <p className={styles.subtitle}>Выбери игру и количество слов</p>
          </div>
        </div>
        <div className={styles.theorySection}>
          <div className={styles.topicsBox}>
            <h3>⚙️ Настройки тренировки</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#fff' }}>
                Тип игры:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['wordbuild', 'quiz'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrainingGameType(t)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: trainingGameType === t ? '2px solid #ffd700' : '2px solid rgba(255,255,255,0.15)',
                      background: trainingGameType === t ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: trainingGameType === t ? 700 : 400,
                      fontSize: '0.95rem',
                    }}
                  >
                    {t === 'wordbuild' ? '🧩 Собери слово' : '🎯 Квиз'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#fff' }}>
                Количество слов: <strong>{trainingQuestionCount}</strong>
              </label>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={trainingQuestionCount}
                onChange={(e) => setTrainingQuestionCount(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.8rem' }}>
                <span>5</span><span>40</span><span>80</span>
              </div>
            </div>
          </div>
          <button className={styles.startQuizBtn} onClick={() => {
            playSoundFile(bubbleClickSound);
            setResetKey((k) => k + 1);
            setPhase('trainingGame');
          }}>
            🎮 Начать тренировку →
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: TRAINING GAME (Level 5 only) ──
  if (phase === 'trainingGame') {
    const words = shuffle(getAllMap2Words()).slice(0, trainingQuestionCount);
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => { playSoundFile(bubbleClickSound); setPhase('training'); }}>
            ← Назад к настройкам
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>📚 Тренировка</h1>
            <p className={styles.subtitle}>{trainingGameType === 'quiz' ? '🎯 Мини-квиз' : '🧩 Собери слово'}</p>
          </div>
        </div>
        {trainingGameType === 'quiz' ? (
          <WordsQuiz
            key={`quiz-${resetKey}`}
            categoryId="map3-training"
            difficulty="easy"
            words={words}
            optionPool={getAllMap2Words()}
            onFinish={() => { playSoundFile(bubbleClickSound); setPhase('training'); }}
          />
        ) : (
          <AlphabetWordBuilderGame
            key={`wb-${resetKey}`}
            learnedWords={words}
            onStep={() => {}}
            onComplete={handleTrainingGameFinish}
          />
        )}
      </div>
    );
  }

  // ── RENDER: Level 5 initial (theory) ──
  if (isFinalExam && phase === 'theory') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/stage-map3')}>
            ← На карту
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>🏆 Финальный экзамен</h1>
            <p className={styles.subtitle}>Выбери режим</p>
          </div>
        </div>
        <div className={styles.theorySection}>
          <div className={styles.phraseBox}>
            <p className={styles.phrase}>Финальное испытание! Ты можешь потренироваться или сразу сдать экзамен.</p>
          </div>
          <div className={styles.theoryActions}>
            <button className={styles.startQuizBtn} onClick={startExam}>
              🎯 Начать экзамен (40 вопросов) →
            </button>
            <button className={styles.examBtn} onClick={startTraining}>
              📚 Тренировка →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LevelDetail3;