import React, { useState, useMemo } from 'react';
import type { VocabWord } from '../../types';
import { getVocalizedForm } from '../../data/nikudWords';
import AlphabetWordBuilderGame from '../alphabet/AlphabetWordBuilderGame';
import useCloudTTS from '../../hooks/useCloudTTS';
import styles from './LevelDetail.module.css';

interface ExamQuestionProps {
  question: {
    type: 'wordbuild' | 'quiz';
    word: VocabWord;
  };
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  allWords: VocabWord[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(correct: VocabWord, all: VocabWord[]): VocabWord[] {
  const pool = all.filter(w => w.id !== correct.id);
  const wrong = shuffle(pool).slice(0, 3);
  return shuffle([...wrong, correct]);
}

const ExamQuestion: React.FC<ExamQuestionProps> = ({ question, onAnswer, onNext, allWords }) => {
  const { playAudio } = useCloudTTS();
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [, setSelectedId] = useState<string | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);

  const options = useMemo(() => buildOptions(question.word, allWords), [question.word, allWords]);

  const handleAnswer = (opt: VocabWord) => {
    if (answered) return;
    const correct = opt.id === question.word.id;
    setIsCorrect(correct);
    setSelectedId(opt.id);
    setAnswered(true);
    onAnswer(correct);
  };

  const handleNext = () => {
    setAnswered(false);
    setIsCorrect(false);
    setSelectedId(null);
    setShowTranscription(false);
    onNext();
  };

  // Word-build type: use AlphabetWordBuilderGame in singleWordMode
  if (question.type === 'wordbuild') {
    return (
      <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', background: '#1a1a2e', borderRadius: 18, padding: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => playAudio(question.word.hebrew)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '6px 14px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
              title="Прослушать"
            >
              🔊 Прослушать
            </button>
            <button
              onClick={() => setShowTranscription(!showTranscription)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '6px 14px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {showTranscription ? '🙈 Скрыть транскрипцию' : '📝 Показать транскрипцию'}
            </button>
          </div>
          {showTranscription && (
            <p style={{ color: '#ffd700', fontSize: '1.1rem', margin: '8px 0 0' }}>
              [{question.word.transliteration}] — {question.word.translation}
            </p>
          )}
        </div>
        <AlphabetWordBuilderGame
          key={`exam-wb-${question.word.id}`}
          learnedWords={[question.word]}
          singleWordMode
          onStep={(correct) => {
            setIsCorrect(correct);
            setAnswered(true);
            onAnswer(correct);
          }}
          onContinue={handleNext}
        />
        {answered && (
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <p style={{ fontSize: '1.5rem' }}>{isCorrect ? '✅' : '❌'}</p>
            <p style={{ color: isCorrect ? '#4caf50' : '#f44336', fontWeight: 600 }}>
              {isCorrect ? 'Верно!' : `Правильно: ${getVocalizedForm(question.word.hebrew)}`}
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 12,
              margin: '8px auto',
              maxWidth: 400,
              textAlign: 'left',
            }}>
              <p style={{ color: '#fcd34d', fontSize: '0.85rem', margin: '0 0 6px', fontWeight: 600 }}>
                📖 Разбор слова:
              </p>
              <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>
                <strong dir="rtl">{getVocalizedForm(question.word.hebrew)}</strong>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '4px 0' }}>
                Транскрипция: [{question.word.transliteration}]
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '0 0 6px' }}>
                Перевод: {question.word.translation}
              </p>
              {question.word.grammarExplanation && (
                <div style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginTop: 6,
                }}>
                  <p style={{ color: '#fbbf24', fontSize: '0.75rem', margin: '0 0 4px', fontWeight: 600 }}>
                    📖 Грамматический разбор:
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', margin: 0, lineHeight: 1.45 }}>
                    {question.word.grammarExplanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Quiz type
  return (
    <div className={styles.theorySection}>
      <div className={styles.phraseBox}>
        <p className={styles.phrase}>
          <button
            onClick={() => playAudio(question.word.hebrew)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 6, fontSize: '1.2rem', verticalAlign: 'middle' }}
            title="Прослушать"
          >🔊</button>
          Как переводится <strong>{getVocalizedForm(question.word.hebrew)}</strong>?
        </p>
      </div>
      <div className={styles.options} style={{ padding: '0 16px' }}>
        {options.map((opt) => {
          let cls = styles.option;
          if (answered) {
            if (opt.id === question.word.id) cls = `${styles.option} ${styles.optionCorrect}`;
            else cls = `${styles.option} ${styles.optionWrong}`;
          }
          return (
            <button
              key={opt.id}
              className={cls}
              disabled={answered}
              onClick={() => handleAnswer(opt)}
            >
              <span className={styles.optionName}>{opt.translation}</span>
              <span className={styles.optionTranslit}>{opt.transliteration}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 12,
            margin: '0 auto 12px',
            maxWidth: 400,
            textAlign: 'left',
          }}>
            <p style={{ color: '#fcd34d', fontSize: '0.85rem', margin: '0 0 6px', fontWeight: 600 }}>
              {isCorrect ? '✅ Верно!' : '❌ Правильный ответ:'}
            </p>
            <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>
              <strong>{question.word.translation}</strong>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '4px 0' }}>
              [{question.word.transliteration}]
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '0 0 6px' }}>
              <strong dir="rtl">{getVocalizedForm(question.word.hebrew)}</strong>
            </p>
            {question.word.grammarExplanation && (
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: 8,
                padding: '8px 10px',
                marginTop: 6,
              }}>
                <p style={{ color: '#fbbf24', fontSize: '0.75rem', margin: '0 0 4px', fontWeight: 600 }}>
                  📖 Разбор слова:
                </p>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', margin: 0, lineHeight: 1.45 }}>
                  {question.word.grammarExplanation}
                </p>
              </div>
            )}
          </div>
          <button className={styles.startQuizBtn} onClick={handleNext}>
            ➡️ Далее
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamQuestion;