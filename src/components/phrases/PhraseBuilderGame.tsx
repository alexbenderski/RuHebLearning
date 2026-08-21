import React, { useState, useCallback, useMemo } from 'react';
import { PHRASE_CATEGORIES, type PhraseItem } from '../../data/phrases';
import useCloudTTS from '../../hooks/useCloudTTS';
import styles from './PhraseBuilderGame.module.css';

interface PhraseBuilderGameProps {
  onBack: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SlotWord {
  id: string;
  hebrew: string;
  transliteration: string;
}

interface PoolWord extends SlotWord {
  uid: string;
}

interface MistakeItem {
  position: number;
  expected: string;
  given: string;
  expectedForm: string;
  givenForm: string;
  tip: string;
}

interface RoundResult {
  phrase: PhraseItem;
  correct: boolean;
  gender: 'm' | 'f';
  mistakes: MistakeItem[];
}

/** Split a Hebrew phrase into individual words (by spaces) */
function splitPhrase(hebrew: string): string[] {
  return hebrew.split(/\s+/).filter(Boolean);
}

/** Build the word pool for a phrase, including both M and F variants */
function buildPool(phrase: PhraseItem): PoolWord[] {
  const pool: PoolWord[] = [];
  const seen = new Set<string>();

  const mWords = splitPhrase(phrase.hebrew);
  mWords.forEach((w, i) => {
    const key = `m-${w}`;
    if (!seen.has(key)) {
      seen.add(key);
      pool.push({
        uid: `m-${i}-${w}`,
        id: `m-${i}`,
        hebrew: w,
        transliteration: phrase.transliteration.split(/\s+/)[i] ?? '',
      });
    }
  });

  if (phrase.hebrewF) {
    const fWords = splitPhrase(phrase.hebrewF);
    fWords.forEach((w, i) => {
      const key = `f-${w}`;
      if (!seen.has(key)) {
        seen.add(key);
        pool.push({
          uid: `f-${i}-${w}`,
          id: `f-${i}`,
          hebrew: w,
          transliteration: phrase.transliterationF?.split(/\s+/)[i] ?? '',
        });
      }
    });
  }

  return shuffle(pool);
}

/** Get the correct slot words for a given gender */
function getCorrectSlots(phrase: PhraseItem, gender: 'm' | 'f'): SlotWord[] {
  const hebrew = gender === 'm' ? phrase.hebrew : (phrase.hebrewF ?? phrase.hebrew);
  const translit = gender === 'm' ? phrase.transliteration : (phrase.transliterationF ?? phrase.transliteration);
  const words = splitPhrase(hebrew);
  const transWords = translit.split(/\s+/);
  return words.map((w, i) => ({
    id: `slot-${i}`,
    hebrew: w,
    transliteration: transWords[i] ?? '',
  }));
}

/** Determine if a Hebrew word looks masculine or feminine based on endings */
function wordGender(word: string): 'm' | 'f' | 'neutral' {
  const lastChar = word[word.length - 1];
  const lastTwo = word.slice(-2);
  if (lastTwo === 'ית' || lastTwo === 'ות') return 'f';
  if (lastChar === 'ָה' || lastChar === 'ת' || lastChar === 'ֶ' || lastChar === 'ַ') return 'f';
  if (lastChar === 'ה' && word.length > 1) {
    const prev = word[word.length - 2];
    if (prev && /[\u05D0-\u05EA]/.test(prev)) return 'f';
  }
  return 'm';
}

/** Get a grammar tip based on the word's gender */
function getGenderTip(word: string): string {
  const lastChar = word[word.length - 1];
  const lastTwo = word.slice(-2);
  if (lastTwo === 'ית') {
    return 'Слова женского рода часто оканчиваются на ־ית (например: צִמְחוֹנִית). Запомни это окончание!';
  }
  if (lastTwo === 'ות') {
    return 'Слова женского рода могут оканчиваться на ־ות (например: מְדַבֶּרֶת).';
  }
  if (lastChar === 'ָה' || lastChar === 'ֶ' || lastChar === 'ַ') {
    return 'Многие слова женского рода в иврите оканчиваются на ־ה (например: גָּרָה, רוֹצָה). Обрати внимание на букву ה в конце!';
  }
  if (lastChar === 'ת') {
    return 'Окончание ־ת — это характерный признак женского рода (например: תַּעַזְרִי, תָּבִיאִי).';
  }
  return 'Слово выглядит как женский род. Запомни его окончание.';
}

/** Check if the user chose the right root but wrong gender form */
function checkWordGenderMatch(
  given: string,
  expected: string,
  phraseGender: 'm' | 'f'
): string | null {
  const givenRoot = given.replace(/[^\u05D0-\u05EA]/g, '');
  const expectedRoot = expected.replace(/[^\u05D0-\u05EA]/g, '');
  if (givenRoot === expectedRoot && given !== expected) {
    if (phraseGender === 'f') {
      return `Ты поставил слово в форме мужского рода (${given}), но фраза женского рода! Нужно: ${expected}. ${getGenderTip(expected)}`;
    } else {
      return `Ты поставил слово в форме женского рода (${given}), но фраза мужского рода! Нужно: ${expected}. В иврите мужской род — базовая форма.`;
    }
  }
  return null;
}

/** Build detailed mistake list for the current round */
function buildMistakes(
  slots: (PoolWord | null)[],
  correctSlots: SlotWord[],
  phraseGender: 'm' | 'f'
): MistakeItem[] {
  const mistakes: MistakeItem[] = [];
  for (let i = 0; i < correctSlots.length; i++) {
    const placed = slots[i];
    const expected = correctSlots[i];
    if (!placed) {
      mistakes.push({
        position: i,
        expected: expected.hebrew,
        given: '(пусто)',
        expectedForm: phraseGender,
        givenForm: 'neutral',
        tip: 'Ты не заполнил эту ячейку. Внимательно прочитай фразу ещё раз.',
      });
    } else if (placed.hebrew !== expected.hebrew) {
      const genderTip = checkWordGenderMatch(placed.hebrew, expected.hebrew, phraseGender);
      if (genderTip) {
        mistakes.push({
          position: i,
          expected: expected.hebrew,
          given: placed.hebrew,
          expectedForm: phraseGender,
          givenForm: wordGender(placed.hebrew),
          tip: genderTip,
        });
      } else {
        // Wrong word entirely — give a general tip
        const givenRoot = placed.hebrew.replace(/[^\u05D0-\u05EA]/g, '');
        const expectedRoot = expected.hebrew.replace(/[^\u05D0-\u05EA]/g, '');
        let tip = 'Порядок слов в фразе важен! Сравни с правильной фразой.';
        if (givenRoot === expectedRoot) {
          tip = 'Ты выбрал слово с тем же корнем, но не ту форму. Сравни окончания слов.';
        }
        mistakes.push({
          position: i,
          expected: expected.hebrew,
          given: placed.hebrew,
          expectedForm: phraseGender,
          givenForm: wordGender(placed.hebrew),
          tip,
        });
      }
    }
  }
  return mistakes;
}

/** Get a human-readable summary of mistakes */
function getMistakeSummary(mistakes: MistakeItem[]): string {
  if (mistakes.length === 0) return '';
  const genderIssues = mistakes.filter(m => m.tip.includes('род') || m.tip.includes('Род'));
  const orderIssues = mistakes.filter(m => !m.tip.includes('род') && !m.tip.includes('Род'));
  const parts: string[] = [];
  if (genderIssues.length > 0) {
    parts.push(`🚩 Ошибки в роде: ${genderIssues.length} слово(а) не подходят по роду.`);
  }
  if (orderIssues.length > 0) {
    parts.push(`🚩 Проблемы с порядком: ${orderIssues.length} слово(а) стоят не на своих местах.`);
  }
  return parts.join(' ');
}

const PRAISE = ['✅ Отлично!', '✅ Молодец!', '✅ Точно в цель!', '✅ Супер!', '✅ Прекрасно!', '✅ Идеально!'];
const ENCOURAGE = ['Не сдавайся!', 'Попробуй снова!', 'Ошибки — это часть обучения!', 'Анализируй и пробуй ещё!'];

const PhraseBuilderGame: React.FC<PhraseBuilderGameProps> = ({ onBack }) => {
  const { playAudio } = useCloudTTS();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'checked' | 'results'>('setup');
  const [phraseCount, setPhraseCount] = useState(5);
  const [showTranslit, setShowTranslit] = useState(false);
  const [showPoolTranslit, setShowPoolTranslit] = useState(false);

  const [queue, setQueue] = useState<PhraseItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [gender, setGender] = useState<'m' | 'f'>('m');
  const [slots, setSlots] = useState<(PoolWord | null)[]>([]);
  const [correctSlots, setCorrectSlots] = useState<SlotWord[]>([]);
  const [pool, setPool] = useState<PoolWord[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [checkResult, setCheckResult] = useState<boolean[]>([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  const allPhrases = useMemo(
    () => PHRASE_CATEGORIES.flatMap((c) => c.phrases),
    [],
  );

  const startGame = useCallback(() => {
    const selected = shuffle(allPhrases).slice(0, phraseCount);
    setQueue(selected);
    setCurrentIdx(0);
    setRoundResults([]);
    setPhase('setup');
  }, [allPhrases, phraseCount]);

  const initRound = useCallback(() => {
    const phrase = queue[0];
    if (!phrase) { setPhase('results'); return; }
    const g: 'm' | 'f' = phrase.hebrewF ? (Math.random() < 0.5 ? 'm' : 'f') : 'm';
    setGender(g);
    const correct = getCorrectSlots(phrase, g);
    setCorrectSlots(correct);
    setSlots(Array(correct.length).fill(null));
    setUsedIds(new Set());
    setCheckResult([]);
    setMistakes([]);
    setPool(buildPool(phrase));
    setPhase('playing');
  }, [queue]);

  React.useEffect(() => {
    if (phase === 'setup' && queue.length > 0) {
      initRound();
    }
  }, [phase, queue.length, initRound]);

  const currentPhrase = queue[currentIdx];

  const handlePoolClick = useCallback((word: PoolWord) => {
    if (phase !== 'playing') return;
    if (usedIds.has(word.uid)) return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty < 0) return;
    const newSlots = [...slots];
    newSlots[firstEmpty] = word;
    setSlots(newSlots);
    setUsedIds((prev) => new Set(prev).add(word.uid));
  }, [phase, slots, usedIds]);

  const handleSlotRemove = useCallback((idx: number) => {
    if (phase !== 'playing') return;
    const word = slots[idx];
    if (!word) return;
    const newSlots = [...slots];
    newSlots[idx] = null;
    setSlots(newSlots);
    setUsedIds((prev) => {
      const next = new Set(prev);
      next.delete(word.uid);
      return next;
    });
  }, [phase, slots]);

  const handleCheck = useCallback(() => {
    const r = slots.map((s, i) => s?.hebrew === correctSlots[i].hebrew);
    const allCorrect = r.every(Boolean);
    const detailed = buildMistakes(slots, correctSlots, gender);
    setCheckResult(r);
    setMistakes(detailed);
    setRoundResults((prev) => [...prev, { phrase: currentPhrase!, correct: allCorrect, gender, mistakes: detailed }]);
    setPhase('checked');
  }, [slots, correctSlots, currentPhrase, gender]);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= queue.length) {
      setPhase('results');
    } else {
      setCurrentIdx((i) => i + 1);
      const nextPhrase = queue[currentIdx + 1];
      if (nextPhrase) {
        const g: 'm' | 'f' = nextPhrase.hebrewF ? (Math.random() < 0.5 ? 'm' : 'f') : 'm';
        setGender(g);
        const correct = getCorrectSlots(nextPhrase, g);
        setCorrectSlots(correct);
        setSlots(Array(correct.length).fill(null));
        setUsedIds(new Set());
        setCheckResult([]);
        setMistakes([]);
        setPool(buildPool(nextPhrase));
        setPhase('playing');
      }
    }
  }, [currentIdx, queue]);

