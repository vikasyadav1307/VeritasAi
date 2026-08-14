import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
        Sign in to your account
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email address"
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
            }}
          />
        </div>

        <button
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            border: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          Sign In
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--color-primary-400)' }}>
          Register
        </Link>
      </p>
    </div>
  );
}
