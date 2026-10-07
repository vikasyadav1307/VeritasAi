import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  LogOut,
  LogIn,
  Search,
  Bell,
  Menu,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import { logoutUser } from '../../services/api';
import styles from './Header.module.css';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function Header({
  onToggleMobileMenu,
  searchQuery = '',
  onSearchChange,
}: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await logoutUser();
    navigate('/login', { replace: true });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/insights?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className={styles.header}>
      {/* ── Left: Menu toggle + Search Bar ── */}
      <div className={styles.leftSection}>
        <button
          className={styles.menuBtn}
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search analyses, topics, or users..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Global search input"
          />
          <span className={styles.searchShortcut}>⌘K</span>
        </div>
      </div>

      {/* ── Right: Theme + Notifications + User Avatar ── */}
      <div className={styles.rightSection}>
        {/* Theme toggle */}
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications Popover */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowNotifications((p) => !p)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={17} />
            <span className={styles.notificationPing} />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-card)',
                backdropFilter: 'blur(20px)',
                zIndex: 110,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                  Notifications
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary-400)', cursor: 'pointer' }}>
                  Mark all read
                </span>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  gap: 'var(--space-3)',
                }}>
                  <ShieldCheck size={16} style={{ color: 'var(--color-real)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)', margin: 0 }}>
                      System models verified
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      XLM-RoBERTa models active • 5m ago
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  gap: 'var(--space-3)',
                }}>
                  <AlertCircle size={16} style={{ color: 'var(--color-fake)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)', margin: 0 }}>
                      High-confidence fake detected
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Article flagged with 94.2% confidence • 25m ago
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  gap: 'var(--space-3)',
                }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--color-primary-400)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)', margin: 0 }}>
                      Database backup completed
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Automated snapshot verified • 2h ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        {isAuthenticated && user ? (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className={styles.userBtn}
              onClick={() => setShowDropdown((prev) => !prev)}
              aria-label="User account menu"
              aria-expanded={showDropdown}
            >
              <div className={styles.avatarPill}>
                {(user.username?.[0] || 'V').toUpperCase()}
              </div>
              <span className={styles.usernameText}>{user.username}</span>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s',
                  transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                }}
              />
            </button>

            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '220px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-card)',
                  backdropFilter: 'blur(20px)',
                  zIndex: 110,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {user.full_name || user.username}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      margin: '2px 0 0',
                    }}
                  >
                    {user.email}
                  </p>
                </div>

                <div style={{ padding: 'var(--space-2)' }}>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/insights');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-xs)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    Personal Insights
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/admin');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-xs)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    Admin Dashboard
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', padding: 'var(--space-2)' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-fake)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-medium)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className={styles.userBtn}
            onClick={() => navigate('/login')}
          >
            <LogIn size={15} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
