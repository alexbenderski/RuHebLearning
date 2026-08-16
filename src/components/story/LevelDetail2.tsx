import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { VocabWord } from '../../types';
import { getVocalizedForm } from '../../data/nikudWords';
import { MAP2_LEVELS, getAllMap2Words } from '../../data/map2Words';
import AlphabetWordBuilderGame, { type WordBuilderResult } from '../alphabet/AlphabetWordBuilderGame';
import WordsQuiz, { type QuizResult } from '../words/WordsQuiz';
import WordsDragBuilderGame from '../words/WordsDragBuilderGame';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import bubbleClickSound from '../../assets/bubbleClickSound.mp3';
import looseVideo from '../../assets/loose_reaction_character.mp4';
import winVideo from '../../assets/win_reaction_character.mp4';
import styles from './LevelDetail.module.css';

type GameType = 'wordbuild' | 'quiz' | 'drag';

const PASS_THRESHOLD_PCT = 80;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
function loadPassed(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem('story2_passed');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}
function savePassed(state: Record<number, boolean>) {
  localStorage.setItem('story2_passed', JSON.stringify(state));
}

function pickExamWords(): VocabWord[] {
  return shuffle(getAllMap2Words()).slice(0, 40);
}

function distributeForExam(words: VocabWord[]): Record<GameType, VocabWord[]> {
  const s = shuffle(words);
  return { wordbuild: s.slice(0, 14), quiz: s.slice(14, 27), drag: s.slice(27, 40) };
}

