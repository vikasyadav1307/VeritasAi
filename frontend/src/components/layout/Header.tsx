import { Moon, Sun, User } from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';
import styles from './Header.module.css';

export function Header() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>V</div>
        <span>VeritasAI</span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className={styles.userMenu}>
          <User size={18} />
          <span>Guest</span>
        </button>
      </div>
    </header>
  );
}
