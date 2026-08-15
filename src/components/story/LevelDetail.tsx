import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ALPHABET_LEVELS } from '../../data/alphabetLevels';
import { ALL_LETTERS } from '../../data/alphabet';
import { getVariantsForLetters } from '../../data/letterNikud';
import type { LetterNikudVariant } from '../../data/letterNikud';
import AlphabetWordBuilderGame from '../alphabet/AlphabetWordBuilderGame';
import AlphabetTeach from '../alphabet/AlphabetTeach';
import { VOCAB_CATEGORIES } from '../../data/vocabulary';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import bubbleClickSound from '../../assets/bubbleClickSound.mp3';
import looseVideo from '../../assets/loose_reaction_character.mp4';
import styles from './LevelDetail.module.css';

const LEVEL_META: Record<number, { phrase: string; topics: string[]; tips: string[] }> = {
  1: {
    phrase: 'С этого начинается иврит! Буквы א–ו и их первые звуки.',
    topics: [
      'Буквы א (Алеф), ב (Бет), ג (Гимел), ד (Далет), ה (Хе), ו (Вав)',
      'Базовые гласные: Камац (а), Патах (а), Сегол (э)',
      'Понятие огласовок (никуд) — как они меняют звучание буквы',
    ],
    tips: [
      '💡 Камац ( ָ ) и Патах ( ַ ) звучат одинаково — оба дают звук «а». Разница только в написании. Камац похож на маленькую букву Т, Патах — просто чёрточка.',
      '💡 Сегол ( ֶ ) даёт звук «э». Это три точки треугольником под буквой.',
      '💡 Буква א (Алеф) — «немая» буква. Она не произносится, но может нести любой гласный звук сверху или снизу.',
    ],
  },
  2: {
    phrase: 'Продолжаем знакомство! Буквы ז–ל — новые формы и звуки.',
    topics: [
      'Буквы ז (Заин), ח (Хет), ט (Тет), י (Йод), כ (Каф), ל (Ламед)',
      'Новые никуды: Цере (э), Хирик (и), Холам (о)',
      'Буква כ и её конечная форма ך (Каф-Софит)',
    ],
    tips: [
      '💡 Камац ( ָ ) и Патах ( ַ ) звучат одинаково — оба дают звук «а». Камац похож на букву Т, Патах — просто чёрточка под буквой.',
      '💡 Хирик ( ִ ) — одна точка под буквой, даёт звук «и». Запомни: одна точка = «и» (как буква И — одна палочка).',
      '💡 Холам ( ֹ ) — точка над буквой, даёт звук «о». ВАЖНО: Холам может быть полным (с буквой ו) или неполным (просто точка).',
      '💡 Цере ( ֵ ) — две точки под буквой, даёт звук «э». Не путай с Сегол (три точки) — оба звучат как «э», но Цере чаще в ударных слогах.',
      '💡 Буква כ (Каф) в конце слова превращается в ך (Каф-Софит). Это как русская прописная и строчная буква — форма меняется, звук тот же.',
      '💡 Буква ח (Хет) — гортанный звук, похожий на украинское «г» или немецкое «ch». В русском точного аналога нет.',
    ],
  },
  3: {
    phrase: 'Половина алфавита позади! Буквы מ–צ.',
    topics: [
      'Буквы מ (Мем), נ (Нун), ס (Самех), ע (Аин), פ (Пе), צ (Цади)',
      'Новые никуды: Кубуц (у), Шва (пауза/краткий э)',
      'Конечные формы: ם, ן, ף, ץ',
    ],
    tips: [
      '💡 Шва ( ְ ) — двоеточие под буквой. Может быть «паузой» (шва нах — без звука) или кратким «э» (шва на).',
      '💡 Кубуц (  ֻ ) — три точки под буквой, даёт звук «у». Альтернатива Шуруку.',
      '💡 У букв מ, נ, פ, צ есть конечные формы: ם, ן, ף, ץ. Они используются ТОЛЬКО в конце слова.',
    ],
  },
  4: {
    phrase: 'Финишная прямая алфавита! Буквы ק–ת + все конечные.',
    topics: [
      'Буквы ק (Куф), ר (Реш), ש (Шин/Син), ת (Тав)',
      'Точки шин (прав.) и син (лев.) — различие между Ш и С',
      'Все 5 конечных букв: ך, ם, ן, ף, ץ',
    ],
    tips: [
      '💡 Одна буква ש может читаться как «ш» (шин) и как «с» (син). Точка справа = Ш, точка слева = С.',
      '💡 Буква ר (Реш) похожа на французскую «r» — картавый звук. Не старайся произнести как русскую «р».',
      '💡 5 конечных букв: ך (Каф-Софит), ם (Мем-Софит), ן (Нун-Софит), ף (Пе-Софит), ץ (Цади-Софит).',
    ],
  },
  5: {
    phrase: 'Финальный экзамен! Все 22 буквы + 5 конечных форм.',
    topics: [
      'Повторение всех букв алфавита',
      'Все гласные никуды и их комбинации',
      'Сборка слов с огласовками (Собери слово)',
    ],
    tips: [
      '💡 На этом уровне проверяется всё, что ты выучил на предыдущих этапах.',
      '💡 Вспомни: одинаковые звуки могут быть у разных никудов (Камац/Патах → «а», Сегол/Цере → «э»).',
    ],
  },
};