const LevelDetail2: React.FC = () => {
  const navigate = useNavigate();
  const { levelId } = useParams<{ levelId: string }>();
  const levelNum = Number(levelId) || 1;
  const isFinalExam = levelNum === 5;

  const levelData = MAP2_LEVELS.find((l) => l.level === levelNum);

  const { playAudio } = useCloudTTS();
  const { playSoundFile, playCorrect, playWrong } = useSoundEffects();

  const [phase, setPhase] = useState<'theory' | 'wordbuild' | 'quiz' | 'drag' | 'lose' | 'win'>(
    isFinalExam ? 'wordbuild' : 'theory',
  );
  const [passed, setPassed] = useState<boolean>(loadPassed()[levelNum] ?? false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  const skipVideo = () => {
    const el = videoRef.current;
    if (!el) return;
    // Jump to the end, which triggers onEnded naturally
    el.currentTime = el.duration;
  };

  // Last achieved score (percentage) for the win/lose screens.
  const [lastScorePct, setLastScorePct] = useState<number | null>(null);

  // ── Levels 1–4 state ──
  const levelWords = levelData?.words ?? [];
  const [resetWordBuilderKey, setResetWordBuilderKey] = useState(0);

  // ── Level 5 exam distribution ──
  const [examDist, setExamDist] = useState<Record<GameType, VocabWord[]> | null>(null);
  const [examPhase, setExamPhase] = useState<GameType>('wordbuild');
  // Per-game scores for Level 5
  const [examScores, setExamScores] = useState<Record<GameType, { correct: number; total: number }>>({
    wordbuild: { correct: 0, total: 0 },
    quiz: { correct: 0, total: 0 },
    drag: { correct: 0, total: 0 },
  });

  const totalExamScore = examScores.wordbuild.correct + examScores.quiz.correct + examScores.drag.correct;
  const totalExamAnswered = examScores.wordbuild.total + examScores.quiz.total + examScores.drag.total;

  // ── Helpers ──
  // Mark a level as "won" and unlock the next one ONLY when called with a
  // verified score >= 80%. This is the single gate for progression.
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

  // Evaluate a final percentage against the 80% rule.
  const evaluateResult = useCallback(
    (pct: number) => {
      setLastScorePct(pct);
      if (pct >= PASS_THRESHOLD_PCT) markPassed();
      else showLose();
    },
    [markPassed, showLose],
  );

  // ── LEVELS 1–4: Word Builder step ──
  const handleWordBuildStep = useCallback(
    (correct: boolean) => {
      if (correct) playCorrect();
    },
    [playCorrect],
  );

  // ── LEVELS 1–4: Start quiz from word builder ──
  const handleStartQuiz = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setPhase('quiz');
  }, [playSoundFile]);

  // ── LEVELS 1–4: Quiz finished — progression gate ──
  const handleQuizFinish = useCallback(
    (result: QuizResult) => {
      evaluateResult(result.pct);
    },
    [evaluateResult],
  );

  // ── LEVELS 1–4: Retry (back to word builder) ──
  const handleL14Retry = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setResetWordBuilderKey((k) => k + 1);
    setPhase('wordbuild');
  }, [playSoundFile]);

  // ── LEVEL 5: Start exam ──
  const startExam = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setExamDist(distributeForExam(pickExamWords()));
    setExamPhase('wordbuild');
    setExamScores({ wordbuild: { correct: 0, total: 0 }, quiz: { correct: 0, total: 0 }, drag: { correct: 0, total: 0 } });
    setResetWordBuilderKey((k) => k + 1);
    setPhase('wordbuild');
  }, [playSoundFile]);

  // ── LEVEL 5: Word Builder step ──
  const handleExamWbStep = useCallback(
    (correct: boolean) => {
      if (correct) playCorrect();
      setExamScores((s) => ({
        ...s,
        wordbuild: { correct: s.wordbuild.correct + (correct ? 1 : 0), total: s.wordbuild.total + 1 },
      }));
    },
    [playCorrect],
  );

  // ── LEVEL 5: Word Builder done → store score ──
  const handleExamWbDone = useCallback((result: WordBuilderResult) => {
    setExamScores((s) => ({
      ...s,
      wordbuild: { correct: result.correct, total: result.total },
    }));
  }, []);

  // ── LEVEL 5: Word Builder "Продолжить" → go to quiz ──
  const handleExamWbContinue = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setExamPhase('quiz');
  }, [playSoundFile]);

  // ── LEVEL 5: Quiz done → store real score, go to drag ──
  const handleExamQuizDone = useCallback(
    (result: QuizResult) => {
      setExamScores((s) => ({
        ...s,
        quiz: { correct: result.correct, total: result.total },
      }));
      playSoundFile(bubbleClickSound);
      setExamPhase('drag');
    },
    [playSoundFile],
  );

  // ── LEVEL 5: Drag answer ──
  const handleExamDragAnswer = useCallback(
    (correct: boolean) => {
      if (correct) playCorrect();
      else playWrong();
      setExamScores((s) => ({
        ...s,
        drag: { correct: s.drag.correct + (correct ? 1 : 0), total: s.drag.total + 1 },
      }));
    },
    [playCorrect, playWrong],
  );

  // ── LEVEL 5: Drag done → finish exam (>=80% gates the win) ──
  const handleExamDragDone = useCallback(() => {
    const allCorrect = examScores.wordbuild.correct + examScores.quiz.correct + examScores.drag.correct;
    const allTotal = examScores.wordbuild.total + examScores.quiz.total + examScores.drag.total;
    const pct = allTotal > 0 ? Math.round((allCorrect / allTotal) * 100) : 0;
    evaluateResult(pct);
  }, [examScores, evaluateResult]);

  // ── LEVEL 5: Retry exam ──
  const handleExamRetry = useCallback(() => {
    startExam();
  }, [startExam]);

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
                <button className={styles.retryBtn} onClick={isFinalExam ? handleExamRetry : handleL14Retry}>
                  🔄 Попробовать снова
                </button>
                <button className={styles.mapBtn} onClick={() => navigate('/stage-map2')}>
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
                <button className={styles.retryBtn} onClick={isFinalExam ? handleExamRetry : handleL14Retry}>
                  🔄 Пройти ещё раз
                </button>
                <button
                  className={styles.mapBtn}
                  onClick={() => {
                    if (levelNum < 5) {
                      sessionStorage.setItem('story2_pending_level', String(levelNum + 1));
                      sessionStorage.removeItem('story2_in_level');
                      navigate('/stage-map2');
                    } else {
                      navigate('/stage-map2');
                    }
                  }}
                >
                  {levelNum < 5 ? '➡️ Следующий уровень' : '🗺️ На карту'}
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
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/stage-map2')}>
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
            <button className={styles.startQuizBtn} onClick={() => { playSoundFile(bubbleClickSound); setPhase('wordbuild'); }}>
              🧩 Начать обучение →
            </button>
            <button className={styles.examBtn} onClick={() => { playSoundFile(bubbleClickSound); setPhase('quiz'); }}>
              🎯 Сразу к экзамену →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: WORD BUILDER (Levels 1–4) ──
  if (!isFinalExam && phase === 'wordbuild') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/stage-map2')}>
            ← На карту
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{levelData?.title ?? `Уровень ${levelNum}`}</h1>
            <p className={styles.subtitle}>🧩 Собери слово</p>
          </div>
        </div>
        <AlphabetWordBuilderGame
          key={resetWordBuilderKey}
          learnedWords={levelWords}
          onStep={handleWordBuildStep}
          onContinue={handleStartQuiz}
        />
      </div>
    );
  }

  // ── RENDER: QUIZ (Levels 1–4) ──
  if (!isFinalExam && phase === 'quiz') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/stage-map2')}>
            ← На карту
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{levelData?.title ?? `Уровень ${levelNum}`}</h1>
            <p className={styles.subtitle}>🎯 Мини-квиз</p>
          </div>
        </div>
        <WordsQuiz
          categoryId={`map2-level-${levelNum}`}
          difficulty="easy"
          words={levelWords}
          optionPool={levelWords}
          onFinish={handleQuizFinish}
        />
      </div>
    );
  }

  // ── RENDER: LEVEL 5 EXAM ──
  if (isFinalExam && examDist) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/stage-map2')}>
            ← На карту
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>🏆 Финальный экзамен</h1>
            <p className={styles.subtitle}>
              {examPhase === 'wordbuild' ? '🧩 Собери слово' : examPhase === 'quiz' ? '🎯 Мини-квиз' : '🖱️ Перетащи слова'}
              {' · '}
              {examDist[examPhase]?.length ?? 0} слов
            </p>
          </div>
          <div className={styles.quizProgress}>
            ✅ {totalExamScore}/{totalExamAnswered}
          </div>
        </div>

        {examPhase === 'wordbuild' && (
          <AlphabetWordBuilderGame
            key={`exam-wb-${resetWordBuilderKey}`}
            learnedWords={examDist.wordbuild}
            onStep={handleExamWbStep}
            onComplete={handleExamWbDone}
            onContinue={handleExamWbContinue}
          />
        )}

        {examPhase === 'quiz' && (
          <WordsQuiz
            categoryId="map2-exam"
            difficulty="easy"
            words={examDist.quiz}
            optionPool={getAllMap2Words()}
            onFinish={handleExamQuizDone}
          />
        )}

        {examPhase === 'drag' && (
          <>
            <WordsDragBuilderGame sourceWords={examDist.drag} onAnswer={handleExamDragAnswer} />
            <button className={styles.startQuizBtn} onClick={handleExamDragDone} style={{ marginTop: 24 }}>
              📊 Завершить экзамен
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Level 5 initial: no dist yet → start exam ──
  if (isFinalExam && !examDist) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/stage-map2')}>
            ← На карту
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>🏆 Финальный экзамен</h1>
            <p className={styles.subtitle}>40 случайных слов из пройденных уровней</p>
          </div>
        </div>
        <div className={styles.theorySection}>
          <div className={styles.phraseBox}>
            <p className={styles.phrase}>Финальное испытание! Ты пройдёшь 3 мини-игры с 40 случайными словами из Кейсарии.</p>
          </div>
          <button className={styles.startQuizBtn} onClick={startExam}>
            🎯 Начать экзамен →
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default LevelDetail2;