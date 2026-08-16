import React, { useState, useCallback, useMemo } from 'react';
import type { VocabWord } from '../../types';
import { ALL_LETTERS } from '../../data/alphabet';
import { getVocalizedForm, getVocalizedCharGroups, NIKUD_MARKS } from '../../data/nikudWords';
import { LETTER_NIKUD_VARIANTS } from '../../data/letterNikud';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useGameTimer } from '../../hooks/useGameTimer';
import styles from './AlphabetWordBuilderGame.module.css';

interface AlphabetWordBuilderGameProps {
  learnedWords: VocabWord[];
  onStep?: (correct: boolean) => void;
  onComplete?: (result: WordBuilderResult) => void;
  onContinue?: () => void;
}

export type WordBuilderDifficulty = 1 | 2 | 3;

interface TileData {
  uid: string;          // unique instance id
  text: string;         // Hebrew letter + nikud (e.g. "יָ")
  transcription: string;
}

interface Mistake {
  position: number;
  expected: TileData;
  actual: TileData | null;
}

interface SessionRound {
  word: VocabWord;
  correct: boolean;
  mistakes: Mistake[];
}

export interface WordBuilderMistake {
  word: VocabWord;
  position: number;
  expectedText: string;
  actualText: string | null;
  expectedDesc: string;
  expectedNote: string;
  actualDesc: string | null;
}

export interface WordBuilderResult {
  correct: number;
  total: number;
  mistakes: WordBuilderMistake[];
}

const DIFFICULTIES: { level: WordBuilderDifficulty; title: string; desc: string }[] = [
  { level: 1, title: 'Уровень 1', desc: 'Полная транскрипция под каждой буквой' },
  { level: 2, title: 'Уровень 2', desc: 'Только гласные (частичная подсказка)' },
  { level: 3, title: 'Уровень 3', desc: 'Только буквы с никудом, без подсказок' },
];

const EXAMPLE_GROUPS = ['יָ', 'פֶ', 'ה'];

const PRAISE = ['✅ Отлично!', '✅ Молодец!', '✅ Точно в цель!', '✅ Супер!'];
const ENCOURAGE = [
  'Почти! Присмотрись к огласовкам (точкам) под буквами.',
  'Не сдавайся! Сравни свой выбор с правильной формой.',
  'Близко! Обрати внимание, какие знаки стоят у каждой буквы.',
];

// ── Transcription helpers ─────────────────────────────────────────
const NIKUD_ID_BY_CHAR: Record<string, string> = {
  '\u05B8': 'kamatz',
  '\u05B7': 'patach',
  '\u05B6': 'segol',
  '\u05B5': 'tsere',
  '\u05B4': 'chirik',
  '\u05B9': 'cholam',
  '\u05BB': 'kubutz',
  '\u05B0': 'shva',
  '\u05B2': 'chatafPatach',
  '\u05B1': 'chatafSegol',
  '\u05B3': 'chatafKamatz',
  '\u05C1': 'shinDot',
  '\u05C2': 'sinDot',
  '\u05BC': 'dagesh',
};

const VOWEL_SOUND: Record<string, string> = {
  kamatz: 'а', patach: 'а', segol: 'э', tsere: 'э', chirik: 'и',
  cholam: 'о', kubutz: 'у', shuruk: 'у', chatafPatach: 'а',
  chatafSegol: 'э', chatafKamatz: 'о',
};

const VOWEL_PRIORITY = [
  'kamatz', 'patach', 'chatafPatach', 'segol', 'tsere', 'chatafSegol',
  'chirik', 'cholam', 'chatafKamatz', 'shuruk', 'kubutz',
];

const CONSONANT: Record<string, string> = {
  א: '', ב: 'б', ג: 'г', ד: 'д', ה: 'х', ו: 'в', ז: 'з', ח: 'х',
  ט: 'т', י: 'й', כ: 'к', ל: 'л', מ: 'м', נ: 'н', ס: 'с', ע: '',
  פ: 'п', צ: 'ц', ק: 'к', ר: 'р', ש: 'ш', ת: 'т',
  ך: 'х', ם: 'м', ן: 'н', ף: 'ф', ץ: 'ц',
};

const YOTATED: Record<string, string> = { а: 'я', о: 'ё', у: 'ю', э: 'е', и: 'и' };

