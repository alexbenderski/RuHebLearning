import React, { useState } from 'react';
import styles from './StoryMode.module.css';

interface Slide {
  emoji: string;
  accentColor: string;
  title: string;
  text: string;
}

const buildSlides = (name: string): Slide[] => [
  {
    emoji: '✈️',
    accentColor: '#3b82f6',
    title: 'Добро пожаловать в Израиль!',
    text:
      `Меня зовут ${name}. Несколько месяцев назад я переехал из Москвы в Тель-Авив. ` +
      'Я совсем не знал иврит, и каждый день был настоящим испытанием...',
  },
  {
    emoji: '🤔',
    accentColor: '#8b5cf6',
    title: 'Первые трудности',
    text:
      'В супермаркете, в автобусе, на работе — везде звучала эта странная, но красивая речь. ' +
      'Я решил: пора учиться! Но как? С чего начать?',
  },
  {
    emoji: '📚',
    accentColor: '#10b981',
    title: 'Начало пути',
    text:
      'Я нашёл это приложение. Здесь я буду учить иврит шаг за шагом — ' +
      'слово за словом, уровень за уровнем. Присоединяйся к моему путешествию!',
  },
  {
    emoji: '🎯',
    accentColor: '#ffd700',
    title: 'Наша цель',
    text:
      'Вместе мы освоим иврит: буквы, слова, фразы и целые разговоры. ' +
      'Каждый пройденный уровень — это шаг к настоящей жизни в Израиле!',
  },
];

interface StoryModeProps {
  onComplete?: () => void;
  narratorName?: string;
}

const StoryMode: React.FC<StoryModeProps> = ({ onComplete, narratorName = 'Друг' }) => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const slides = buildSlides(narratorName);

  const navigate = (direction: 1 | -1) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => c + direction);
      setAnimating(false);
    }, 260);
  };

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div className={styles.container}>
      {/* decorative Hebrew watermark */}
      <span className={styles.watermark} aria-hidden>אִבְרִית</span>

      <div
        className={`${styles.card} ${animating ? styles.cardExit : styles.cardEnter}`}
        style={{ borderTopColor: slide.accentColor }}
      >
        {/* dot indicators */}
        <div className={styles.dots}>
          {slides.map((s, i) => (
            <span
              key={i}
              className={styles.dot}
              style={i === current ? { background: s.accentColor, width: 24 } : undefined}
            />
          ))}
        </div>

        {/* slide content */}
        <span className={styles.emoji}>{slide.emoji}</span>
        <h2 className={styles.title}>{slide.title}</h2>
        <p className={styles.text}>{slide.text}</p>

        {/* narrator tag */}
        <div className={styles.narrator}>
          <div className={styles.narratorAvatar}>{narratorName.charAt(0).toUpperCase() || 'Я'}</div>
          <span className={styles.narratorName}>{narratorName} рассказывает</span>
        </div>

        {/* navigation */}
        <div className={styles.actions}>
          {current > 0 && (
            <button className={styles.btnSecondary} onClick={() => navigate(-1)}>
              ← Назад
            </button>
          )}
          <button
            className={styles.btnPrimary}
            style={{ background: `linear-gradient(135deg, ${slide.accentColor}cc, ${slide.accentColor})` }}
            onClick={isLast ? onComplete : () => navigate(1)}
          >
            {isLast ? '🚀 Начать обучение!' : 'Далее →'}
          </button>
        </div>
      </div>

      <p className={styles.hint}>Вводная история</p>
    </div>
  );
};

export default StoryMode;