function loadUnlocked(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem('story_unlocked');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { 1: true, 2: true, 3: true, 4: false, 5: false };
}
function saveUnlocked(state: Record<number, boolean>) {
  localStorage.setItem('story_unlocked', JSON.stringify(state));
}
function loadPassed(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem('story_passed');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}
function savePassed(state: Record<number, boolean>) {
  localStorage.setItem('story_passed', JSON.stringify(state));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function firstConsonant(translit: string): string {
  return translit.split(' / ')[0].trim().replace(/[()]/g, '');
}

function buildSoundName(v: LetterNikudVariant): string {
  let first = firstConsonant(v.transliteration);
  if (v.markName.startsWith('Син')) first = 'С';
  if (v.markName === 'Шва') return `${first} (пауза)`;
  if (v.markName === 'Дагеш') return `${first} (твёрдо)`;
  if (v.markName === 'Шурук') return `${first}у`;
  const arrow = v.sound.indexOf('→');
  const vowel = arrow >= 0 ? v.sound.slice(arrow + 1).trim() : '';
  if (!vowel) return v.markName;
  return `${first}${vowel}`;
}

interface QuizQuestion {
  variant: LetterNikudVariant;
  label: string;
  correctSound: string;
  correctMark: string;
}

interface QuizOption {
  key: string;
  sound: string;
  mark: string;
}

function generateQuiz(variants: LetterNikudVariant[], count: number): QuizQuestion[] {
  const shuffled = shuffle([...variants]);
  const questions: QuizQuestion[] = [];
  for (const v of shuffled) {
    if (questions.length >= count) break;
    questions.push({
      variant: v,
      label: v.nikudChar,
      correctSound: buildSoundName(v),
      correctMark: v.markName,
    });
  }
  return shuffle(questions).slice(0, count);
}

function buildOptionsFor(correct: QuizQuestion, allVariants: LetterNikudVariant[]): QuizOption[] {
  const candidates: QuizOption[] = allVariants
    .filter((v) => v.id !== correct.variant.id)
    .map((v) => ({ key: v.id, sound: buildSoundName(v), mark: v.markName }));

  // Deduplicate by sound — when two nikud marks sound the same (e.g. Камац "ла" and Патах "ла"),
  // keep only one option so the user isn't presented with duplicate answers.
  const uniqueCandidates: QuizOption[] = [];
  const seenSounds = new Set<string>([correct.correctSound]);
  for (const opt of shuffle(candidates)) {
    if (seenSounds.has(opt.sound)) continue;
    seenSounds.add(opt.sound);
    uniqueCandidates.push(opt);
  }

  const others = uniqueCandidates.slice(0, 3);
  const options: QuizOption[] = [
    ...others,
    { key: correct.variant.id, sound: correct.correctSound, mark: correct.correctMark },
  ];
  return shuffle(options);
}

const LevelDetail: React.FC = () => {
  const navigate = useNavigate();
  const { levelId } = useParams<{ levelId: string }>();
  const levelNum = Number(levelId) || 1;
  const meta = LEVEL_META[levelNum] ?? LEVEL_META[1];

  const levelData = ALPHABET_LEVELS.find((l) => l.level === levelNum);
  const levelLetters = levelData?.letters ?? ALL_LETTERS;

  const nikudVariants = useMemo(
    () => getVariantsForLetters(levelLetters.map((l) => l.letter)),
    [levelLetters],
  );

  const { playAudio } = useCloudTTS();
  const { playSoundFile, playCorrect, playWrong } = useSoundEffects();

  const [phase, setPhase] = useState<'theory' | 'quiz' | 'wordbuild' | 'results' | 'lose' | 'passed'>('theory');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [passed, setPassed] = useState<boolean>(loadPassed()[levelNum] ?? false);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => generateQuiz(nikudVariants, 20));
  const [questionIdx, setQuestionIdx] = useState(0);
  const [options, setOptions] = useState<QuizOption[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  React.useEffect(() => {
    if (phase === 'quiz' && quizQuestions.length > 0 && options.length === 0) {
      setOptions(buildOptionsFor(quizQuestions[0], nikudVariants));
    }
  }, [phase, quizQuestions, nikudVariants, options.length]);

  const allVocabWords = useMemo(() => VOCAB_CATEGORIES.flatMap((c) => c.words), []);

  const handleAnswer = (opt: QuizOption) => {
    if (picked !== null) return;
    const current = quizQuestions[questionIdx];
    if (!current) return;
    playSoundFile(bubbleClickSound);
    setPicked(opt.key);

    const isCorrect = opt.key === current.variant.id;
    if (isCorrect) {
      playCorrect();
      playAudio(current.label);
    } else {
      playWrong();
    }

    setTotalAnswered((t) => t + 1);
    if (isCorrect) setCorrectCount((c) => c + 1);

    setTimeout(() => {
      setPicked(null);
      const nextIdx = questionIdx + 1;
      if (nextIdx >= quizQuestions.length) {
        const pct = Math.round(((correctCount + (isCorrect ? 1 : 0)) / quizQuestions.length) * 100);
        finishWithResult(pct);
      } else {
        setQuestionIdx(nextIdx);
        setOptions(buildOptionsFor(quizQuestions[nextIdx], nikudVariants));
      }
    }, isCorrect ? 900 : 1400);
  };

  const finishWithResult = (pct: number) => {
    if (pct >= 80) {
      if (!passed) {
        const unlocked = loadUnlocked();
        if (levelNum < 5) unlocked[levelNum + 1] = true;
        saveUnlocked(unlocked);
        const passedState = loadPassed();
        passedState[levelNum] = true;
        savePassed(passedState);
        setPassed(true);
      }
      if (levelNum === 5) {
        setPhase('wordbuild');
      } else {
        setPhase('passed');
      }
    } else {
      // Show lose video
      setPhase('lose');
      setVideoEnded(false);
    }
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const startQuiz = () => {
    playSoundFile(bubbleClickSound);
    setCorrectCount(0);
    setTotalAnswered(0);
    setQuestionIdx(0);
    setPicked(null);
    const fresh = generateQuiz(nikudVariants, 5);
    setQuizQuestions(fresh);
    setOptions(buildOptionsFor(fresh[0], nikudVariants));
    setPhase('quiz');
  };

  const quizScore = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : null;
  const current = quizQuestions[questionIdx];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/stage-map')}>
          ← На карту
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{levelData?.title ?? `Уровень ${levelNum}`}</h1>
          <p className={styles.subtitle}>{levelData?.subtitle ?? ''}</p>
        </div>
        {passed && <span className={styles.passedBadge}>✅ Пройден</span>}
      </div>

      {/* ── THEORY ── */}
      {phase === 'theory' && (
        <div className={styles.theorySection}>
          <div className={styles.phraseBox}>
            <p className={styles.phrase}>{meta.phrase}</p>
          </div>
          <div className={styles.topicsBox}>
            <h3>📚 Что ты узнаешь:</h3>
            <ul>
              {meta.topics.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          <div className={styles.tipsBox}>
            <h3>💡 Полезные советы:</h3>
            <ul>
              {meta.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          <div className={styles.teachWrap}>
            <AlphabetTeach letters={levelLetters} />
          </div>
          <button className={styles.startQuizBtn} onClick={startQuiz}>
            🎯 Начать тест (20 вопросов) →
          </button>
        </div>
      )}

      {/* ── QUIZ ── */}
      {phase === 'quiz' && current && (
        <div className={styles.quizSection}>
          <div className={styles.quizHeader}>
            <h3 className={styles.quizTitle}>
              🎯 Тест уровня {levelNum}
              <span className={styles.quizSub}>(нужно 80% для прохода)</span>
            </h3>
            <div className={styles.quizProgress}>
              ✅ {correctCount}/{totalAnswered}
            </div>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(totalAnswered / quizQuestions.length) * 100}%` }} />
          </div>

          <div className={styles.questionBox}>
            <p className={styles.prompt}>Прочитай эту букву с никудом</p>
            <button className={styles.bigLetter} onClick={() => playAudio(current.label)} title="Прослушать">
              {current.label}
            </button>
            <p className={styles.tapHint}>нажми на букву, чтобы услышать</p>
            <span className={styles.variantNote}>
              {current.variant.letterName} · {current.correctMark}
            </span>
          </div>

          <div className={styles.options}>
            {options.map((opt) => {
              let cls = styles.option;
              if (picked !== null) {
                if (opt.key === current.variant.id) cls = `${styles.option} ${styles.optionCorrect}`;
                else if (opt.key === picked) cls = `${styles.option} ${styles.optionWrong}`;
              }
              return (
                <button key={opt.key} className={cls} disabled={picked !== null} onClick={() => handleAnswer(opt)}>
                  <span className={styles.optionName}>{opt.sound}</span>
                  <span className={styles.optionTranslit}>{opt.mark}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WORD BUILD (Level 5 only) ── */}
      {phase === 'wordbuild' && levelNum === 5 && (
        <div className={styles.wordbuildSection}>
          <h3 className={styles.quizTitle}>
            🧩 Собери слово
            <span className={styles.quizSub}>(финальное испытание)</span>
          </h3>
          <AlphabetWordBuilderGame learnedWords={allVocabWords} onStep={() => {}} />
          <button className={styles.startQuizBtn} onClick={() => setPhase('passed')} style={{ marginTop: 24 }}>
            📊 К результатам
          </button>
        </div>
      )}

      {/* ── LOSE VIDEO ── */}
      {phase === 'lose' && (
        <div className={styles.loseOverlay}>
          <div className={styles.loseVideoWrap}>
            <video
              ref={videoRef}
              className={styles.loseVideo}
              src={looseVideo}
              autoPlay
              onEnded={handleVideoEnd}
              playsInline
            />
            {videoEnded && (
              <div className={styles.loseActions}>
                <p className={styles.loseMsg}>Попробуй ещё раз! У тебя получится! 💪</p>
                <div className={styles.loseBtnRow}>
                  <button className={styles.retryBtn} onClick={startQuiz}>
                    🔄 Попробовать снова
                  </button>
                  <button className={styles.mapBtn} onClick={() => navigate('/stage-map')}>
                    🗺️ На карту
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PASSED RESULTS ── */}
      {phase === 'passed' && quizScore !== null && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsCard}>
            <div className={styles.resultsIcon}>🏆</div>
            <h2 className={styles.resultsScore}>{quizScore}%</h2>
            <p className={styles.resultsMsg}>Поздравляем! Уровень пройден! 🎉</p>
            {levelNum < 5 && <p className={styles.unlockMsg}>🔓 Следующий уровень открыт!</p>}
            <div className={styles.resultsActions}>
              <button className={styles.retryBtn} onClick={startQuiz}>
                🔄 Пройти ещё раз
              </button>
              <button className={styles.mapBtn} onClick={() => navigate('/stage-map')}>
                🗺️ На карту
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelDetail;