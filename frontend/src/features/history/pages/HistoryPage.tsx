import { History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>Analysis History</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
        View and manage your past analyses.
      </p>

      <div style={{
        padding: 'var(--space-12)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-xl)',
      }}>
        <History size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>
          No analyses yet
        </p>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Your analysis history will appear here. Coming in Phase 2.
        </p>
      </div>
    </div>
  );
}
