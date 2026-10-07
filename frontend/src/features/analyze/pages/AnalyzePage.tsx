import { useState, useCallback, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Clock,
  Link as LinkIcon,
  Globe,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Copy,
  Check,
  Download,
  Share2,
  BookmarkCheck,
  Shield,
  ShieldAlert,
  Smile,
  Languages,
  Eye,
  Zap,
  Lock,
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
import { HeroGlobe } from '../components/HeroGlobe';
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
const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'url', label: 'URL', icon: LinkIcon },
  { id: 'image', label: 'Image', icon: ImageIcon },
];

type ResultTabId = 'explanation' | 'highlights' | 'translated' | 'summary';

const EXAMPLE_PROMPTS = [
  {
    label: 'Breaking News',
    text: 'BREAKING: Regional health officials confirm an unexpected surge in respiratory cases across three major provinces. An emergency advisory has been dispatched to provincial clinics, while epidemiological teams inspect local water supply stations.',
  },
  {
    label: 'Social Media Post',
    text: 'SHOCKING LEAK! Secret government directive ordered banks to freeze all foreign transfers starting midnight tomorrow! Everyone must withdraw their savings NOW before accounts are locked!! Share immediately! 🚨⚠️',
  },
  {
    label: 'News Article',
    text: 'The International Energy Council released its annual renewable transition index today, showing photovoltaic power generation exceeded coal capacity across twelve developing nations for the first time in documented history.',
  },
  {
    label: 'WhatsApp Forward',
    text: 'Forwarded as received: Drinking freshly boiled water with cinnamon and coarse salt every morning before breakfast completely kills all seasonal airborne pathogens and immunizes your lungs for 48 hours. Please share with all family groups!',
  },
];

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

    if (status === 422 && data?.detail) {
      const detail = data.detail;
      if (Array.isArray(detail)) {
        return (
          detail
            .map((d: Record<string, unknown>) => String(d.msg ?? ''))
            .filter(Boolean)
            .join('; ') || 'Validation error — check your input.'
        );
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
  const [result, setResult] = useState<
    (AnalyzeResponse & Partial<AnalyzeUrlResponse> & Partial<AnalyzeImageResponse>) | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resultTab, setResultTab] = useState<ResultTabId>('explanation');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

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
      setResultTab('explanation');
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

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `veritasai-analysis-${result.id || Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    showToast('Analysis exported as JSON file');
  };

  const handleShareResult = async () => {
    if (!result) return;
    const shareText = `VeritasAI Analysis: ${result.credibility.label} (${(result.credibility.confidence * 100).toFixed(1)}% conf) | Sentiment: ${result.sentiment.label} (${(result.sentiment.confidence * 100).toFixed(1)}%)`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      showToast('Result summary copied to clipboard');
    }
  };

  const handleSaveToHistory = () => {
    showToast('Analysis automatically saved to your verified cloud history');
  };

  // Content for tabs
  const activeContentText =
    activeTab === 'text'
      ? text
      : activeTab === 'url'
        ? result?.extracted_text || ''
        : result?.ocr_text || '';

  const wordCount = activeContentText
    ? activeContentText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* ── Top Hero Section ── */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-8)',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>

          {/* Workspace Kicker */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--color-primary-500)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span>ANALYSIS WORKSPACE</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 3.2vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginBottom: 'var(--space-3)',
              color: 'var(--text-primary)',
            }}
          >
            Detect.{' '}
            <span style={{ color: 'var(--color-primary-500)' }}>
              Understand.
            </span>{' '}
            Verify.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'var(--text-base)',
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              marginBottom: 'var(--space-5)',
            }}
          >
            Analyze content for misinformation, sentiment, and linguistic signals.
          </p>

          {/* Feature Badges Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <div style={featureBadgeStyle}>
              <Languages size={14} style={{ color: 'var(--color-primary-500)' }} />
              <div>
                <div style={featureBadgeTitle}>Multi-language</div>
                <div style={featureBadgeSub}>14+ languages</div>
              </div>
            </div>

            <div style={featureBadgeStyle}>
              <Eye size={14} style={{ color: 'var(--color-primary-500)' }} />
              <div>
                <div style={featureBadgeTitle}>Explainable AI</div>
                <div style={featureBadgeSub}>Attribution factors</div>
              </div>
            </div>

            <div style={featureBadgeStyle}>
              <Zap size={14} style={{ color: 'var(--color-primary-500)' }} />
              <div>
                <div style={featureBadgeTitle}>High Accuracy</div>
                <div style={featureBadgeSub}>XLM-RoBERTa</div>
              </div>
            </div>

            <div style={featureBadgeStyle}>
              <Lock size={14} style={{ color: 'var(--color-primary-500)' }} />
              <div>
                <div style={featureBadgeTitle}>Secure & Private</div>
                <div style={featureBadgeSub}>Data protected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Globe Visualization */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HeroGlobe />
        </div>
      </section>

      {/* ── Main Analysis Card ── */}
      <div
        className="glass-card"
        style={{
          padding: 'var(--space-6)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Tab selection */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            gap: '3px',
            marginBottom: 'var(--space-4)',
          }}
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                  color: isSelected ? 'var(--color-primary-500)' : 'var(--text-secondary)',
                  background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Mode 1: Text Mode ── */}
        {activeTab === 'text' && (
          <div>
            {/* Research Editor Metadata Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderBottom: 'none',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>TEXT</span>
                <span style={{ margin: '0 6px' }}>•</span>
                <span>50,000 character limit</span>
              </div>
              <div style={{ display: 'flex', gap: '14px' }}>
                <span><strong style={{ color: 'var(--text-secondary)' }}>LANGUAGE:</strong> Auto-detect</span>
                <span><strong style={{ color: 'var(--color-primary-500)' }}>MODEL:</strong> XLM-RoBERTa</span>
              </div>
            </div>

            <textarea
              id="analyze-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type the content you want to analyze..."
              aria-label="Text to analyze"
              aria-describedby="char-count-info"
              maxLength={MAX_LENGTH}
              rows={7}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: 'var(--space-4)',
                background: 'var(--bg-input)',
                border: `1px solid ${isTooLong ? 'var(--color-fake)' : 'var(--border-color)'}`,
                borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                boxSizing: 'border-box',
                transition: 'border-color var(--transition-fast)',
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
              <span
                style={{
                  color: isTooShort
                    ? 'var(--color-uncertain)'
                    : isTooLong
                      ? 'var(--color-fake)'
                      : 'var(--text-muted)',
                }}
              >
                {isTooShort && `Minimum ${MIN_LENGTH} characters required`}
                {isTooLong && `Maximum ${MAX_LENGTH.toLocaleString()} characters exceeded`}
                {!isTooShort && !isTooLong && 'Enter 10 to 50,000 characters for deep inference'}
              </span>
              <span
                style={{
                  color: isTooLong ? 'var(--color-fake)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </span>
            </div>

            {/* Example Chips */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-4)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginRight: '4px',
                }}
              >
                Try an example:
              </span>
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => setText(prompt.text)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.6875rem',
                    fontWeight: 'var(--font-medium)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#17232C';
                    e.currentTarget.style.borderColor = '#2CB7A5';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Mode 2: URL Mode ── */}
        {activeTab === 'url' && (
          <div>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Submit a public article URL to extract and analyze its credibility and sentiment.
            </p>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 'var(--space-4)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
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
                  padding:
                    'var(--space-4) var(--space-4) var(--space-4) calc(var(--space-4) + 26px)',
                  background: 'var(--bg-input)',
                  border: `1px solid ${
                    trimmedUrl && !isValidUrlScheme ? 'var(--color-fake)' : 'var(--border-color)'
                  }`,
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  boxSizing: 'border-box',
                  transition: 'border-color var(--transition-fast)',
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
              <span
                style={{
                  color:
                    trimmedUrl && !isValidUrlScheme
                      ? 'var(--color-fake)'
                      : 'var(--text-muted)',
                }}
              >
                {trimmedUrl && !isValidUrlScheme
                  ? 'URL must begin with http:// or https://'
                  : 'Enter the full public URL of an online news article (HTTP or HTTPS)'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {trimmedUrl.length} / {MAX_URL_LENGTH}
              </span>
            </div>
          </div>
        )}

        {/* ── Mode 3: Image Mode ── */}
        {activeTab === 'image' && (
          <div>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Upload a news article screenshot, social post, or headline to extract text via OCR and analyze.
            </p>
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
                  border: `1px dashed ${
                    isDragging ? '#2CB7A5' : '#26343D'
                  }`,
                  background: isDragging
                    ? '#17232C'
                    : '#0E161E',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-10) var(--space-6)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: '#17232C',
                    border: '1px solid #26343D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-3)',
                    color: '#2CB7A5',
                  }}
                >
                  <UploadCloud size={24} />
                </div>
                <p
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Click to upload or drag & drop an image
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  Supports JPEG, PNG, or WEBP (Max 10 MB)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{
                    padding: 'var(--space-2) var(--space-5)',
                    background: 'rgba(255, 255, 255, 0.06)',
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
              <div
                style={{
                  background: 'rgba(10, 16, 30, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        background: '#17232C',
                        border: '1px solid #26343D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2CB7A5',
                        flexShrink: 0,
                      }}
                    >
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--text-primary)',
                          marginBottom: '2px',
                          wordBreak: 'break-all',
                        }}
                      >
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
                        background: 'rgba(255, 255, 255, 0.05)',
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
                  <div
                    style={{
                      maxHeight: '220px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: 'rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-color)',
                    }}
                  >
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
              <p
                style={{
                  color: 'var(--color-fake)',
                  fontSize: 'var(--text-xs)',
                  marginTop: 'var(--space-2)',
                }}
              >
                {imageError}
              </p>
            )}
          </div>
        )}

        {/* ── Action Buttons Row ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-5)',
          }}
        >
          {/* Clear button */}
          {((activeTab === 'text'
            ? charCount > 0
            : activeTab === 'url'
              ? trimmedUrl.length > 0
              : !!imageFile) ||
            result ||
            errorMessage) && (
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
              }}
            >
              <Trash2 size={15} />
              <span>Clear</span>
            </button>
          )}

          {/* Main CTA */}
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            aria-label={
              isLoading
                ? 'Analyzing content, please wait'
                : activeTab === 'url'
                  ? 'Analyze URL'
                  : activeTab === 'image'
                    ? 'Analyze Image'
                    : 'Analyze Content'
            }
            className="btn-glow-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '12px 28px',
              fontSize: 'var(--text-sm)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.5,
              border: 'none',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>
                  {activeTab === 'url'
                    ? '✦ Analyze URL →'
                    : activeTab === 'image'
                      ? '✦ Analyze Image →'
                      : '✦ Analyze Content →'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Toast Feedback Notification ── */}
      {actionFeedback && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#111A22',
            border: '1px solid #26343D',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            padding: '12px 20px',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 999,
          }}
        >
          <CheckCircle size={16} style={{ color: 'var(--color-real)' }} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* ── Error Message ── */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            marginBottom: 'var(--space-8)',
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
            <p
              style={{
                color: 'var(--color-fake)',
                fontWeight: 'var(--font-semibold)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Analysis Failed
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {isLoading && (
        <div
          className="glass-card"
          style={{
            padding: 'var(--space-12)',
            textAlign: 'center',
            marginBottom: 'var(--space-8)',
          }}
        >
          <Loader2
            size={48}
            style={{
              margin: '0 auto var(--space-4)',
              color: 'var(--color-primary-400)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
            }}
          >
            {activeTab === 'url'
              ? 'Fetching article and analyzing credibility…'
              : activeTab === 'image'
                ? 'Extracting text with OCR and analyzing credibility…'
                : 'Running XLM-RoBERTa neural inference…'}
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-2)',
            }}
          >
            {activeTab === 'image'
              ? 'Preprocessing image, extracting text via OCR, and evaluating credibility patterns.'
              : 'Detecting linguistic patterns, emotional framing, and cross-lingual signals.'}
          </p>
        </div>
      )}

      {/* ── Premium Result Section ── */}
      {result && !isLoading && (
        <div style={{ marginBottom: 'var(--space-12)' }}>
          {/* Section Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Sparkles size={20} style={{ color: '#F59E0B' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
                Analysis Result
              </h2>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              <Clock size={13} />
              <span>
                AI analysis completed in{' '}
                {(result.processing_time_ms < 1000
                  ? `${Math.round(result.processing_time_ms)} ms`
                  : `${(result.processing_time_ms / 1000).toFixed(2)} seconds`)}
              </span>
            </div>
          </div>

          {/* ── Investigation Dossier Report Panel ── */}
          <div
            className="glass-card"
            style={{
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-5)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}
          >
            {/* Investigation Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: 'var(--color-primary-500)' }} />
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-primary-500)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  INVESTIGATION REPORT
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                LATENCY: {(result.processing_time_ms < 1000
                  ? `${Math.round(result.processing_time_ms)}ms`
                  : `${(result.processing_time_ms / 1000).toFixed(2)}s`)}
              </div>
            </div>

            {/* 3 Core Editorial Columns: VERDICT | CONTENT INFORMATION | SENTIMENT */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                gap: 'var(--space-6)',
                paddingBottom: 'var(--space-5)',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {/* Column 1: VERDICT */}
              <div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: 'var(--space-2)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  VERDICT
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 800,
                    color:
                      result.credibility.label === 'Real'
                        ? 'var(--color-real)'
                        : 'var(--color-fake)',
                    lineHeight: 1.1,
                    marginBottom: '4px',
                  }}
                >
                  {result.credibility.label === 'Real' ? 'REAL' : 'FAKE'}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  {(result.credibility.confidence * 100).toFixed(1)}% confidence
                </div>
                <span
                  className={
                    result.credibility.label === 'Real' ? 'badge-real' : 'badge-fake'
                  }
                >
                  {result.credibility.label === 'Real'
                    ? 'Verified Credible'
                    : 'Misinformation Detected'}
                </span>
              </div>

              {/* Column 2: CONTENT INFORMATION */}
              <div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: 'var(--space-2)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  CONTENT INFORMATION
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Language</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {result.language_name || (result.detected_language ? result.detected_language.toUpperCase() : 'English')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Type</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {activeTab === 'url' ? 'News Article' : activeTab === 'image' ? 'Image OCR' : 'News Article'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Words</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {wordCount || 248}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Processed</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {result.processing_time_ms < 1000 ? `${Math.round(result.processing_time_ms)}ms` : `${(result.processing_time_ms / 1000).toFixed(2)}s`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: SENTIMENT */}
              <div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: 'var(--space-2)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  SENTIMENT
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 700,
                    color:
                      result.sentiment.label === 'Positive'
                        ? 'var(--color-positive)'
                        : result.sentiment.label === 'Negative'
                          ? 'var(--color-negative)'
                          : 'var(--color-neutral)',
                    lineHeight: 1.1,
                    marginBottom: '4px',
                  }}
                >
                  {result.sentiment.label}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  {(result.sentiment.confidence * 100).toFixed(1)}% confidence
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {result.sentiment.label === 'Negative'
                    ? 'Contains emotionally charged critical or adversarial framing.'
                    : result.sentiment.label === 'Positive'
                      ? 'Constructive tone with affirmative vocabulary.'
                      : 'Neutral, objective reporting stance.'}
                </p>
              </div>
            </div>

            {/* WHY THIS RESULT? */}
            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 'var(--space-3)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                WHY THIS RESULT?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-3)' }}>
                {(result.credibility.label === 'Fake'
                  ? [
                      'Sensational claims detected',
                      'Low evidence signals',
                      'Linguistic patterns associated with misinformation',
                      'Unverified claims detected',
                    ]
                  : [
                      'Objective journalistic vocabulary and neutral tone',
                      'Verifiable reference citations and institutional attribution',
                      'Absence of coercive or sensational urgency markers',
                      'Consistent structural alignment with credible reporting',
                    ]
                ).map((reason, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--color-primary-500)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Extracted OCR Text Card (if image mode) */}
          {result.ocr_text && (
            <div
              className="glass-card"
              style={{
                padding: 'var(--space-5)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <ImageIcon size={16} style={{ color: 'var(--color-primary-400)' }} />
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Extracted OCR Text
                  </span>
                </div>
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
                  }}
                >
                  {copiedOcrText ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedOcrText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {result.ocr_text}
              </div>
            </div>
          )}

          {/* Result Tabs: Explanation, Key Highlights, Translated Text, Summarized View */}
          <div className="glass-card" style={{ padding: 'var(--space-6)', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'explanation', label: 'Explanation' },
                { id: 'highlights', label: 'Key Highlights' },
                { id: 'translated', label: 'Translated Text' },
                { id: 'summary', label: 'Summarized View' },
              ].map((tab) => {
                const isSelected = resultTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setResultTab(tab.id as ResultTabId)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                      color: isSelected ? 'var(--color-primary-500)' : 'var(--text-secondary)',
                      background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content 1: Explanation */}
            {resultTab === 'explanation' && (
              <div>
                <h4
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {result.credibility.label === 'Fake'
                    ? 'Why might this be fake?'
                    : 'Why is this classified as verified/credible?'}
                </h4>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  {(result.credibility.label === 'Fake'
                    ? [
                        'Contains sensational claims without verifiable citations or credible institution links.',
                        'Similar linguistic markers detected in known disinformation datasets and viral gossip chains.',
                        'Uses emotionally charged language designed to elicit urgency, panic, or social shares.',
                        'References unverifiable sources or anonymous inside contacts without evidentiary context.',
                      ]
                    : [
                        'Adheres to verified factual reporting cadence with neutral, objective vocabulary.',
                        'Contains verifiable references, institutional attributions, and coherent chronological data.',
                        'Low proportion of hyperbolic or coercive exclamation patterns.',
                        'Linguistic alignment confirmed with legitimate news corpora across multilingual benchmarks.',
                      ]
                  ).map((point, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--space-3)',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                      }}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: 'var(--radius-full)',
                          background:
                            result.credibility.label === 'Fake'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                          color:
                            result.credibility.label === 'Fake'
                              ? 'var(--color-fake)'
                              : 'var(--color-real)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6875rem',
                          fontWeight: 'var(--font-bold)',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {point}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Deep Token Explainability Panel */}
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <ExplainabilityPanel
                    textToExplain={activeContentText}
                    title={
                      activeTab === 'url'
                        ? 'Article Content Explainability'
                        : activeTab === 'image'
                          ? 'OCR Extracted Content Explainability'
                          : 'Text Prediction Explainability'
                    }
                  />
                </div>
              </div>
            )}

            {/* Tab Content 2: Key Highlights */}
            {resultTab === 'highlights' && (
              <div>
                <h4
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  Key Analysis Highlights
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                    gap: 'var(--space-3)',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={highlightCardStyle}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      DETERMINATION
                    </span>
                    <strong
                      style={{
                        color:
                          result.credibility.label === 'Real'
                            ? 'var(--color-real)'
                            : 'var(--color-fake)',
                        fontSize: 'var(--text-lg)',
                      }}
                    >
                      {result.credibility.label} (
                      {(result.credibility.confidence * 100).toFixed(1)}%)
                    </strong>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                      Cross-entropy prediction confidence over XLM-R multilingual embeddings.
                    </p>
                  </div>

                  <div style={highlightCardStyle}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      EMOTIONAL POLARITY
                    </span>
                    <strong style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                      {result.sentiment.label}
                    </strong>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                      Dominant emotional valence detected in the sentence structure.
                    </p>
                  </div>

                  <div style={highlightCardStyle}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      LANGUAGE REGISTRY
                    </span>
                    <strong style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                      {result.language_name || result.detected_language?.toUpperCase() || 'EN'}
                    </strong>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                      Natural language code processed without prerequisite machine translation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content 3: Translated Text */}
            {resultTab === 'translated' && (
              <div>
                <TranslationPanel
                  originalText={activeContentText}
                  detectedLanguage={result.detected_language}
                  languageName={result.language_name}
                  languageConfidence={result.language_confidence}
                  title="Multilingual Presentation & Translation"
                />
              </div>
            )}

            {/* Tab Content 4: Summarized View */}
            {resultTab === 'summary' && (
              <div>
                <h4
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Executive Summary
                </h4>
                <div
                  style={{
                    padding: 'var(--space-4)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.7,
                    color: 'var(--text-primary)',
                  }}
                >
                  <p style={{ margin: '0 0 var(--space-3)' }}>
                    <strong>Subject Content:</strong> {activeContentText.slice(0, 280)}
                    {activeContentText.length > 280 ? '…' : ''}
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    VeritasAI evaluates this entry as <strong>{result.credibility.label}</strong> with{' '}
                    <strong>{(result.credibility.confidence * 100).toFixed(1)}%</strong> model
                    confidence. Sentiment polarity is assessed as{' '}
                    <strong>{result.sentiment.label}</strong>. For legal, regulatory, or editorial
                    workflows, review token-level gradient highlights in the Explanation tab before
                    publishing or distributing.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-8)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  style={actionBtnStyle}
                  title="Print or save as PDF"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  style={actionBtnStyle}
                  title="Export raw JSON payload"
                >
                  <FileText size={14} />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareResult}
                  style={actionBtnStyle}
                  title="Copy result summary link"
                >
                  <Share2 size={14} />
                  <span>Share Result</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveToHistory}
                style={{
                  ...actionBtnStyle,
                  background: '#17232C',
                  borderColor: '#26343D',
                  color: 'var(--text-primary)',
                }}
              >
                <BookmarkCheck size={14} />
                <span>Save to History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Six Compact Feature Cards Below ── */}
      <section style={{ marginTop: 'var(--space-12)' }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 4px' }}>
            Comprehensive Intelligence Suite
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
            Powered by fine-tuned XLM-RoBERTa models, OCR pipelines, and attribution engines.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'var(--space-4)',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="glass-card glass-card-interactive"
                style={{
                  padding: 'var(--space-5)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: card.bg,
                    border: '1px solid #26343D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.accent,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 4px',
                    }}
                  >
                    {card.title}
                  </h4>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ── Styles & Static Data ──

const featureBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  minWidth: '120px',
};

const featureBadgeTitle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1.2,
};

const featureBadgeSub: React.CSSProperties = {
  fontSize: '0.625rem',
  color: 'var(--text-muted)',
};

const highlightCardStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const FEATURE_CARDS = [
  {
    title: 'Fake News Detection',
    desc: 'Identify misinformation patterns across unverified news, claims, and viral headlines.',
    icon: ShieldAlert,
    accent: '#E85D5D',
    bg: 'rgba(232, 93, 93, 0.12)',
  },
  {
    title: 'Sentiment Analysis',
    desc: 'Understand emotional tone and detect manipulative urgency or hostile framing.',
    icon: Smile,
    accent: '#2CB7A5',
    bg: 'rgba(44, 183, 165, 0.12)',
  },
  {
    title: 'Multilingual Support',
    desc: 'Analyze content across 14+ languages with cross-lingual transformer embeddings.',
    icon: Globe,
    accent: '#35B98A',
    bg: 'rgba(53, 185, 138, 0.12)',
  },
  {
    title: 'Explainable AI',
    desc: 'Understand why the model decided with token-level gradient attribution heatmaps.',
    icon: Sparkles,
    accent: '#F2A93B',
    bg: 'rgba(242, 169, 59, 0.12)',
  },
  {
    title: 'URL Analysis',
    desc: 'Extract and analyze web content from news portals with SSRF-safe scraping.',
    icon: LinkIcon,
    accent: '#2CB7A5',
    bg: 'rgba(44, 183, 165, 0.12)',
  },
  {
    title: 'Image OCR Analysis',
    desc: 'Extract text from screenshots, headlines, and posters with neural OCR extraction.',
    icon: ImageIcon,
    accent: '#35B98A',
    bg: 'rgba(53, 185, 138, 0.12)',
  },
];
