'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-4 mb-12 justify-center"
    >
      {categories.map((category) => (
        <motion.button
          key={category}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCategoryChange(category)}
          className={`px-6 py-2 rounded-full text-sm tracking-widest transition-all font-semibold ${
            activeCategory === category
              ? 'bg-accent-gold text-dark'
              : 'border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-dark'
          }`}
        >
          {category.toUpperCase()}
        </motion.button>
      ))}
    </motion.div>
  );
}
