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
    <section className="py-14 px-6">
      <div className="max-w-[1680px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true, margin: '-100px' }}
          className="mb-8"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-serif font-bold mb-3"
          >
            Latest Updates
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-sm md:text-base max-w-2xl"
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
            className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="h-full w-full"
              >
                <Link
                  href={item.href}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-dark-tertiary bg-dark-secondary transition-colors hover:border-accent-gold"
                >
                  <div className="aspect-[4/3] overflow-hidden border-b border-dark-tertiary bg-black/40">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-accent-gold mb-3">
                      <span>{item.type === 'post' ? 'Story' : 'Photo'}</span>
                      <span className="text-gray-600">/</span>
                      <span>{item.category}</span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-serif font-bold mb-2 leading-tight">
                      {item.title}
                    </h3>

                    <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-400">
                      {item.summary}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm text-gray-500">
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
          className="mt-12 flex flex-wrap gap-4"
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
