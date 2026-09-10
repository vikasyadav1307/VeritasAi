import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExplainabilityPanel } from '../components/ExplainabilityPanel';
import * as api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  explainText: vi.fn(),
}));

const mockExplainResponse: api.ExplainResponse = {
  credibility_explanation: {
    predicted_label: 'Real',
    confidence: 0.94,
    method: 'Gradient × Input',
    tokens: [
      { token: 'Scientists', score: 0.45, direction: 'supporting', normalized_score: 1.0 },
      { token: 'breakthrough', score: 0.35, direction: 'supporting', normalized_score: 0.778 },
      { token: 'unverified', score: -0.25, direction: 'opposing', normalized_score: 0.556 },
    ],
    latency_ms: 312.4,
  },
  sentiment_explanation: {
    predicted_label: 'Positive',
    confidence: 0.88,
    method: 'Gradient × Input',
    tokens: [
      { token: 'breakthrough', score: 0.55, direction: 'supporting', normalized_score: 1.0 },
      { token: 'Scientists', score: 0.20, direction: 'supporting', normalized_score: 0.364 },
    ],
    latency_ms: 330.1,
  },
  total_latency_ms: 642.5,
  disclaimer:
    'Gradient × Input attribution estimates token influence on the predicted-class logit. This reflects model sensitivity, not causal proof or factual verification.',
};

describe('ExplainabilityPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the initial collapsed state with Explain Prediction button', () => {
    render(
      <ExplainabilityPanel
        textToExplain="Scientists announced a major breakthrough in nuclear fusion energy."
        title="Prediction Explainability"
      />,
    );

    expect(screen.getByText('Prediction Explainability')).toBeInTheDocument();
    expect(
      screen.getByText(/Token-level Gradient × Input feature attribution/i),
    ).toBeInTheDocument();

    const explainBtn = screen.getByTestId('explain-prediction-btn');
    expect(explainBtn).toBeInTheDocument();
    expect(explainBtn).not.toBeDisabled();
  });

  it('fetches explanation on button click and renders disclaimer and tokens', async () => {
    vi.mocked(api.explainText).mockResolvedValueOnce(mockExplainResponse);

    render(
      <ExplainabilityPanel
        textToExplain="Scientists announced a major breakthrough in nuclear fusion energy."
      />,
    );

    const explainBtn = screen.getByTestId('explain-prediction-btn');
    fireEvent.click(explainBtn);

    await waitFor(() => {
      expect(api.explainText).toHaveBeenCalledWith(
        'Scientists announced a major breakthrough in nuclear fusion energy.',
      );
    });

    // Check disclaimer
    await waitFor(() => {
      expect(
        screen.getByText(/Gradient × Input attribution estimates token influence/i),
      ).toBeInTheDocument();
    });

    // Check tokens rendered
    expect(screen.getByText('Scientists')).toBeInTheDocument();
    expect(screen.getByText('breakthrough')).toBeInTheDocument();
    expect(screen.getByText('unverified')).toBeInTheDocument();

    // Check latencies rendered
    expect(screen.getByText(/Total: 642.5 ms/i)).toBeInTheDocument();
  });

  it('switches between Credibility and Sentiment model tabs', async () => {
    vi.mocked(api.explainText).mockResolvedValueOnce(mockExplainResponse);

    render(
      <ExplainabilityPanel
        textToExplain="Scientists announced a major breakthrough in nuclear fusion energy."
      />,
    );

    fireEvent.click(screen.getByTestId('explain-prediction-btn'));

    await waitFor(() => {
      expect(screen.getByText('Credibility (Real)')).toBeInTheDocument();
    });

    // Click Sentiment tab
    const sentimentTab = screen.getByText('Sentiment (Positive)');
    fireEvent.click(sentimentTab);

    // Sentiment tokens should be displayed
    await waitFor(() => {
      expect(screen.getByText('breakthrough')).toBeInTheDocument();
    });
  });

  it('filters tokens by direction (supporting vs opposing)', async () => {
    vi.mocked(api.explainText).mockResolvedValueOnce(mockExplainResponse);

    render(
      <ExplainabilityPanel
        textToExplain="Scientists announced a major breakthrough in nuclear fusion energy."
      />,
    );

    fireEvent.click(screen.getByTestId('explain-prediction-btn'));

    await waitFor(() => {
      expect(screen.getByText('unverified')).toBeInTheDocument();
    });

    // Click Supporting filter
    const supportingFilterBtn = screen.getByRole('button', { name: /Supporting/i });
    fireEvent.click(supportingFilterBtn);

    // Opposing token "unverified" should no longer be in the cloud
    const cloud = screen.getByTestId('token-attribution-cloud');
    expect(cloud).toHaveTextContent('Scientists');
    expect(cloud).toHaveTextContent('breakthrough');
    expect(cloud).not.toHaveTextContent('unverified');

    // Click Opposing filter
    const opposingFilterBtn = screen.getByRole('button', { name: /Opposing/i });
    fireEvent.click(opposingFilterBtn);

    expect(cloud).toHaveTextContent('unverified');
    expect(cloud).not.toHaveTextContent('Scientists');
  });

  it('handles API failure gracefully with an error banner', async () => {
    vi.mocked(api.explainText).mockRejectedValueOnce(
      new Error('Model attribution computation timed out.'),
    );

    render(
      <ExplainabilityPanel
        textToExplain="Some sample news article text."
      />,
    );

    fireEvent.click(screen.getByTestId('explain-prediction-btn'));

    await waitFor(() => {
      expect(
        screen.getByText('Model attribution computation timed out.'),
      ).toBeInTheDocument();
    });
  });
});
