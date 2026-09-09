import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { loginUser } from '../../../services/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
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

  return (
    <div>
      <p
        style={{
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center',
        }}
      >
        Sign in to your account
      </p>

      {serverError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#ef4444',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <div>
          <label htmlFor="login-email" className="sr-only">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            disabled={isSubmitting}
            {...register('email')}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-elevated)',
              border: `1px solid ${errors.email ? '#ef4444' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />
          {errors.email && (
            <p
              style={{
                color: '#ef4444',
                fontSize: 'var(--text-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="sr-only">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            disabled={isSubmitting}
            {...register('password')}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-elevated)',
              border: `1px solid ${errors.password ? '#ef4444' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />
          {errors.password && (
            <p
              style={{
                color: '#ef4444',
                fontSize: 'var(--text-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            background: isSubmitting
              ? 'var(--bg-elevated)'
              : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-sm)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            border: 'none',
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={16} />
              Sign In
            </>
          )}
        </button>
      </form>

      <p
        style={{
          textAlign: 'center',
          marginTop: 'var(--space-6)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--color-primary-400)' }}>
          Register
        </Link>
      </p>
    </div>
  );
}
