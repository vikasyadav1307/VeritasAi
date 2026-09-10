import { useState, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  ThumbsUp,
  ThumbsDown,
  SlidersHorizontal,
} from 'lucide-react';
import {
  explainText,
  type ExplainResponse,
  type AttributedToken,
  type ModelExplanation,
} from '../../../services/api';

interface ExplainabilityPanelProps {
  textToExplain: string;
  title?: string;
}

type DirectionFilter = 'all' | 'supporting' | 'opposing';
type ActiveModelTab = 'credibility' | 'sentiment';

export function ExplainabilityPanel({
  textToExplain,
  title = 'Prediction Explainability',
}: ExplainabilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveModelTab>('credibility');
  const [filter, setFilter] = useState<DirectionFilter>('all');
  const [hoveredToken, setHoveredToken] = useState<AttributedToken | null>(null);

  const handleFetchExplanation = useCallback(async () => {
    if (!textToExplain || textToExplain.trim().length === 0) {
      setError('No analyzed text available to explain.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await explainText(textToExplain);
      setExplanation(data);
      setIsOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate explanation.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [textToExplain]);

  const activeExplanation: ModelExplanation | undefined = explanation
    ? activeTab === 'credibility'
      ? explanation.credibility_explanation
      : explanation.sentiment_explanation
    : undefined;

  const filteredTokens = (activeExplanation?.tokens || []).filter((tok) => {
    if (filter === 'all') return true;
    return tok.direction === filter;
  });

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        marginTop: 'var(--space-2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        transition: 'all var(--transition-normal)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          background: 'rgba(99, 102, 241, 0.05)',
          borderBottom: isOpen ? '1px solid var(--border-color)' : 'none',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-400)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
              Token-level Gradient × Input feature attribution for XLM-RoBERTa
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {!explanation && (
            <button
              type="button"
              onClick={handleFetchExplanation}
              disabled={isLoading || !textToExplain}
              data-testid="explain-prediction-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                background: isLoading
                  ? 'var(--bg-elevated)'
                  : 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Calculating Attributions…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Explain Prediction
                </>
              )}
            </button>
          )}

          {explanation && (
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label={isOpen ? 'Collapse explainability panel' : 'Expand explainability panel'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              {isOpen ? (
                <>
                  Hide Details <ChevronUp size={14} />
                </>
              ) : (
                <>
                  View Explanations <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            background: 'rgba(239, 68, 68, 0.08)',
            borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-fake)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Expanded Content */}
      {isOpen && explanation && (
        <div style={{ padding: 'var(--space-6)' }}>
          {/* Educational Disclaimer */}
          <div
            role="note"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-5)',
            }}
          >
            <Info size={16} style={{ color: 'var(--color-primary-400)', flexShrink: 0, marginTop: '2px' }} />
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Gradient × Input Attribution:</strong>{' '}
              {explanation.disclaimer}
            </p>
          </div>

          {/* Controls Bar: Model Switcher, Filters, Latency */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-5)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {/* Model Tabs */}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('credibility')}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  border: '1px solid',
                  borderColor:
                    activeTab === 'credibility' ? 'var(--color-primary-500)' : 'var(--border-color)',
                  background:
                    activeTab === 'credibility' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-elevated)',
                  color: activeTab === 'credibility' ? 'var(--color-primary-300)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Credibility ({explanation.credibility_explanation.predicted_label})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sentiment')}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  border: '1px solid',
                  borderColor:
                    activeTab === 'sentiment' ? 'var(--color-primary-500)' : 'var(--border-color)',
                  background:
                    activeTab === 'sentiment' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-elevated)',
                  color: activeTab === 'sentiment' ? 'var(--color-primary-300)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Sentiment ({explanation.sentiment_explanation.predicted_label})
              </button>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}
              >
                <SlidersHorizontal size={12} /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setFilter('all')}
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  border: '1px solid',
                  borderColor: filter === 'all' ? 'var(--color-primary-400)' : 'var(--border-color)',
                  background: filter === 'all' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                All ({activeExplanation?.tokens.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilter('supporting')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  border: '1px solid',
                  borderColor: filter === 'supporting' ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)',
                  background: filter === 'supporting' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: filter === 'supporting' ? 'var(--color-real)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <ThumbsUp size={11} /> Supporting
              </button>
              <button
                type="button"
                onClick={() => setFilter('opposing')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  border: '1px solid',
                  borderColor: filter === 'opposing' ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-color)',
                  background: filter === 'opposing' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  color: filter === 'opposing' ? 'var(--color-fake)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <ThumbsDown size={11} /> Opposing
              </button>
            </div>

            {/* Latency Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              <Clock size={12} />
              <span>
                Attribution: {activeExplanation?.latency_ms.toFixed(1)} ms (Total: {explanation.total_latency_ms.toFixed(1)} ms)
              </span>
            </div>
          </div>

          {/* Direction Key Guide */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: 'rgba(16, 185, 129, 0.3)',
                  border: '1px solid var(--color-real)',
                }}
              />
              <strong>Supporting:</strong> Positive attribution toward predicted &quot;{activeExplanation?.predicted_label}&quot;
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: 'rgba(239, 68, 68, 0.3)',
                  border: '1px solid var(--color-fake)',
                }}
              />
              <strong>Opposing:</strong> Negative attribution away from predicted &quot;{activeExplanation?.predicted_label}&quot;
            </span>
          </div>

          {/* Interactive Token Cloud */}
          <div
            data-testid="token-attribution-cloud"
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-6)',
              minHeight: '80px',
              alignItems: 'center',
            }}
          >
            {filteredTokens.length === 0 ? (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                No tokens match the selected filter.
              </span>
            ) : (
              filteredTokens.map((tok, idx) => {
                const isSupporting = tok.direction === 'supporting';
                const opacity = Math.max(0.15, tok.normalized_score);
                const bg = isSupporting
                  ? `rgba(16, 185, 129, ${opacity * 0.4})`
                  : `rgba(239, 68, 68, ${opacity * 0.4})`;
                const border = isSupporting
                  ? `rgba(16, 185, 129, ${Math.max(0.3, opacity)})`
                  : `rgba(239, 68, 68, ${Math.max(0.3, opacity)})`;
                const textCol = isSupporting ? 'var(--color-real)' : 'var(--color-fake)';

                return (
                  <button
                    key={`${tok.token}-${idx}`}
                    type="button"
                    onMouseEnter={() => setHoveredToken(tok)}
                    onMouseLeave={() => setHoveredToken(null)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'monospace',
                      color: textCol,
                      cursor: 'pointer',
                      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                    }}
                    title={`${tok.token}: score=${tok.score > 0 ? '+' : ''}${tok.score.toFixed(4)} (${tok.direction})`}
                  >
                    <span>{tok.token}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 4px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {tok.score > 0 ? '+' : ''}
                      {tok.score.toFixed(2)}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Hovered Token Details or Top Ranked Table */}
          {hoveredToken ? (
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--color-primary-500)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div>
                <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                  &quot;{hoveredToken.token}&quot;
                </strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>
                  • Raw Score: {hoveredToken.score > 0 ? '+' : ''}
                  {hoveredToken.score.toFixed(4)} • Direction:{' '}
                  <span
                    style={{
                      color:
                        hoveredToken.direction === 'supporting'
                          ? 'var(--color-real)'
                          : 'var(--color-fake)',
                      fontWeight: 'var(--font-semibold)',
                    }}
                  >
                    {hoveredToken.direction.toUpperCase()}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Influence:</span>
                <div
                  style={{
                    width: '100px',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(hoveredToken.normalized_score * 100).toFixed(0)}%`,
                      height: '100%',
                      background:
                        hoveredToken.direction === 'supporting'
                          ? 'var(--color-real)'
                          : 'var(--color-fake)',
                    }}
                  />
                </div>
                <span>{(hoveredToken.normalized_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : null}

          {/* Ranked Tokens Breakdown Table */}
          <div>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Top Influential Tokens (Ranked by Influence Magnitude)
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 'var(--space-2)',
              }}
            >
              {(activeExplanation?.tokens || []).slice(0, 8).map((tok, idx) => {
                const isSupporting = tok.direction === 'supporting';
                return (
                  <div
                    key={`rank-${tok.token}-${idx}`}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        #{idx + 1} {tok.token}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: isSupporting ? 'var(--color-real)' : 'var(--color-fake)',
                          fontWeight: 'var(--font-medium)',
                        }}
                      >
                        {isSupporting ? 'Supporting' : 'Opposing'} ({tok.score > 0 ? '+' : ''}
                        {tok.score.toFixed(3)})
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.round(tok.normalized_score * 100)}%`,
                          background: isSupporting ? 'var(--color-real)' : 'var(--color-fake)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
