import { Search } from 'lucide-react';

export default function AnalyzePage() {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>Analyze Content</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
        Enter text, a URL, or upload an image to detect fake news and analyze sentiment.
      </p>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
      }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-1)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 'var(--space-3)',
        }}>
          {['Text', 'URL', 'Image'].map((tab, i) => (
            <button
              key={tab}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: i === 0 ? 'var(--font-semibold)' : 'var(--font-normal)',
                color: i === 0 ? 'var(--color-primary-400)' : 'var(--text-secondary)',
                background: i === 0 ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Text input */}
        <textarea
          placeholder="Enter or paste the text you want to analyze..."
          aria-label="Text to analyze"
          rows={8}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-normal)',
          }}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-4)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Explanation
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="checkbox" /> Summary
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="checkbox" /> Translation
            </label>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-6)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <Search size={16} />
            Analyze
          </button>
        </div>
      </div>

      {/* Results placeholder */}
      <div style={{
        marginTop: 'var(--space-8)',
        padding: 'var(--space-12)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-xl)',
      }}>
        <Search size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>
          Results will appear here
        </p>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Enter text and click Analyze to get started
        </p>
      </div>
    </div>
  );
}
