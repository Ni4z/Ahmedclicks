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
    <section className="px-6 py-12">
      <div className="max-w-[1680px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true, margin: '-100px' }}
          className="mb-6"
        >
          <motion.h2
            variants={itemVariants}
            className="mb-2 text-4xl font-serif font-bold md:text-5xl"
          >
            Latest Updates
          </motion.h2>
        </motion.div>

        {items.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-4"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="min-w-0 self-start"
              >
                <Link
                  href={item.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-dark-tertiary bg-dark-secondary transition-colors hover:border-accent-gold"
                >
                  <div className="overflow-hidden border-b border-dark-tertiary bg-black/40">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>

                  <div className="flex flex-col p-4 xl:p-3.5">
                    <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-accent-gold">
                      <span>{item.type === 'post' ? 'Story' : 'Photo'}</span>
                      <span className="text-gray-600">/</span>
                      <span>{item.category}</span>
                    </div>

                    <h3 className="mb-2 text-2xl font-serif font-bold leading-tight xl:text-[1.95rem]">
                      {item.title}
                    </h3>

                    {item.summary ? (
                      <p className="mb-4 text-sm leading-6 text-gray-400 xl:text-[0.95rem] xl:leading-6">
                        {item.summary}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 xl:text-[0.78rem]">
                      <span>{formatDate(item.date)}</span>
                      {item.type === 'post' && item.readTime ? (
                        <span>{item.readTime} min read</span>
                      ) : null}
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
          className="mt-10 flex flex-wrap gap-4"
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
