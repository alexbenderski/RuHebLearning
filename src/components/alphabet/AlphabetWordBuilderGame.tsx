import React, { useState, useCallback, useMemo } from 'react';
import type { VocabWord } from '../../types';
import { ALL_LETTERS } from '../../data/alphabet';
import { getVocalizedForm, getVocalizedCharGroups } from '../../data/nikudWords';
import { LETTER_NIKUD_VARIANTS } from '../../data/letterNikud';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useGameTimer } from '../../hooks/useGameTimer';
import styles from './AlphabetWordBuilderGame.module.css';

interface AlphabetWordBuilderGameProps {
  learnedWords: VocabWord[];
  onStep?: (correct: boolean) => void;
}

interface TileData {
  id: string;
  text: string;
  transcription: string;
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

function makeTile(text: string): TileData {
  const variant = LETTER_NIKUD_VARIANTS.find((v) => v.nikudChar === text);
  if (variant) return { id: text, text, transcription: parseSoundName(variant) };
  const letter = ALL_LETTERS.find((l) => l.letter === text);
  if (letter) return { id: text, text, transcription: letter.transliteration };
  return { id: text, text, transcription: '' };
}

function generateDistractors(count: number, excludeSet: Set<string>): TileData[] {
  const pool = LETTER_NIKUD_VARIANTS.filter((v) => !excludeSet.has(v.nikudChar));
  return shuffle(pool).slice(0, count).map((v) => ({
    id: v.nikudChar,
    text: v.nikudChar,
    transcription: parseSoundName(v),
  }));
}

const AlphabetWordBuilderGame: React.FC<AlphabetWordBuilderGameProps> = ({ learnedWords, onStep }) => {
  const [phase, setPhase] = useState<'setup' | 'building' | 'checked'>('setup');
  const [wordCount, setWordCount] = useState(5);
  const [roundIndex, setRoundIndex] = useState(0);
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [slots, setSlots] = useState<TileData[]>([]);
  const [bank, setBank] = useState<TileData[]>([]);
  const [target, setTarget] = useState<TileData[]>([]);
  const [checkResult, setCheckResult] = useState<boolean[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const { playAudio } = useCloudTTS();
  const { seconds, formattedTime, resetTimer } = useGameTimer(phase === 'building');

  const availableWords = useMemo(
    () => learnedWords.filter((w) => splitChars(w.hebrew).length >= 3),
    [learnedWords],
  );

  const effectiveCount = Math.min(wordCount, availableWords.length);

  const startGame = useCallback(() => {
    const selected = shuffle(availableWords).slice(0, effectiveCount);
    setQueue(selected);
    setRoundIndex(0);
    setPhase('setup');
  }, [availableWords, effectiveCount]);

  const initRound = useCallback(() => {
    const w = queue[roundIndex];
    if (!w) { setPhase('checked'); return; }
    const t = splitChars(w.hebrew);
    const b = vocalizedChars(w.hebrew);
    const resolved = b.length === t.length ? b : t;
    const tiles = resolved.map((ch) => makeTile(ch));
    const ex = new Set(resolved);
    const d = generateDistractors(2, ex);
    setTarget(tiles);
    setSlots(Array(tiles.length).fill(null) as unknown as TileData[]);
    setBank(shuffle([...tiles, ...d]));
    setCheckResult([]);
    setTotalTime(seconds);
    setPhase('building');
    resetTimer();
  }, [queue, roundIndex, seconds, resetTimer]);

  React.useEffect(() => {
    if (phase === 'setup' && queue.length > 0) initRound();
  }, [phase, queue.length, initRound]);

  if (phase === 'setup' && queue.length === 0) {
    return (
      <div className={styles.wrap}>
        <h3 className={styles.setupTitle}>🧩 Построй слово</h3>
        <p className={styles.setupDesc}>Собери слово из букв с огласовками (никуд). Каждая буква показывает произношение.</p>
        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>
            Слов в игре: <strong>{effectiveCount}</strong>
            {effectiveCount < wordCount && ` (доступно ${availableWords.length})`}
          </div>
          <input type="range" min={3} max={Math.max(3, availableWords.length)}
            value={Math.min(wordCount, availableWords.length)}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className={styles.slider} />
          <div className={styles.sliderLabels}><span>3</span><span>{availableWords.length}</span></div>
        </div>
        <button className={styles.startBtn} onClick={startGame} disabled={availableWords.length === 0}>
          {availableWords.length === 0 ? 'Нет слов' : `Начать (${effectiveCount} слов) →`}
        </button>
      </div>
    );
  }

  if (phase === 'checked' && queue.length > 0 && roundIndex >= queue.length) {
    return (
      <div className={styles.wrap}>
        <h3 className={styles.feedbackTitle}>🧩 Итоги</h3>
        <p className={styles.feedbackLabel}>Слов собрано: {roundIndex} · Время: {totalTime}s</p>
        <button className={styles.startBtn} onClick={() => { setQueue([]); setPhase('setup'); }}>Играть снова</button>
      </div>
    );
  }

  const currentWord = queue[roundIndex];
  if (!currentWord) return null;
  const isComplete = slots.every((s) => s !== null);

  const onDrop = (si: number, tid: string) => {
    if (phase !== 'building') return;
    const tile = bank.find((t) => t.id === tid);
    if (!tile) return;
    const d = slots[si];
    const n = [...slots]; n[si] = tile; setSlots(n);
    setBank((p) => {
      const c = [...p]; const i = c.findIndex((t) => t.id === tid);
      if (i >= 0) c.splice(i, 1);
      if (d) c.push(d);
      return c;
    });
  };

  const handleCheck = () => {
    const r = slots.map((s, i) => s.id === target[i].id);
    setCheckResult(r);
    setTotalTime(seconds);
    setPhase('checked');
    onStep?.(r.every(Boolean));
  };

  const handleNext = () => {
    if (roundIndex + 1 >= queue.length) { setPhase('checked'); return; }
    setRoundIndex((n) => n + 1);
    setPhase('setup');
  };

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
            <div key={i}
              className={`${styles.slot} ${s ? styles.slotFilled : ''} ${checkResult[i] === true ? styles.slotCorrect : ''} ${checkResult[i] === false ? styles.slotWrong : ''}`}
              onClick={() => phase === 'building' && s && onDrop(i, s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { if (phase === 'building') { const id = e.dataTransfer.getData('text/plain'); if (id) onDrop(i, id); } }}>
              {s ? <><span className={styles.feedbackLetter}>{s.text}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{s.transcription}</span></> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>?</span>}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.letters}>
        {bank.map((t) => (
          <button key={t.id} draggable={phase === 'building'}
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); }}
            className={styles.letter}
            onClick={() => { playAudio(t.text); if (phase === 'building') { const firstEmpty = slots.findIndex((s) => s === null); if (firstEmpty >= 0) onDrop(firstEmpty, t.id); } }}>
            <span className={styles.letterChar}>{t.text}</span>
            <span className={styles.letterTranslit}>{t.transcription}</span>
          </button>
        ))}
      </div>

      {phase === 'building' && (
        <button className={styles.checkBtn} disabled={!isComplete} onClick={handleCheck}>
          {isComplete ? '✓ Проверить' : 'Заполни все слоты'}
        </button>
      )}

      {phase === 'checked' && (
        <div className={styles.feedback}>
          <div className={styles.feedbackTitle}>{checkResult.every(Boolean) ? '✅ Верно!' : '❌ Ошибки'}</div>
          <div className={styles.feedbackSlots}>
            {target.map((t, i) => (
              <div key={i} className={`${styles.feedbackSlotItem} ${checkResult[i] ? styles.feedbackSlotOk : styles.feedbackSlotErr}`}>
                <span className={styles.feedbackLetter}>{t.text}</span>
                <span className={styles.feedbackLetterName}>{t.transcription}</span>
                {!checkResult[i] && <span className={styles.feedbackWasLetter}>{slots[i]?.text} {slots[i]?.transcription}</span>}
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