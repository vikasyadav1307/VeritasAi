import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
        Create your account
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <input
          type="text"
          placeholder="Full name"
          aria-label="Full name"
          style={{
            width: '100%', padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)', outline: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Username"
          aria-label="Username"
          style={{
            width: '100%', padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)', outline: 'none',
          }}
        />
        <input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          style={{
            width: '100%', padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)', outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          aria-label="Password"
          style={{
            width: '100%', padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)', outline: 'none',
          }}
        />

        <button
          style={{
            width: '100%', padding: 'var(--space-3)',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            color: 'white', borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)',
            cursor: 'pointer', border: 'none',
          }}
        >
          Create Account
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary-400)' }}>Sign in</Link>
      </p>
    </div>
  );
}
