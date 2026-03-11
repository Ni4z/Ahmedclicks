'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';

export type LatestUpdateItem = {
  id: string;
  type: 'photo' | 'post';
  title: string;
  summary: string;
  image: string;
  href: string;
  date: string;
  category: string;
  readTime?: number;
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

interface LatestUpdatesProps {
  items: LatestUpdateItem[];
}

export default function LatestUpdates({ items }: LatestUpdatesProps) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true, margin: '-100px' }}
          className="mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-5xl md:text-6xl font-serif font-bold mb-4"
          >
            Latest Updates
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-lg max-w-3xl"
          >
            The four newest stories and frames from the current
            NiazPhotography archive, each paired with a short note so the
            homepage always reflects your latest work.
          </motion.p>
        </motion.div>

        {items.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
            {items.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <Link
                  href={item.href}
                  className="group block rounded-2xl border border-dark-tertiary bg-dark-secondary p-5 transition-colors hover:border-accent-gold"
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] items-start">
                    <div className="overflow-hidden rounded-xl border border-dark-tertiary bg-black/40">
                      <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="block w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>

                    <div className="flex min-h-full flex-col">
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-accent-gold mb-4">
                        <span>{item.type === 'post' ? 'Story' : 'Photo'}</span>
                        <span className="text-gray-600">/</span>
                        <span>{item.category}</span>
                      </div>

                      <h3 className="text-3xl font-serif font-bold mb-4 leading-tight">
                        {item.title}
                      </h3>

                      <p className="text-gray-400 leading-7 mb-6">
                        {item.summary}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                        <span>{formatDate(item.date)}</span>
                        <span>
                          {item.type === 'post'
                            ? `${item.readTime} min read`
                            : 'View frame'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-dark-tertiary bg-dark-secondary p-10 text-center text-gray-400">
            No recent updates available yet.
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap gap-4"
        >
          <Link href="/gallery" className="btn-secondary inline-block">
            View All Gallery
          </Link>
          <Link href="/blog" className="btn-secondary inline-block">
            Read the Journal
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
