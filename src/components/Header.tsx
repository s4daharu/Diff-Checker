import { LogoIcon, MoonIcon, SunIcon } from './Icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNewDiff: () => void;
  busy: boolean;
}

export function Header({ theme, onToggleTheme, onNewDiff, busy }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__brand">
        <LogoIcon size={30} />
        <div className="header__titles">
          <span className="header__name">OpenDiff</span>
          <span className="header__tagline">
            Open source diff checker — runs 100% in your browser
          </span>
        </div>
      </div>
      <div className="header__actions">
        {busy && <span className="header__busy">Comparing…</span>}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          <span className="btn__label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button type="button" className="btn btn--primary" onClick={onNewDiff}>
          New diff
        </button>
      </div>
    </header>
  );
}
