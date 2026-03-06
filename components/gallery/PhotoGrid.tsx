'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Photo } from '@/lib/types';

interface PhotoGridProps {
  photos: Photo[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

export default function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]"
    >
      {photos.map((photo, i) => {
        // Create masonry effect with varied sizes
        const isLarge = i % 5 === 0 || i % 5 === 3;
        const gridClass = isLarge ? 'md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2' : '';

        return (
          <motion.div
            key={photo.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className={`${gridClass} relative rounded-lg overflow-hidden cursor-pointer group`}
          >
            <Link href={`/gallery/${photo.id}`}>
              <div className="absolute inset-0">
                <Image
                  src={photo.thumbnail}
                  alt={photo.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h3 className="text-xl font-serif font-bold mb-2">{photo.title}</h3>
                <p className="text-sm text-gray-300 capitalize">{photo.category}</p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
