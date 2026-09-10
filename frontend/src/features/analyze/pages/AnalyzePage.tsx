import { useState, useCallback, useRef } from 'react';
import {
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  Trash2,
  Clock,
  FlaskConical,
  Link as LinkIcon,
  ExternalLink,
  Globe,
  Newspaper,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Copy,
  Check,
} from 'lucide-react';
import {
  analyzeText,
  analyzeUrl,
  analyzeImage,
  type AnalyzeResponse,
  type AnalyzeUrlResponse,
  type AnalyzeImageResponse,
} from '../../../services/api';
import { ExplainabilityPanel } from '../components/ExplainabilityPanel';
import { TranslationPanel } from '../components/TranslationPanel';
import axios from 'axios';

const MIN_LENGTH = 10;
const MAX_LENGTH = 50_000;
const MAX_URL_LENGTH = 2048;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type TabId = 'text' | 'url' | 'image';
const TABS: { id: TabId; label: string; disabled: boolean }[] = [
  { id: 'text', label: 'Text', disabled: false },
  { id: 'url', label: 'URL', disabled: false },
  { id: 'image', label: 'Image', disabled: false },
];

/**
 * Extract a user-friendly error message from an Axios error or generic Error.
 */
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. The server may be busy — please try again.';
    }
    if (!error.response) {
      return 'Unable to reach the server. Make sure the backend is running.';
    }

    const status = error.response.status;
    const data = error.response.data as Record<string, unknown> | undefined;

    // FastAPI validation errors
    if (status === 422 && data?.detail) {
      const detail = data.detail;
      if (Array.isArray(detail)) {
        return detail
          .map((d: Record<string, unknown>) => String(d.msg ?? ''))
          .filter(Boolean)
          .join('; ') || 'Validation error — check your input.';
      }
      return String(detail);
    }

    if (data?.detail && typeof data.detail === 'string') {
      return data.detail;
    }

    if (status === 400 && data?.detail && typeof data.detail === 'string') {
      return data.detail;
    }

    if (status === 500) return 'Internal server error. Please try again later.';
    if (status === 503) return 'Service unavailable. The model may still be loading.';
    return `Request failed (HTTP ${status}).`;
  }

  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState<TabId>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copiedOcrText, setCopiedOcrText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<(AnalyzeResponse & Partial<AnalyzeUrlResponse> & Partial<AnalyzeImageResponse>) | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Text validation
  const charCount = text.length;
  const isTooShort = charCount > 0 && charCount < MIN_LENGTH;
  const isTooLong = charCount > MAX_LENGTH;
  const canSubmitText = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH && !isLoading;

  // URL validation
  const trimmedUrl = url.trim();
  const isValidUrlScheme = /^https?:\/\/.+/i.test(trimmedUrl);
  const isUrlTooLong = trimmedUrl.length > MAX_URL_LENGTH;
  const canSubmitUrl = isValidUrlScheme && !isUrlTooLong && !isLoading;

  // Image validation
  const canSubmitImage = !!imageFile && !isLoading;

  const canSubmit =
    activeTab === 'text'
      ? canSubmitText
      : activeTab === 'url'
        ? canSubmitUrl
        : canSubmitImage;

  const handleImageSelect = useCallback((file: File) => {
    setImageError(null);
    setErrorMessage(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Unsupported image format. Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError('Image file is too large. Maximum allowed size is 10 MB.');
      return;
    }

    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setImageFile(file);
    setResult(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageFile(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'text') {
        const response = await analyzeText(text);
        setResult(response);
      } else if (activeTab === 'url') {
        const response = await analyzeUrl(trimmedUrl);
        setResult(response);
      } else if (activeTab === 'image' && imageFile) {
        const response = await analyzeImage(imageFile);
        setResult(response);
      }
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, text, trimmedUrl, imageFile, canSubmit]);

  const handleClear = useCallback(() => {
    setText('');
    setUrl('');
    handleRemoveImage();
    setResult(null);
    setErrorMessage(null);
  }, [handleRemoveImage]);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    setErrorMessage(null);
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>Analyze Content</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
        {activeTab === 'text'
          ? 'Enter text to detect fake news and analyze sentiment.'
          : activeTab === 'url'
            ? 'Submit a public article URL to extract and analyze its credibility and sentiment.'
            : 'Upload a news article screenshot, social post, or headline to extract text via OCR and analyze.'}
      </p>

      {/* ── Input Card ── */}
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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === tab.id ? 'var(--font-semibold)' : 'var(--font-normal)',
                color: tab.disabled
                  ? 'var(--text-muted)'
                  : activeTab === tab.id
                    ? 'var(--color-primary-400)'
                    : 'var(--text-secondary)',
                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
              {tab.disabled && (
                <span style={{
                  marginLeft: 'var(--space-1)',
                  fontSize: 'var(--text-xs)',
                  opacity: 0.7,
                }}>
                  (soon)
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Text Input Mode ── */}
        {activeTab === 'text' && (
          <>
            <textarea
              id="analyze-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or paste the text you want to analyze..."
              aria-label="Text to analyze"
              aria-describedby="char-count-info"
              maxLength={MAX_LENGTH}
              rows={8}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: 'var(--space-4)',
                background: 'var(--bg-elevated)',
                border: `1px solid ${isTooLong ? 'var(--color-fake)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                lineHeight: 'var(--leading-normal)',
                transition: 'border-color var(--transition-fast)',
                opacity: isLoading ? 0.6 : 1,
              }}
            />

            <div
              id="char-count-info"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <span style={{
                color: isTooShort
                  ? 'var(--color-uncertain)'
                  : isTooLong
                    ? 'var(--color-fake)'
                    : 'var(--text-muted)',
              }}>
                {isTooShort && `Minimum ${MIN_LENGTH} characters required`}
                {isTooLong && `Maximum ${MAX_LENGTH.toLocaleString()} characters exceeded`}
              </span>
              <span style={{
                color: isTooLong
                  ? 'var(--color-fake)'
                  : 'var(--text-muted)',
              }}>
                {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </span>
            </div>
          </>
        )}

        {/* ── URL Input Mode ── */}
        {activeTab === 'url' && (
          <>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 'var(--space-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}>
                <LinkIcon size={18} />
              </div>
              <input
                id="analyze-url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news/article-headline..."
                aria-label="Article URL to analyze"
                aria-describedby="url-validation-info"
                maxLength={MAX_URL_LENGTH}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: 'var(--space-4) var(--space-4) var(--space-4) calc(var(--space-4) + 26px)',
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${trimmedUrl && !isValidUrlScheme ? 'var(--color-fake)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  transition: 'border-color var(--transition-fast)',
                  opacity: isLoading ? 0.6 : 1,
                }}
              />
            </div>

            <div
              id="url-validation-info"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <span style={{
                color: trimmedUrl && !isValidUrlScheme
                  ? 'var(--color-fake)'
                  : 'var(--text-muted)',
              }}>
                {trimmedUrl && !isValidUrlScheme
                  ? 'URL must begin with http:// or https://'
                  : 'Enter the full public URL of an online news article (HTTP or HTTPS)'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {trimmedUrl.length} / {MAX_URL_LENGTH}
              </span>
            </div>
          </>
        )}

        {/* ── Image Input Mode ── */}
        {activeTab === 'image' && (
          <div>
            <input
              ref={fileInputRef}
              id="analyze-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
              style={{ display: 'none' }}
              aria-label="Upload image for analysis"
            />

            {!imageFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageSelect(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--color-primary-400)' : 'var(--border-color)'}`,
                  background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-10) var(--space-6)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  color: 'var(--color-primary-400)',
                }}>
                  <UploadCloud size={28} />
                </div>
                <p style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-1)',
                }}>
                  Click to upload or drag & drop an image
                </p>
                <p style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-4)',
                }}>
                  Supports JPEG, PNG, or WEBP (Max 10 MB)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    cursor: 'pointer',
                  }}
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary-400)',
                      flexShrink: 0,
                    }}>
                      <ImageIcon size={22} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--text-primary)',
                        marginBottom: '2px',
                        wordBreak: 'break-all',
                      }}>
                        {imageFile.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {formatBytes(imageFile.size)} • {imageFile.type || 'image'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                      aria-label="Remove selected image"
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--text-muted)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                </div>

                {imagePreviewUrl && (
                  <div style={{
                    maxHeight: '220px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                  }}>
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '220px',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {imageError && (
              <p style={{
                color: 'var(--color-fake)',
                fontSize: 'var(--text-xs)',
                marginTop: 'var(--space-2)',
              }}>
                {imageError}
              </p>
            )}
          </div>
        )}

        {/* Actions row */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-4)',
        }}>
          {/* Clear button */}
          {((activeTab === 'text' ? charCount > 0 : activeTab === 'url' ? trimmedUrl.length > 0 : !!imageFile) || result || errorMessage) && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              aria-label="Clear input and results"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-5)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--font-medium)',
                fontSize: 'var(--text-sm)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <Trash2 size={15} />
              Clear
            </button>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            aria-label={isLoading ? 'Analyzing content, please wait' : activeTab === 'url' ? 'Analyze Article URL' : activeTab === 'image' ? 'Analyze Image' : 'Analyze text'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-6)',
              background: canSubmit
                ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))'
                : 'var(--bg-elevated)',
              color: canSubmit ? 'white' : 'var(--text-muted)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-sm)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              border: 'none',
              transition: 'all var(--transition-fast)',
              opacity: isLoading ? 0.85 : 1,
              boxShadow: canSubmit ? 'var(--shadow-glow)' : 'none',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing…
              </>
            ) : (
              <>
                {activeTab === 'url' ? <LinkIcon size={16} /> : activeTab === 'image' ? <ImageIcon size={16} /> : <Search size={16} />}
                {activeTab === 'url' ? 'Analyze URL' : activeTab === 'image' ? 'Analyze Image' : 'Analyze'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Error Message ── */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-4) var(--space-5)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle
            size={18}
            style={{ color: 'var(--color-fake)', flexShrink: 0, marginTop: '2px' }}
          />
          <div>
            <p style={{
              color: 'var(--color-fake)',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-1)',
            }}>
              Analysis Failed
            </p>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
            }}>
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── Loading Indicator ── */}
      {isLoading && (
        <div style={{
          marginTop: 'var(--space-8)',
          padding: 'var(--space-12)',
          textAlign: 'center',
          border: '2px dashed var(--border-color)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <Loader2
            size={48}
            style={{
              margin: '0 auto var(--space-4)',
              color: 'var(--color-primary-400)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}>
            {activeTab === 'url'
              ? 'Fetching article and analyzing credibility…'
              : activeTab === 'image'
                ? 'Extracting text with OCR and analyzing credibility…'
                : 'Analyzing your text…'}
          </p>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            marginTop: 'var(--space-2)',
          }}>
            {activeTab === 'image'
              ? 'Preprocessing image, extracting text via OCR, and running XLM-RoBERTa models.'
              : 'This may take up to a minute on CPU inference.'}
          </p>
        </div>
      )}

      {/* ── Results Dashboard ── */}
      {result && !isLoading && (
        <div style={{
          marginTop: 'var(--space-8)',
          display: 'grid',
          gap: 'var(--space-6)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}>
          {/* Text Analysis Metadata Card */}
          {activeTab === 'text' && result.detected_language && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4) var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileText size={18} style={{ color: 'var(--color-primary-400)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                  Text Analysis
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-1) var(--space-3)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary-300)',
                  fontWeight: 'var(--font-medium)',
                }}>
                  <Globe size={12} />
                  Language: {result.language_name ? `${result.language_name} (${result.detected_language.toUpperCase()})` : result.detected_language.toUpperCase()}
                  {result.language_confidence !== null && result.language_confidence !== undefined && (
                    <span style={{ opacity: 0.8, marginLeft: '4px' }}>
                      ({(result.language_confidence * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-1) var(--space-3)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}>
                  <FileText size={12} />
                  {charCount.toLocaleString()} chars
                </span>
              </div>
            </div>
          )}

          {/* Image OCR Metadata & Extracted Text Card */}
          {result.ocr_text && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5) var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <ImageIcon size={18} style={{ color: 'var(--color-primary-400)' }} />
                  <h3 style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    {result.filename || 'Extracted Image Content'}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {result.detected_language && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      padding: 'var(--space-1) var(--space-3)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-primary-400)',
                      fontWeight: 'var(--font-medium)',
                    }}>
                      <Globe size={12} />
                      Language: {result.detected_language.toUpperCase()}
                    </span>
                  )}
                  {result.character_count !== undefined && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      padding: 'var(--space-1) var(--space-3)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                    }}>
                      <FileText size={12} />
                      {result.character_count.toLocaleString()} characters
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)',
                }}>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Extracted OCR Text
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (result.ocr_text) {
                        navigator.clipboard.writeText(result.ocr_text);
                        setCopiedOcrText(true);
                        setTimeout(() => setCopiedOcrText(false), 2000);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 8px',
                      fontSize: 'var(--text-xs)',
                      color: copiedOcrText ? 'var(--color-real)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {copiedOcrText ? <Check size={12} /> : <Copy size={12} />}
                    {copiedOcrText ? 'Copied' : 'Copy Text'}
                  </button>
                </div>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 'var(--leading-relaxed)',
                  color: 'var(--text-primary)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {result.ocr_text}
                </div>
              </div>
            </div>
          )}

          {/* Article Metadata Card for URL analyses */}
          {result.source_url && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5) var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Newspaper size={18} style={{ color: 'var(--color-primary-400)' }} />
                <h3 style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {result.extracted_title || 'Analyzed Article'}
                </h3>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}>
                <LinkIcon size={14} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-muted)' }}>Source:</span>
                <a
                  href={result.final_url || result.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--color-primary-400)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={result.final_url || result.source_url}
                >
                  {result.source_url}
                  <ExternalLink size={12} style={{ flexShrink: 0 }} />
                </a>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-1)',
              }}>
                {result.detected_language && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: 'var(--space-1) var(--space-3)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-primary-300)',
                    fontWeight: 'var(--font-medium)',
                  }}>
                    <Globe size={12} />
                    Language: {result.detected_language.toUpperCase()}
                  </span>
                )}
                {typeof result.character_count === 'number' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: 'var(--space-1) var(--space-3)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                  }}>
                    <FileText size={12} />
                    {result.character_count.toLocaleString()} chars extracted
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Credibility Card */}
          <CredibilityCard
            label={result.credibility.label}
            confidence={result.credibility.confidence}
            isMock={result.credibility.is_mock}
          />

          {/* Sentiment Card */}
          <SentimentCard
            label={result.sentiment.label}
            confidence={result.sentiment.confidence}
            isMock={result.sentiment.is_mock}
          />

          {/* Explainability Section */}
          <ExplainabilityPanel
            textToExplain={
              activeTab === 'text'
                ? text
                : activeTab === 'url'
                  ? (result.extracted_text || '')
                  : (result.ocr_text || '')
            }
            title={
              activeTab === 'url'
                ? 'Article Content Explainability'
                : activeTab === 'image'
                  ? 'OCR Extracted Content Explainability'
                  : 'Text Prediction Explainability'
            }
          />

          {/* Translation Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <TranslationPanel
              originalText={
                activeTab === 'text'
                  ? text
                  : activeTab === 'url'
                    ? (result.extracted_text || '')
                    : (result.ocr_text || '')
              }
              detectedLanguage={result.detected_language}
              languageName={result.language_name}
              languageConfidence={result.language_confidence}
              title={
                activeTab === 'url'
                  ? 'Article Translation & Presentation'
                  : activeTab === 'image'
                    ? 'OCR Text Translation & Presentation'
                    : 'Multilingual Presentation & Translation'
              }
            />
          </div>

          {/* Processing Time */}
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}>
            <Clock size={13} />
            Processed in {formatProcessingTime(result.processing_time_ms)}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!result && !isLoading && (
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
      )}

      {/* Keyframes for the spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──

function CredibilityCard({
  label,
  confidence,
  isMock,
}: {
  label: 'Real' | 'Fake';
  confidence: number;
  isMock: boolean;
}) {
  const isReal = label === 'Real';
  const color = isReal ? 'var(--color-real)' : 'var(--color-fake)';
  const bgTint = isReal ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
  const borderTint = isReal ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
  const Icon = isReal ? CheckCircle : XCircle;
  const pct = (confidence * 100).toFixed(1);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${borderTint}`,
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle colored top accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: color,
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-5)',
      }}>
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
        }}>
          Credibility
        </span>
        {isMock && <MockBadge />}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          background: bgTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={26} style={{ color }} />
        </div>
        <div>
          <p style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color,
            lineHeight: 'var(--leading-tight)',
          }}>
            {label}
          </p>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}>
            {pct}% confidence
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div style={{
        height: '6px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(confidence * 100, 100)}%`,
          borderRadius: 'var(--radius-full)',
          background: color,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function SentimentCard({
  label,
  confidence,
  isMock,
}: {
  label: 'Positive' | 'Negative' | 'Neutral';
  confidence: number;
  isMock: boolean;
}) {
  const colorMap: Record<string, string> = {
    Positive: 'var(--color-positive)',
    Negative: 'var(--color-negative)',
    Neutral: 'var(--color-neutral)',
  };
  const bgMap: Record<string, string> = {
    Positive: 'rgba(16, 185, 129, 0.08)',
    Negative: 'rgba(239, 68, 68, 0.08)',
    Neutral: 'rgba(107, 114, 128, 0.08)',
  };
  const borderMap: Record<string, string> = {
    Positive: 'rgba(16, 185, 129, 0.25)',
    Negative: 'rgba(239, 68, 68, 0.25)',
    Neutral: 'rgba(107, 114, 128, 0.25)',
  };
  const iconMap: Record<string, typeof CheckCircle> = {
    Positive: CheckCircle,
    Negative: XCircle,
    Neutral: Minus,
  };

  const color = colorMap[label];
  const bgTint = bgMap[label];
  const borderTint = borderMap[label];
  const Icon = iconMap[label];
  const pct = (confidence * 100).toFixed(1);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${borderTint}`,
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: color,
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-5)',
      }}>
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
        }}>
          Sentiment
        </span>
        {isMock && <MockBadge />}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          background: bgTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={26} style={{ color }} />
        </div>
        <div>
          <p style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color,
            lineHeight: 'var(--leading-tight)',
          }}>
            {label}
          </p>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}>
            {pct}% confidence
          </p>
        </div>
      </div>

      <div style={{
        height: '6px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(confidence * 100, 100)}%`,
          borderRadius: 'var(--radius-full)',
          background: color,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function MockBadge() {
  return (
    <span
      title="This result was generated by a mock/fallback model, not the production model."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-medium)',
        color: 'var(--color-uncertain)',
        background: 'rgba(245, 158, 11, 0.12)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        cursor: 'help',
      }}
    >
      <FlaskConical size={11} />
      Mock
    </span>
  );
}

function formatProcessingTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
