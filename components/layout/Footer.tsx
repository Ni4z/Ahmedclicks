'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { siteConfig } from '@/lib/site';
import BrandMark from '@/components/layout/BrandMark';

const socialLinks = [
  { name: 'Instagram', href: siteConfig.instagramUrl, icon: 'instagram' as const },
  ...(siteConfig.contactEmail
    ? [{ name: 'Email', href: `mailto:${siteConfig.contactEmail}`, icon: 'email' as const }]
    : []),
  ...(siteConfig.linkedinUrl
    ? [{ name: 'LinkedIn', href: siteConfig.linkedinUrl, icon: 'linkedin' as const }]
    : []),
];

function SocialIcon({ icon }: { icon: 'instagram' | 'email' | 'linkedin' }) {
  if (icon === 'instagram') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.25" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (icon === 'linkedin') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8" cy="8" r="1.15" fill="currentColor" stroke="none" />
        <path d="M6.8 10.4h2.4v6.8H6.8z" fill="currentColor" stroke="none" />
        <path
          d="M11.4 10.4h2.3v1c.5-.76 1.34-1.22 2.45-1.22 1.93 0 3.08 1.28 3.08 3.72v3.26h-2.46v-2.98c0-1.03-.37-1.73-1.31-1.73-.71 0-1.13.48-1.31.94-.07.17-.1.41-.1.65v3.12H11.4z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export default function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="bg-dark-secondary border-t border-dark-tertiary">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"
        >
          {/* Brand */}
          <motion.div variants={itemVariants}>
            <div className="mb-4">
              <BrandMark />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              A photography and video portfolio documenting wildlife, landscapes, roads, trees, portraits, and the night sky.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold tracking-widest mb-4">NAVIGATE</h4>
            <ul className="space-y-2">
              {[
                { name: 'Gallery', href: '/gallery' },
                { name: 'Videos', href: '/videos' },
                { name: 'About', href: '/about' },
                { name: 'Blog', href: '/blog' },
                { name: 'Contact', href: '/contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-accent-gold text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold tracking-widest mb-4">SERVICES</h4>
            <ul className="space-y-2">
              {[
                'Landscape Photography',
                'Wildlife Photography',
                'Astrophotography',
                'Roads & Travel Frames',
                'Short Video Work',
              ].map((service) => (
                <li key={service} className="text-gray-400 text-sm">
                  {service}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold tracking-widest mb-4">FOLLOW</h4>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-dark-tertiary flex items-center justify-center hover:bg-accent-gold hover:text-dark transition-all"
                  aria-label={link.name}
                >
                  <SocialIcon icon={link.icon} />
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          className="border-t border-dark-tertiary pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} NiazPhotography. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-accent-gold">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-accent-gold">
              Terms
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
