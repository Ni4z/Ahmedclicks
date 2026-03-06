'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import CategoryFilter from '@/components/gallery/CategoryFilter';
import { photos } from '@/data/portfolio';

const categories = ['all', 'wildlife', 'astrophotography', 'landscape', 'travel'];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return photos;
    return photos.filter((photo) => photo.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 px-6 text-center bg-dark-secondary"
      >
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">Gallery</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Explore my complete collection of photography across multiple genres
        </p>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PhotoGrid photos={filteredPhotos} />
        </motion.div>

        {filteredPhotos.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-gray-400 text-lg">No photos found in this category</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
