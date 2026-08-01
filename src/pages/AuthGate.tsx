import React, { useEffect, useState } from 'react';
import { completeRedirectSignIn, signInWithGoogle } from '../firebase/authService';
import styles from './AuthGate.module.css';

const AuthGate: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeRedirectSignIn().catch((err) => {
      console.error('[auth redirect]', err);
    });
  }, []);

  const handleSignIn = async () => {
    try {
      setBusy(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error('[auth sign-in]', err);
      setError('Не удалось войти. Попробуйте ещё раз.');
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🇮🇱</div>
        <h1 className={styles.title}>ИвритПуть</h1>
        <p className={styles.subtitle}>Вход обязателен для сохранения прогресса и статистики</p>

        <button
          className={styles.googleBtn}
          onClick={handleSignIn}
          disabled={busy}
        >
          {busy ? 'Подключение...' : 'Войти через Google'}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default AuthGate;