function transcribe(text: string): { full: string; vowel: string } {
  const chars = [...text];
  const base = chars.find((ch) => /[\u05D0-\u05EA]/.test(ch)) ?? '';
  const markChars = chars.filter((ch) => /[\u0591-\u05C7]/.test(ch));

  const ids: string[] = [];
  for (const m of markChars) {
    if (m === '\u05BC' && base === 'ו') ids.push('shuruk');
    else if (NIKUD_ID_BY_CHAR[m]) ids.push(NIKUD_ID_BY_CHAR[m]);
  }
  const idSet = new Set(ids);

  let vowel = '';
  for (const id of VOWEL_PRIORITY) {
    if (idSet.has(id)) {
      vowel = VOWEL_SOUND[id] ?? '';
      break;
    }
  }

  let consonant = CONSONANT[base] ?? '';
  const hasDagesh = idSet.has('dagesh');

  if (base === 'ב') consonant = hasDagesh ? 'б' : 'в';
  else if (base === 'כ') consonant = hasDagesh ? 'к' : 'х';
  else if (base === 'פ') consonant = hasDagesh ? 'п' : 'ф';
  else if (base === 'ש') consonant = idSet.has('sinDot') ? 'с' : 'ш';
  else if (base === 'ו') {
    if (idSet.has('cholam')) { consonant = ''; vowel = 'о'; }
    else if (idSet.has('shuruk')) { consonant = ''; vowel = 'у'; }
    else consonant = 'в';
  } else if (base === 'א' || base === 'ע') {
    consonant = '';
  } else if (base === 'ה' && markChars.length === 0) {
    // Word-final ה (мать чтения) is silent.
    consonant = '';
  }

  let full = '';
  if (consonant) {
    if (consonant === 'й' && vowel) full = YOTATED[vowel] ?? `й${vowel}`;
    else full = consonant + vowel;
  } else {
    full = vowel;
  }

  return { full, vowel };
}

function transcriptionFor(text: string, difficulty: WordBuilderDifficulty): string {
  const t = transcribe(text);
  if (difficulty === 1) return t.full;
  if (difficulty === 2) return t.vowel;
  return '';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitChars(word: string): string[] {
  return [...word.replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, '')];
}

function vocalizedChars(word: string): string[] {
  return getVocalizedCharGroups(getVocalizedForm(word));
}

function parseSoundName(v: typeof LETTER_NIKUD_VARIANTS[number]): string {
  const first = v.transliteration.split(' / ')[0];
  if (v.markName === 'Шва') return `${first} (пауза)`;
  if (v.markName === 'Дагеш') return `${first} (твёрдо)`;
  if (v.markName === 'Шурук') return `${first}у`;
  const arrow = v.sound.indexOf('→');
  if (arrow >= 0) {
    const right = v.sound.slice(arrow + 1).trim();
    if (right) return right.charAt(0).toUpperCase() + right.slice(1);
  }
  return first;
}

function describeTile(text: string): { desc: string; note: string } {
  const chars = [...text];
  const base = chars.find((ch) => /[\u05D0-\u05EA]/.test(ch)) ?? '';
  const markChars = chars.filter((ch) => /[\u0591-\u05C7]/.test(ch));

  const ids: string[] = [];
  for (const m of markChars) {
    if (m === '\u05BC' && base === 'ו') ids.push('shuruk');
    else if (NIKUD_ID_BY_CHAR[m]) ids.push(NIKUD_ID_BY_CHAR[m]);
  }

  const variant = LETTER_NIKUD_VARIANTS.find((v) => v.nikudChar === text);
  const letter = ALL_LETTERS.find((l) => l.letter === base);

  const name = variant
    ? `${variant.letterName}${variant.markName ? ` + ${variant.markName}` : ''}`
    : (letter?.name ?? base);
  const sound = variant ? parseSoundName(variant) : (letter?.transliteration ?? '');
  const desc = `${name} (звук «${sound}»)`;

  const markId =
    ids.find((id) => VOWEL_PRIORITY.includes(id)) ??
    ids.find((id) => id === 'shinDot' || id === 'sinDot' || id === 'dagesh') ??
    ids[0];
  const mark = markId ? NIKUD_MARKS.find((m) => m.id === markId) : undefined;
  const note = mark
    ? mark.explanation
    : 'Запомни, как выглядит этот знак и какой звук он даёт.';

  return { desc, note };
}

function buildTiles(texts: string[], difficulty: WordBuilderDifficulty): TileData[] {
  return texts.map((text, i) => ({
    uid: `t-${i}`,
    text,
    transcription: transcriptionFor(text, difficulty),
  }));
}

