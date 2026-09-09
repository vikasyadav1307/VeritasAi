import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RotateCw,
  ArrowRight,
  ExternalLink,
  X,
  Globe,
  Smile,
  Frown,
  Meh,
  Search,
} from 'lucide-react';
import {
  getDashboardSummary,
  type DashboardSummary,
  type HistoryItem,
} from '../../../services/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummary();
      if (isMountedRef.current) setSummary(data);
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error ? err.message : 'Failed to load dashboard metrics.';
        setError(message);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!selectedItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  const formatProcessingTime = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${Math.round(ms)}ms`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Real-time aggregate intelligence computed from verified PostgreSQL analysis records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={fetchSummary}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <RotateCw
              size={15}
              style={{
                animation: loading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>Refresh</span>
          </button>

          <Link
            to="/analyze"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))',
              borderRadius: 'var(--radius-md)',
              color: '#FFFFFF',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Search size={15} />
            <span>New Analysis</span>
          </Link>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-fake)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              {error}
            </span>
          </div>
          <button
            onClick={fetchSummary}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-1) var(--space-3)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && !summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                height: '110px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  width: '40%',
                  height: '14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <div
                style={{
                  width: '60%',
                  height: '24px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && summary && summary.total_analyses === 0 && (
        <div
          style={{
            padding: 'var(--space-16)',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <Activity
            size={48}
            style={{
              margin: '0 auto var(--space-4)',
              color: 'var(--color-primary-400)',
              opacity: 0.6,
            }}
          />
          <h2
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            No Analyses Recorded Yet
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              maxWidth: '480px',
              margin: '0 auto var(--space-6)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Analyze your first news article or statement with the XLM-RoBERTa transformer
            model to see live credibility distribution, sentiment trends, and telemetry here.
          </p>
          <Link
            to="/analyze"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-6)',
              background: 'var(--color-primary-600)',
              borderRadius: 'var(--radius-md)',
              color: '#FFFFFF',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            Start First Analysis
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ── Active Dashboard Content ── */}
      {summary && summary.total_analyses > 0 && (
        <>
          {/* ── Row 1: KPI Stat Cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {/* 1. Total Analyses */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Total Analyses
                </span>
                <Activity size={18} style={{ color: 'var(--color-primary-400)' }} />
              </div>
              <p
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {summary.total_analyses.toLocaleString()}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Active database records
              </p>
            </div>

            {/* 2. Real News Detected */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Real Detected
                </span>
                <CheckCircle2 size={18} style={{ color: 'var(--color-real)' }} />
              </div>
              <p
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--color-real)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {summary.credibility_distribution.real_count}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {summary.credibility_distribution.real_percentage}% of all records
              </p>
            </div>

            {/* 3. Fake News Detected */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Fake Detected
                </span>
                <AlertTriangle size={18} style={{ color: 'var(--color-fake)' }} />
              </div>
              <p
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--color-fake)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {summary.credibility_distribution.fake_count}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {summary.credibility_distribution.fake_percentage}% of all records
              </p>
            </div>

            {/* 4. Avg Confidence */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Avg Confidence
                </span>
                <ShieldCheck size={18} style={{ color: 'var(--color-primary-400)' }} />
              </div>
              <p
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {summary.average_confidence}%
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Across both models
              </p>
            </div>

            {/* 5. Avg Response Time */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Avg Latency
                </span>
                <Clock size={18} style={{ color: 'var(--color-primary-400)' }} />
              </div>
              <p
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {formatProcessingTime(summary.average_processing_time_ms)}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Inference execution time
              </p>
            </div>
          </div>

          {/* ── Row 2: Visual Distribution Charts ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {/* Credibility Distribution Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    Credibility Distribution
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Real vs. Fake news classification balance
                  </p>
                </div>
              </div>

              {/* Stacked Ratio Bar */}
              <div
                style={{
                  width: '100%',
                  height: '24px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  display: 'flex',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    width: `${summary.credibility_distribution.real_percentage}%`,
                    background: 'var(--color-real)',
                    transition: 'width var(--transition-slow)',
                  }}
                  title={`Real: ${summary.credibility_distribution.real_percentage}%`}
                />
                <div
                  style={{
                    width: `${summary.credibility_distribution.fake_percentage}%`,
                    background: 'var(--color-fake)',
                    transition: 'width var(--transition-slow)',
                  }}
                  title={`Fake: ${summary.credibility_distribution.fake_percentage}%`}
                />
              </div>

              {/* Legend & Exact Figures */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderLeft: '4px solid var(--color-real)',
                  }}
                >
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Verified Real
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--color-real)',
                    }}
                  >
                    {summary.credibility_distribution.real_count}{' '}
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                      ({summary.credibility_distribution.real_percentage}%)
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderLeft: '4px solid var(--color-fake)',
                  }}
                >
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Flagged Fake
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--color-fake)',
                    }}
                  >
                    {summary.credibility_distribution.fake_count}{' '}
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                      ({summary.credibility_distribution.fake_percentage}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Sentiment Distribution Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    Sentiment Distribution
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Emotion spectrum across analyzed text records
                  </p>
                </div>
              </div>

              {/* Stacked Sentiment Bar */}
              <div
                style={{
                  width: '100%',
                  height: '24px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  display: 'flex',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    width: `${summary.sentiment_distribution.positive_percentage}%`,
                    background: 'var(--color-positive)',
                    transition: 'width var(--transition-slow)',
                  }}
                  title={`Positive: ${summary.sentiment_distribution.positive_percentage}%`}
                />
                <div
                  style={{
                    width: `${summary.sentiment_distribution.negative_percentage}%`,
                    background: 'var(--color-negative)',
                    transition: 'width var(--transition-slow)',
                  }}
                  title={`Negative: ${summary.sentiment_distribution.negative_percentage}%`}
                />
                <div
                  style={{
                    width: `${summary.sentiment_distribution.neutral_percentage}%`,
                    background: 'var(--color-neutral)',
                    transition: 'width var(--transition-slow)',
                  }}
                  title={`Neutral: ${summary.sentiment_distribution.neutral_percentage}%`}
                />
              </div>

              {/* Legend & Figures */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    borderLeft: '3px solid var(--color-positive)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <Smile size={13} style={{ color: 'var(--color-positive)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Pos</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-positive)' }}>
                    {summary.sentiment_distribution.positive_count}{' '}
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      ({summary.sentiment_distribution.positive_percentage}%)
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    borderLeft: '3px solid var(--color-negative)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <Frown size={13} style={{ color: 'var(--color-negative)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Neg</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-negative)' }}>
                    {summary.sentiment_distribution.negative_count}{' '}
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      ({summary.sentiment_distribution.negative_percentage}%)
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    borderLeft: '3px solid var(--color-neutral)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <Meh size={13} style={{ color: 'var(--color-neutral)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Neu</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                    {summary.sentiment_distribution.neutral_count}{' '}
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      ({summary.sentiment_distribution.neutral_percentage}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 3: Language Distribution & Details ── */}
          {summary.language_distribution && summary.language_distribution.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <Globe size={18} style={{ color: 'var(--color-primary-400)' }} />
                <h3
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Language Distribution
                </h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                {summary.language_distribution.map((lang) => (
                  <div
                    key={lang.language}
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--text-primary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {lang.language}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {lang.count} ({lang.percentage}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--border-color)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${lang.percentage}%`,
                          height: '100%',
                          background: 'var(--color-primary-500)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Row 4: Recent Analyses ── */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-5) var(--space-6)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  Recent Analyses
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Latest verified records submitted to the pipeline
                </p>
              </div>

              <Link
                to="/history"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-primary-400)',
                  textDecoration: 'none',
                }}
              >
                View All in History
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* List */}
            <div>
              {summary.recent_analyses.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom:
                      idx < summary.recent_analyses.length - 1
                        ? '1px solid var(--border-color)'
                        : 'none',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <p
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--space-1)',
                        lineHeight: 'var(--leading-snug)',
                      }}
                    >
                      {item.original_text.length > 95
                        ? `${item.original_text.substring(0, 95)}...`
                        : item.original_text}
                    </p>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {formatDate(item.created_at)} • {formatProcessingTime(item.processing_time_ms)}
                    </span>
                  </div>

                  {/* Badges and Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                    }}
                  >
                    {/* Credibility Badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-semibold)',
                        background:
                          item.credibility_label === 'Real'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          item.credibility_label === 'Real'
                            ? 'var(--color-real)'
                            : 'var(--color-fake)',
                        border:
                          item.credibility_label === 'Real'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      {item.credibility_label === 'Real' ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <AlertTriangle size={12} />
                      )}
                      {item.credibility_label} ({(item.credibility_score * 100).toFixed(0)}%)
                    </span>

                    {/* Sentiment Badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-semibold)',
                        background:
                          item.sentiment_label === 'Positive'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : item.sentiment_label === 'Negative'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(107, 114, 128, 0.15)',
                        color:
                          item.sentiment_label === 'Positive'
                            ? 'var(--color-positive)'
                            : item.sentiment_label === 'Negative'
                            ? 'var(--color-negative)'
                            : 'var(--color-neutral)',
                      }}
                    >
                      {item.sentiment_label}
                    </span>

                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedItem(item)}
                      title="Inspect record"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 'var(--space-1) var(--space-3)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-medium)',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <ExternalLink size={12} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Detail Inspection Modal ── */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 'var(--z-modal)',
            padding: 'var(--space-4)',
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-inspection-modal-title"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--space-6)',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div>
                <h3
                  id="dashboard-inspection-modal-title"
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Analysis Inspection
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedItem.id}</code> • {formatDate(selectedItem.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scores Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
              }}
            >
              {/* Credibility Card */}
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  border:
                    selectedItem.credibility_label === 'Real'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  CREDIBILITY
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-bold)',
                    color:
                      selectedItem.credibility_label === 'Real'
                        ? 'var(--color-real)'
                        : 'var(--color-fake)',
                  }}
                >
                  {selectedItem.credibility_label}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {(selectedItem.credibility_score * 100).toFixed(1)}% confidence
                </p>
              </div>

              {/* Sentiment Card */}
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  SENTIMENT
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-bold)',
                    color:
                      selectedItem.sentiment_label === 'Positive'
                        ? 'var(--color-positive)'
                        : selectedItem.sentiment_label === 'Negative'
                        ? 'var(--color-negative)'
                        : 'var(--text-primary)',
                  }}
                >
                  {selectedItem.sentiment_label}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {(selectedItem.sentiment_score * 100).toFixed(1)}% confidence
                </p>
              </div>
            </div>

            {/* Processing Telemetry */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <span>Execution Time: <strong>{formatProcessingTime(selectedItem.processing_time_ms)}</strong></span>
              <span>Language: <strong>{selectedItem.detected_language}</strong></span>
              <span>Modality: <strong>{selectedItem.input_type}</strong></span>
            </div>

            {/* Submitted Text Content */}
            <div>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Submitted Text ({selectedItem.original_text.length} characters)
              </p>
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 'var(--leading-relaxed)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  color: 'var(--text-primary)',
                }}
              >
                {selectedItem.original_text}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: 'var(--space-2) var(--space-5)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
