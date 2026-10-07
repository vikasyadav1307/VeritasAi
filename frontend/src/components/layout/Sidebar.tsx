import { NavLink, useLocation } from 'react-router-dom';
import {
  Sparkles,
  BarChart2,
  Shield,
  Settings,
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  HeartPulse,
  Gauge,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  adminSubNav?: string;
  onSelectAdminTab?: (tab: string) => void;
}

export function Sidebar({ isOpen, onClose, adminSubNav, onSelectAdminTab }: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const mainItems = [
    { to: '/analyze', label: 'Analyze', icon: Sparkles },
    { to: '/insights', label: 'Insights', icon: BarChart2 },
  ];

  const adminItems = [
    { to: '/admin', label: 'Admin Panel', icon: Shield },
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'logs', label: 'Analysis Logs', icon: FileText },
    { id: 'models', label: 'Model Status', icon: Activity },
    { id: 'health', label: 'System Health', icon: HeartPulse },
    { id: 'ratelimits', label: 'Rate Limits', icon: Gauge },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <NavLink to="/analyze" className={styles.brand} onClick={onClose}>
          <div className={styles.logoBox}>V</div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>VeritasAI</span>
            <span className={styles.tagline}>Truth Beyond Language</span>
          </div>
        </NavLink>

        <nav className={styles.nav}>
          <span className={styles.sectionLabel}>Main</span>
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <span className={styles.sectionLabel}>Admin</span>
          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Contextual Admin Sub-navigation when on /admin */}
          {isAdminRoute && onSelectAdminTab && (
            <div style={{
              marginTop: 'var(--space-2)',
              paddingTop: 'var(--space-2)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              <span className={styles.sectionLabel} style={{ paddingTop: '4px' }}>Admin Views</span>
              {adminTabs.map((tab) => {
                const isSelected = adminSubNav === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      onSelectAdminTab(tab.id);
                      if (onClose) onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      fontSize: 'var(--text-xs)',
                      fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <Icon size={15} style={{ color: isSelected ? 'var(--color-primary-400)' : 'inherit' }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        <div className={styles.bottomSection}>
          <NavLink
            to="/insights"
            className={styles.navItem}
            onClick={onClose}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>

          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {(user?.username?.[0] || 'V').toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {user?.username || 'vikasyadav'}
              </div>
              <div className={styles.userRole}>
                {isAdminRoute ? 'Admin' : 'Free Plan'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
