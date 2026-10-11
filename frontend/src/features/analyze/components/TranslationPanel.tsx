import { useState, useEffect, useCallback } from 'react';
import {
  Languages,
  Loader2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Globe,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getSupportedLanguages,
  translateText,
  type SupportedLanguage,
  type TranslateResponse,
} from '../../../services/api';

interface TranslationPanelProps {
  originalText: string;
  detectedLanguage?: string;
  languageName?: string | null;
  languageConfidence?: number | null;
  title?: string;
}

export function TranslationPanel({
  originalText,
  detectedLanguage = 'unknown',
  languageName,
  languageConfidence,
  title = 'Multilingual Presentation & Translation',
}: TranslationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [targetLang, setTargetLang] = useState<string>('en');
  const [isLoadingLangs, setIsLoadingLangs] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);

  // Load supported languages list once
  useEffect(() => {
    let isMounted = true;
    const loadLanguages = async () => {
      setIsLoadingLangs(true);
      try {
        const data = await getSupportedLanguages();
        if (isMounted) {
          setLanguages(data.languages);
          if (data.default_target) {
            setTargetLang(data.default_target);
          }
        }
      } catch {
        // Fallback default list if registry call fails
        if (isMounted) {
          setLanguages([
            { code: 'en', name: 'English', native_name: 'English', is_supported_for_analysis: true, is_verified_translation: true },
            { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', is_supported_for_analysis: true, is_verified_translation: true },
            { code: 'es', name: 'Spanish', native_name: 'Español', is_supported_for_analysis: true, is_verified_translation: true },
            { code: 'fr', name: 'French', native_name: 'Français', is_supported_for_analysis: true, is_verified_translation: true },
            { code: 'de', name: 'German', native_name: 'Deutsch', is_supported_for_analysis: true, is_verified_translation: true },
          ]);
        }
      } finally {
        if (isMounted) setIsLoadingLangs(false);
      }
    };
    loadLanguages();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!originalText || originalText.trim().length === 0) {
      setError('No text available to translate.');
      return;
    }

    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateText({
        text: originalText,
        target_lang: targetLang,
        source_lang: detectedLanguage !== 'unknown' ? detectedLanguage : undefined,
      });
      setTranslationResult(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Translation is temporarily unavailable. Inference and explainability remain fully operational on original text.';
      setError(msg);
    } finally {
      setIsTranslating(false);
    }
  }, [originalText, targetLang, detectedLanguage]);

  const copyToClipboard = (text: string, isOriginal: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedTranslated(true);
      setTimeout(() => setCopiedTranslated(false), 2000);
    }
  };

  const isUnknownLang = !detectedLanguage || detectedLanguage.toLowerCase() === 'unknown';
  const displayLangName = languageName || (isUnknownLang ? 'Undetermined / Unknown' : detectedLanguage.toUpperCase());

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: 'var(--space-6)',
      }}
    >
      {/* Header Bar / Collapsible Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'var(--bg-elevated)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              color: 'var(--color-accent)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Languages size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              {title}
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px' }}>
                On-Demand
              </span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Detected:{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{displayLangName}</span>
              {languageConfidence !== null && languageConfidence !== undefined && (
                <span style={{ marginLeft: '6px', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
                  ({(languageConfidence * 100).toFixed(1)}% conf)
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isOpen ? 'Collapse panel' : 'Translate for presentation'}
          </span>
          <div style={{ color: 'var(--text-secondary)' }}>
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isOpen && (
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* External Provider & Model Decoupling Notice */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Info size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Presentation Translation Disclaimer
              </p>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Translation is strictly optional and presentation-only (powered by external services). Model credibility, sentiment scoring, and token explainability are computed strictly on the <strong style={{ color: 'var(--text-primary)' }}>original text</strong> to guarantee zero semantic distortion.
              </p>
            </div>
          </div>

          {/* Controls Bar: Source Badge -> Target Selector -> Action Button */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Source:</span>
              <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-color)' }}>
                {displayLangName} ({detectedLanguage})
              </span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Target:</span>
              <select
                aria-label="Target translation language"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={isLoadingLangs || isTranslating}
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  outline: 'none',
                }}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} {l.native_name !== l.name ? `(${l.native_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'var(--color-accent)',
                color: '#FFFFFF',
                border: '1px solid var(--color-accent)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isTranslating ? 'not-allowed' : 'pointer',
                opacity: isTranslating ? 0.6 : 1,
              }}
            >
              {isTranslating ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Translating...
                </>
              ) : (
                <>
                  <Globe size={14} />
                  Translate Text
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(232, 93, 93, 0.12)',
                border: '1px solid rgba(232, 93, 93, 0.28)',
                fontSize: '0.75rem',
                color: 'var(--color-fake)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Dual Text Display: Original vs Translated */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Original Text Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--color-real)' }} />
                    Original Analyzed Text
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-real)', fontFamily: 'var(--font-mono)', background: 'var(--color-real-bg)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>
                    Used for XLM-R Inference
                  </span>
                </div>
                <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: '240px', overflowY: 'auto', lineHeight: 1.6 }}>
                  {originalText || '(No text)'}
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span>Length: {originalText.length} chars</span>
                <button
                  onClick={() => copyToClipboard(originalText, true)}
                  style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  {copiedOriginal ? <Check size={13} style={{ color: 'var(--color-real)' }} /> : <Copy size={13} />}
                  {copiedOriginal ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Translated Presentation Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={14} style={{ color: 'var(--color-accent)' }} />
                    Translated Presentation Text
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', background: 'var(--color-accent-bg)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>
                    {translationResult ? translationResult.target_lang_name : 'Pending'}
                  </span>
                </div>

                <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: '240px', overflowY: 'auto', lineHeight: 1.6 }}>
                  {isTranslating ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--text-secondary)', gap: '8px' }}>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
                      <span>Requesting presentation translation...</span>
                    </div>
                  ) : translationResult ? (
                    translationResult.translated_text
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Click &quot;Translate Text&quot; above to request translation for presentation.
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span>
                  {translationResult ? `Provider: ${translationResult.provider}` : 'On-demand only'}
                </span>
                {translationResult && (
                  <button
                    onClick={() => copyToClipboard(translationResult.translated_text, false)}
                    style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    {copiedTranslated ? <Check size={13} style={{ color: 'var(--color-accent)' }} /> : <Copy size={13} />}
                    {copiedTranslated ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
