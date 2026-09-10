import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranslationPanel } from '../components/TranslationPanel';
import * as api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  getSupportedLanguages: vi.fn(),
  translateText: vi.fn(),
}));

const mockLanguagesResponse: api.LanguagesResponse = {
  languages: [
    { code: 'en', name: 'English', native_name: 'English', is_supported_for_analysis: true, is_verified_translation: true },
    { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', is_supported_for_analysis: true, is_verified_translation: true },
    { code: 'es', name: 'Spanish', native_name: 'Español', is_supported_for_analysis: true, is_verified_translation: true },
    { code: 'fr', name: 'French', native_name: 'Français', is_supported_for_analysis: true, is_verified_translation: true },
  ],
  total_supported: 4,
  default_target: 'en',
};

const mockTranslateResponse: api.TranslateResponse = {
  translated_text: 'Scientists announced a breakthrough in clean energy today.',
  source_lang: 'hi',
  source_lang_name: 'Hindi',
  target_lang: 'en',
  target_lang_name: 'English',
  character_count: 58,
  provider: 'MyMemory Translation API (Public)',
  is_cached: false,
  disclaimer:
    'Translation is provided for presentation purposes only via an external service. Model credibility predictions, sentiment analysis, and explainability attributions were computed strictly on the original un-translated text.',
};

describe('TranslationPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getSupportedLanguages).mockResolvedValue(mockLanguagesResponse);
  });

  it('renders collapsed state with detected language and confidence', async () => {
    render(
      <TranslationPanel
        originalText="वैज्ञानिकों ने आज स्वच्छ ऊर्जा के क्षेत्र में सफलता हासिल की।"
        detectedLanguage="hi"
        languageName="Hindi"
        languageConfidence={0.998}
      />,
    );

    expect(screen.getByText('Multilingual Presentation & Translation')).toBeInTheDocument();
    expect(screen.getByText('Hindi')).toBeInTheDocument();
    expect(screen.getByText('(99.8% conf)')).toBeInTheDocument();
    await waitFor(() => expect(api.getSupportedLanguages).toHaveBeenCalled());
  });

  it('handles undetermined/unknown language gracefully without defaulting to English', async () => {
    render(
      <TranslationPanel
        originalText="1234567890"
        detectedLanguage="unknown"
        languageName={null}
        languageConfidence={null}
      />,
    );

    expect(screen.getByText('Undetermined / Unknown')).toBeInTheDocument();
    expect(screen.queryByText(/conf/)).not.toBeInTheDocument();
    await waitFor(() => expect(api.getSupportedLanguages).toHaveBeenCalled());
  });

  it('expands on header click and shows disclaimer and controls', async () => {
    render(
      <TranslationPanel
        originalText="वैज्ञानिकों ने आज स्वच्छ ऊर्जा के क्षेत्र में सफलता हासिल की।"
        detectedLanguage="hi"
        languageName="Hindi"
      />,
    );

    const headerToggle = screen.getByRole('button');
    fireEvent.click(headerToggle);

    expect(screen.getByText('Presentation Translation Disclaimer')).toBeInTheDocument();
    expect(
      screen.getByText(/Model credibility, sentiment scoring, and token explainability are computed strictly on the/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /target translation language/i })).toBeInTheDocument();
    });
  });

  it('translates text and displays dual cards separating original and translated text', async () => {
    vi.mocked(api.translateText).mockResolvedValueOnce(mockTranslateResponse);

    render(
      <TranslationPanel
        originalText="वैज्ञानिकों ने आज स्वच्छ ऊर्जा के क्षेत्र में सफलता हासिल की।"
        detectedLanguage="hi"
        languageName="Hindi"
      />,
    );

    // Expand
    fireEvent.click(screen.getByRole('button'));

    // Wait for languages
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /translate text/i })).toBeInTheDocument();
    });

    // Click translate
    const translateBtn = screen.getByRole('button', { name: /translate text/i });
    fireEvent.click(translateBtn);

    await waitFor(() => {
      expect(api.translateText).toHaveBeenCalledWith({
        text: 'वैज्ञानिकों ने आज स्वच्छ ऊर्जा के क्षेत्र में सफलता हासिल की।',
        target_lang: 'en',
        source_lang: 'hi',
      });
    });

    // Verify dual cards
    expect(screen.getByText('Original Analyzed Text')).toBeInTheDocument();
    expect(screen.getByText('Used for XLM-R Inference')).toBeInTheDocument();
    expect(screen.getByText('Translated Presentation Text')).toBeInTheDocument();
    expect(
      screen.getByText('Scientists announced a breakthrough in clean energy today.'),
    ).toBeInTheDocument();
  });

  it('displays friendly error message when translation fails', async () => {
    vi.mocked(api.translateText).mockRejectedValueOnce(
      new Error('Translation service is temporarily unavailable.'),
    );

    render(
      <TranslationPanel
        originalText="Some text to translate"
        detectedLanguage="en"
      />,
    );

    // Expand
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /translate text/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /translate text/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Translation service is temporarily unavailable.'),
      ).toBeInTheDocument();
    });
  });
});
