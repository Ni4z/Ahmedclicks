'use client';

import Link from 'next/link';
import { ArrowUpRight, Camera, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/lib/site';

const navigationLinks = [
  { name: 'Prints', href: '/prints' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function EntranceHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const desktop = window.matchMedia('(min-width: 768px)');
    const handleResize = () => {
      if (desktop.matches) setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    desktop.addEventListener('change', handleResize);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      desktop.removeEventListener('change', handleResize);
    };
  }, [isOpen]);

  return (
    <header
      ref={headerRef}
      className="entrance-header"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <Link href="/" className="entrance-wordmark" aria-label="NiazPhotography home">
        <span className="entrance-wordmark-name">Niaz</span>
        <span className="entrance-wordmark-label">Photography</span>
      </Link>

      <nav className="entrance-navigation" aria-label="Main navigation">
        <div className="entrance-secondary-links">
          {navigationLinks.map((link) => (
            <Link key={link.href} href={link.href}>{link.name}</Link>
          ))}
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="entrance-social-link"
            aria-label="NiazPhotography on Instagram (opens in a new tab)"
            title="Instagram"
          >
            <Camera size={19} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </div>
        <button
          ref={buttonRef}
          type="button"
          className="entrance-menu-button"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="entrance-mobile-menu"
          title={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((previous) => !previous)}
        >
          {isOpen ? <X size={21} strokeWidth={1.6} aria-hidden="true" /> : <Menu size={21} strokeWidth={1.6} aria-hidden="true" />}
        </button>
        <Link href="/portfolio" className="btn-primary entrance-gallery-link">
          Gallary
          <ArrowUpRight size={18} strokeWidth={1.7} aria-hidden="true" />
        </Link>
      </nav>

      {isOpen ? (
        <nav id="entrance-mobile-menu" className="entrance-mobile-navigation" aria-label="Mobile navigation">
          {navigationLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
              {link.name}
            </Link>
          ))}
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
          >
            <Camera size={17} strokeWidth={1.6} aria-hidden="true" />
            Instagram
            <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </nav>
      ) : null}
    </header>
  );
}