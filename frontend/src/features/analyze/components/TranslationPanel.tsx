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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-6 backdrop-blur-sm transition-all duration-200">
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
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              {title}
              <span className="text-xs font-normal text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                On-Demand
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Detected:{' '}
              <span className="font-medium text-slate-200">{displayLangName}</span>
              {languageConfidence !== null && languageConfidence !== undefined && (
                <span className="ml-1.5 text-indigo-400 font-mono text-[11px]">
                  ({(languageConfidence * 100).toFixed(1)}% conf)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isOpen ? 'Collapse panel' : 'Translate for presentation'}
          </span>
          <div className="p-1 rounded-md text-slate-400 hover:text-slate-200">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isOpen && (
        <div className="p-5 border-t border-slate-800/80 space-y-5">
          {/* External Provider & Model Decoupling Notice */}
          <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-800/50 text-xs text-blue-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-100">
                Presentation Translation Disclaimer
              </p>
              <p className="text-blue-300/90 leading-relaxed">
                Translation is strictly optional and presentation-only (powered by external services). Model credibility, sentiment scoring, and token explainability are computed strictly on the <strong>original text</strong> to guarantee zero semantic distortion.
              </p>
            </div>
          </div>

          {/* Controls Bar: Source Badge -> Target Selector -> Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Source:</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono border border-slate-700">
                {displayLangName} ({detectedLanguage})
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400">Target:</span>
              <select
                aria-label="Target translation language"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={isLoadingLangs || isTranslating}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Translate Text
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dual Text Display: Original vs Translated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Text Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Original Analyzed Text
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                    Used for XLM-R Inference
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {originalText || '(No text)'}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Length: {originalText.length} chars</span>
                <button
                  onClick={() => copyToClipboard(originalText, true)}
                  className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedOriginal ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Translated Presentation Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Translated Presentation Text
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/40 border border-indigo-800/50 px-2 py-0.5 rounded">
                    {translationResult ? translationResult.target_lang_name : 'Pending'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {isTranslating ? (
                    <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Requesting presentation translation...</span>
                    </div>
                  ) : translationResult ? (
                    translationResult.translated_text
                  ) : (
                    <span className="text-slate-500 italic">
                      Click "Translate Text" above to request translation for presentation.
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span>
                  {translationResult ? `Provider: ${translationResult.provider}` : 'On-demand only'}
                </span>
                {translationResult && (
                  <button
                    onClick={() => copyToClipboard(translationResult.translated_text, false)}
                    className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    {copiedTranslated ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
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
