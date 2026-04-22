'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Photo } from '@/lib/types';

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

interface FeaturedPhotosProps {
  photos: Photo[];
}

export default function FeaturedPhotos({ photos }: FeaturedPhotosProps) {
  const featuredPhotos = photos.slice(0, 6);

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
            The latest uploads from the current NiazPhotography archive, surfaced automatically from the most recent additions to the portfolio.
          </motion.p>
        </motion.div>

        {/* Grid */}
        {featuredPhotos.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuredPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                variants={itemVariants}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <Link href={`/gallery/${photo.id}`}>
                  <div className="relative overflow-hidden rounded-lg group cursor-pointer bg-dark-secondary border border-dark-tertiary">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={photo.thumbnail}
                        alt={photo.title}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end justify-end p-6">
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
        ) : (
          <div className="rounded-2xl border border-dark-tertiary bg-dark-secondary p-10 text-center text-gray-400">
            No featured photos available yet.
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link href="/gallery" className="btn-secondary inline-block">
            View All Gallery
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
