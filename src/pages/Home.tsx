import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryMode from '../components/story/StoryMode';
import { getModuleProgressMap, getRecentProgressEvents } from '../firebase/userService';
import type { ModuleProgress, ProgressEvent } from '../types';
import styles from './Home.module.css';

const MODULES = [
  { icon: '🔤', title: 'Алфавит', desc: 'Буквы и звуки', ready: true,  path: '/alphabet' },
  { icon: '💬', title: 'Слова',   desc: 'Базовая лексика', ready: true, path: '/words'    },
  { icon: '🗂️', title: 'My words list', desc: 'Личные слова и тренировка', ready: true, path: '/my-words' },
  { icon: '🗣️', title: 'Фразы',   desc: 'Разговорная речь', ready: false },
  { icon: '📝', title: 'Грамматика', desc: 'Структура языка', ready: true, path: '/grammar' },
  { icon: '📖', title: 'Словарь', desc: 'Русско-ивритский словарь', ready: true, path: '/dictionary' },
];

interface HomeProps {
  userId: string;
  userName: string;
}

const Home: React.FC<HomeProps> = ({ userId, userName }) => {
  const introKey = `ruhebstudy_intro_seen_${userId}`;
  const hasSeenIntro = localStorage.getItem(introKey) === '1';
  const [storyDone, setStoryDone] = useState(hasSeenIntro);
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
  const [recentEvents, setRecentEvents] = useState<ProgressEvent[]>([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    Promise.all([
      getModuleProgressMap(userId),
      getRecentProgressEvents(userId, 8),
    ])
      .then(([progressMap, events]) => {
        setModuleProgress(progressMap);
        setRecentEvents(events);
      })
      .catch((err) => console.error('[home progress]', err));
  }, [userId]);

  if (!storyDone) {
    return (
      <StoryMode
        narratorName={userName}
        onComplete={() => {
          localStorage.setItem(introKey, '1');
          setStoryDone(true);
        }}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Выбери раздел</h1>
        <p className={styles.heroSub}>
          {hasSeenIntro
            ? `Добро пожаловать назад, ${userName}! Продолжим путь к свободному ивриту.`
            : 'Каждый модуль — новый шаг к свободному ивриту'}
        </p>
      </div>

      <div className={styles.grid}>
        {MODULES.map((m) => (
          <div
            key={m.title}
            className={`${styles.card} ${!m.ready ? styles.locked : styles.unlocked}`}
            onClick={() => m.ready && m.path && navigate(m.path)}
          >
            <span className={styles.cardIcon}>{m.icon}</span>
            <h3 className={styles.cardTitle}>{m.title}</h3>
            <p className={styles.cardDesc}>{m.ready ? m.desc : 'Скоро!'}</p>
            {!m.ready && <span className={styles.lockBadge}>🔒</span>}
            {m.ready && <span className={styles.goBtn}>Начать →</span>}
          </div>
        ))}
      </div>

      <div className={styles.progressPanel}>
        <h2 className={styles.progressTitle}>Твой прогресс по шагам</h2>
        <div className={styles.progressGrid}>
          {['alphabet', 'words'].map((moduleId) => {
            const item = moduleProgress[moduleId];
            const attempts = item?.attempts ?? 0;
            const correct = item?.correct ?? 0;
            const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
            return (
              <div key={moduleId} className={styles.progressCard}>
                <h3>{moduleId === 'alphabet' ? 'Алфавит' : 'Слова'}</h3>
                <p>Шагов выполнено: {item?.completedSteps?.length ?? 0}</p>
                <p>Попытки: {attempts}</p>
                <p>Точность: {accuracy}%</p>
                <p>Последний шаг: {item?.lastStep ?? 'пока нет'}</p>
              </div>
            );
          })}
        </div>

        <h3 className={styles.timelineTitle}>Последние действия</h3>
        <ul className={styles.timeline}>
          {recentEvents.length === 0 && <li>Сделай первый шаг, и он появится здесь.</li>}
          {recentEvents.map((event, idx) => (
            <li key={`${event.moduleId}-${event.stepId}-${idx}`}>
              <span className={styles.timelineModule}>{event.moduleId}</span>
              <span>{event.stepId}</span>
              {typeof event.isCorrect === 'boolean' && (
                <span className={event.isCorrect ? styles.timelineGood : styles.timelineBad}>
                  {event.isCorrect ? ' ✅' : ' ❌'}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
