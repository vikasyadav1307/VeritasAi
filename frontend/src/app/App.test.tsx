import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // The app should render the VeritasAI text somewhere (header logo)
    expect(screen.getByText('VeritasAI')).toBeInTheDocument();
  });
});
