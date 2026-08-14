import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.authLayout}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>V</div>
          <h1 className={styles.authTitle}>VeritasAI</h1>
          <p className={styles.authSubtitle}>
            Multilingual Fake News Detection
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
