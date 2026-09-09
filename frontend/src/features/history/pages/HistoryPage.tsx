import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Clock,
  CheckCircle,
  XCircle,
  Minus,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  FlaskConical,
  ExternalLink,
} from 'lucide-react';
import {
  getHistory,
  deleteHistory,
  type HistoryItem,
  type PaginatedHistoryResponse,
} from '../../../services/api';

function formatProcessingTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function HistoryPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<PaginatedHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistory(currentPage, 10);
      setData(response);
    } catch (err: unknown) {
      setError('Unable to load history records. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis record?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteHistory(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      await fetchHistory(page);
    } catch (err: unknown) {
      alert('Failed to delete analysis record.');
    } finally {
      setDeletingId(null);
    }
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 0;

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-8)',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
      }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Analysis History</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review, inspect, and manage your previous content analyses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={() => fetchHistory(page)}
            disabled={loading}
            title="Refresh history"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/analyze')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Search size={15} />
            Analyze New Text
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-4) var(--space-5)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-fake)' }} />
            <span style={{ color: 'var(--color-fake)', fontSize: 'var(--text-sm)' }}>
              {error}
            </span>
          </div>
          <button
            onClick={() => fetchHistory(page)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: 'var(--color-fake)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-1) var(--space-3)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && !data && (
        <div style={{
          padding: 'var(--space-12)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', margin: '0 auto var(--space-4)' }} />
          <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)' }}>
            Loading your analysis history…
          </p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && total === 0 && !error && (
        <div style={{
          padding: 'var(--space-12)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          border: '2px dashed var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-card)',
        }}>
          <History size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
            No analyses recorded yet
          </p>
          <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)', maxWidth: '400px', marginInline: 'auto' }}>
            When you analyze text content on the Analyze page, records will be automatically preserved here.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-6)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            Start Your First Analysis
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── History List View ── */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {items.map((item) => {
            const isReal = item.credibility_label === 'Real';
            const credColor = isReal ? 'var(--color-real)' : 'var(--color-fake)';
            const credBg = isReal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            const credBorder = isReal ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';

            const sentimentColorMap: Record<string, string> = {
              Positive: 'var(--color-positive)',
              Negative: 'var(--color-negative)',
              Neutral: 'var(--color-neutral)',
            };
            const sentColor = sentimentColorMap[item.sentiment_label] || 'var(--text-secondary)';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-6)',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Card Top Row: Badges & Timestamp */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {/* Credibility Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-semibold)',
                      color: credColor,
                      background: credBg,
                      border: `1px solid ${credBorder}`,
                    }}>
                      {isReal ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      {item.credibility_label} ({(item.credibility_score * 100).toFixed(1)}%)
                    </span>

                    {/* Sentiment Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-semibold)',
                      color: sentColor,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                    }}>
                      {item.sentiment_label === 'Positive' && <CheckCircle size={13} />}
                      {item.sentiment_label === 'Negative' && <XCircle size={13} />}
                      {item.sentiment_label === 'Neutral' && <Minus size={13} />}
                      {item.sentiment_label} ({(item.sentiment_score * 100).toFixed(1)}%)
                    </span>

                    {item.is_mock && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-uncertain)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}>
                        <FlaskConical size={11} /> Mock
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatProcessingTime(item.processing_time_ms)}
                    </span>
                    <span>•</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* Card Middle: Text Snippet */}
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  lineHeight: 'var(--leading-relaxed)',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {item.original_text}
                </p>

                {/* Card Bottom: Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 'var(--space-2)',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: 'var(--space-1)',
                }}>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <Eye size={13} /> Click to view full details
                  </span>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    title="Delete record"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: 'var(--text-muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-fake)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <Trash2 size={13} />
                    {deletingId === item.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* ── Pagination Controls ── */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Showing page {page} of {totalPages} ({total} total analyses)
              </span>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1 || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Inspection Modal ── */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-2xl)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'var(--space-8)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 'var(--space-4)',
            }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>
                  Analysis Details
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  ID: {selectedItem.id} • {formatDate(selectedItem.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}>
              {/* Credibility Card */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                border: selectedItem.credibility_label === 'Real'
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                  CREDIBILITY
                </p>
                <p style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--font-bold)',
                  color: selectedItem.credibility_label === 'Real' ? 'var(--color-real)' : 'var(--color-fake)',
                }}>
                  {selectedItem.credibility_label}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {(selectedItem.credibility_score * 100).toFixed(1)}% confidence
                </p>
              </div>

              {/* Sentiment Card */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                border: '1px solid var(--border-color)',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                  SENTIMENT
                </p>
                <p style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--font-bold)',
                  color: selectedItem.sentiment_label === 'Positive'
                    ? 'var(--color-positive)'
                    : selectedItem.sentiment_label === 'Negative'
                    ? 'var(--color-negative)'
                    : 'var(--text-primary)',
                }}>
                  {selectedItem.sentiment_label}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {(selectedItem.sentiment_score * 100).toFixed(1)}% confidence
                </p>
              </div>
            </div>

            {/* Processing Telemetry */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-4)',
            }}>
              <span>Execution Time: <strong>{formatProcessingTime(selectedItem.processing_time_ms)}</strong></span>
              <span>Language: <strong>{selectedItem.detected_language}</strong></span>
              <span>Modality: <strong>{selectedItem.input_type}</strong></span>
            </div>

            {/* Source URL & Title (for URL analyses) */}
            {selectedItem.source_url && (
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-4)',
              }}>
                {selectedItem.title && (
                  <div style={{ marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-muted)' }}>TITLE: </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-medium)' }}>
                      {selectedItem.title}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-muted)', flexShrink: 0 }}>
                    SOURCE URL:
                  </span>
                  <a
                    href={selectedItem.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-primary-400)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedItem.source_url}
                    <ExternalLink size={12} style={{ flexShrink: 0 }} />
                  </a>
                </div>
              </div>
            )}

            {/* Submitted Text Content */}
            <div>
              <p style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-2)',
              }}>
                Submitted Text Content ({selectedItem.original_text.length} characters)
              </p>
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--leading-relaxed)',
                whiteSpace: 'pre-wrap',
                maxHeight: '260px',
                overflowY: 'auto',
                color: 'var(--text-primary)',
              }}>
                {selectedItem.original_text}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-color)',
            }}>
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
