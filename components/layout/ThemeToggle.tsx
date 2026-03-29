'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'niaz-theme';

type Theme = 'dark' | 'light';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-opacity ${active ? 'opacity-100' : 'opacity-35'}`}
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

function MoonIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-opacity ${active ? 'opacity-100' : 'opacity-35'}`}
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

export default function ThemeToggle() {
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

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex items-center gap-2 rounded-full border border-dark-tertiary bg-dark-secondary/85 px-3 py-2 text-foreground backdrop-blur-sm transition-colors hover:border-accent-gold"
    >
      <SunIcon active={theme === 'light'} />
      <span className="relative h-5 w-10 rounded-full border border-dark-tertiary bg-dark">
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-accent-gold transition-transform duration-300 ${
            theme === 'dark' ? 'translate-x-[2px]' : 'translate-x-[18px]'
          }`}
        />
      </span>
      <MoonIcon active={theme === 'dark'} />
    </button>
  );
}
