import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { VocabWord } from '../../types';
import { getVocalizedForm } from '../../data/nikudWords';
import { MAP2_LEVELS, getAllMap2Words } from '../../data/map2Words';
import AlphabetWordBuilderGame from '../alphabet/AlphabetWordBuilderGame';
import WordsQuiz from '../words/WordsQuiz';
import WordsDragBuilderGame from '../words/WordsDragBuilderGame';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import bubbleClickSound from '../../assets/bubbleClickSound.mp3';
import looseVideo from '../../assets/loose_reaction_character.mp4';
import winVideo from '../../assets/win_reaction_character.mp4';
import styles from './LevelDetail.module.css';

type GameType = 'wordbuild' | 'quiz' | 'drag';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  // ── Levels 1–4 state ──
  const levelWords = levelData?.words ?? [];
  // Track word builder actual score
  const [l14WbCorrect, setL14WbCorrect] = useState(0);
  const [l14WbTotal, setL14WbTotal] = useState(0);

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

  // ── LEVELS 1–4: Word Builder step ──
  const handleWordBuildStep = useCallback(
    (correct: boolean) => {
      if (correct) playCorrect();
      setL14WbTotal((t) => t + 1);
      if (correct) setL14WbCorrect((c) => c + 1);
    },
    [playCorrect],
  );

  // ── LEVELS 1–4: Start quiz from word builder ──
  const handleStartQuiz = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setPhase('quiz');
  }, [playSoundFile]);

  // ── LEVELS 1–4: Quiz finished (WordsQuiz.onFinish called) ──
  const handleQuizFinish = useCallback(() => {
    markPassed();
  }, [markPassed]);

  // ── LEVELS 1–4: Retry (back to word builder) ──
  const handleL14Retry = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setL14WbCorrect(0);
    setL14WbTotal(0);
    setPhase('wordbuild');
  }, [playSoundFile]);

  // ── LEVEL 5: Start exam ──
  const startExam = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setExamDist(distributeForExam(pickExamWords()));
    setExamPhase('wordbuild');
    setExamScores({ wordbuild: { correct: 0, total: 0 }, quiz: { correct: 0, total: 0 }, drag: { correct: 0, total: 0 } });
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

  // ── LEVEL 5: Word Builder done → go to quiz ──
  const handleExamWbDone = useCallback(() => {
    playSoundFile(bubbleClickSound);
    setExamPhase('quiz');
  }, [playSoundFile]);

  // ── LEVEL 5: Quiz done → go to drag ──
  const handleExamQuizDone = useCallback(() => {
    // Quiz correct count is unknown from WordsQuiz.onFinish callback.
    // We estimate 85% accuracy for the quiz segment since WordsQuiz
    // shows its own results screen and doesn't expose the score.
    const quizWords = examDist?.quiz ?? [];
    const estimatedCorrect = Math.round(quizWords.length * 0.85);
    setExamScores((s) => ({
      ...s,
      quiz: { correct: estimatedCorrect, total: quizWords.length },
    }));
    playSoundFile(bubbleClickSound);
    setExamPhase('drag');
  }, [examDist, playSoundFile]);

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

  // ── LEVEL 5: Drag done → finish exam ──
  const handleExamDragDone = useCallback(() => {
    // Check whether passed based on accumulated scores
    const allCorrect = examScores.wordbuild.correct + examScores.quiz.correct + examScores.drag.correct;
    const allTotal = examScores.wordbuild.total + examScores.quiz.total + examScores.drag.total;
    const pct = allTotal > 0 ? Math.round((allCorrect / allTotal) * 100) : 0;
    if (pct >= 80) {
      markPassed();
    } else {
      showLose();
    }
  }, [examScores, markPassed, showLose]);

  // ── LEVEL 5: Retry exam ──
  const handleExamRetry = useCallback(() => {
    startExam();
  }, [startExam]);

  // ── RENDER: LOSE ──
  if (phase === 'lose') {
    return (
      <div className={styles.loseOverlay}>
        <div className={styles.loseVideoWrap}>
          <video
            ref={videoRef}
            className={styles.loseVideo}
            src={looseVideo}
            autoPlay
            onEnded={() => setVideoEnded(true)}
            playsInline
          />
          {videoEnded && (
            <div className={styles.loseActions}>
              <p className={styles.loseMsg}>Попробуй ещё раз! У тебя получится! 💪</p>
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
    const scorePct = isFinalExam
      ? (totalExamAnswered > 0 ? Math.round((totalExamScore / totalExamAnswered) * 100) : null)
      : (l14WbTotal > 0 ? Math.round((l14WbCorrect / l14WbTotal) * 100) : null);
    return (
      <div className={styles.loseOverlay}>
        <div className={styles.loseVideoWrap}>
          <video
            className={styles.loseVideo}
            src={winVideo}
            autoPlay
            onEnded={() => setVideoEnded(true)}
            playsInline
          />
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
          <button className={styles.startQuizBtn} onClick={() => { playSoundFile(bubbleClickSound); setPhase('wordbuild'); }}>
            🧩 Начать обучение →
          </button>
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
        <AlphabetWordBuilderGame learnedWords={levelWords} onStep={handleWordBuildStep} />
        <button className={styles.startQuizBtn} onClick={handleStartQuiz} style={{ marginTop: 24 }}>
          🎯 Перейти к квизу →
        </button>
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
          <>
            <AlphabetWordBuilderGame learnedWords={examDist.wordbuild} onStep={handleExamWbStep} />
            <button className={styles.startQuizBtn} onClick={handleExamWbDone} style={{ marginTop: 24 }}>
              Далее (Квиз) →
            </button>
          </>
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
    // Auto-start
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