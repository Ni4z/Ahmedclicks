'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { siteConfig } from '@/lib/site';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(formData.subject);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );

    window.location.href = `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 px-6 text-center bg-dark-secondary"
      >
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">Get In Touch</h1>
        <p className="text-gray-400 text-lg">Let&apos;s collaborate and create something amazing</p>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-20 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
        >
          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-serif font-bold mb-8">Contact Information</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold tracking-widest text-accent-gold mb-2">
                  EMAIL
                </h3>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="text-lg hover:text-accent-gold transition-colors"
                >
                  {siteConfig.contactEmail}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-widest text-accent-gold mb-2">
                  INSTAGRAM
                </h3>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-lg hover:text-accent-gold transition-colors">
                  @ahmedphotography
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-widest text-accent-gold mb-2">
                  LOCATION
                </h3>
                <p className="text-lg">New York, USA</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-widest text-accent-gold mb-4">
                  SERVICES
                </h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Landscape & Outdoor Photography</li>
                  <li>Wildlife Photography</li>
                  <li>Astrophotography</li>
                  <li>Travel Photography</li>
                  <li>Print Sales & Licensing</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={itemVariants}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="btn-primary w-full"
              >
                Send Message
              </motion.button>

              {submitted && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-accent-gold text-center"
                >
                  Your email app should open with your message pre-filled.
                </motion.p>
              )}
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
