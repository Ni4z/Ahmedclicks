'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { photos } from '@/data/portfolio';

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

export default function FeaturedPhotos() {
  const featuredPhotos = photos.filter((p) => p.featured).slice(0, 6);

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
          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Featured Work
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-lg max-w-2xl"
          >
            A curated selection of my most captivating photographs spanning wildlife, astrophotography, landscapes, and travel.
          </motion.p>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {featuredPhotos.map((photo, i) => (
            <motion.div
              key={photo.id}
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <Link href={`/gallery/${photo.id}`}>
                <div className="relative w-full h-80 overflow-hidden rounded-lg group cursor-pointer">
                  <Image
                    src={photo.thumbnail}
                    alt={photo.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end justify-end p-6">
                    <h3 className="text-xl font-serif font-bold mb-2 text-right">
                      {photo.title}
                    </h3>
                    <p className="text-sm text-gray-300 text-right">
                      {photo.category.toUpperCase()}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link href="/gallery">
            <button className="btn-secondary">
              View All Gallery
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
