import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', async () => {
    render(<App />);
    const matches = await screen.findAllByText(/Veritas/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
