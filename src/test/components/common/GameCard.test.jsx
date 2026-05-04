import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameCard from '../../../components/common/GameCard';

const baseGame = {
  id: 1,
  name: 'Test Game',
  genres: ['RPG', 'Action'],
  platforms: ['PC'],
  backgroundImage: null,
};

describe('GameCard', () => {
  it('renders the game name and the first genre as default subtitle', () => {
    render(<GameCard game={baseGame} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('RPG')).toBeInTheDocument();
  });

  it('respects an explicit subtitle prop over the default genre', () => {
    render(<GameCard game={baseGame} subtitle="Releases May 27, 2026" />);
    expect(screen.getByText('Releases May 27, 2026')).toBeInTheDocument();
    expect(screen.queryByText('RPG')).not.toBeInTheDocument();
  });

  it('renders the cover fallback when backgroundImage is missing', () => {
    render(<GameCard game={baseGame} />);
    expect(screen.getByRole('img', { name: /no cover art/i })).toBeInTheDocument();
  });

  it('invokes onClick when the card is clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<GameCard game={baseGame} onClick={onClick} />);
    await user.click(screen.getByText('Test Game'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
