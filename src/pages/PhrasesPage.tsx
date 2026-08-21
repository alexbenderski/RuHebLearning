import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PHRASE_CATEGORIES, type PhraseCategory } from '../data/phrases';
import useCloudTTS from '../hooks/useCloudTTS';
import PhraseBuilderGame from '../components/phrases/PhraseBuilderGame';
import styles from './Home.module.css';

type Gender = 'm' | 'f';
type PageMode = 'categories' | 'category' | 'games' | 'builder';

const PhrasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { playAudio } = useCloudTTS();
  const [mode, setMode] = useState<PageMode>('categories');
  const [selectedCategory, setSelectedCategory] = useState<PhraseCategory | null>(null);
  const [gender, setGender] = useState<Gender>('m');

  // ── Category detail view ──
  if (mode === 'category' && selectedCategory) {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <button
            onClick={() => { setSelectedCategory(null); setMode('categories'); }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '8px 20px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: 16,
            }}
          >
            ← Назад к категориям
          </button>
          <h1 className={styles.heroTitle} style={{ fontSize: '1.8rem' }}>
            {selectedCategory.icon} {selectedCategory.name}
          </h1>
          <p className={styles.heroSub}>
            {selectedCategory.phrases.length} фраз — нажми на 🔊 чтобы прослушать
          </p>

          {/* Gender toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 4,
              marginTop: 16,
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <button
              onClick={() => setGender('m')}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: gender === 'm' ? '#ffd700' : 'transparent',
                color: gender === 'm' ? '#1a1a2e' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              }}
            >
              👨 Мужской
            </button>
            <button
              onClick={() => setGender('f')}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: gender === 'f' ? '#ffd700' : 'transparent',
                color: gender === 'f' ? '#1a1a2e' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              }}
            >
              👩 Женский
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px 40px' }}>
          {selectedCategory.phrases.map((phrase) => {
            const isF = gender === 'f' && phrase.hebrewF;
            const hebrew = isF ? phrase.hebrewF! : phrase.hebrew;
            const transliteration = isF ? (phrase.transliterationF ?? phrase.transliteration) : phrase.transliteration;
            const translation = isF ? (phrase.translationF ?? phrase.translation) : phrase.translation;
            const hasVariant = Boolean(phrase.hebrewF);

            return (
              <div
                key={phrase.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <button
                  onClick={() => playAudio(hebrew)}
                  style={{
                    background: 'rgba(255,215,0,0.15)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    color: '#ffd700',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                  title="Прослушать"
                >
                  🔊
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 600,
                      color: '#fff',
                      margin: '0 0 4px',
                      direction: 'rtl',
                      fontFamily: '"Noto Sans Hebrew", "Segoe UI", sans-serif',
                    }}
                  >
                    {hebrew}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 2px' }}>
                    [{transliteration}]
                  </p>
                  <p style={{ color: '#fcd34d', fontSize: '1rem', margin: 0 }}>
                    {translation}
                  </p>
                  {hasVariant && (
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: '0.8rem',
                        margin: '4px 0 0',
                      }}
                    >
                      {gender === 'm' ? '👨 м.р.' : '👩 ж.р.'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Phrase Builder Game ──
  if (mode === 'builder') {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle} style={{ fontSize: '1.8rem' }}>
            🧩 Собери фразу
          </h1>
          <p className={styles.heroSub}>
            Собери ивритскую фразу из слов в правильном порядке
          </p>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 40px' }}>
          <PhraseBuilderGame onBack={() => setMode('games')} />
        </div>
      </div>
    );
  }

  // ── Games menu ──
  if (mode === 'games') {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <button
            onClick={() => setMode('categories')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '8px 20px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: 16,
            }}
          >
            ← Назад
          </button>
          <h1 className={styles.heroTitle}>🎮 Игры с фразами</h1>
          <p className={styles.heroSub}>
            Закрепи знания с помощью интерактивных игр
          </p>
        </div>

        <div className={styles.grid}>
          <div
            className={`${styles.card} ${styles.unlocked}`}
            onClick={() => setMode('builder')}
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.cardIcon}>🧩</span>
            <h3 className={styles.cardTitle}>Собери фразу</h3>
            <p className={styles.cardDesc}>
              Перетаскивай слова в правильном порядке. В пуле есть слова мужского и женского рода — будь внимателен!
            </p>
            <span className={styles.goBtn}>Играть →</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main categories view ──
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: '8px 20px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: 16,
          }}
        >
          ← На главную
        </button>
        <h1 className={styles.heroTitle}>🗣️ Разговорные фразы</h1>
        <p className={styles.heroSub}>
          Выбери категорию и учи полезные фразы для реальной жизни
        </p>
      </div>

      <div className={styles.grid}>
        {PHRASE_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={`${styles.card} ${styles.unlocked}`}
            onClick={() => { setSelectedCategory(cat); setMode('category'); }}
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.cardIcon}>{cat.icon}</span>
            <h3 className={styles.cardTitle}>{cat.name}</h3>
            <p className={styles.cardDesc}>{cat.phrases.length} фраз</p>
            <span className={styles.goBtn}>Открыть →</span>
          </div>
        ))}

        {/* Games card */}
        <div
          className={`${styles.card} ${styles.unlocked}`}
          onClick={() => setMode('games')}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.cardIcon}>🎮</span>
          <h3 className={styles.cardTitle}>Игры</h3>
          <p className={styles.cardDesc}>Закрепи знания в игровой форме</p>
          <span className={styles.goBtn}>Играть →</span>
        </div>
      </div>
    </div>
  );
};

export default PhrasesPage;