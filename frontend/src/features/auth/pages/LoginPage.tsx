import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
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
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useThemeStore } from '../../../store/theme.store';
import { loginUser } from '../../../services/api';
import styles from './LoginPage.module.css';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { theme, toggleTheme } = useThemeStore();

  const [serverError, setServerError] = useState<string | null>(null);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setSocialNotice(null);
    try {
      const response = await loginUser(data);
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

        if (status === 401) {
          const detail = typeof data?.detail === 'string' ? data.detail : '';
          setServerError(detail || 'Invalid email or password.');
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

  const handleSocialClick = (provider: string) => {
    setSocialNotice(`${provider} single sign-on is not configured on this server yet.`);
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
            A rigorous verification workstation for investigative journalism, research teams,
            and analysts evaluating multilingual claims and misinformation patterns.
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

        {/* Right Side: Login Card */}
        <section className={styles.rightLoginSection}>
          <div className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardKicker}>AUTHENTICATION</div>
              <h2 className={styles.cardTitle}>Sign in to VeritasAI</h2>
              <p className={styles.cardSubtitle}>Access your analysis workspace and research records</p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className={styles.serverAlert} role="alert">
                <AlertCircle size={15} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Social notice if clicked */}
            {socialNotice && (
              <div
                className={styles.serverAlert}
                style={{
                  background: 'rgba(242, 169, 59, 0.12)',
                  borderColor: 'rgba(242, 169, 59, 0.3)',
                  color: '#F2A93B',
                }}
                role="status"
              >
                <AlertCircle size={15} />
                <span>{socialNotice}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="login-email" className={styles.inputLabel}>
                  Email address
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Mail size={15} />
                  </span>
                  <input
                    id="login-email"
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
                <label htmlFor="login-password" className={styles.inputLabel}>
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Lock size={15} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    autoComplete="current-password"
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

              <div className={styles.forgotPasswordRow}>
                <button
                  type="button"
                  onClick={() =>
                    setServerError(
                      'Please contact your organization administrator to reset credentials.'
                    )
                  }
                  className={styles.forgotPasswordLink}
                >
                  Forgot password?
                </button>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={15} />
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
                  onClick={() => handleSocialClick('Google')}
                  className={styles.socialBtn}
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
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialClick('GitHub')}
                  className={styles.socialBtn}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Register Navigation */}
              <div className={styles.registerText}>
                <span>Need researcher credentials?</span>
                <Link to="/register" className={styles.registerLink}>
                  Request Access
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>

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
