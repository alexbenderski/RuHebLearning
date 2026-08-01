import React from 'react';
import type { UserProfile } from '../../types';
import { signOutUser } from '../../firebase/authService';
import { useNikud } from '../../context/NikudContext';
import styles from './Navbar.module.css';

interface NavbarProps {
  userProfile: UserProfile | null;
}

const xpRequiredForLevel = (level: number) => level * 100;

const Navbar: React.FC<NavbarProps> = ({ userProfile }) => {
  const { nikudOn, toggleNikud } = useNikud();
  const level = userProfile?.currentLevel ?? 1;
  const points = userProfile?.totalPoints ?? 0;
  const xpRequired = xpRequiredForLevel(level);
  const xpInLevel = points % xpRequired;
  const xpProgress = Math.min((xpInLevel / xpRequired) * 100, 100);
  const completedCount = userProfile?.completedLevels.length ?? 0;
  const streak = userProfile?.streak ?? 0;
  const initial = userProfile?.displayName?.charAt(0).toUpperCase() ?? '?';

  return (
    <nav className={styles.navbar}>
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandLogo}>🇮🇱</span>
        <span className={styles.brandTitle}>ИвритПуть</span>
      </div>

      {/* Stats row */}
      <div className={styles.stats}>
        <div className={`${styles.badge} ${styles.badgeStreak}`}>
          <span>🔥</span>
          <span>{streak}</span>
        </div>
        <div className={`${styles.badge} ${styles.badgePoints}`}>
          <span>⭐</span>
          <span>{points.toLocaleString('ru-RU')}</span>
        </div>
        <div className={`${styles.badge} ${styles.badgeLevels}`}>
          <span>🏆</span>
          <span>{completedCount}</span>
        </div>

        {/* XP progress */}
        <div className={styles.xpBlock}>
          <div className={styles.xpLabels}>
            <span>Уровень {level}</span>
            <span className={styles.xpNumbers}>{xpInLevel}/{xpRequired} XP</span>
          </div>
          <div className={styles.xpTrack}>
            <div className={styles.xpFill} style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Nikud toggle */}
      <button
        className={`${styles.nikudBtn} ${nikudOn ? styles.nikudBtnOn : ''}`}
        onClick={toggleNikud}
        title={nikudOn ? 'Никуд включён — нажми чтобы выключить' : 'Включить никуд (знаки гласных)'}
      >
        <span className={styles.nikudBtnText}>ניקוד</span>
        <span className={styles.nikudBtnState}>{nikudOn ? 'ON' : 'OFF'}</span>
      </button>

      {/* Avatar */}
      <div className={styles.avatar}>
        <div className={styles.avatarCircle}>{initial}</div>
        <span className={styles.avatarName}>{userProfile?.displayName ?? 'Гость'}</span>
        <button className={styles.logoutBtn} onClick={() => signOutUser()}>
          Выйти
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
