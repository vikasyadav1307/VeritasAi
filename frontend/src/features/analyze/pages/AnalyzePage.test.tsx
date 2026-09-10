import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnalyzePage from './AnalyzePage';
import * as api from '../../../services/api';

// Mock the API service
vi.mock('../../../services/api', () => ({
  analyzeText: vi.fn(),
  analyzeUrl: vi.fn(),
  analyzeImage: vi.fn(),
}));

describe('AnalyzePage — Image Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with all three tabs: Text, URL, and Image', () => {
    render(<AnalyzePage />);
    expect(screen.getByRole('tab', { name: /text/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /url/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /image/i })).toBeInTheDocument();
  });

  it('switches to the Image tab and displays the upload area', () => {
    render(<AnalyzePage />);
    const imageTab = screen.getByRole('tab', { name: /image/i });
    fireEvent.click(imageTab);

    expect(
      screen.getByText(/Upload a news article screenshot, social post, or headline/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Click to upload or drag & drop an image/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Supports JPEG, PNG, or WEBP/i),
    ).toBeInTheDocument();
  });

  it('validates and rejects unsupported file formats in image upload', async () => {
    render(<AnalyzePage />);
    fireEvent.click(screen.getByRole('tab', { name: /image/i }));

    const input = document.getElementById('analyze-image-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const pdfFile = new File(['%PDF-1.5 dummy content'], 'test.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Unsupported image format. Please upload a JPEG, PNG, or WEBP image./i),
      ).toBeInTheDocument();
    });
  });

  it('validates and rejects oversized image files (> 10MB)', async () => {
    render(<AnalyzePage />);
    fireEvent.click(screen.getByRole('tab', { name: /image/i }));

    const input = document.getElementById('analyze-image-input') as HTMLInputElement;

    // Create file larger than 10MB
    const largeBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], {
      type: 'image/png',
    });
    const largeFile = new File([largeBlob], 'huge.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Image file is too large. Maximum allowed size is 10 MB./i),
      ).toBeInTheDocument();
    });
  });

  it('accepts valid PNG image and displays file card with remove button', async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-uuid');
    URL.revokeObjectURL = vi.fn();

    try {
      render(<AnalyzePage />);
      fireEvent.click(screen.getByRole('tab', { name: /image/i }));

      const input = document.getElementById('analyze-image-input') as HTMLInputElement;
      const validFile = new File(['valid png data'], 'news_headline.png', {
        type: 'image/png',
      });

      fireEvent.change(input, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('news_headline.png')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /remove selected image/i })).toBeInTheDocument();
      });

      // Click remove button
      const removeBtn = screen.getByRole('button', { name: /remove selected image/i });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Click to upload or drag & drop an image/i),
        ).toBeInTheDocument();
      });
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('submits valid image and displays OCR results and credibility/sentiment', async () => {
    const mockResponse: api.AnalyzeImageResponse = {
      id: 'b1a2c3d4-0000-0000-0000-000000000001',
      filename: 'sample_news.jpg',
      content_type: 'image/jpeg',
      ocr_text: 'BREAKING: World summit adopts clean energy goals for 2030.',
      detected_language: 'en',
      character_count: 57,
      credibility: {
        label: 'Real',
        confidence: 0.94,
        is_mock: false,
      },
      sentiment: {
        label: 'Positive',
        confidence: 0.88,
        is_mock: false,
      },
      processing_time_ms: 120.5,
    };

    vi.mocked(api.analyzeImage).mockResolvedValueOnce(mockResponse);

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-uuid');
    URL.revokeObjectURL = vi.fn();

    try {
      render(<AnalyzePage />);
      fireEvent.click(screen.getByRole('tab', { name: /image/i }));

      const input = document.getElementById('analyze-image-input') as HTMLInputElement;
      const file = new File(['image-bytes'], 'sample_news.jpg', {
        type: 'image/jpeg',
      });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('sample_news.jpg')).toBeInTheDocument();
      });

      const analyzeBtn = screen.getByRole('button', { name: /analyze image/i });
      expect(analyzeBtn).not.toBeDisabled();

      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(api.analyzeImage).toHaveBeenCalledWith(file);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Extracted OCR Text/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/BREAKING: World summit adopts clean energy goals for 2030./i),
        ).toBeInTheDocument();
        expect(screen.getByText('Real')).toBeInTheDocument();
        expect(screen.getByText('Positive')).toBeInTheDocument();
      });
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });
});
