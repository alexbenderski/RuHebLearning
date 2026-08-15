import React, { useState, useCallback, useMemo } from 'react';
import type { HebrewLetter } from '../../types';
import type { LetterNikudVariant } from '../../data/letterNikud';
import { getVariantsForLetters } from '../../data/letterNikud';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import { useGameTimer } from '../../hooks/useGameTimer';
import styles from './AlphabetQuiz.module.css';

interface AlphabetQuizProps {
  letters: HebrewLetter[];
  userId?: string;
  onAnswer?: (letterChar: string, correct: boolean) => void;
  variants?: LetterNikudVariant[];
}

type QuizPhase = 'select' | 'quiz' | 'results';

interface Question {
  id: string;
  letter: HebrewLetter;
  variant: LetterNikudVariant;
  label: string;          // e.g. "בֶ"
  correctSound: string;   // e.g. "Бэ"
  correctMark: string;    // e.g. "Сегол"
}

interface Option {
  key: string;   // variant id
  sound: string; // e.g. "Бэ"
  mark: string;  // e.g. "Сегол"
}

interface MistakeEntry {
  question: Question;
  chosenSound: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "Б / В" → "Б" (first consonant cluster) */
function firstConsonant(translit: string): string {
  return translit.split(' / ')[0].trim().replace(/[()]/g, '');
}

/**
 * Build the nikud sound name shown in answers, e.g.:
 *   Бет + Сегол → "Бэ"
 *   Бет + Камац → "Ба"
 *   Бет + Шва   → "Б (пауза)"
 *   Бет + Дагеш → "Б (твёрдо)"
 */
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

const COUNT_PRESETS = [5, 8, 10, 15, 20];

const AlphabetQuiz: React.FC<AlphabetQuizProps> = ({ letters, userId, onAnswer, variants }) => {
  const [phase, setPhase] = useState<QuizPhase>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState(5);

  const [queue, setQueue] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  const { playAudio } = useCloudTTS();
  const { playCorrect, playWrong } = useSoundEffects();
  const { trackStep } = useProgressTracker(userId);
  const { seconds, formattedTime, resetTimer } = useGameTimer(phase === 'quiz');

  const allVariants = useMemo(
    () => (variants && variants.length > 0 ? variants : getVariantsForLetters(letters.map((l) => l.letter))),
    [variants, letters],
  );

  const variantsFor = useCallback(
    (char: string) => allVariants.filter((v) => v.baseLetter === char),
    [allVariants],
  );

  // Letters with at least 2 nikud variants are selectable
  const selectableLetters = useMemo(
    () => letters.filter((l) => variantsFor(l.letter).length >= 2),
    [letters, variantsFor],
  );

  // Maximum total variants available across selected letters
  const maxAvailable = useMemo(() => {
    let total = 0;
    selected.forEach((char) => {
      total += variantsFor(char).length;
    });
    return total;
  }, [selected, variantsFor]);

  const countChoices = useMemo(() => {
    const list: number[] = [];
    for (const n of COUNT_PRESETS) if (n <= maxAvailable) list.push(n);
    if (!list.includes(maxAvailable)) list.push(maxAvailable);
    return list.sort((a, b) => a - b);
  }, [maxAvailable]);

  const toggleLetter = (char: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(char)) next.delete(char);
      else next.add(char);
      return next;
    });
  };

  const startQuiz = useCallback(() => {
    const chosenLetters = letters.filter((l) => selected.has(l.letter) && variantsFor(l.letter).length >= 2);
    if (chosenLetters.length === 0) return;

    const perLetter = Math.floor(questionCount / chosenLetters.length);
    let remainder = questionCount % chosenLetters.length;
    const questions: Question[] = [];

    chosenLetters.forEach((letter, i) => {
      const letterVariants = variantsFor(letter.letter);
      // Distribute questions evenly: base per letter + 1 extra for the first `remainder` letters
      const take = Math.min(letterVariants.length, perLetter + (i < remainder ? 1 : 0));
      const chosen = shuffle(letterVariants).slice(0, take);
      chosen.forEach((v) => {
        questions.push({
          id: v.id,
          letter,
          variant: v,
          label: v.nikudChar,
          correctSound: buildSoundName(v),
          correctMark: v.markName,
        });
      });
    });

    if (questions.length === 0) return;

    setQueue(shuffle(questions));
    setOptions(buildOptionsFor(questions[0], variantsFor(questions[0].letter.letter)));
    setPicked(null);
    setAttempts(0);
    setCorrectCount(0);
    setMistakes([]);
    resetTimer();
    setPhase('quiz');
  }, [letters, selected, variantsFor, questionCount, resetTimer]);

  const handleAnswer = useCallback(
    (opt: Option) => {
      if (picked !== null) return;
      const current = queue[0];
      if (!current) return;
      setPicked(opt.key);
      const isCorrect = opt.key === current.id;

      setAttempts((n) => n + 1);
      if (isCorrect) setCorrectCount((n) => n + 1);
      if (isCorrect) {
        playCorrect();
        playAudio(current.label);
      } else {
        playWrong();
        setMistakes((prev) => [...prev, { question: current, chosenSound: `${opt.sound} (${opt.mark})` }]);
      }

      trackStep({
        moduleId: 'alphabet',
        stepId: `quiz:${current.letter.letter}:${current.variant.id}`,
        isCorrect,
        payload: { selected: opt.key, label: current.label },
      }).catch(console.error);
      onAnswer?.(current.letter.letter, isCorrect);

      setTimeout(() => {
        setPicked(null);
        const next = queue.slice(1);
        if (next.length === 0) {
          setTotalTime(seconds);
          setPhase('results');
        } else {
          setQueue(next);
          setOptions(buildOptionsFor(next[0], variantsFor(next[0].letter.letter)));
        }
      }, isCorrect ? 900 : 1400);
    },
    [picked, queue, seconds, playAudio, trackStep, onAnswer, variantsFor],
  );

  // ── SELECT phase ──
  if (phase === 'select') {
    return (
      <div className={styles.selectWrap}>
        <div className={styles.selectHeader}>
          <p className={styles.selectDesc}>
            Выбери одну или несколько букв — вопросы распределятся поровну между ними
          </p>
          <div className={styles.selectActions}>
            <button className={styles.selCtrlBtn} onClick={() => setSelected(new Set(selectableLetters.map((l) => l.letter)))}>
              Все
            </button>
            <button className={styles.selCtrlBtn} onClick={() => setSelected(new Set())}>
              Сбросить
            </button>
          </div>
        </div>

        <div className={styles.selectGrid}>
          {letters.map((l) => {
            const cnt = variantsFor(l.letter).length;
            const selectable = cnt >= 2;
            return (
              <button
                key={l.letter}
                className={`${styles.selCard}
                  ${!selectable ? styles.selCardDisabled : ''}
                  ${selected.has(l.letter) ? styles.selCardOn : ''}`}
                onClick={() => selectable && toggleLetter(l.letter)}
                disabled={!selectable}
              >
                <span className={styles.selHebrew}>{l.letter}</span>
                <span className={styles.selName}>{l.name}</span>
                <span className={styles.selTranslit}>
                  {selectable ? `${cnt} никудов` : 'нет никуда'}
                </span>
              </button>
            );
          })}
        </div>

        {selected.size >= 1 && (
          <div className={styles.setupPanel}>
            <h4 className={styles.setupTitle}>
              Выбрано букв: <span className={styles.setupCount}>{selected.size}</span> · доступно вопросов: {maxAvailable}
            </h4>
            <p className={styles.setupSub}>Сколько всего вопросов?</p>
            <div className={styles.countRow}>
              {countChoices.map((n) => (
                <button
                  key={n}
                  className={`${styles.countBtn} ${questionCount === n ? styles.countBtnActive : ''}`}
                  onClick={() => setQuestionCount(n)}
                >
                  {n === maxAvailable ? `Все (${n})` : `${n}`}
                </button>
              ))}
            </div>
            <button className={styles.startBtn} onClick={startQuiz}>
              🎯 Играть →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── RESULTS phase ──
  if (phase === 'results') {
    const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;
    return (
      <div className={styles.resultsWrap}>
        <h3 className={styles.resultsTitle}>🎉 Результаты квиза</h3>
        <div className={styles.resultsSummary}>
          <span className={styles.resStat}>✅ {correctCount}</span>
          <span className={styles.resStat}>❌ {attempts - correctCount}</span>
          <span className={styles.resStat}>🎯 {accuracy}%</span>
          <span className={styles.resStat}>⏱ {totalTime}s</span>
        </div>

        {mistakes.length > 0 ? (
          <div className={styles.mistakesPanel}>
            <h4 className={styles.mistakesTitle}>📖 Разбор ошибок</h4>
            <div className={styles.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={`${m.question.id}-${i}`} className={styles.mistakeRow}>
                  <button
                    className={styles.mistakeChar}
                    onClick={() => playAudio(m.question.label)}
                    title={`Прослушать ${m.question.label}`}
                  >
                    {m.question.label}
                  </button>
                  <div className={styles.mistakeInfo}>
                    <span className={styles.mistakeName}>
                      {m.question.correctSound} · {m.question.correctMark}
                    </span>
                    <span className={styles.mistakeChosen}>
                      Ты выбрал: {m.chosenSound}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.resultsPerfect}>🏆 Идеально! Все ответы верны.</p>
        )}

        <button className={styles.restartBtn} onClick={() => setPhase('select')}>← Выбрать снова</button>
      </div>
    );
  }

  // ── QUIZ phase ──
  const current = queue[0];
  if (!current) return null;
  const doneCount = attempts;
  const progressPct = (doneCount / (doneCount + queue.length)) * 100;

  return (
    <div className={styles.quiz}>
      {/* Progress */}
      <div className={styles.quizProgress}>
        <span className={styles.progressText}>{doneCount} / {doneCount + queue.length}</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <span className={styles.timerText}>⏱ {formattedTime}</span>
        <button className={styles.abortBtn} onClick={() => setPhase('select')}>← Назад</button>
      </div>

      {/* Question: nikud variant of one of the chosen letters */}
      <div className={styles.questionBox}>
        <p className={styles.prompt}>Прочитай эту букву с никудом</p>
        <button className={styles.bigLetter} onClick={() => playAudio(current.label)} title="Прослушать">
          {current.label}
        </button>
        <p className={styles.tapHint}>нажми на букву, чтобы услышать</p>
        <span className={styles.variantNote}>
          {current.letter.name} · {current.correctMark}
        </span>
      </div>

      {/* Options: nikud sound names of the SAME letter */}
      <div className={styles.options}>
        {options.map((opt) => {
          let cls = styles.option;
          if (picked !== null && opt.key === picked) {
            cls = `${styles.option} ${picked === current.id ? styles.correct : styles.wrong}`;
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
  );
};

function buildOptionsFor(correct: Question, letterVariants: LetterNikudVariant[]): Option[] {
  const candidates: Option[] = letterVariants
    .filter((v) => v.id !== correct.id)
    .map((v) => ({ key: v.id, sound: buildSoundName(v), mark: v.markName }));

  // Deduplicate by sound — when two nikud marks sound the same (e.g. Камац "ла" and Патах "ла"),
  // keep only one option so the user isn't presented with duplicate answers.
  const uniqueCandidates: Option[] = [];
  const seenSounds = new Set<string>([correct.correctSound]);
  for (const opt of shuffle(candidates)) {
    if (seenSounds.has(opt.sound)) continue;
    seenSounds.add(opt.sound);
    uniqueCandidates.push(opt);
  }

  const options: Option[] = [
    ...uniqueCandidates.slice(0, 3),
    { key: correct.id, sound: correct.correctSound, mark: correct.correctMark },
  ];
  return shuffle(options);
}

export default AlphabetQuiz;