function generateDistractors(count: number, excludeSet: Set<string>, difficulty: WordBuilderDifficulty): TileData[] {
  const pool = LETTER_NIKUD_VARIANTS.filter((v) => !excludeSet.has(v.nikudChar));
  return shuffle(pool)
    .slice(0, count)
    .map((v, i) => ({
      uid: `d-${i}-${v.id}`,
      text: v.nikudChar,
      transcription: transcriptionFor(v.nikudChar, difficulty),
    }));
}

const AlphabetWordBuilderGame: React.FC<AlphabetWordBuilderGameProps> = ({ learnedWords, onStep, onComplete, onContinue }) => {
  const [phase, setPhase] = useState<'setup' | 'building' | 'checked' | 'finished'>('setup');
  const [difficulty, setDifficulty] = useState<WordBuilderDifficulty>(1);
  const [wordCount, setWordCount] = useState(5);
  const [roundIndex, setRoundIndex] = useState(0);
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [slots, setSlots] = useState<(TileData | null)[]>([]);
  const [bank, setBank] = useState<TileData[]>([]);
  const [target, setTarget] = useState<TileData[]>([]);
  const [checkResult, setCheckResult] = useState<boolean[]>([]);
  const [sessionRounds, setSessionRounds] = useState<SessionRound[]>([]);
  const [finalResult, setFinalResult] = useState<WordBuilderResult | null>(null);
  const { playAudio } = useCloudTTS();
  const { formattedTime, resetTimer } = useGameTimer(phase === 'building');

  const availableWords = useMemo(
    () => learnedWords.filter((w) => splitChars(w.hebrew).length >= 2),
    [learnedWords],
  );

  const effectiveCount = Math.min(wordCount, availableWords.length);

  const startGame = useCallback(() => {
    const selected = shuffle(availableWords).slice(0, effectiveCount);
    setQueue(selected);
    setRoundIndex(0);
    setSessionRounds([]);
    setFinalResult(null);
    setPhase('setup');
  }, [availableWords, effectiveCount]);

  const resetToSetup = useCallback(() => {
    setQueue([]);
    setRoundIndex(0);
    setSessionRounds([]);
    setFinalResult(null);
    setPhase('setup');
  }, []);

  const initRound = useCallback(() => {
    const w = queue[roundIndex];
    if (!w) { setPhase('finished'); return; }
    const t = splitChars(w.hebrew);
    const b = vocalizedChars(w.hebrew);
    const resolved = b.length === t.length ? b : t;
    const targetTiles = buildTiles(resolved, difficulty);
    const ex = new Set(resolved);
    const distractors = generateDistractors(2, ex, difficulty);
    setTarget(targetTiles);
    setSlots(Array(targetTiles.length).fill(null));
    setBank(shuffle([...targetTiles.map((x) => ({ ...x, uid: `b-${x.uid}` })), ...distractors]));
    setCheckResult([]);
    setPhase('building');
    resetTimer();
  }, [queue, roundIndex, difficulty, resetTimer]);

  React.useEffect(() => {
    if (phase === 'setup' && queue.length > 0) initRound();
  }, [phase, queue.length, initRound]);

  const finishSession = useCallback(() => {
    const correct = sessionRounds.filter((r) => r.correct).length;
    const total = sessionRounds.length;
    const mistakes: WordBuilderMistake[] = sessionRounds.flatMap((r) =>
      r.mistakes.map((m) => {
        const expectedInfo = describeTile(m.expected.text);
        return {
          word: r.word,
          position: m.position,
          expectedText: m.expected.text,
          actualText: m.actual?.text ?? null,
          expectedDesc: expectedInfo.desc,
          expectedNote: expectedInfo.note,
          actualDesc: m.actual ? describeTile(m.actual.text).desc : null,
        };
      }),
    );
    const result: WordBuilderResult = { correct, total, mistakes };
    setFinalResult(result);
    setPhase('finished');
    onComplete?.(result);
  }, [sessionRounds, onComplete]);

  // ── Pre-submit editing helpers ──
  const placeTile = useCallback((si: number, tile: TileData) => {
    const displaced = slots[si];
    setSlots((prev) => {
      const n = [...prev];
      n[si] = tile;
      return n;
    });
    setBank((prev) => {
      const c = prev.filter((t) => t.uid !== tile.uid);
      if (displaced) c.push(displaced);
      return c;
    });
  }, [slots]);

  const removeFromSlot = useCallback((si: number) => {
    if (phase !== 'building') return;
    const tile = slots[si];
    if (!tile) return;
    setSlots((prev) => {
      const n = [...prev];
      n[si] = null;
      return n;
    });
    setBank((prev) => [...prev, tile]);
  }, [phase, slots]);

  const clearAll = useCallback(() => {
    if (phase !== 'building') return;
    const filled = slots.filter((s): s is TileData => s !== null);
    setSlots((prev) => prev.map(() => null));
    setBank((prev) => [...prev, ...filled]);
  }, [phase, slots]);

  const handleDrop = useCallback((si: number, uid: string) => {
    if (phase !== 'building') return;
    const tile = bank.find((t) => t.uid === uid);
    if (!tile) return;
    placeTile(si, tile);
  }, [phase, bank, placeTile]);

  const handleBankClick = (tile: TileData) => {
    playAudio(tile.text);
    if (phase !== 'building') return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty >= 0) placeTile(firstEmpty, tile);
  };

  const handleCheck = () => {
    const r = slots.map((s, i) => s?.text === target[i].text);
    const correct = r.every(Boolean);
    const mistakes: Mistake[] = target
      .map((t, i) => (!r[i] ? { position: i, expected: t, actual: slots[i] ?? null } : null))
      .filter((m): m is Mistake => m !== null);
    setCheckResult(r);
    setSessionRounds((prev) => [...prev, { word: currentWord, correct, mistakes }]);
    setPhase('checked');
    onStep?.(correct);
  };

  const handleNext = () => {
    if (roundIndex + 1 >= queue.length) {
      finishSession();
    } else {
      setRoundIndex((n) => n + 1);
      setPhase('setup');
    }
  };

  // ── Setup screen ──
  if (phase === 'setup' && queue.length === 0) {
    return (
      <div className={styles.wrap}>
        <h3 className={styles.setupTitle}>🧩 Построй слово</h3>
        <p className={styles.setupDesc}>
          Собери слово из букв с огласовками (никуд). Пока не нажал «Проверить» —
          можно свободно менять, переставлять и убирать буквы.
        </p>

        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>🎚️ Уровень сложности</div>
          <div className={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.level}
                className={`${styles.diffBtn} ${difficulty === d.level ? styles.diffBtnActive : ''}`}
                onClick={() => setDifficulty(d.level)}
              >
                <span className={styles.diffTitle}>{d.title}</span>
                <span className={styles.diffDesc}>{d.desc}</span>
              </button>
            ))}
          </div>
          <div className={styles.previewRow}>
            {EXAMPLE_GROUPS.map((g, i) => (
              <div key={i} className={styles.previewTile}>
                <span className={styles.previewHeb}>{g}</span>
                <span className={styles.previewTranslit}>{transcriptionFor(g, difficulty)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>
            Слов в игре: <strong>{effectiveCount}</strong>
            {effectiveCount < wordCount && ` (доступно ${availableWords.length})`}
          </div>
          <input
            type="range"
            min={3}
            max={Math.max(3, availableWords.length)}
            value={Math.min(wordCount, availableWords.length)}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}><span>3</span><span>{availableWords.length}</span></div>
        </div>

        <button className={styles.startBtn} onClick={startGame} disabled={availableWords.length === 0}>
          {availableWords.length === 0 ? 'Нет слов' : `Начать (${effectiveCount} слов) →`}
        </button>
      </div>
    );
  }

  // ── Final feedback modal ──
  if (phase === 'finished' && finalResult) {
    const byWord = new Map<string, WordBuilderMistake[]>();
    for (const m of finalResult.mistakes) {
      const list = byWord.get(m.word.id) ?? [];
      list.push(m);
      byWord.set(m.word.id, list);
    }
    const entries = [...byWord.entries()];

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalCard}>
          <h3 className={styles.modalTitle}>🎉 Сессия завершена!</h3>
          <p className={styles.modalScore}>
            Правильно собрано слов: <strong>{finalResult.correct} / {finalResult.total}</strong>
            {finalResult.total > 0 && <> ({Math.round((finalResult.correct / finalResult.total) * 100)}%)</>}
          </p>

          {finalResult.mistakes.length === 0 ? (
            <p className={styles.modalNoMistakes}>Без ошибок! Ты отлично справляешься с огласовками. 🌟</p>
          ) : (
            <div className={styles.mistakeList}>
              <h4 className={styles.mistakeListTitle}>📖 Разбор ошибок (грамматика)</h4>
              {entries.map(([wordId, list]) => {
                const word = list[0].word;
                return (
                  <div key={wordId} className={styles.mistakeItem}>
                    <div className={styles.mistakeWord}>
                      <strong dir="rtl">{getVocalizedForm(word.hebrew)}</strong>{' '}
                      <span>[{word.transliteration}]</span> — {word.translation}
                    </div>
                    {list.map((m, i) => (
                      <div key={i} className={styles.mistakeRow}>
                        <div className={styles.mistakeLine}>
                          Позиция {m.position + 1}: нужно{' '}
                          <strong dir="rtl">{m.expectedText}</strong> — {m.expectedDesc}
                          {m.actualText ? (
                            <> · ты поставил <strong dir="rtl">{m.actualText}</strong> — {m.actualDesc}</>
                          ) : (
                            <> · слот остался пустым</>
                          )}
                        </div>
                        <div className={styles.mistakeNote}>💡 {m.expectedNote}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.modalActions}>
            <button className={styles.startBtn} onClick={resetToSetup}>Играть снова</button>
            {onContinue && (
              <button className={styles.continueBtn} onClick={onContinue}>Продолжить →</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentWord = queue[roundIndex];
  if (!currentWord) return null;
  const isComplete = slots.every((s) => s !== null);
  const allCorrect = checkResult.length > 0 && checkResult.every(Boolean);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span>Слово {roundIndex + 1} / {queue.length} · ⏱ {formattedTime}</span>
        <button className={styles.speakBtn} onClick={() => playAudio(getVocalizedForm(currentWord.hebrew))}>🔊</button>
      </div>
      <p className={styles.prompt}>{currentWord.translation}</p>
      <p className={styles.promptTranslit}>[{currentWord.transliteration}]</p>

      <div className={styles.slotsWrap}>
        <div className={styles.slots}>
          {slots.map((s, i) => (
            <div
              key={i}
              className={`${styles.slot} ${s ? styles.slotFilled : ''} ${checkResult[i] === true ? styles.slotCorrect : ''} ${checkResult[i] === false ? styles.slotWrong : ''}`}
              onClick={() => removeFromSlot(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                if (phase === 'building') {
                  const uid = e.dataTransfer.getData('text/plain');
                  if (uid) handleDrop(i, uid);
                }
              }}
            >
              {s ? (
                <>
                  <span className={styles.feedbackLetter}>{s.text}</span>
                  {s.transcription && <span className={styles.slotTranslit}>{s.transcription}</span>}
                </>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>?</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {phase === 'building' && (
        <p className={styles.hint}>
          💡 Нажми на заполненный слот, чтобы вернуть букву в банк. Перетащи новую букву на занятый слот, чтобы заменить.
        </p>
      )}

      <div className={styles.letters}>
        {bank.map((t) => (
          <button
            key={t.uid}
            draggable={phase === 'building'}
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.uid); }}
            className={styles.letter}
            onClick={() => handleBankClick(t)}
          >
            <span className={styles.letterChar}>{t.text}</span>
            {t.transcription && <span className={styles.letterTranslit}>{t.transcription}</span>}
          </button>
        ))}
      </div>

      {phase === 'building' && bank.length > 0 && slots.some((s) => s !== null) && (
        <button className={styles.clearBtn} onClick={clearAll}>🗑 Очистить</button>
      )}

      {phase === 'building' && (
        <button className={styles.checkBtn} disabled={!isComplete} onClick={handleCheck}>
          {isComplete ? '✓ Проверить' : 'Заполни все слоты'}
        </button>
      )}

      {phase === 'checked' && (
        <div className={styles.feedback}>
          <div className={styles.feedbackTitle}>
            {allCorrect ? PRAISE[roundIndex % PRAISE.length] : ENCOURAGE[roundIndex % ENCOURAGE.length]}
          </div>
          <div className={styles.feedbackSlots}>
            {target.map((t, i) => (
              <div key={i} className={`${styles.feedbackSlotItem} ${checkResult[i] ? styles.feedbackSlotOk : styles.feedbackSlotErr}`}>
                <span className={styles.feedbackLetter}>{t.text}</span>
                {t.transcription && <span className={styles.feedbackLetterName}>{t.transcription}</span>}
                {!checkResult[i] && (
                  <span className={styles.feedbackWasLetter}>
                    {slots[i] ? `${slots[i]?.text} ${slots[i]?.transcription}` : 'пусто'}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button className={styles.nextBtn} onClick={handleNext}>
            {roundIndex + 1 >= queue.length ? '📊 Итоги' : 'Далее →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AlphabetWordBuilderGame;