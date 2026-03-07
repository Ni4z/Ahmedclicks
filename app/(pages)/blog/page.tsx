'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { blogPosts } from '@/data/portfolio';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

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

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 px-6 text-center bg-dark-secondary"
      >
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">Stories & Articles</h1>
        <p className="text-gray-400 text-lg">Process notes, field observations, and practical photography articles</p>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-20 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {blogPosts.map((post) => (
            <motion.article
              key={post.id}
              variants={itemVariants}
              whileHover={{ x: 10 }}
              className="group cursor-pointer"
            >
              <Link href={`/blog/${post.slug}`}>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Image */}
                  <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm text-accent-gold mb-2 uppercase tracking-widest">
                      {post.category}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3 group-hover:text-accent-gold transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {formatDate(post.date)} • {post.readTime} min read
                      </span>
                      <span className="text-accent-gold group-hover:translate-x-2 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="border-b border-dark-tertiary mt-8" />
            </motion.article>
          ))}
        </motion.div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-12 bg-dark-secondary rounded-lg border border-dark-tertiary text-center"
        >
          <h3 className="text-2xl font-serif font-bold mb-4">Subscribe to My Newsletter</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Get photography notes and updates when new work lands in the NiazClicks archive
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 bg-dark rounded border border-dark-tertiary focus:border-accent-gold outline-none transition-colors"
            />
            <button className="px-6 py-3 bg-accent-gold text-dark font-semibold rounded hover:bg-white transition-colors">
              Subscribe
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
