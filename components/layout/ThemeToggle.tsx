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
      className="inline-flex h-12 items-center gap-2 rounded-full border border-dark-tertiary bg-dark-secondary/90 px-3 text-foreground shadow-[0_10px_28px_rgba(0,0,0,0.08)] backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-300 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/12 focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-[opacity,transform,color] duration-300 ${
          theme === 'light'
            ? 'scale-100 text-foreground'
            : 'scale-[0.96] text-foreground/35'
        }`}
      >
        <SunIcon active={theme === 'light'} />
      </span>
      <span className="relative h-8 w-14 shrink-0 rounded-full border border-dark-tertiary bg-dark/95 shadow-inner shadow-black/10">
        <span
          className="absolute top-1 h-6 w-6 rounded-full bg-accent-gold shadow-[0_8px_18px_rgba(0,0,0,0.24)] transition-transform duration-300"
          style={{
            transform: theme === 'light' ? 'translateX(2px)' : 'translateX(30px)',
          }}
        />
      </span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-[opacity,transform,color] duration-300 ${
          theme === 'dark'
            ? 'scale-100 text-foreground'
            : 'scale-[0.96] text-foreground/35'
        }`}
      >
        <MoonIcon active={theme === 'dark'} />
      </span>
    </button>
  );
}
