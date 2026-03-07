'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PhotoCategory } from '@/lib/types';

interface CategoriesProps {
  categories: PhotoCategory[];
}

export default function Categories({ categories }: CategoriesProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-20 px-6 bg-dark-secondary">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true }}
          className="mb-16"
        >
          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Photography Categories
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-lg max-w-2xl"
          >
            Explore different genres of photography and find what resonates with you.
          </motion.p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {categories.map((category) => (
            <motion.div
              key={category.key}
              variants={itemVariants}
              whileHover={{ x: 20, transition: { duration: 0.3 } }}
              className="border border-dark-tertiary rounded-lg hover:border-accent-gold transition-colors"
            >
              <Link href="/gallery" className="block p-8">
                <p className="text-xs tracking-[0.35em] uppercase text-accent-gold mb-3">
                  {category.count} photos
                </p>
                <h3 className="text-2xl font-serif font-bold mb-3">{category.name}</h3>
                <p className="text-gray-400">{category.description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
