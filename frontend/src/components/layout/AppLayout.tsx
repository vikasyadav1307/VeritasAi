import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.appShell}>
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className={styles.mainLayout}>
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen((p) => !p)}
        />
        <main id="main-content" className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
