import { render, screen } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  it('renders the site title', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('七輪');
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'メインナビゲーション');
    expect(screen.getByText('ライブ一覧')).toBeInTheDocument();
    expect(screen.getByText('楽曲一覧')).toBeInTheDocument();
  });
});
