import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { registerUser } from '../../../services/api';

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

const inputStyle = (hasError: boolean, disabled: boolean) => ({
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--bg-elevated)',
  border: `1px solid ${hasError ? '#ef4444' : 'var(--border-color)'}`,
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  transition: 'border-color 0.2s',
  opacity: disabled ? 0.7 : 1,
  boxSizing: 'border-box' as const,
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

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

  return (
    <div>
      <p
        style={{
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center',
        }}
      >
        Create your account
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
          <input
            type="text"
            placeholder="Full name (optional)"
            autoComplete="name"
            disabled={isSubmitting}
            aria-label="Full name"
            {...register('full_name')}
            style={inputStyle(false, isSubmitting)}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            disabled={isSubmitting}
            aria-label="Username"
            {...register('username')}
            style={inputStyle(!!errors.username, isSubmitting)}
          />
          {errors.username && (
            <p style={{ color: '#ef4444', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            disabled={isSubmitting}
            aria-label="Email address"
            {...register('email')}
            style={inputStyle(!!errors.email, isSubmitting)}
          />
          {errors.email && (
            <p style={{ color: '#ef4444', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-label="Password"
            {...register('password')}
            style={inputStyle(!!errors.password, isSubmitting)}
          />
          {errors.password && (
            <p style={{ color: '#ef4444', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
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
              Creating account...
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Create Account
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
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary-400)' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
