import { BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
        Analytics and insights from your analyses.
      </p>

      {/* Stat cards placeholder */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        {[
          { label: 'Total Analyses', value: '—' },
          { label: 'Fake Detected', value: '—' },
          { label: 'Real Detected', value: '—' },
          { label: 'Avg Response', value: '—' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        padding: 'var(--space-12)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-xl)',
      }}>
        <BarChart3 size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>
          Charts coming in Phase 4
        </p>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Trend charts, language distribution, and more.
        </p>
      </div>
    </div>
  );
}
