'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import BrandMark from '@/components/layout/BrandMark';
import ThemeToggle from '@/components/layout/ThemeToggle';

const navItems = [
  { name: 'Gallery', href: '/gallery' },
  { name: 'Videos', href: '/videos' },
  { name: 'About', href: '/about' },
  { name: 'Prints', href: '/prints' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const menuVariants = {
    closed: { opacity: 0, height: 0 },
    open: { opacity: 1, height: 'auto' },
  };

  const itemVariants = {
    closed: { x: -20, opacity: 0 },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.1 },
    }),
  };

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-dark-tertiary bg-dark/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo */}
          <Link
            href="/"
            aria-label="NiazPhotography home"
            className="group shrink-0"
          >
            <span className="block transition-transform duration-300 group-hover:-translate-y-0.5">
              <BrandMark compact />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <motion.span
                    whileHover={{ y: -1 }}
                    className={`text-sm tracking-[0.22em] hover:text-accent-gold transition-colors ${
                      isActive(item.href)
                        ? 'text-foreground underline decoration-foreground/50 underline-offset-8'
                        : 'text-foreground/85'
                    }`}
                  >
                    {item.name}
                  </motion.span>
                </Link>
              ))}
            </div>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden sm:gap-3">
            <ThemeToggle compact />
            <button
              className="flex cursor-pointer flex-col gap-1 rounded-md p-1"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span
                className={`h-0.5 w-6 bg-foreground transition-all ${
                  isOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`h-0.5 w-6 bg-foreground transition-all ${
                  isOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`h-0.5 w-6 bg-foreground transition-all ${
                  isOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu: unmounted when closed so hidden links are not reachable by keyboard */}
        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              key="mobile-menu"
              id="mobile-menu"
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="md:hidden overflow-hidden bg-dark-secondary"
            >
              {navItems.map((item, i) => (
                <motion.div key={item.href} custom={i} variants={itemVariants}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`block px-6 py-3 text-sm tracking-[0.22em] hover:text-accent-gold ${
                      isActive(item.href) ? 'text-foreground' : 'text-foreground/80'
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>

      {/* Spacer */}
      <div className="h-14 sm:h-16" />
    </>
  );
}
