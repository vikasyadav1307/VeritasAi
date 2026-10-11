import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Globe,
  Brain,
  BarChart3,
  Shield,
  FileText,
  Users,
  Sun,
  Moon,
  UserPlus,
  LogIn,
  X,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useThemeStore } from '../../../store/theme.store';
import { registerUser, loginWithGoogle, getGoogleAuthConfig } from '../../../services/api';
import styles from './LoginPage.module.css';

const registerSchema = z.object({
  full_name: z.string().max(255).optional().or(z.literal('')),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { theme, toggleTheme } = useThemeStore();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  useEffect(() => {
    getGoogleAuthConfig()
      .then((cfg) => {
        if (cfg.client_id) {
          setGoogleClientId(cfg.client_id);
        }
      })
      .catch(() => {});
  }, []);

  const handleGoogleClick = () => {
    setServerError(null);
    const google = (window as unknown as {
      google?: {
        accounts?: {
          id?: {
            initialize: (cfg: unknown) => void;
            prompt: () => void;
          };
          oauth2?: {
            initCodeClient: (cfg: {
              client_id: string;
              scope: string;
              ux_mode?: string;
              callback: (resp: { code?: string; error?: string }) => void;
              error_callback?: (err: unknown) => void;
            }) => { requestCode: () => void };
          };
        };
      };
    }).google;

    const cid = googleClientId || (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined);

    if (cid && google?.accounts) {
      if (google.accounts.oauth2?.initCodeClient) {
        try {
          const client = google.accounts.oauth2.initCodeClient({
            client_id: cid,
            scope: 'openid email profile',
            ux_mode: 'popup',
            callback: async (response) => {
              if (response.code) {
                setGoogleLoading(true);
                try {
                  const authRes = await loginWithGoogle({
                    code: response.code,
                    redirect_uri: 'postmessage',
                  });
                  setAuth(authRes.user, authRes.access_token, authRes.refresh_token);
                  navigate('/analyze', { replace: true });
                } catch {
                  setServerError('Google registration failed. Please check your credentials.');
                } finally {
                  setGoogleLoading(false);
                }
              }
            },
            error_callback: () => {
              setGoogleLoading(false);
            },
          });
          client.requestCode();
          return;
        } catch {
          // fall through
        }
      }

      if (google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: cid,
            callback: async (res: { credential?: string }) => {
              if (res.credential) {
                setGoogleLoading(true);
                try {
                  const authRes = await loginWithGoogle({ credential: res.credential });
                  setAuth(authRes.user, authRes.access_token, authRes.refresh_token);
                  navigate('/analyze', { replace: true });
                } catch {
                  setServerError('Google token validation failed.');
                } finally {
                  setGoogleLoading(false);
                }
              }
            },
          });
          google.accounts.id.prompt();
          return;
        } catch {
          // fall through
        }
      }
    }

    setIsGoogleModalOpen(true);
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const enteredEmail = watch('email');
  const enteredFullName = watch('full_name');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const payload = {
        email: data.email,
        username: data.username,
        password: data.password,
        ...(data.full_name ? { full_name: data.full_name } : {}),
      };
      const response = await registerUser(payload);
      setAuth(response.user, response.access_token, response.refresh_token);
      navigate('/analyze', { replace: true });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosErr = error as {
          response?: {
            status?: number;
            data?: { detail?: string | Array<{ msg?: string }>; error?: { message?: string } };
          };
        };

        if (!axiosErr.response) {
          setServerError('Unable to reach the server. Please try again.');
          return;
        }

        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        if (status === 409 && typeof data?.detail === 'string') {
          setServerError(data.detail);
          return;
        }

        if (status === 422) {
          if (typeof data?.detail === 'string') {
            setServerError(data.detail);
          } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
            setServerError(data.detail[0]?.msg || 'Please check your input.');
          } else {
            setServerError('Please check your input and try again.');
          }
          return;
        }

        if (status && status >= 500) {
          setServerError('Something went wrong. Please try again.');
          return;
        }

        if (typeof data?.detail === 'string' && data.detail.trim()) {
          setServerError(data.detail);
          return;
        }

        if (typeof data?.error?.message === 'string' && data.error.message.trim()) {
          setServerError(data.error.message);
          return;
        }

        setServerError('Something went wrong. Please try again.');
      } else {
        setServerError('Unable to reach the server. Please try again.');
      }
    }
  };

  const handleGoogleAuthSubmit = async (email: string, name?: string) => {
    if (!email) return;
    setGoogleLoading(true);
    setServerError(null);
    try {
      const response = await loginWithGoogle({
        email,
        full_name: name || enteredFullName || email.split('@')[0],
      });
      setAuth(response.user, response.access_token, response.refresh_token);
      setIsGoogleModalOpen(false);
      navigate('/analyze', { replace: true });
    } catch {
      setServerError('Google sign-up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ── Top Header ── */}
      <header className={styles.topBar}>
        <div className={styles.brandLogoGroup}>
          <div className={styles.brandLogoIcon}>V</div>
          <div className={styles.brandTextCol}>
            <span className={styles.brandTitle}>
              Veritas<span className={styles.brandTitleHighlight}>AI</span>
            </span>
            <span className={styles.brandTagline}>Truth Beyond Language</span>
          </div>
        </div>

        <div className={styles.topNavActions}>
          <Link to="/login" className={styles.topSignUpBtn}>
            <LogIn size={14} />
            <span>Sign In</span>
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            <div
              className={`${styles.themeSwitchTrack} ${theme === 'light' ? styles.themeSwitchTrackActive : ''}`}
            >
              <div
                className={`${styles.themeSwitchThumb} ${theme === 'light' ? styles.themeSwitchThumbActive : ''}`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* ── Main Split Container ── */}
      <main className={styles.mainSplit}>
        {/* Left Side: Product Branding */}
        <section className={styles.leftBranding}>
          <div className={styles.kicker}>
            <span>INVESTIGATION &bull; VERIFICATION &bull; RESEARCH</span>
          </div>

          <h1 className={styles.headline}>
            Detect.{' '}
            <span className={styles.accentWord}>Understand.</span>{' '}
            Verify.
          </h1>

          <p className={styles.subtitle}>
            Join analysts, researchers, and journalists worldwide using VeritasAI
            to counter misinformation across multilingual sources.
          </p>

          {/* Feature Rows */}
          <div className={styles.featuresList}>
            <div className={styles.featureRow}>
              <div className={styles.featureIconBox}>
                <Globe size={16} />
              </div>
              <div className={styles.featureContent}>
                <span className={styles.featureTitle}>Multilingual Intelligence</span>
                <span className={styles.featureDesc}>Deep evaluation across 14+ languages</span>
              </div>
            </div>

            <div className={styles.featureRow}>
              <div className={styles.featureIconBox}>
                <Brain size={16} />
              </div>
              <div className={styles.featureContent}>
                <span className={styles.featureTitle}>Feature Attribution</span>
                <span className={styles.featureDesc}>Token-level rationale for every decision</span>
              </div>
            </div>

            <div className={styles.featureRow}>
              <div className={styles.featureIconBox}>
                <BarChart3 size={16} />
              </div>
              <div className={styles.featureContent}>
                <span className={styles.featureTitle}>High Precision Baseline</span>
                <span className={styles.featureDesc}>Fine-tuned XLM-RoBERTa architecture</span>
              </div>
            </div>

            <div className={styles.featureRow}>
              <div className={styles.featureIconBox}>
                <Shield size={16} />
              </div>
              <div className={styles.featureContent}>
                <span className={styles.featureTitle}>Confidential Workspace</span>
                <span className={styles.featureDesc}>Enterprise-grade audit and isolation</span>
              </div>
            </div>
          </div>

          {/* Bottom Statistics Strip */}
          <div className={styles.statsStrip}>
            <div className={styles.statItem}>
              <FileText size={16} className={styles.statIcon} />
              <div className={styles.statNumbers}>
                <span className={styles.statValue}>12,458</span>
                <span className={styles.statLabel}>Analyses</span>
              </div>
            </div>

            <div className={styles.statItem}>
              <Users size={16} className={styles.statIcon} />
              <div className={styles.statNumbers}>
                <span className={styles.statValue}>1,320</span>
                <span className={styles.statLabel}>Active Users</span>
              </div>
            </div>

            <div className={styles.statItem}>
              <BarChart3 size={16} className={styles.statIcon} />
              <div className={styles.statNumbers}>
                <span className={styles.statValue}>98.3%</span>
                <span className={styles.statLabel}>Confidence</span>
              </div>
            </div>

            <div className={styles.statItem}>
              <Globe size={16} className={styles.statIcon} />
              <div className={styles.statNumbers}>
                <span className={styles.statValue}>14+</span>
                <span className={styles.statLabel}>Languages</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Register Card */}
        <section className={styles.rightLoginSection}>
          <div className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardKicker}>REGISTRATION</div>
              <h2 className={styles.cardTitle}>Create VeritasAI Account</h2>
              <p className={styles.cardSubtitle}>
                Get full access to verification and analysis workspaces
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className={styles.serverAlert} role="alert">
                <AlertCircle size={15} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="register-fullname" className={styles.inputLabel}>
                  Full Name (Optional)
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <User size={15} />
                  </span>
                  <input
                    id="register-fullname"
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    autoComplete="name"
                    disabled={isSubmitting}
                    className={styles.textInput}
                    {...register('full_name')}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="register-username" className={styles.inputLabel}>
                  Username
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <AtSign size={15} />
                  </span>
                  <input
                    id="register-username"
                    type="text"
                    placeholder="analyst_veritas"
                    autoComplete="username"
                    disabled={isSubmitting}
                    className={`${styles.textInput} ${errors.username ? styles.textInputError : ''}`}
                    {...register('username')}
                  />
                </div>
                {errors.username && (
                  <p className={styles.errorMessage}>{errors.username.message}</p>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="register-email" className={styles.inputLabel}>
                  Email address
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Mail size={15} />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="analyst@organization.org"
                    autoComplete="email"
                    disabled={isSubmitting}
                    className={`${styles.textInput} ${errors.email ? styles.textInputError : ''}`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className={styles.errorMessage}>{errors.email.message}</p>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="register-password" className={styles.inputLabel}>
                  Password (min. 8 characters)
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Lock size={15} />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create secure password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className={`${styles.textInput} ${errors.password ? styles.textInputError : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={styles.passwordToggle}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className={styles.errorMessage}>{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className={styles.divider}>
                <span className={styles.dividerSpan}>OR CONTINUE WITH</span>
              </div>

              {/* Social Login Buttons */}
              <div className={styles.socialRow}>
                <button
                  type="button"
                  id="register-google-btn"
                  onClick={handleGoogleClick}
                  className={styles.socialBtn}
                  disabled={googleLoading}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>
              </div>

              {/* Login Navigation */}
              <div className={styles.registerText}>
                <span>Already have an account?</span>
                <Link to="/login" className={styles.registerLink}>
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* ── Google SSO Modal ── */}
      {isGoogleModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => !googleLoading && setIsGoogleModalOpen(false)}
        >
          <div className={styles.googleModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.googleModalHeader}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsGoogleModalOpen(false)}
                disabled={googleLoading}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>

              <div className={styles.googleLogoBadge}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <h3 className={styles.googleModalTitle}>Sign up with Google</h3>
              <p className={styles.googleModalSubtitle}>Create your account instantly with Google</p>
            </div>

            <div className={styles.googleAccountList}>
              {enteredEmail && enteredEmail.includes('@') && (
                <button
                  type="button"
                  className={styles.googleAccountCard}
                  disabled={googleLoading}
                  onClick={() => handleGoogleAuthSubmit(enteredEmail, enteredFullName || enteredEmail.split('@')[0])}
                >
                  <div className={styles.googleAccountUser}>
                    <div className={styles.googleAvatar}>
                      {enteredEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.googleAccountDetails}>
                      <span className={styles.googleAccountName}>
                        {enteredFullName || enteredEmail.split('@')[0]}
                      </span>
                      <span className={styles.googleAccountEmail}>{enteredEmail}</span>
                    </div>
                  </div>
                  <Check size={16} color="#2CB7A5" />
                </button>
              )}

              {(!enteredEmail || enteredEmail !== 'analyst@veritas.ai') && (
                <button
                  type="button"
                  id="register-google-account-btn"
                  className={styles.googleAccountCard}
                  disabled={googleLoading}
                  onClick={() => handleGoogleAuthSubmit('analyst@veritas.ai', 'Veritas Analyst')}
                >
                  <div className={styles.googleAccountUser}>
                    <div className={styles.googleAvatar}>A</div>
                    <div className={styles.googleAccountDetails}>
                      <span className={styles.googleAccountName}>Veritas Analyst</span>
                      <span className={styles.googleAccountEmail}>analyst@veritas.ai</span>
                    </div>
                  </div>
                  <Check size={16} color="#2CB7A5" />
                </button>
              )}

              <div className={styles.googleDivider}>
                <span className={styles.googleDividerText}>OR USE ANOTHER GOOGLE ACCOUNT</span>
              </div>

              <div className={styles.customGoogleForm}>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  className={styles.customGoogleInput}
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  disabled={googleLoading}
                />
                <button
                  type="button"
                  className={styles.googleActionBtn}
                  disabled={googleLoading || !customGoogleEmail.includes('@')}
                  onClick={() => handleGoogleAuthSubmit(customGoogleEmail)}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Creating Account with Google...</span>
                    </>
                  ) : (
                    <span>Continue with Google Account</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span>&copy; 2026 VeritasAI Verification Platform</span>
        <span>&bull;</span>
        <span className={styles.footerLink}>Security Policy</span>
        <span>&bull;</span>
        <span className={styles.footerLink}>Documentation</span>
        <span>&bull;</span>
        <span className={styles.footerLink}>Terms</span>
      </footer>
    </div>
  );
}