  const correctCount = roundResults.filter((r) => r.correct).length;

  const allSessionMistakes = useMemo(() => {
    const m: { round: number; phrase: PhraseItem; gender: 'm' | 'f'; mistake: MistakeItem }[] = [];
    roundResults.forEach((r, ri) => {
      r.mistakes.forEach((mist) => {
        m.push({ round: ri + 1, phrase: r.phrase, gender: r.gender, mistake: mist });
      });
    });
    return m;
  }, [roundResults]);

  // ── SETUP ──
  if (phase === 'setup' && queue.length === 0) {
    return (
      <div className={styles.wrap}>
        <h3 className={styles.setupTitle}>🧩 Собери фразу</h3>
        <p className={styles.setupDesc}>
          Перетаскивай ивритские слова в пустые ячейки, чтобы собрать фразу.
          В пуле есть слова и мужского, и женского рода — будь внимателен!
        </p>
        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>
            Количество фраз: <strong>{phraseCount}</strong>
          </div>
          <input
            type="range"
            min={3}
            max={allPhrases.length}
            value={phraseCount}
            onChange={(e) => setPhraseCount(Number(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}><span>3</span><span>{allPhrases.length}</span></div>
        </div>
        <button className={styles.startBtn} onClick={startGame}>
          Начать игру ({phraseCount} фраз) →
        </button>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === 'results') {
    return (
      <div className={styles.wrap}>
        <div className={styles.results}>
          <h3 className={styles.resultsTitle}>🎉 Игра завершена!</h3>
          <p className={styles.resultsScore}>
            Правильно собрано: <strong>{correctCount} / {roundResults.length}</strong>
            {roundResults.length > 0 && <> ({Math.round((correctCount / roundResults.length) * 100)}%)</>}
          </p>

          {/* Summary of all mistakes across the session */}
          {allSessionMistakes.length > 0 && (
            <div className={styles.feedback} style={{ marginBottom: 16, textAlign: 'left', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 12 }}>
              <h4 style={{ color: '#fca5a5', margin: '0 0 8px', fontSize: '1rem' }}>📖 Разбор ошибок за всю сессию:</h4>
              {allSessionMistakes.map((item, i) => {
                const trans = item.gender === 'm'
                  ? item.phrase.translation
                  : (item.phrase.translationF ?? item.phrase.translation);
                return (
                  <div key={i} style={{
                    padding: '8px 10px',
                    marginBottom: 6,
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    borderLeft: '3px solid #f97316',
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                      <strong>#{item.round}</strong> — {trans}
                    </div>
                    <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
                      ❌ Слово {item.mistake.position + 1}: нужно <strong>{item.mistake.expected}</strong>, ты поставил <strong>{item.mistake.given}</strong>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', marginTop: 2 }}>
                      💡 {item.mistake.tip}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.resultsList}>
            {roundResults.map((r, i) => (
              <div key={i} className={`${styles.resultItem} ${r.correct ? styles.resultOk : styles.resultFail}`}>
                <div className={styles.resultMark}>{r.correct ? '✅' : '❌'}</div>
                <div className={styles.resultBody}>
                  <div className={styles.resultSentence} dir="rtl">
                    {r.gender === 'm' ? r.phrase.hebrew : (r.phrase.hebrewF ?? r.phrase.hebrew)}
                  </div>
                  <div className={styles.resultTranslation}>
                    {r.gender === 'm' ? r.phrase.translation : (r.phrase.translationF ?? r.phrase.translation)}
                  </div>
                  {r.mistakes.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {r.mistakes.map((m, mi) => (
                        <div key={mi} style={{
                          color: '#fbbf24',
                          fontSize: '0.78rem',
                          padding: '4px 0 0 0',
                          borderTop: mi > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}>
                          <div>❌ Слово {m.position + 1}: нужно «{m.expected}», ты: «{m.given}»</div>
                          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>
                            💡 {m.tip}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className={styles.startBtn} onClick={() => { setQueue([]); setPhase('setup'); }}>
            Играть снова →
          </button>
          <button className={styles.nextBtn} onClick={onBack} style={{ marginLeft: 8 }}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING / CHECKED ──
  const isChecked = phase === 'checked';
  const allCorrect = checkResult.length > 0 && checkResult.every(Boolean);
  const allSlotsFilled = slots.every((s) => s !== null);

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.toggleBtn} onClick={onBack}>← Назад</button>
        <div className={styles.progress}>
          <span className={styles.progressText}>Фраза {currentIdx + 1} / {queue.length}</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${((currentIdx + 1) / queue.length) * 100}%` }} />
          </div>
        </div>
        <span className={styles.score}>✅ {correctCount}/{roundResults.length}</span>
      </div>

      {/* Russian sentence (always visible) */}
      <p className={styles.sentenceRu}>
        {gender === 'm' ? currentPhrase?.translation : (currentPhrase?.translationF ?? currentPhrase?.translation)}
      </p>

      {/* Gender label */}
      <p className={styles.genderLabel}>
        {currentPhrase?.hebrewF ? (
          gender === 'm' ? '👨 Фраза мужского рода' : '👩 Фраза женского рода'
        ) : (
          '⚪ Фраза без рода'
        )}
      </p>

      {/* Toggle buttons */}
      <div className={styles.transcriptToggle}>
        <button
          className={`${styles.toggleBtn} ${showTranslit ? styles.toggleBtnActive : ''}`}
          onClick={() => setShowTranslit(!showTranslit)}
        >
          {showTranslit ? '🙈 Скрыть транскрипцию' : '📝 Показать транскрипцию'}
        </button>
        <button
          className={`${styles.toggleBtn} ${showPoolTranslit ? styles.toggleBtnActive : ''}`}
          onClick={() => setShowPoolTranslit(!showPoolTranslit)}
        >
          {showPoolTranslit ? '🙈 Скрыть подписи слов' : '📝 Показать подписи слов'}
        </button>
        <button
          className={styles.speakBtn}
          onClick={() => {
            const text = gender === 'm' ? currentPhrase?.hebrew : (currentPhrase?.hebrewF ?? currentPhrase?.hebrew);
            if (text) playAudio(text);
          }}
        >
          🔊 Фраза целиком
        </button>
      </div>

      {/* Transcription display */}
      {showTranslit && (
        <div className={styles.transcriptDisplay}>
          [{gender === 'm' ? currentPhrase?.transliteration : (currentPhrase?.transliterationF ?? currentPhrase?.transliteration)}]
        </div>
      )}

<div className={styles.slotsWrap}>
  {slots
    .map((s, i) => ({ s, originalIndex: i })) // 1. שומרים את האינדקס המקורי
    .reverse() // 2. הופכים את הסדר
    .map(({ s, originalIndex }) => (
      <div
        key={originalIndex} // חובה להשתמש באינדקס המקורי כדי שה-React לא יתבלבל
        className={`${styles.slot} ${s ? styles.slotFilled : ''} ${
          isChecked ? (checkResult[originalIndex] ? styles.slotCorrect : styles.slotWrong) : ''
        }`}
        onClick={() => !isChecked && handleSlotRemove(originalIndex)}
      >
        {s && (
          <>
            <span className={styles.slotText}>{s.hebrew}</span>
            {!isChecked && <span className={styles.slotRemove}>✕</span>}
          </>
        )}
      </div>
    ))}
</div>

      {/* Word pool */}
      <p className={styles.poolLabel}>Выбери слово и нажми на него, чтобы поместить в пустую ячейку:</p>
      <div className={styles.pool}>
        {pool.map((word) => {
          const isUsed = usedIds.has(word.uid);
          return (
            <button
              key={word.uid}
              className={`${styles.poolWord} ${isUsed ? styles.poolWordUsed : ''}`}
              onClick={() => {
                if (!isUsed) playAudio(word.hebrew);
                handlePoolClick(word);
              }}
              disabled={isUsed || isChecked}
            >
              <span className={styles.poolWordHeb}>{word.hebrew}</span>
              {showPoolTranslit && (
                <span className={styles.poolWordTranslit}>[{word.transliteration}]</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {!isChecked ? (
          <button
            className={styles.checkBtn}
            onClick={handleCheck}
            disabled={!allSlotsFilled}
          >
            ✅ Проверить
          </button>
        ) : (
          <>
            <div className={`${styles.feedback} ${allCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}>
              <div className={styles.feedbackTitle}>
                {allCorrect
                  ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
                  : ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)]}
              </div>
              {!allCorrect && (
                <>
                  <div className={styles.feedbackSub}>
                    Правильная фраза: {correctSlots.map((s) => s.hebrew).join(' ')}
                  </div>
                  {/* Detailed mistake breakdown */}
                  <div style={{ marginTop: 10, textAlign: 'left' }}>
                    {mistakes.map((m, i) => (
                      <div key={i} style={{
                        padding: '6px 8px',
                        marginBottom: 4,
                        background: 'rgba(0,0,0,0.15)',
                        borderRadius: 6,
                        borderLeft: '3px solid #f97316',
                      }}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                          ❌ Позиция {m.position + 1}: нужно <strong>{m.expected}</strong>, ты поставил <strong>{m.given}</strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: 2 }}>
                          💡 {m.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {/* Summary */}
              {mistakes.length > 0 && (
                <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  {getMistakeSummary(mistakes)}
                </div>
              )}
            </div>
            <button className={styles.nextBtn} onClick={handleNext}>
              {currentIdx + 1 >= queue.length ? '🏁 К результатам' : '➡️ Следующая фраза'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PhraseBuilderGame;