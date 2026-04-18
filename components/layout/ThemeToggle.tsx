'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'niaz-theme';

type Theme = 'dark' | 'light';

interface ThemeToggleProps {
  compact?: boolean;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

function SunIcon({ active, compact }: { active: boolean; compact: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} transition-opacity ${
        active ? 'opacity-100' : 'opacity-35'
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.25M12 19.25v2.25M4.75 4.75l1.6 1.6M17.65 17.65l1.6 1.6M2.5 12h2.25M19.25 12h2.25M4.75 19.25l1.6-1.6M17.65 6.35l1.6-1.6" />
    </svg>
  );
}

function MoonIcon({ active, compact }: { active: boolean; compact: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} transition-opacity ${
        active ? 'opacity-100' : 'opacity-35'
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 14.2A7.8 7.8 0 0 1 9.8 4a8.8 8.8 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const currentTheme =
      document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(currentTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const thumbLeft =
    theme === 'light'
      ? '2px'
      : compact
        ? 'calc(100% - 16px)'
        : 'calc(100% - 18px)';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center rounded-full border border-dark-tertiary bg-dark-secondary/85 text-foreground backdrop-blur-sm transition-colors hover:border-accent-gold ${
        compact ? 'gap-1.5 px-2.5 py-1.5' : 'gap-2 px-3 py-2'
      }`}
    >
      <SunIcon active={theme === 'light'} compact={compact} />
      <span
        className={`relative rounded-full border border-dark-tertiary bg-dark ${
          compact ? 'h-[18px] w-10' : 'h-5 w-11'
        }`}
      >
        <span
          className={`absolute top-0.5 rounded-full bg-accent-gold transition-[left] duration-300 ${
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
          }`}
          style={{
            left: thumbLeft,
          }}
        />
      </span>
      <MoonIcon active={theme === 'dark'} compact={compact} />
    </button>
  );
}
