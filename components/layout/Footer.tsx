'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const socialLinks = [
  { name: 'Instagram', href: 'https://instagram.com', icon: 'I' },
  { name: 'Email', href: 'mailto:ahmed@example.com', icon: 'E' },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: 'L' },
];

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
            <h3 className="text-2xl font-serif font-bold mb-4">AHMED</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Professional photographer specializing in wildlife, astrophotography, and travel photography.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold tracking-widest mb-4">NAVIGATE</h4>
            <ul className="space-y-2">
              {[
                { name: 'Gallery', href: '/gallery' },
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
                'Travel Photography',
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
                >
                  {link.icon}
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
          <p className="text-gray-500 text-sm">© 2024 Ahmed Photography. All rights reserved.</p>
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
